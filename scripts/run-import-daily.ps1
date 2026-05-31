# run-import-daily.ps1
# Disparado pelo Task Scheduler 2x/dia (12:00 e 19:00).
# Cria container detached que importa tickets/mensagens/midia do Blip
# -> Postgres + MinIO locais.
# Idempotente: se ja tem `import-daily-bg` rodando, sai cedo (nao duplica).
#
# IMPORTANTE: este arquivo NAO pode conter caracteres non-ASCII (acentos, em-dash,
# setas, etc.) porque PS 5.1 le UTF-8 sem BOM como Windows-1252 e quebra o parser.
# Bug consumiu 2 dias de imports em 2026-05-29 a 2026-05-31. Manter ASCII puro.

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"

$LogDir  = "C:\Users\CHABRA\Documents\db-messages-main\logs"
$LogFile = Join-Path $LogDir ("import-daily-{0:yyyyMMdd-HHmm}.log" -f (Get-Date))
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
  $line = "{0:yyyy-MM-dd HH:mm:ss}  $msg" -f (Get-Date)
  Add-Content -Path $LogFile -Value $line
  Write-Host $line
}

# Marca jobs com status='running' ha mais de 6h como 'failed' (zumbis), MAS apenas
# se o container associado (metadata.container) nao estiver mais Up. Evita marcar
# um job legitimo de longa duracao cujo container ainda processa. Caso real:
# 2026-05-27 e1f2a0df ficou 43h+ "running" em 91.4% - container havia morrido.
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
  else { Log "[zombie-cleanup] todos os candidatos tem container Up - nada a marcar" }
}

$ProjectDir    = "C:\Users\CHABRA\Documents\db-messages-main"
$EnvFile       = Join-Path $ProjectDir ".env.import-script"
$Network       = "db-messages-main_db-messages-network"

# Pipeline daily: 2 etapas sequenciais
#   etapa A: tickets novos (rapido, ~1-2min)
#   etapa B: mensagens dos tickets existentes (modo delta ~2-3h pos-drenagem
#            do backlog inicial; sweep completo e responsabilidade do
#            run-import-weekly-full.ps1)
$Stages = @(
  @{ Name = "import-tickets-bg";  Script = "import-new-tickets-standalone.ts"; Detached = $false; ExtraEnv = @() },
  @{ Name = "import-daily-bg";    Script = "import-all-tickets-with-media.ts"; Detached = $true;  ExtraEnv = @("IMPORT_MODE=delta","CONCURRENCY_TICKETS=15") }
)

Log "[start] script triggered by Task Scheduler"

if (-not (Test-Path $EnvFile)) { Log "[abort] .env nao encontrado em $EnvFile"; exit 1 }

CleanupZombieJobs

foreach ($stage in $Stages) {
  $name = $stage.Name
  $script = $stage.Script
  $detached = $stage.Detached
  $extraEnv = $stage.ExtraEnv
  $scriptPath = Join-Path $ProjectDir "scripts\$script"
  if (-not (Test-Path $scriptPath)) { Log "[abort] script $script nao encontrado"; exit 1 }

  $existing = & docker ps -a --filter "name=^${name}$" --format "{{.Status}}" 2>$null
  if ($existing) {
    if ($existing -like "Up*") { Log "[skip] $name ja esta rodando ($existing). Pulando etapa."; continue }
    Log ("[cleanup] removendo container parado: {0} ({1})" -f $name, $existing)
    & docker rm -f $name 2>&1 | Out-Null
  }

  # Monta lista de -e <KEY=VAL> a partir de ExtraEnv. Vazio = nada extra.
  $envArgs = @()
  foreach ($e in $extraEnv) { $envArgs += @("-e", $e) }

  Log "[run] disparando $name -> $script (detached=$detached, extraEnv=[$($extraEnv -join ',')])"
  if ($detached) {
    $containerId = & docker run -d --name $name --network $Network --env-file $EnvFile @envArgs -v "${ProjectDir}\scripts:/scripts:ro" -w /scripts oven/bun:1.2-alpine bun /scripts/$script 2>&1
    if ($LASTEXITCODE -ne 0) { Log ("[fail] {0}: {1}" -f $name, $containerId); exit $LASTEXITCODE }
    Log "[ok] $name iniciado: $containerId"
  } else {
    & docker run --rm --name $name --network $Network --env-file $EnvFile @envArgs -v "${ProjectDir}\scripts:/scripts:ro" -w /scripts oven/bun:1.2-alpine bun /scripts/$script 2>&1 | ForEach-Object { Add-Content -Path $LogFile -Value "  [$name] $_" }
    if ($LASTEXITCODE -ne 0) { Log ("[fail] {0} saiu com {1}" -f $name, $LASTEXITCODE); exit $LASTEXITCODE }
    Log "[ok] $name terminou OK"
  }
}

Log "[end] pipeline daily finalizado. Para acompanhar import-daily-bg: docker logs import-daily-bg -f"
exit 0
