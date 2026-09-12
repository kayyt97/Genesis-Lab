#Requires -Version 5.1
<#
.SYNOPSIS
  Build Genesis Lab locally and safely deploy dist/ contents to production.

.DESCRIPTION
  EDIT → BUILD → STAGE → ACTIVATE → VERIFY

  Deploys ONLY the contents of the local Vite `dist` directory to:
    kara@jreco.de:/var/www/genesis-lab/

  Does not modify nginx, Certbot, other /var/www sites, or system configuration.
  Does not use sudo, chown, chmod, or ACL changes.
  Does not store or hard-code SSH credentials; Windows OpenSSH prompts as needed.

.EXAMPLE
  .\deploy.ps1
  npm run deploy
#>

[CmdletBinding()]
param(
  [string]$RemoteUser = 'kara',
  [string]$RemoteHost = 'jreco.de',
  [string]$WebRoot = '/var/www/genesis-lab',
  [string]$ProductionUrl = 'https://genesis.jreco.de/',
  # Local-only: build + archive validation. Never touches the server.
  [switch]$LocalOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$DeployDir = Join-Path $ProjectRoot '.deploy'
$ArchiveName = 'genesis-lab-dist.tar.gz'
$ArchivePath = Join-Path $DeployDir $ArchiveName
$DistDir = Join-Path $ProjectRoot 'dist'
$RemoteDeployHome = '~/genesis-lab-deploy'
$RemoteArchive = "$RemoteDeployHome/upload.tar.gz"
$StartedAt = Get-Date

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Fail {
  param([string]$Message)
  Write-Host ""
  Write-Host "DEPLOYMENT FAILED: $Message" -ForegroundColor Red
}

function Assert-ProjectRoot {
  Write-Step "Confirming Genesis Lab project root"

  $pkgPath = Join-Path $ProjectRoot 'package.json'
  if (-not (Test-Path -LiteralPath $pkgPath)) {
    throw "package.json not found in $ProjectRoot"
  }

  $pkgRaw = Get-Content -LiteralPath $pkgPath -Raw -Encoding UTF8
  if ($pkgRaw -notmatch '"name"\s*:\s*"genesis-lab"') {
    throw "Refusing to run: package.json name is not genesis-lab (path: $ProjectRoot)"
  }

  $buildScriptOk = $pkgRaw -match '"build"\s*:\s*"tsc -b && vite build"'
  if (-not $buildScriptOk) {
    # Still allow if a build script exists; warn if shape differs.
    if ($pkgRaw -notmatch '"build"\s*:') {
      throw "package.json has no build script."
    }
    Write-Host "Note: package.json build script differs from the expected Vite command; continuing with npm run build." -ForegroundColor Yellow
  }

  if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'vite.config.ts'))) {
    throw "vite.config.ts not found; refusing to deploy from a non-Vite tree."
  }

  Write-Host "Project OK: $ProjectRoot"
}

function Invoke-ProductionBuild {
  Write-Step "Running production build (npm run build)"

  Push-Location $ProjectRoot
  try {
    & npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "npm run build exited with code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }

  $indexPath = Join-Path $DistDir 'index.html'
  if (-not (Test-Path -LiteralPath $indexPath)) {
    throw "Build did not produce dist/index.html"
  }

  Write-Host "Build succeeded: $DistDir"
}

function New-DeployArchive {
  Write-Step "Creating deployment archive from dist/ contents only"

  if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
    throw "Windows tar.exe is required to create .tar.gz archives."
  }

  New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null

  if (Test-Path -LiteralPath $ArchivePath) {
    Remove-Item -LiteralPath $ArchivePath -Force
    Write-Host "Removed previous local archive: $ArchivePath"
  }

  # -C dist . packs CONTENTS (index.html, assets/, …), not a top-level "dist/" folder.
  & tar -czf $ArchivePath -C $DistDir .
  if ($LASTEXITCODE -ne 0) {
    throw "tar failed with exit code $LASTEXITCODE"
  }

  if (-not (Test-Path -LiteralPath $ArchivePath)) {
    throw "Archive was not created: $ArchivePath"
  }

  $sizeKb = [math]::Round((Get-Item -LiteralPath $ArchivePath).Length / 1KB, 1)
  Write-Host "Archive ready: $ArchivePath ($sizeKb KB)"
}

function Test-OpenSshClient {
  foreach ($tool in @('ssh', 'scp')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
      throw "Required OpenSSH client tool not found on PATH: $tool"
    }
  }
}

function Publish-ToStaging {
  Write-Step "Uploading archive to ${RemoteUser}@${RemoteHost} (staging only)"

  $remoteTarget = "${RemoteUser}@${RemoteHost}:${RemoteArchive}"

  # Ensure remote deploy home exists before scp (scp does not create nested dirs reliably).
  & ssh "${RemoteUser}@${RemoteHost}" "mkdir -p $RemoteDeployHome"
  if ($LASTEXITCODE -ne 0) {
    throw "ssh mkdir failed with exit code $LASTEXITCODE (live site untouched)"
  }

  & scp $ArchivePath $remoteTarget
  if ($LASTEXITCODE -ne 0) {
    throw "scp upload failed with exit code $LASTEXITCODE (live site untouched)"
  }

  Write-Host "Upload complete: $remoteTarget"
}

function Invoke-RemoteActivation {
  Write-Step "Staging, validating, then activating release under $WebRoot"

  # Remote bash: never deletes $WebRoot itself; never uses sudo/chown/chmod.
  # On activation failure, restores from the pre-activation backup when possible.
  $remoteBash = @"
set -euo pipefail

WEBROOT='$WebRoot'
DEPLOY_HOME=`$HOME/genesis-lab-deploy
ARCHIVE=`$DEPLOY_HOME/upload.tar.gz
STAGE=`$DEPLOY_HOME/stage
BACKUP=`$DEPLOY_HOME/backup
PREV_BACKUP=`$DEPLOY_HOME/backup.prev

if [ ! -f "`$ARCHIVE" ]; then
  echo "Remote archive missing: `$ARCHIVE" >&2
  exit 10
fi

case "`$WEBROOT" in
  /var/www/genesis-lab|/var/www/genesis-lab/)
    ;;
  *)
    echo "Refusing unexpected WEBROOT: `$WEBROOT" >&2
    exit 11
    ;;
esac

rm -rf "`$STAGE"
mkdir -p "`$STAGE" "`$DEPLOY_HOME"

echo "Extracting archive into staging..."
tar -xzf "`$ARCHIVE" -C "`$STAGE"

if [ ! -f "`$STAGE/index.html" ]; then
  echo "Staged release missing index.html; aborting (live untouched)." >&2
  exit 12
fi

ASSET_COUNT=`$(find "`$STAGE" -type f | wc -l | tr -d ' ')
echo "Staged release OK (files=`$ASSET_COUNT)."

# Preserve previous backup once, then refresh backup of current live.
rm -rf "`$PREV_BACKUP"
if [ -d "`$BACKUP" ]; then
  mv "`$BACKUP" "`$PREV_BACKUP"
fi
mkdir -p "`$BACKUP"

if [ -d "`$WEBROOT" ]; then
  # Copy current live contents for rollback. Empty webroot is allowed on first deploy.
  shopt -s dotglob nullglob
  for item in "`$WEBROOT"/*; do
    cp -a "`$item" "`$BACKUP/"
  done
  shopt -u dotglob nullglob
else
  echo "WEBROOT does not exist: `$WEBROOT" >&2
  exit 13
fi

activate() {
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "`$STAGE"/ "`$WEBROOT"/
  else
    # Fallback without rsync: overwrite with new tree, then prune obsolete paths.
    cp -a "`$STAGE"/. "`$WEBROOT"/
    # Remove top-level entries in WEBROOT that are absent from STAGE (keeps WEBROOT itself).
    shopt -s nullglob
    for item in "`$WEBROOT"/*; do
      name=`$(basename "`$item")
      if [ ! -e "`$STAGE/`$name" ]; then
        rm -rf "`$item"
      fi
    done
    # Prune obsolete hashed assets under assets/ when present.
    if [ -d "`$WEBROOT/assets" ]; then
      if [ -d "`$STAGE/assets" ]; then
        for item in "`$WEBROOT/assets"/*; do
          name=`$(basename "`$item")
          if [ ! -e "`$STAGE/assets/`$name" ]; then
            rm -rf "`$item"
          fi
        done
      fi
    fi
    shopt -u nullglob
  fi
}

restore_backup() {
  echo "Activation failed; attempting restore from backup..." >&2
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "`$BACKUP"/ "`$WEBROOT"/ || return 1
  else
    # Best-effort restore: clear known top-level entries then copy backup back.
    shopt -s nullglob
    for item in "`$WEBROOT"/*; do
      rm -rf "`$item"
    done
    shopt -u nullglob
    cp -a "`$BACKUP"/. "`$WEBROOT"/ || return 1
  fi
  echo "Previous deployment restored from backup." >&2
  return 0
}

if ! activate; then
  restore_backup || true
  exit 14
fi

if [ ! -f "`$WEBROOT/index.html" ]; then
  echo "Post-activation check failed: index.html missing in WEBROOT." >&2
  restore_backup || true
  exit 15
fi

# Cleanup remote staging + upload archive after successful activation.
rm -rf "`$STAGE"
rm -f "`$ARCHIVE"
# Keep `$BACKUP` for the next failed-activation restore; drop older prev after success.
rm -rf "`$PREV_BACKUP"

echo "Remote activation complete."
"@

  $remoteBash | & ssh "${RemoteUser}@${RemoteHost}" 'bash -s'
  if ($LASTEXITCODE -ne 0) {
    throw "Remote activation failed with exit code $LASTEXITCODE"
  }
}

function Get-ReferencedAssets {
  param([string]$Html)

  $pattern = '(?:src|href)\s*=\s*["''](/assets/[^"'']+)["'']'
  $urls = [System.Collections.Generic.List[string]]::new()
  foreach ($m in [regex]::Matches($Html, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
    $path = $m.Groups[1].Value
    if (-not $urls.Contains($path)) {
      $urls.Add($path)
    }
  }
  return $urls
}

function Test-LiveDeployment {
  Write-Step "Verifying live site $ProductionUrl"

  $base = $ProductionUrl.TrimEnd('/')
  $indexUri = "$base/"

  try {
    $indexResponse = Invoke-WebRequest -Uri $indexUri -UseBasicParsing -TimeoutSec 60
  }
  catch {
    throw "HTTP request to $indexUri failed: $($_.Exception.Message)"
  }

  if ($indexResponse.StatusCode -lt 200 -or $indexResponse.StatusCode -ge 300) {
    throw "Unexpected HTTP status for index: $($indexResponse.StatusCode)"
  }

  $html = $indexResponse.Content
  if ([string]::IsNullOrWhiteSpace($html)) {
    throw "Live index.html response body was empty."
  }

  $assetPaths = @(Get-ReferencedAssets -Html $html)
  $verifiedAssets = @()

  foreach ($assetPath in $assetPaths) {
    $assetUri = "$base$assetPath"
    try {
      $assetResponse = Invoke-WebRequest -Uri $assetUri -UseBasicParsing -TimeoutSec 60 -Method Head
      if ($assetResponse.StatusCode -lt 200 -or $assetResponse.StatusCode -ge 300) {
        # Some hosts dislike HEAD; retry GET.
        $assetResponse = Invoke-WebRequest -Uri $assetUri -UseBasicParsing -TimeoutSec 60
      }
    }
    catch {
      try {
        $assetResponse = Invoke-WebRequest -Uri $assetUri -UseBasicParsing -TimeoutSec 60
      }
      catch {
        throw "Referenced asset failed: $assetUri ($($_.Exception.Message))"
      }
    }

    if ($assetResponse.StatusCode -lt 200 -or $assetResponse.StatusCode -ge 300) {
      throw "Referenced asset returned HTTP $($assetResponse.StatusCode): $assetUri"
    }

    $verifiedAssets += ($assetPath.TrimStart('/'))
    Write-Host "Asset OK: $assetPath"
  }

  if ($assetPaths.Count -eq 0) {
    Write-Host "Warning: no /assets/* references found in live index.html; index HTTP check still passed." -ForegroundColor Yellow
  }

  return [pscustomobject]@{
    VerifiedAssets = $verifiedAssets
    StatusCode = [int]$indexResponse.StatusCode
  }
}

function Clear-LocalDeployArtifacts {
  Write-Step "Cleaning local deployment artifacts"
  if (Test-Path -LiteralPath $ArchivePath) {
    Remove-Item -LiteralPath $ArchivePath -Force
    Write-Host "Removed $ArchivePath"
  }
}

# --- main ---
try {
  Assert-ProjectRoot
  Invoke-ProductionBuild
  New-DeployArchive

  if ($LocalOnly) {
    Write-Host ""
    Write-Host "LOCAL ONLY: build + archive succeeded. Skipping upload/activation/verification." -ForegroundColor Yellow
    Write-Host "Archive: $ArchivePath"
    exit 0
  }

  Test-OpenSshClient
  Publish-ToStaging
  Invoke-RemoteActivation

  $verify = Test-LiveDeployment
  Clear-LocalDeployArtifacts

  $elapsed = (Get-Date) - $StartedAt
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Green
  Write-Host "DEPLOYMENT COMPLETED" -ForegroundColor Green
  Write-Host "Production URL : $ProductionUrl"
  Write-Host ("Build/deploy   : {0:yyyy-MM-dd HH:mm:ss} ({1:n1}s)" -f $StartedAt, $elapsed.TotalSeconds)
  if ($verify.VerifiedAssets.Count -gt 0) {
    Write-Host "Deployed assets:"
    foreach ($a in $verify.VerifiedAssets) {
      Write-Host "  - $a"
    }
  }
  else {
    Write-Host "Deployed assets: (none parsed from index.html)"
  }
  Write-Host "============================================================" -ForegroundColor Green
  exit 0
}
catch {
  Write-Fail $_.Exception.Message
  exit 1
}
