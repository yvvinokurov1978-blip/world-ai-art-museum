# WAAM Auto-Verifier: Discovered -> Verified
# Reads candidates, applies passport/rights/provenance/IP/dedup rules, writes verified file + log.
# No network calls. No publishing. UTF-8 throughout.

param(
    [string]$CandidatesDir = "data\candidates",
    [string]$IncomingDir   = "data\incoming",
    [string]$ArtworksFile  = "data\artworks.json",
    [string]$LogFile       = "data\ingestion_logs.jsonl"
)

$ErrorActionPreference = "Stop"

# --- Resolve paths from repo root ---
$repoRoot      = Split-Path -Parent $PSScriptRoot
$CandidatesDir = Join-Path $repoRoot $CandidatesDir
$IncomingDir   = Join-Path $repoRoot $IncomingDir
$ArtworksFile  = Join-Path $repoRoot $ArtworksFile
$LogFile       = Join-Path $repoRoot $LogFile

# --- Constants ---
$RequiredFields = @(
    "passport_id","passport_version","status","title","provenance_level",
    "rights_status","rights_basis","third_party_ip_risk","source_jurisdiction",
    "provenance_evidence","created_at","updated_at"
)
$EnumStatus       = @("discovered","verified","published")
$EnumProvenance   = @("A","B","C")
$EnumRights       = @("confirmed","external_link_only","unknown","denied")
$EnumIpRisk       = @("low","medium","high","unknown")
$HashPattern      = '^sha256:[a-f0-9]{64}$'
$PassportPattern  = '^WAAM-[0-9]{4}-[0-9]{4}$'
$PlaceholderHash  = "sha256:" + ("0" * 64)
$RankMap          = @{ pass = 0; review = 1; fail = 2 }

# --- Helpers ---
function Get-WorstVerdict {
    param([string[]]$Verdicts)
    $worst = "pass"
    foreach ($v in $Verdicts) {
        if ($RankMap[$v] -gt $RankMap[$worst]) { $worst = $v }
    }
    return $worst
}

function Get-Prop {
    param($Obj, [string]$Name)
    if ($null -eq $Obj) { return $null }
    if ($Obj -is [System.Collections.IDictionary]) {
        if ($Obj.Contains($Name)) { return $Obj[$Name] }
        return $null
    }
    $p = $Obj.PSObject.Properties[$Name]
    if ($p) { return $p.Value }
    return $null
}

function Set-Prop {
    param($Obj, [string]$Name, $Value)
    if ($Obj -is [System.Collections.IDictionary]) {
        $Obj[$Name] = $Value
    } else {
        $p = $Obj.PSObject.Properties[$Name]
        if ($p) { $p.Value = $Value } else { $Obj | Add-Member -NotePropertyName $Name -NotePropertyValue $Value }
    }
}

function Test-EmptyString {
    param($V)
    return ($null -eq $V) -or ($V -is [string] -and [string]::IsNullOrWhiteSpace($V))
}

function Get-CanonicalJson {
    param($Obj)
    # Canonical JSON: sorted keys, no whitespace, recursive.
    if ($null -eq $Obj) { return "null" }
    if ($Obj -is [string]) { return (ConvertTo-Json $Obj -Compress) }
    if ($Obj -is [bool]) { return $(if ($Obj) { "true" } else { "false" }) }
    if ($Obj -is [int] -or $Obj -is [long] -or $Obj -is [double] -or $Obj -is [decimal]) {
        return ([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, "{0}", $Obj))
    }
    if ($Obj -is [System.Collections.IDictionary]) {
        $keys = @($Obj.Keys | Sort-Object)
        $parts = foreach ($k in $keys) { (ConvertTo-Json ([string]$k) -Compress) + ":" + (Get-CanonicalJson $Obj[$k]) }
        return "{" + ($parts -join ",") + "}"
    }
    if ($Obj -is [System.Collections.IEnumerable]) {
        $parts = foreach ($it in $Obj) { Get-CanonicalJson $it }
        return "[" + ($parts -join ",") + "]"
    }
    # PSCustomObject: enumerate properties
    $props = @($Obj.PSObject.Properties | Sort-Object Name)
    $parts = foreach ($p in $props) { (ConvertTo-Json $p.Name -Compress) + ":" + (Get-CanonicalJson $p.Value) }
    return "{" + ($parts -join ",") + "}"
}

function Get-Sha256 {
    param([string]$Text)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        $hash = $sha.ComputeHash($bytes)
        return "sha256:" + (($hash | ForEach-Object { $_.ToString("x2") }) -join "")
    } finally { $sha.Dispose() }
}

function Write-LogLine {
    param($Record)
    $json = $Record | ConvertTo-Json -Depth 10 -Compress
    Add-Content -Path $LogFile -Value $json -Encoding UTF8
}

# --- Load published artworks for dedup ---
$published = @()
if (Test-Path $ArtworksFile) {
    try {
        $raw = Get-Content -Path $ArtworksFile -Raw -Encoding UTF8
        if (-not [string]::IsNullOrWhiteSpace($raw)) {
            $parsed = $raw | ConvertFrom-Json
            if ($parsed -is [System.Collections.IEnumerable] -and -not ($parsed -is [System.Collections.IDictionary]) -and -not $parsed.GetType().Name.StartsWith("PSCustomObject")) {
                $published = @($parsed)
            } elseif ($null -ne $parsed) {
                $published = @($parsed)
            }
        }
    } catch {
        Write-Warning "Could not parse artworks file: $($_.Exception.Message)"
    }
}

$publishedExternal = @{}
$publishedHashes   = @{}
foreach ($art in $published) {
    $eid = Get-Prop $art "external_id"
    $sid = Get-Prop $art "source_id"
    if ($null -ne $eid -and $null -ne $sid) {
        $publishedExternal["$sid|$eid"] = $true
    }
    $ch = Get-Prop $art "content_hash"
    if (-not (Test-EmptyString $ch)) { $publishedHashes[$ch] = $true }
}

# --- Prepare dirs ---
if (-not (Test-Path $CandidatesDir)) { New-Item -ItemType Directory -Path $CandidatesDir -Force | Out-Null }
if (-not (Test-Path $IncomingDir))   { New-Item -ItemType Directory -Path $IncomingDir   -Force | Out-Null }
$logDir = Split-Path -Parent $LogFile
if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

# --- Find candidate files ---
$candidateFiles = @(Get-ChildItem -Path $CandidatesDir -Filter "discovered-*.json" -File -ErrorAction SilentlyContinue | Sort-Object Name)
if ($candidateFiles.Count -eq 0) {
    Write-Host "No candidate files found in $CandidatesDir. Nothing to do."
    return
}

$timestamp     = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$nowIso        = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$outFile       = Join-Path $IncomingDir "verified-$timestamp.json"

$verifiedCandidates = New-Object System.Collections.ArrayList
$summary = @{ pass = 0; review = 0; fail = 0 }
$filesToRename = New-Object System.Collections.ArrayList

foreach ($file in $candidateFiles) {
    $sourceFile = $file.Name
    $rawText = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($rawText)) {
        $filesToRename.Add($file) | Out-Null
        continue
    }
    $items = $null
    try {
        $parsed = $rawText | ConvertFrom-Json
        if ($parsed -is [System.Collections.IEnumerable] -and -not ($parsed -is [string]) -and -not ($parsed.GetType().Name.StartsWith("PSCustomObject"))) {
            $items = @($parsed)
        } else {
            $items = @($parsed)
        }
    } catch {
        Write-Warning "Cannot parse $sourceFile : $($_.Exception.Message)"
        $filesToRename.Add($file) | Out-Null
        continue
    }

    foreach ($c in $items) {
        if ($null -eq $c) { continue }
        $reasons  = New-Object System.Collections.ArrayList
        $verdicts = New-Object System.Collections.ArrayList
        $rightsHint = $null

        # ---- 3.1 Structural validation ----
        foreach ($field in $RequiredFields) {
            $val = Get-Prop $c $field
            # "present" = property exists (null is allowed only for passport_id per spec)
            $exists = $false
            if ($c -is [System.Collections.IDictionary]) { $exists = $c.Contains($field) }
            else { $exists = ($null -ne $c.PSObject.Properties[$field]) }
            if (-not $exists) {
                $verdicts.Add("fail") | Out-Null
                $reasons.Add("SCHEMA_INVALID:$field") | Out-Null
            }
        }

        # enum checks
        $statusVal = Get-Prop $c "status"
        if ($null -ne $statusVal -and $EnumStatus -notcontains $statusVal) {
            $verdicts.Add("fail") | Out-Null; $reasons.Add("SCHEMA_INVALID:status") | Out-Null
        }
        $provVal = Get-Prop $c "provenance_level"
        if ($null -ne $provVal -and $EnumProvenance -notcontains $provVal) {
            $verdicts.Add("fail") | Out-Null; $reasons.Add("SCHEMA_INVALID:provenance_level") | Out-Null
        }
        $rightsVal = Get-Prop $c "rights_status"
        if ($null -ne $rightsVal -and $EnumRights -notcontains $rightsVal) {
            $verdicts.Add("fail") | Out-Null; $reasons.Add("SCHEMA_INVALID:rights_status") | Out-Null
        }
        $ipVal = Get-Prop $c "third_party_ip_risk"
        if ($null -ne $ipVal -and $EnumIpRisk -notcontains $ipVal) {
            $verdicts.Add("fail") | Out-Null; $reasons.Add("SCHEMA_INVALID:third_party_ip_risk") | Out-Null
        }

        # passport_id pattern (null allowed)
        $passId = Get-Prop $c "passport_id"
        if (-not ($null -eq $passId)) {
            if (-not ($passId -is [string]) -or ($passId -notmatch $PassportPattern)) {
                $verdicts.Add("fail") | Out-Null; $reasons.Add("SCHEMA_INVALID:passport_id") | Out-Null
            }
        }

        # ---- 3.2 Provenance ----
        $evidence = Get-Prop $c "provenance_evidence"
        if ($null -eq $evidence) { $evidence = @() }
        $evidenceArr = @($evidence)
        $provLevel = Get-Prop $c "provenance_level"

        $strongTypes = @("c2pa_manifest","api_response","generation_log")
        $hasStrongReal = $false
        foreach ($ev in $evidenceArr) {
            $t = Get-Prop $ev "type"
            if ($strongTypes -contains $t) {
                $h = Get-Prop $ev "hash"
                if ($h -eq $PlaceholderHash) {
                    # Recompute hash from canonical JSON of the evidence object (minus hash) as a deterministic source.
                    $copy = [ordered]@{}
                    if ($ev -is [System.Collections.IDictionary]) {
                        foreach ($k in $ev.Keys) { if ($k -ne "hash") { $copy[$k] = $ev[$k] } }
                    } else {
                        foreach ($p in $ev.PSObject.Properties) { if ($p.Name -ne "hash") { $copy[$p.Name] = $p.Value } }
                    }
                    $canon = Get-CanonicalJson $copy
                    $realHash = Get-Sha256 $canon
                    Set-Prop $ev "hash" $realHash
                    $h = $realHash
                    $reasons.Add("HASH_RECOMPUTED:$t") | Out-Null
                }
                if ($h -is [string] -and $h -match $HashPattern) { $hasStrongReal = $true }
            }
        }

        if ($hasStrongReal) {
            $newProv = "A"
        } else {
            $hasAuthorConfirm = $false
            foreach ($ev in $evidenceArr) {
                if ((Get-Prop $ev "type") -eq "author_confirmation") { $hasAuthorConfirm = $true; break }
            }
            $creatorVal = Get-Prop $c "creator"
            $modelVal   = Get-Prop $c "model_name"
            if ($hasAuthorConfirm -and -not (Test-EmptyString $creatorVal) -and -not (Test-EmptyString $modelVal)) {
                $newProv = "B"
            } else {
                $newProv = "C"
            }
        }
        Set-Prop $c "provenance_level" $newProv
        Set-Prop $c "provenance_evidence" $evidenceArr

        if ($newProv -eq "C") {
            $verdicts.Add("fail") | Out-Null
            $reasons.Add("PROVENANCE_C") | Out-Null
        }

        # ---- 3.3 Rights ----
        $rStatus = Get-Prop $c "rights_status"
        $rBasis  = Get-Prop $c "rights_basis"
        $juris   = Get-Prop $c "source_jurisdiction"

        if ($rStatus -eq "unknown") {
            $verdicts.Add("review") | Out-Null
            $reasons.Add("RIGHTS_UNKNOWN") | Out-Null
        }
        if (($rStatus -eq "confirmed" -or $rStatus -eq "external_link_only") -and (Test-EmptyString $rBasis)) {
            $verdicts.Add("fail") | Out-Null
            $reasons.Add("RIGHTS_BASIS_MISSING") | Out-Null
        }
        if ($juris -eq "unknown") {
            $verdicts.Add("review") | Out-Null
            $reasons.Add("JURISDICTION_UNKNOWN") | Out-Null
        }

        # rights_hint from source metadata (if present)
        $allow = $null
        foreach ($srcKey in @("source_metadata","metadata","raw")) {
            $src = Get-Prop $c $srcKey
            if ($null -ne $src) {
                $a = Get-Prop $src "allowCommercialUse"
                if ($null -ne $a) { $allow = $a; break }
            }
        }
        if ($null -eq $allow) {
            $a = Get-Prop $c "allowCommercialUse"
            if ($null -ne $a) { $allow = $a }
        }
        if ($null -ne $allow) {
            $rightsHint = [ordered]@{ allowCommercialUse = $allow; source = "source_metadata" }
        }

        # ---- 3.4 IP risk ----
        $ip = Get-Prop $c "third_party_ip_risk"
        if ($ip -eq "unknown") {
            $verdicts.Add("review") | Out-Null
            $reasons.Add("IP_RISK_UNASSESSED") | Out-Null
        } elseif ($ip -eq "high") {
            $verdicts.Add("fail") | Out-Null
            $reasons.Add("IP_RISK_HIGH") | Out-Null
        }

        # ---- 3.5 Dedup ----
        $extId = Get-Prop $c "external_id"
        $srcId = Get-Prop $c "source_id"
        if ($null -ne $extId -and -not (Test-EmptyString $srcId)) {
            $key = "$srcId|$extId"
            if ($publishedExternal.ContainsKey($key)) {
                $verdicts.Add("fail") | Out-Null
                $reasons.Add("DUPLICATE_EXTERNAL_ID") | Out-Null
            }
        }
        $ch = Get-Prop $c "content_hash"
        if (-not (Test-EmptyString $ch) -and $publishedHashes.ContainsKey($ch)) {
            $verdicts.Add("fail") | Out-Null
            $reasons.Add("DUPLICATE_HASH") | Out-Null
        }
        # TODO(v1+): perceptual-hash (pHash) near-duplicate detection is out of scope.

        # ---- Final verdict ----
        $final = Get-WorstVerdict -Verdicts @($verdicts)
        if ($verdicts.Count -eq 0) { $final = "pass" }

        # ---- Annotate candidate ----
        Set-Prop $c "verification" ([ordered]@{
            verified_at = $nowIso
            verdict     = $final
            reasons     = @($reasons)
            rights_hint = $rightsHint
        })
        Set-Prop $c "updated_at" $nowIso

        $hist = Get-Prop $c "history"
        $histArr = if ($null -eq $hist) { @() } else { @($hist) }
        $histArr += [ordered]@{
            event     = "auto_verified"
            timestamp = $nowIso
            actor     = "cli/verify.ps1"
            reason    = "$($final): $($reasons -join ',')"
        }
        Set-Prop $c "history" $histArr

        $verifiedCandidates.Add($c) | Out-Null

        # ---- Counters + log ----
        $summary[$final] = $summary[$final] + 1
        Write-LogLine ([ordered]@{
            timestamp   = $nowIso
            source_file = $sourceFile
            external_id = $extId
            verdict     = $final
            reasons     = @($reasons)
        })
    }

    $filesToRename.Add($file) | Out-Null
}

# --- Write verified output ---
$outJson = $verifiedCandidates | ConvertTo-Json -Depth 20
if ($verifiedCandidates.Count -eq 0) { $outJson = "[]" }
Set-Content -Path $outFile -Value $outJson -Encoding UTF8

# --- Rename processed candidates ---
foreach ($f in $filesToRename) {
    $target = $f.FullName + ".processed"
    try {
        Move-Item -Path $f.FullName -Destination $target -Force
    } catch {
        Write-Warning "Could not rename $($f.Name): $($_.Exception.Message)"
    }
}

# --- Console summary ---
Write-Host ""
Write-Host "=== WAAM verify summary ==="
Write-Host ("  pass   : {0}" -f $summary.pass)
Write-Host ("  review : {0}" -f $summary.review)
Write-Host ("  fail   : {0}" -f $summary.fail)
Write-Host ("  output : {0}" -f $outFile)
Write-Host ("  log    : {0}" -f $LogFile)