$ErrorActionPreference = 'Stop'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script from an elevated PowerShell window.'
}

$mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.4'
$mysqld = Join-Path $mysqlHome 'bin\mysqld.exe'
$dataDirectory = Join-Path $env:LOCALAPPDATA 'MySQL\SaintBernard'
$configPath = Join-Path $dataDirectory 'my-saint-bernard.ini'
$serviceName = 'SaintBernardMySQL'

if (!(Test-Path -LiteralPath $mysqld)) {
    throw "MySQL server executable was not found: $mysqld"
}
if (!(Test-Path -LiteralPath $dataDirectory)) {
    throw "MySQL data directory was not found: $dataDirectory"
}

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    $serviceInfo = Get-CimInstance Win32_Service -Filter "Name = '$serviceName'"
    if ($serviceInfo.PathName -notmatch [regex]::Escape($configPath)) {
        throw "The existing $serviceName service uses a different configuration; refusing to change it."
    }

    Set-Service -Name $serviceName -StartupType Automatic
    if ($service.Status -ne 'Running') {
        Start-Service -Name $serviceName
        $service = Get-Service -Name $serviceName
        $service.WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
    }
    Write-Output "MySQL service '$serviceName' is running and set to start automatically."
    exit 0
}

$listener = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    throw 'MySQL is still running manually on port 3306. Stop it with Ctrl+C in its terminal, then run this script again.'
}
if (Test-Path -LiteralPath $configPath) {
    throw "The MySQL service configuration already exists: $configPath. Inspect it before continuing."
}

$config = @"
[mysqld]
basedir="$($mysqlHome.Replace('\', '/'))"
datadir="$($dataDirectory.Replace('\', '/'))"
bind-address=127.0.0.1
port=3306
mysqlx=0
"@
[System.IO.File]::WriteAllText($configPath, $config, [System.Text.Encoding]::ASCII)

& $mysqld --install $serviceName "--defaults-file=$configPath"
if ($LASTEXITCODE -ne 0) {
    throw "MySQL failed to register the '$serviceName' service."
}

Set-Service -Name $serviceName -StartupType Automatic
Start-Service -Name $serviceName
$service = Get-Service -Name $serviceName
$service.WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
Write-Output "MySQL service '$serviceName' is running and set to start automatically."
