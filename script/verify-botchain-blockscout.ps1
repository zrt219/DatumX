param(
  [ValidateSet('botchain-mainnet', 'bohr-testnet', 'all')]
  [string]$Network = 'botchain-mainnet',
  [switch]$CheckOnly,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$contractAddress = '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7'
$contractIdentifier = 'contracts/botchain/BotChainDatasetRegistry.sol:BotChainDatasetRegistry'

$networkConfigs = @{
  'botchain-mainnet' = @{
    Name = 'BOT Chain Mainnet'
    ChainId = 677
    VerifierUrl = 'https://scan.botchain.ai/api'
    ExplorerBase = 'https://scan.botchain.ai'
    ConstructorArgs = '0000000000000000000000000000000000000000000000000000000000000000'
  }
  'bohr-testnet' = @{
    Name = 'Bohr Testnet'
    ChainId = 968
    VerifierUrl = 'https://scan.bohr.life/api'
    ExplorerBase = 'https://scan.bohr.life'
    ConstructorArgs = '0000000000000000000000000000000000000000000000000000000000000001'
  }
}

$targets = if ($Network -eq 'all') {
  @('botchain-mainnet', 'bohr-testnet')
} else {
  @($Network)
}

$allVerified = $true

foreach ($netKey in $targets) {
  $cfg = $networkConfigs[$netKey]
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host "Target: $($cfg.Name) (Chain ID: $($cfg.ChainId))" -ForegroundColor Cyan
  Write-Host "Contract: $contractAddress ($contractIdentifier)" -ForegroundColor Cyan
  Write-Host "Verifier URL: $($cfg.VerifierUrl)" -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor Cyan

  $isVerified = $false
  try {
    $apiEndpoint = "$($cfg.ExplorerBase)/api/v2/addresses/$contractAddress"
    $state = Invoke-RestMethod -Uri $apiEndpoint -TimeoutSec 15
    if ($state.is_verified) {
      $isVerified = $true
      Write-Host "Explorer reports contract is ALREADY VERIFIED:" -ForegroundColor Green
      Write-Host "  Name: $($state.name)" -ForegroundColor Green
      Write-Host "  Contract URL: $($cfg.ExplorerBase)/address/$($contractAddress)?tab=contract" -ForegroundColor Green
    }
  } catch {
    Write-Host "Could not query explorer REST API directly: $_" -ForegroundColor Yellow
  }

  if ($isVerified -and -not $Force) {
    Write-Host "Verification check passed for $($cfg.Name)." -ForegroundColor Green
    continue
  }

  if ($CheckOnly) {
    if (-not $isVerified) {
      Write-Host "CheckOnly requested and contract is NOT verified on $($cfg.Name)." -ForegroundColor Red
      $allVerified = $false
    }
    continue
  }

  Write-Host "Executing Forge Blockscout verification command..." -ForegroundColor Yellow
  $verifyArgs = @(
    'verify-contract',
    $contractAddress,
    $contractIdentifier,
    '--verifier', 'blockscout',
    '--verifier-url', $cfg.VerifierUrl,
    '--use', '0.8.24',
    '--num-of-optimizations', '200',
    '--via-ir',
    '--evm-version', 'cancun',
    '--constructor-args', $cfg.ConstructorArgs
  )

  & forge.exe @verifyArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Forge verification command failed with exit code $LASTEXITCODE" -ForegroundColor Red
    $allVerified = $false
  } else {
    Write-Host "Forge verification command succeeded for $($cfg.Name)!" -ForegroundColor Green
  }
}

if (-not $allVerified) {
  throw "One or more verification checks or submissions failed."
}

Write-Host "`nAll verification steps completed successfully." -ForegroundColor Green
