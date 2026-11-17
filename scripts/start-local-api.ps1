$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$phpPath = (Get-Command php.exe -ErrorAction SilentlyContinue).Source
if (!$phpPath) {
    $phpPath = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
}
if (!(Test-Path -LiteralPath $phpPath)) {
    throw "PHP CLI was not found: $phpPath"
}

$extensionDir = Join-Path (Split-Path -Parent $phpPath) 'ext'
$publicRoot = Join-Path $backendRoot 'public'
$router = Join-Path $publicRoot 'index.php'
if (!(Test-Path -LiteralPath $router)) {
    throw "The local API router was not found: $router"
}

# Ensure local MySQL instance is running
$mysqlListener = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if (!$mysqlListener) {
    $mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.4'
    $mysqld = Join-Path $mysqlHome 'bin\mysqld.exe'
    $mysqlDataDirectory = Join-Path $env:LOCALAPPDATA 'MySQL\SaintBernard'
    $mysqlConfigPath = Join-Path $mysqlDataDirectory 'my-saint-bernard.ini'
    if (!(Test-Path -LiteralPath $mysqlConfigPath)) {
        $cfg = @"
[mysqld]
basedir="$($mysqlHome.Replace('\', '/'))"
datadir="$($mysqlDataDirectory.Replace('\', '/'))"
bind-address=127.0.0.1
port=3306
mysqlx=0
"@
        [System.IO.File]::WriteAllText($mysqlConfigPath, $cfg, [System.Text.Encoding]::ASCII)
    }
    if (Test-Path -LiteralPath $mysqld) {
        Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
            CommandLine = "`"$mysqld`" --defaults-file=`"$mysqlConfigPath`""
        } | Out-Null
        Start-Sleep -Seconds 3
    }
}

$listener = Get-NetTCPConnection -LocalPort 8098 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $health = Invoke-RestMethod -Uri 'http://localhost:8098/api/health' -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($health -and $health.status -eq 'ok') {
        exit 0
    }
    Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 1
}

$logDirectory = Join-Path $env:LOCALAPPDATA 'SaintBernard\logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$arguments = @(
    '-d'
    "extension_dir=`"$extensionDir`""
    '-d'
    'extension=pdo_mysql'
    '-d'
    'upload_max_filesize=8M'
    '-d'
    'post_max_size=12M'
    '-d'
    'memory_limit=256M'
    '-S'
    '127.0.0.1:8098'
    '-t'
    "`"$publicRoot`""
    "`"$router`""
)

$process = Start-Process -FilePath $phpPath `
    -ArgumentList $arguments `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDirectory 'php-api.stdout.log') `
    -RedirectStandardError (Join-Path $logDirectory 'php-api.stderr.log') `
    -PassThru

Start-Sleep -Seconds 2
$process.Refresh()
if ($process.HasExited) {
    throw "The PHP API process exited during startup. Check logs in $logDirectory"
}

$health = Invoke-RestMethod -Uri 'http://localhost:8098/api/health' -TimeoutSec 5
if ($health.status -ne 'ok') {
    throw "The PHP API started but returned an unexpected health response. Check logs in $logDirectory"
}
