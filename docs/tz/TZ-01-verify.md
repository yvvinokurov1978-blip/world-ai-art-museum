# ТЗ-01: cli/verify.ps1 — автоматическая верификация кандидатов WAAM

**Статус:** к разработке (вариант А, файловый пайплайн)
**Язык:** PowerShell 5.1+ (без внешних зависимостей)
**Вход:** файлы `data/candidates/discovered-*.json` (результат `cli/discover.ps1`)
**Выход:** `data/incoming/verified-<timestamp>.json` + строки в `data/ingestion_logs.jsonl`

## 1. Назначение

Второе звено пайплайна Discovered → Verified → Published. Скрипт автоматически проверяет кандидатов по `PASSPORT_SCHEMA.json` и `RIGHTS_POLICY.md` и выносит предварительное решение. Финальное подтверждение остаётся за человеком (ТЗ-02), скрипт ничего не публикует.

## 2. Параметры

```powershell
param(
    [string]$CandidatesDir = "data\candidates",   # где искать discovered-*.json
    [string]$IncomingDir   = "data\incoming",     # куда класть результат
    [string]$ArtworksFile  = "data\artworks.json",# для дедупликации
    [string]$LogFile       = "data\ingestion_logs.jsonl"
)
```

## 3. Проверки для каждого кандидата

Каждая проверка даёт verdict `pass` / `fail` / `review` с кодом причины. Итоговый вердикт кандидата — худший из проверок (`fail` > `review` > `pass`).

### 3.1 Структурная валидация
- Обязательные поля по `PASSPORT_SCHEMA.json` (required-список) присутствуют.
- Значения enum-полей (`status`, `provenance_level`, `rights_status`, `third_party_ip_risk`) — только из допустимых списков.
- `passport_id` либо `null` (присвоит модератор), либо соответствует паттерну `^WAAM-[0-9]{4}-[0-9]{4}$`.
- Код причины при fail: `SCHEMA_INVALID:<поле>`.

### 3.2 Происхождение (provenance)
- Уровень A: в `provenance_evidence[]` есть объект типа `c2pa_manifest`, `api_response` или `generation_log` с **реальным** хешем `sha256:` + 64 hex (не placeholder из нулей). Если хеш-заглушка (`000...0`) — пересчитать SHA-256 от каноничного JSON исходного api_response и подставить, зафиксировав в логе.
- Уровень B: есть `author_confirmation` + заполнены `creator` и `model_name`.
- Иначе уровень C → итоговый `fail` с кодом `PROVENANCE_C` (уровень C не публикуется, см. RIGHTS_POLICY п.3).

### 3.3 Права (rights)
- Если `rights_status` = `unknown` → итоговый не выше `review`, код `RIGHTS_UNKNOWN` (решает модератор).
- Если `rights_status` в (`confirmed`, `external_link_only`), но `rights_basis` пуст → `fail`, код `RIGHTS_BASIS_MISSING` (решение без основания недействительно, RIGHTS_POLICY п.4).
- Если в метаданных источника есть `allowCommercialUse` — записать его в поле `rights_hint` (подсказка, не решение).
- Если `source_jurisdiction` = `unknown` → `review`, код `JURISDICTION_UNKNOWN`.

### 3.4 IP-риск
- `third_party_ip_risk` = `unknown` → трактовать как `medium` → `review`, код `IP_RISK_UNASSESSED`.
- `high` → `fail`, код `IP_RISK_HIGH`.

### 3.5 Дедупликация
- По `external_id` + `source_id` против уже опубликованных в `data/artworks.json` → совпадение = `fail`, код `DUPLICATE_EXTERNAL_ID`.
- Если заполнен `content_hash` — сверить с хешами опубликованных → `fail`, код `DUPLICATE_HASH`.
- pHash (перцептивный хеш изображения) — **вне объёма v1**, оставить TODO-комментарий.

## 4. Результат

1. `data/incoming/verified-<yyyyMMdd-HHmmss>.json` — массив кандидатов, каждый дополнен:
   - `verification`: `{ verified_at, verdict, reasons: [коды], rights_hint }`
   - обновлённые `provenance_level`, `provenance_evidence` (реальные хеши), `updated_at`
   - элемент `history`: `{ event: "auto_verified", timestamp, actor: "cli/verify.ps1", reason: "<verdict>: <коды>" }`
2. В `data/ingestion_logs.jsonl` (JSON Lines, создать если нет) — одна строка на кандидата: `{ timestamp, source_file, external_id, verdict, reasons }`.
3. Исходные файлы в `data/candidates/` **не удалять** — переименовать в `<имя>.processed`.
4. Вывод в консоль: сводка `pass/review/fail` по количеству.

## 5. Критерии приёмки

- На пустой папке `candidates` — корректный выход с нулевой сводкой, без ошибок.
- Кандидат с хешем-заглушкой получает пересчитанный хеш; в логе есть запись.
- Кандидат без `rights_basis` при `rights_status=confirmed` получает `fail`.
- Дубликат по `external_id` отклоняется.
- Файл результата валиден по `PASSPORT_SCHEMA.json` для каждого элемента (поля `verification` и `history` схемой допускаются — `additionalProperties` не запрещены).
- Скрипт не выполняет сетевых запросов и ничего не публикует.

## 6. Ограничения

- Только чтение Civitai-данных из файлов; никаких обращений к API.
- Кодировка файлов UTF-8; пути — через `Join-Path` от корня репозитория.
- Комментарии в коде — кратко, на английском.
