# run-import-daily.ps1
# Disparado pelo Task Scheduler 2x/dia (12:00 e 19:00).
# Cria container detached que importa tickets/mensagens/mídia do Blip → Postgres + MinIO locais.
# Idempotente: se já tem `import-daily-bg` rodando, sai cedo (não duplica).

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

$ProjectDir    = "C:\Users\CHABRA\Documents\db-messages-main"
$EnvFile       = Join-Path $ProjectDir ".env.import-script"
$Network       = "db-messages-main_db-messages-network"

# Pipeline daily: 2 etapas sequenciais
#   etapa A: tickets novos (rápido, ~1-2min)
#   etapa B: mensagens dos tickets existentes (longo, ~30-60min)
$Stages = @(
  @{ Name = "import-tickets-bg";  Script = "import-new-tickets-standalone.ts"; Detached = $false },
  @{ Name = "import-daily-bg";    Script = "import-all-tickets-with-media.ts"; Detached = $true  }
)

Log "[start] script triggered by Task Scheduler"

if (-not (Test-Path $EnvFile)) { Log "[abort] .env nao encontrado em $EnvFile"; exit 1 }

foreach ($stage in $Stages) {
  $name = $stage.Name
  $script = $stage.Script
  $detached = $stage.Detached
  $scriptPath = Join-Path $ProjectDir "scripts\$script"
  if (-not (Test-Path $scriptPath)) { Log "[abort] script $script nao encontrado"; exit 1 }

  $existing = & docker ps -a --filter "name=^${name}$" --format "{{.Status}}" 2>$null
  if ($existing) {
    if ($existing -like "Up*") { Log "[skip] $name ja esta rodando ($existing). Pulando etapa."; continue }
    Log ("[cleanup] removendo container parado: {0} ({1})" -f $name, $existing)
    & docker rm -f $name 2>&1 | Out-Null
  }

  Log "[run] disparando $name -> $script (detached=$detached)"
  if ($detached) {
    $containerId = & docker run -d --name $name --network $Network --env-file $EnvFile -v "${ProjectDir}\scripts:/scripts:ro" -w /scripts oven/bun:1.2-alpine bun /scripts/$script 2>&1
    if ($LASTEXITCODE -ne 0) { Log ("[fail] {0}: {1}" -f $name, $containerId); exit $LASTEXITCODE }
    Log "[ok] $name iniciado: $containerId"
  } else {
    & docker run --rm --name $name --network $Network --env-file $EnvFile -v "${ProjectDir}\scripts:/scripts:ro" -w /scripts oven/bun:1.2-alpine bun /scripts/$script 2>&1 | ForEach-Object { Add-Content -Path $LogFile -Value "  [$name] $_" }
    if ($LASTEXITCODE -ne 0) { Log ("[fail] {0} saiu com {1}" -f $name, $LASTEXITCODE); exit $LASTEXITCODE }
    Log "[ok] $name terminou OK"
  }
}

Log "[end] pipeline daily finalizado. Para acompanhar import-daily-bg: docker logs import-daily-bg -f"
exit 0
