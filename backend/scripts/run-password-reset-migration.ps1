$ErrorActionPreference = 'Stop'

if (-not $env:DATABASE_URL) {
  throw 'DATABASE_URL no esta disponible en el entorno.'
}

$migrationPath = Join-Path $PSScriptRoot '..\src\migrations\20260705_add_password_reset_tokens.sql'
if (-not (Test-Path -LiteralPath $migrationPath)) {
  throw "No se encontro la migracion: $migrationPath"
}

$databaseUri = [System.Uri]$env:DATABASE_URL
$databaseName = $databaseUri.AbsolutePath.TrimStart('/')
if (-not $databaseName) {
  throw 'DATABASE_URL no incluye nombre de base de datos.'
}

$userInfo = $databaseUri.UserInfo.Split(':', 2)
$dbUser = [System.Uri]::UnescapeDataString($userInfo[0])
$dbPassword = if ($userInfo.Length -gt 1) { [System.Uri]::UnescapeDataString($userInfo[1]) } else { '' }
$dbHost = $databaseUri.Host
$dbPort = if ($databaseUri.Port -gt 0) { $databaseUri.Port } else { 3306 }
$sql = Get-Content -LiteralPath $migrationPath -Raw

$env:MYSQL_PWD = $dbPassword

try {
  & mysql `
    --host=$dbHost `
    --port=$dbPort `
    --user=$dbUser `
    --database=$databaseName `
    --ssl-mode=REQUIRED `
    --execute=$sql

  if ($LASTEXITCODE -ne 0) {
    throw "mysql termino con codigo $LASTEXITCODE."
  }

  Write-Output 'Migracion aplicada: password_reset_tokens existe.'
} finally {
  Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}
