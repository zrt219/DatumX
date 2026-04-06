$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$manifestPath = Join-Path $repoRoot 'deployments\xrpl-testnet.json'
$outputDir = Join-Path $repoRoot 'deployments\verification\xrpl-testnet'

if (-not (Test-Path $manifestPath)) {
  throw "Deployment manifest not found at $manifestPath"
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$contracts = @(
  @{
    Name = 'DrillProofAccess'
    Address = $manifest.contracts.DrillProofAccess
    Id = 'contracts/core/DrillProofAccess.sol:DrillProofAccess'
    Args = cast abi-encode 'constructor(address)' $manifest.deployer
  },
  @{
    Name = 'ProjectRegistry'
    Address = $manifest.contracts.ProjectRegistry
    Id = 'contracts/core/ProjectRegistry.sol:ProjectRegistry'
    Args = cast abi-encode 'constructor(address)' $manifest.contracts.DrillProofAccess
  },
  @{
    Name = 'DatasetRegistry'
    Address = $manifest.contracts.DatasetRegistry
    Id = 'contracts/core/DatasetRegistry.sol:DatasetRegistry'
    Args = cast abi-encode 'constructor(address,address)' $manifest.contracts.DrillProofAccess $manifest.contracts.ProjectRegistry
  },
  @{
    Name = 'ValidationModule'
    Address = $manifest.contracts.ValidationModule
    Id = 'contracts/core/ValidationModule.sol:ValidationModule'
    Args = cast abi-encode 'constructor(address,address,(uint16,uint16,uint16))' $manifest.contracts.DrillProofAccess $manifest.contracts.DatasetRegistry '(3,6667,7000)'
  },
  @{
    Name = 'ProjectRouter'
    Address = $manifest.contracts.ProjectRouter
    Id = 'contracts/core/ProjectRouter.sol:ProjectRouter'
    Args = cast abi-encode 'constructor(address,address,address)' $manifest.contracts.DrillProofAccess $manifest.contracts.ProjectRegistry $manifest.contracts.DatasetRegistry
  },
  @{
    Name = 'DuckCreekAdapter'
    Address = $manifest.contracts.DuckCreekAdapter
    Id = 'contracts/adapters/DuckCreekAdapter.sol:DuckCreekAdapter'
    Args = '0x'
  },
  @{
    Name = 'ShirleyCentralAdapter'
    Address = $manifest.contracts.ShirleyCentralAdapter
    Id = 'contracts/adapters/ShirleyCentralAdapter.sol:ShirleyCentralAdapter'
    Args = '0x'
  },
  @{
    Name = 'ShirleyEastAdapter'
    Address = $manifest.contracts.ShirleyEastAdapter
    Id = 'contracts/adapters/ShirleyEastAdapter.sol:ShirleyEastAdapter'
    Args = '0x'
  }
)

foreach ($contract in $contracts) {
  $argsPath = Join-Path $outputDir ($contract.Name + '.constructor-args.txt')
  $jsonPath = Join-Path $outputDir ($contract.Name + '.standard-input.json')
  $encodedArgs = $contract.Args.Trim()

  Write-Utf8NoBom -Path $argsPath -Content ($encodedArgs + "`n")

  $standardJson = forge verify-contract $contract.Address $contract.Id `
    --show-standard-json-input `
    --use 0.8.24 `
    --num-of-optimizations 200 `
    --via-ir `
    --evm-version cancun `
    --constructor-args $encodedArgs

  if ($LASTEXITCODE -ne 0) {
    throw "forge verify-contract failed while exporting artifacts for $($contract.Name)"
  }

  Write-Utf8NoBom -Path $jsonPath -Content ($standardJson.Trim() + "`n")
  Write-Host ("Exported verification artifacts for {0}" -f $contract.Name)
}

Write-Host ("XRPL V5 verification artifacts refreshed in {0}" -f $outputDir)
