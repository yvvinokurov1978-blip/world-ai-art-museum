Проект WAAM, статический каталог, пайплайн Discovered → Verified → Published, публикация только после ручной модерации.

Ниже — техническое задание, схема паспорта и существующий коннектор (формат входных данных). Напиши файл `cli/verify.ps1` строго по ТЗ. Ответ — только код файла с минимальными пояснениями.

================================================================
ТЗ-01: cli/verify.ps1 — автоматическая верификация кандидатов WAAM
================================================================

Язык: PowerShell 5.1+ (без внешних зависимостей)
Вход: файлы `data/candidates/discovered-*.json` (результат `cli/discover.ps1`)
Выход: `data/incoming/verified-<timestamp>.json` + строки в `data/ingestion_logs.jsonl`

## 1. Назначение

Второе звено пайплайна Discovered → Verified → Published. Скрипт автоматически проверяет кандидатов по PASSPORT_SCHEMA.json и правилам прав, выносит предварительное решение. Финальное подтверждение остаётся за человеком, скрипт ничего не публикует.

## 2. Параметры

```powershell
param(
    [string]$CandidatesDir = "data\candidates",
    [string]$IncomingDir   = "data\incoming",
    [string]$ArtworksFile  = "data\artworks.json",
    [string]$LogFile       = "data\ingestion_logs.jsonl"
)
```

## 3. Проверки для каждого кандидата

Каждая проверка даёт verdict `pass` / `fail` / `review` с кодом причины. Итоговый вердикт кандидата — худший из проверок (`fail` > `review` > `pass`).

### 3.1 Структурная валидация
- Обязательные поля по схеме (required-список) присутствуют.
- Enum-поля (`status`, `provenance_level`, `rights_status`, `third_party_ip_risk`) — только допустимые значения.
- `passport_id` либо `null`, либо паттерн `^WAAM-[0-9]{4}-[0-9]{4}$`.
- Код причины при fail: `SCHEMA_INVALID:<поле>`.

### 3.2 Происхождение (provenance)
- Уровень A: в `provenance_evidence[]` есть объект типа `c2pa_manifest`, `api_response` или `generation_log` с реальным хешем `sha256:` + 64 hex. Если хеш-заглушка (`000...0`) — пересчитать SHA-256 от каноничного JSON исходного api_response и подставить, зафиксировав в логе.
- Уровень B: есть `author_confirmation` + заполнены `creator` и `model_name`.
- Иначе уровень C → итоговый `fail` с кодом `PROVENANCE_C` (уровень C не публикуется).

### 3.3 Права (rights)
- `rights_status` = `unknown` → итоговый не выше `review`, код `RIGHTS_UNKNOWN`.
- `rights_status` в (`confirmed`, `external_link_only`), но `rights_basis` пуст → `fail`, код `RIGHTS_BASIS_MISSING`.
- Если в метаданных источника есть `allowCommercialUse` — записать в поле `rights_hint` (подсказка, не решение).
- `source_jurisdiction` = `unknown` → `review`, код `JURISDICTION_UNKNOWN`.

### 3.4 IP-риск
- `third_party_ip_risk` = `unknown` → трактовать как `medium` → `review`, код `IP_RISK_UNASSESSED`.
- `high` → `fail`, код `IP_RISK_HIGH`.

### 3.5 Дедупликация
- По `external_id` + `source_id` против опубликованных в `data/artworks.json` → `fail`, код `DUPLICATE_EXTERNAL_ID`.
- Если заполнен `content_hash` — сверить с хешами опубликованных → `fail`, код `DUPLICATE_HASH`.
- pHash — вне объёма v1, оставить TODO-комментарий.

## 4. Результат

1. `data/incoming/verified-<yyyyMMdd-HHmmss>.json` — массив кандидатов, каждый дополнен:
   - `verification`: `{ verified_at, verdict, reasons: [коды], rights_hint }`
   - обновлённые `provenance_level`, `provenance_evidence` (реальные хеши), `updated_at`
   - элемент `history`: `{ event: "auto_verified", timestamp, actor: "cli/verify.ps1", reason: "<verdict>: <коды>" }`
2. В `data/ingestion_logs.jsonl` (JSON Lines) — одна строка на кандидата: `{ timestamp, source_file, external_id, verdict, reasons }`.
3. Исходные файлы в `data/candidates/` не удалять — переименовать в `<имя>.processed`.
4. В консоль — сводка pass/review/fail.

## 5. Критерии приёмки

- Пустая папка candidates → корректный выход без ошибок.
- Кандидат с хешем-заглушкой получает пересчитанный хеш, запись в логе.
- Кандидат без `rights_basis` при `rights_status=confirmed` → `fail`.
- Дубликат по `external_id` отклоняется.
- Скрипт не выполняет сетевых запросов и ничего не публикует.

## 6. Ограничения

- Только чтение данных из файлов; никаких обращений к API.
- Кодировка UTF-8; пути через `Join-Path` от корня репозитория.
- Комментарии в коде — кратко, на английском.

================================================================
PASSPORT_SCHEMA.json (схема паспорта работы)
================================================================

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://waam.example/schemas/passport.json",
  "title": "WAAM Artwork Passport",
  "version": "1.0",
  "type": "object",
  "required": [
    "passport_id",
    "passport_version",
    "status",
    "title",
    "provenance_level",
    "rights_status",
    "rights_basis",
    "third_party_ip_risk",
    "source_jurisdiction",
    "provenance_evidence",
    "created_at",
    "updated_at"
  ],
  "properties": {
    "passport_id": {
      "type": "string",
      "pattern": "^WAAM-[0-9]{4}-[0-9]{4}$",
      "description": "Format: WAAM-YYYY-NNNN. Never reused after removal."
    },
    "passport_version": { "type": "integer", "minimum": 1 },
    "status": { "enum": ["discovered", "verified", "published"] },
    "title": { "type": "string" },
    "creator": { "type": ["string", "null"] },
    "model_name": { "type": ["string", "null"] },
    "image_generator": { "type": ["string", "null"] },
    "model_version": { "type": ["string", "null"] },
    "created_date": { "type": ["string", "null"], "format": "date" },
    "source_id": { "type": "string" },
    "source_url": { "type": "string", "format": "uri" },
    "source_jurisdiction": { "type": "string" },
    "provenance_level": { "enum": ["A", "B", "C"] },
    "provenance_evidence": {
      "type": "array",
      "minItems": 0,
      "items": {
        "type": "object",
        "required": ["type", "uri", "hash", "captured_at"],
        "properties": {
          "type": { "enum": ["c2pa_manifest", "api_response", "generation_log", "author_confirmation", "screenshot"] },
          "uri": { "type": "string", "format": "uri" },
          "hash": { "type": "string", "pattern": "^sha256:[a-f0-9]{64}$" },
          "captured_at": { "type": "string", "format": "date-time" },
          "captured_by": { "type": "string" }
        }
      }
    },
    "rights_status": { "enum": ["confirmed", "external_link_only", "unknown", "denied"] },
    "rights_basis": { "type": "string" },
    "rights_scope": { "enum": ["display", "thumbnail", "link_only"] },
    "third_party_ip_risk": { "enum": ["low", "medium", "high", "unknown"] },
    "content_hash": { "type": ["string", "null"], "pattern": "^sha256:[a-f0-9]{64}$" },
    "genre": { "type": ["string", "null"] },
    "style": { "type": ["string", "null"] },
    "history": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["event", "timestamp"],
        "properties": {
          "event": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" },
          "actor": { "type": "string" },
          "reason": { "type": "string" }
        }
      }
    },
    "supersedes": { "type": ["string", "null"] },
    "superseded_by": { "type": ["string", "null"] },
    "created_at": { "type": "string", "format": "date-time" },
    "updated_at": { "type": "string", "format": "date-time" }
  },
  "allOf": [
    {
      "if": { "properties": { "status": { "const": "published" } } },
      "then": {
        "properties": {
          "rights_status": { "enum": ["confirmed", "external_link_only"] },
          "provenance_level": { "enum": ["A", "B"] },
          "third_party_ip_risk": { "enum": ["low", "medium"] }
        },
        "required": ["rights_basis", "content_hash"]
      }
    },
    {
      "if": { "properties": { "provenance_level": { "const": "A" } } },
      "then": {
        "properties": {
          "provenance_evidence": {
            "minItems": 1,
            "contains": {
              "properties": { "type": { "enum": ["c2pa_manifest", "api_response", "generation_log"] } }
            }
          }
        }
      }
    }
  ]
}
```

================================================================
cli/discover.ps1 (существующий коннектор — формат входных кандидатов)
================================================================

```powershell
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

$url = "https://civitai.com/api/v1/images?limit=$Limit&nsfw=None&sort=$([uri]::EscapeDataString($Sort))&period=$Period"

$response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
    "User-Agent" = "WAAM-Discovery/0.1 (research)"
} -TimeoutSec 30

$discoveredAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$candidates = @()

foreach ($item in $response.items) {
    $candidate = [ordered]@{
        passport_id        = $null
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
```
