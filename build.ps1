param(
    [ValidateSet('Test', 'Build', 'Verify', 'Publish', 'Package', 'Run')]
    [string]$Task = 'Verify',
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release',
    [string]$Version = '0.8.0'
)

$ErrorActionPreference = 'Stop'
if ($Version -notmatch '^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$') {
    throw 'Version must be a semantic version, e.g. 0.4.0 or 0.4.0-preview.1.'
}
$dotnetCommand = Get-Command dotnet -ErrorAction SilentlyContinue
$dotnetPath = if ($dotnetCommand) { $dotnetCommand.Source } else { $null }
# A user-local SDK may coexist with a system installation containing runtimes only.
$localSdk = Join-Path $env:LOCALAPPDATA 'EMCalc-dotnet/dotnet.exe'
if (Test-Path -LiteralPath $localSdk) { $dotnetPath = $localSdk }
if (-not $dotnetPath) { throw 'Install the .NET 8 SDK before building.' }

function Invoke-DotNet {
    param([string[]]$Arguments)
    & $dotnetPath @Arguments
    if ($LASTEXITCODE -ne 0) { throw "dotnet failed with exit code $LASTEXITCODE" }
}

Push-Location $PSScriptRoot
try {
    $app = 'src/EMCalculator/EMCalculator.csproj'
    if ($Task -in @('Test', 'Verify', 'Publish', 'Package')) {
        Invoke-DotNet -Arguments @('run', '--project', 'tests/EMCalculator.Tests', '-c', $Configuration)
    }
    if ($Task -in @('Build', 'Verify', 'Run')) {
        Invoke-DotNet -Arguments @('build', $app, '-c', $Configuration, '-p:Platform=x64')
    }
    if ($Task -eq 'Publish') {
        $artifactRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'artifacts'))
        $publishPath = [IO.Path]::GetFullPath((Join-Path $artifactRoot 'publish/win-x64'))
        if (-not $publishPath.StartsWith($artifactRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Publish output must stay within the artifacts directory.'
        }
        if (Test-Path -LiteralPath $publishPath) {
            Remove-Item -LiteralPath $publishPath -Recurse -Force
        }
        Invoke-DotNet -Arguments @('publish', $app, '-c', $Configuration, '-r', 'win-x64', '--self-contained', 'true', '-p:Platform=x64', "-p:Version=$Version", '-o', $publishPath)
        $archivePath = Join-Path $artifactRoot "EM-Calculator-$Version-win-x64.zip"
        Compress-Archive -Path (Join-Path $publishPath '*') -DestinationPath $archivePath -Force
        $sum = (Get-ChildItem -LiteralPath $publishPath -Recurse -File | Measure-Object Length -Sum).Sum
        $archive = Get-Item -LiteralPath $archivePath
        Write-Host ("Published folder: {0:N1} MiB; ZIP: {1:N1} MiB" -f ($sum / 1MB), ($archive.Length / 1MB))
        Write-Host $archivePath
    }
    if ($Task -eq 'Package') {
        $artifactRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'artifacts'))
        $packagePath = [IO.Path]::GetFullPath((Join-Path $artifactRoot 'publish/msix/win-x64'))
        if (-not $packagePath.StartsWith($artifactRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'MSIX output must stay within the artifacts directory.'
        }
        if (Test-Path -LiteralPath $packagePath) {
            Remove-Item -LiteralPath $packagePath -Recurse -Force
        }
        $packageDirArgument = $packagePath.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
        $appxVersion = (($Version -split '-', 2)[0]) + '.0'
        Invoke-DotNet -Arguments @(
            'publish', $app, '-c', $Configuration, '-r', 'win-x64', '--self-contained', 'true',
            '-p:Platform=x64', "-p:Version=$Version", "-p:AppxPackageVersion=$appxVersion", '-p:WindowsPackageType=MSIX',
            '-p:WindowsAppSDKSelfContained=false', '-p:GenerateAppxPackageOnBuild=true',
            '-p:AppxPackageSigningEnabled=false', '-p:AppxBundle=Never',
            "-p:AppxPackageDir=$packageDirArgument"
        )
        $msix = Get-ChildItem -LiteralPath $packagePath -Filter '*.msix' -Recurse -File | Select-Object -First 1
        $storeUpload = Get-ChildItem -LiteralPath $packagePath -Filter '*.msixupload' -Recurse -File | Select-Object -First 1
        if (-not $msix -and -not $storeUpload) { throw "MSIX build completed without a package under $packagePath" }
        if ($msix) {
            Write-Host ("MSIX package: {0:N1} MiB (unsigned Store submission candidate)" -f ($msix.Length / 1MB))
            Write-Host $msix.FullName
        }
        if ($storeUpload) {
            Write-Host ("Store upload package: {0:N1} MiB" -f ($storeUpload.Length / 1MB))
            Write-Host $storeUpload.FullName
        }
    }
    if ($Task -eq 'Run') {
        $exe = Join-Path $PSScriptRoot "artifacts/bin/EMCalculator/x64/$Configuration/net8.0-windows10.0.19041.0/win-x64/EMCalculator.exe"
        Start-Process -FilePath $exe
    }
}
finally { Pop-Location }
