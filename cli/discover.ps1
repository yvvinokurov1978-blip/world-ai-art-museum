# WAAM Discovery Engine - dry-run connector for Civitai
# Reads public API only. Does NOT write anything to Civitai.
# Saves candidates to data/candidates/ for manual moderation.

param(
    [int]$Limit = 5,
    [string]$Sort = "Most Reactions",
    [string]$Period = "AllTime"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$candidatesDir = Join-Path $repoRoot "data\candidates"

if (-not (Test-Path $candidatesDir)) {
    New-Item -ItemType Directory -Path $candidatesDir -Force | Out-Null
}

Write-Host "[discover] Querying Civitai API (limit=$Limit, sort=$Sort)..." -ForegroundColor Cyan

$url = "https://civitai.com/api/v1/images?limit=$Limit&nsfw=None&sort=$([uri]::EscapeDataString($Sort))&period=$Period"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "User-Agent" = "WAAM-Discovery/0.1 (research; https://github.com/yvvinokurov1978-blip/world-ai-art-museum)"
    } -TimeoutSec 30
} catch {
    Write-Host "[discover] ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if (-not $response.items -or $response.items.Count -eq 0) {
    Write-Host "[discover] No items returned." -ForegroundColor Yellow
    exit 0
}

$discoveredAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$candidates = @()

foreach ($item in $response.items) {
    $candidate = [ordered]@{
        passport_id        = $null  # assigned later by verify/moderate
        passport_version   = 1
        status             = "discovered"
        title              = if ($item.meta.prompt) { $item.meta.prompt.Substring(0, [Math]::Min(80, $item.meta.prompt.Length)) } else { "Untitled" }
        category           = $null
        creator            = if ($item.username) { $item.username } else { $null }
        model_name         = if ($item.meta.Model) { $item.meta.Model } else { $null }
        image_generator    = "Civitai"
        model_version      = if ($item.meta.ModelVersion) { $item.meta.ModelVersion } else { $null }
        source_id          = "civitai"
        source_url         = "https://civitai.com/images/$($item.id)"
        external_id        = $item.id
        source_jurisdiction = "unknown"
        provenance_level   = "C"
        provenance_evidence = @(
            [ordered]@{
                type        = "api_response"
                uri         = $url
                hash        = "sha256:" + ("0" * 64)  # placeholder; real hash computed later
                captured_at = $discoveredAt
                captured_by = "connector:civitai"
            }
        )
        rights_status      = "unknown"
        rights_basis       = $null
        rights_scope       = "link_only"
        third_party_ip_risk = "unknown"
        preview_url        = $item.url
        discovered_at      = $discoveredAt
        created_at         = $discoveredAt
        updated_at         = $discoveredAt
    }
    $candidates += $candidate
}

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$outFile = Join-Path $candidatesDir "discovered-$timestamp.json"

$candidates | ConvertTo-Json -Depth 10 | Set-Content -Path $outFile -Encoding UTF8

Write-Host "[discover] Saved $($candidates.Count) candidates to $outFile" -ForegroundColor Green
Write-Host "[discover] Next step: run 'cli/verify.ps1' to check provenance and rights." -ForegroundColor Cyan
