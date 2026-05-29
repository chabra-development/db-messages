# run-import-weekly-full.ps1
# Disparado pelo Task Scheduler 1x/semana (domingo 03:00).
# Sweep COMPLETO de todos os tickets (ignora filtro delta-aware) para capturar
# correcoes raras em tickets fechados (rating, transferencia tardia, msg fora-de-ordem).
# Daily continua rodando IMPORT_MODE=delta nos outros dias.

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"

$LogDir  = "C:\Users\CHABRA\Documents\db-messages-main\logs"
$LogFile = Join-Path $LogDir ("import-weekly-full-{0:yyyyMMdd-HHmm}.log" -f (Get-Date))
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
  $line = "{0:yyyy-MM-dd HH:mm:ss}  $msg" -f (Get-Date)
  Add-Content -Path $LogFile -Value $line
  Write-Host $line
}

# Marca jobs com status='running' ha mais de 6h como 'failed' (zumbis), MAS apenas
# se o container associado (metadata.container) nao estiver mais Up. Evita marcar
# um job legitimo de longa duracao cujo container ainda processa. Caso real:
# 2026-05-27 e1f2a0df ficou 43h+ "running" em 91,4% - container havia morrido.
function CleanupZombieJobs() {
  $query = "SELECT id || '|' || COALESCE(metadata->>'container','') FROM import_jobs WHERE status = 'running' AND started_at < NOW() - INTERVAL '6 hours' AND metadata->>'type' IN ('import-all-standalone-107', 'tickets-standalone-107');"
  $candidates = & docker exec db-messages-postgres psql -U chabra_admin -d wpp_blip -t -A -c $query 2>&1
  if ($LASTEXITCODE -ne 0) { Log "[zombie-cleanup] WARN: psql exit=$LASTEXITCODE saida=$candidates"; return }
  $rows = @($candidates | Where-Object { $_ -and $_ -match '\|' })
  if ($rows.Count -eq 0) { Log "[zombie-cleanup] nenhum candidato"; return }
  $marked = @()
  foreach ($line in $rows) {
    $parts = $line -split '\|', 2
    $jobId = $parts[0]; $container = $parts[1]
    if ($container) {
      $up = & docker ps --filter "name=^${container}$" --format "{{.Status}}" 2>$null
      if ($up -and $up -like "Up*") { Log "[zombie-cleanup] skip $jobId (container $container ainda Up: $up)"; continue }
    }
    $u = "UPDATE import_jobs SET status='failed', completed_at=NOW(), updated_at=NOW(), metadata=jsonb_set(COALESCE(metadata,'{}'::jsonb),'{cleanup_reason}',to_jsonb('auto-cleanup ' || NOW()::text || ': container ' || COALESCE(metadata->>'container','?') || ' nao encontrado / job > 6h')) WHERE id='$jobId';"
    & docker exec db-messages-postgres psql -U chabra_admin -d wpp_blip -c $u 2>&1 | Out-Null
    $marked += $jobId
  }
  if ($marked.Count -gt 0) { Log ("[zombie-cleanup] marcou {0} job(s) como failed: {1}" -f $marked.Count, ($marked -join ',')) }
  else { Log "[zombie-cleanup] todos os candidatos ainda tem container Up - nada a marcar" }
}

$ProjectDir = "C:\Users\CHABRA\Documents\db-messages-main"
$EnvFile    = Join-Path $ProjectDir ".env.import-script"
$Network    = "db-messages-main_db-messages-network"
$Script     = "import-all-tickets-with-media.ts"
$Name       = "import-weekly-full-bg"

Log "[start] sweep semanal completo (IMPORT_MODE=full)"

if (-not (Test-Path $EnvFile)) { Log "[abort] .env nao encontrado em $EnvFile"; exit 1 }
$scriptPath = Join-Path $ProjectDir "scripts\$Script"
if (-not (Test-Path $scriptPath)) { Log "[abort] script $Script nao encontrado"; exit 1 }

CleanupZombieJobs

# Conflito: se daily ainda nao terminou, NAO disparar (sobrecarga API Blip + Postgres).
$blockers = @("import-daily-bg", "import-weekly-full-bg", "import-all-bg")
foreach ($b in $blockers) {
  $st = & docker ps --filter "name=^${b}$" --format "{{.Status}}" 2>$null
  if ($st -and $st -like "Up*") {
    Log "[abort] container concorrente ainda rodando: $b ($st). Aborta sweep semanal."
    exit 0
  }
}

# Cleanup do container anterior se existir parado
$existing = & docker ps -a --filter "name=^${Name}$" --format "{{.Status}}" 2>$null
if ($existing) {
  Log ("[cleanup] removendo container parado: {0} ({1})" -f $Name, $existing)
  & docker rm -f $Name 2>&1 | Out-Null
}

Log "[run] disparando $Name detached (IMPORT_MODE=full)"
$containerId = & docker run -d --name $Name --network $Network `
  --env-file $EnvFile `
  -e IMPORT_MODE=full `
  -e CONCURRENCY_TICKETS=10 `
  -v "${ProjectDir}\scripts:/scripts:ro" -w /scripts `
  oven/bun:1.2-alpine bun /scripts/$Script 2>&1

if ($LASTEXITCODE -ne 0) { Log ("[fail] {0}: {1}" -f $Name, $containerId); exit $LASTEXITCODE }
Log "[ok] $Name iniciado: $containerId"
Log "[end] sweep semanal disparado. Acompanhar: docker logs $Name -f"
exit 0
