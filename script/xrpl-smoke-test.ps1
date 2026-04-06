$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$deploymentPath = Join-Path $root 'deployments/xrpl-testnet.json'
$deployment = Get-Content -Raw $deploymentPath | ConvertFrom-Json

if (-not $env:PRIVATE_KEY) {
  throw 'PRIVATE_KEY is required in the environment to run the XRPL smoke test.'
}

$rpc = $deployment.rpcUrl
$validation = $deployment.contracts.ValidationModule
$datasetRegistry = $deployment.contracts.DatasetRegistry
$router = $deployment.contracts.ProjectRouter
$projectKey = '0x534849524c45595f43454e5452414c0000000000000000000000000000000000'
$zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
$legacyGasPrice = if ($env:XRPL_GAS_PRICE_WEI) { $env:XRPL_GAS_PRICE_WEI } else { '137500000000' }
$thresholdGasLimit = if ($env:XRPL_THRESHOLD_GAS_LIMIT) { $env:XRPL_THRESHOLD_GAS_LIMIT } else { '120000' }
$submitGasLimit = if ($env:XRPL_SUBMIT_GAS_LIMIT) { $env:XRPL_SUBMIT_GAS_LIMIT } else { '500000' }
$reviewGasLimit = if ($env:XRPL_REVIEW_GAS_LIMIT) { $env:XRPL_REVIEW_GAS_LIMIT } else { '300000' }
$finalizeGasLimit = if ($env:XRPL_FINALIZE_GAS_LIMIT) { $env:XRPL_FINALIZE_GAS_LIMIT } else { '200000' }

function Invoke-CastCall {
  param(
    [Parameter(Mandatory = $true)][string]$Address,
    [Parameter(Mandatory = $true)][string]$Signature,
    [string[]]$Args = @()
  )

  $argList = @('call', $Address, $Signature) + $Args + @('--rpc-url', $rpc)
  (& cast @argList).Trim()
}

function Invoke-CastSend {
  param(
    [Parameter(Mandatory = $true)][string]$Address,
    [Parameter(Mandatory = $true)][string]$Signature,
    [string[]]$Args = @(),
  [string]$GasLimit = '500000'
  )

  $argList = @(
    'send',
    $Address,
    $Signature
  ) + $Args + @(
    '--private-key', $env:PRIVATE_KEY,
    '--rpc-url', $rpc,
    '--legacy',
    '--gas-price', $legacyGasPrice,
    '--gas-limit', $GasLimit
  )

  $output = & cast @argList
  if ($LASTEXITCODE -ne 0) {
    throw "cast send failed for $Signature"
  }

  $txHashMatch = [regex]::Match(($output -join "`n"), 'transactionHash\s+((0x)?[a-fA-F0-9]{64})', 'IgnoreCase')
  if (-not $txHashMatch.Success) {
    $txHashMatch = [regex]::Match(($output -join "`n"), '\b0x[a-fA-F0-9]{64}\b')
  }

  if (-not $txHashMatch.Success) {
    throw "Unable to extract transaction hash from cast output for $Signature"
  }

  [PSCustomObject]@{
    TxHash = $txHashMatch.Groups[1].Value
    Raw = $output
  }
}

function Get-DatasetTuple {
  param([Parameter(Mandatory = $true)][int]$DatasetId)

  Invoke-CastCall $datasetRegistry 'getDataset(uint256)((uint256,bytes32,uint8,uint8,bytes32,bytes32,string,uint16,uint32,uint32,uint32,uint32,address,uint64,uint64,uint64))' @("$DatasetId")
}

$startId = [int](Invoke-CastCall $datasetRegistry 'nextDatasetId()(uint256)')
$rootId = $startId
$childId = $startId + 1
$epoch = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$rootSubmissionId = "SC-LIVE-ROOT-$epoch"
$childSubmissionId = "SC-LIVE-CHILD-$($epoch + 1)"
$rootSourceHash = (& cast keccak 'datumx-live-root-source').Trim()
$rootTransformHash = (& cast keccak $rootSubmissionId).Trim()
$childSourceHash = (& cast keccak 'datumx-live-child-source').Trim()
$childTransformHash = (& cast keccak $childSubmissionId).Trim()

Write-Output "XRPL smoke test starting on $($deployment.networkName)"
Write-Output "Starting nextDatasetId: $startId"
Write-Output "Using legacy gas mode with fixed gas price: $legacyGasPrice"
Write-Output "Gas limits => thresholds: $thresholdGasLimit, submit: $submitGasLimit, review: $reviewGasLimit, finalize: $finalizeGasLimit"

try {
  Write-Output 'Lowering thresholds to (1, 6667, 7000)'
  $lowerThresholdTx = Invoke-CastSend $validation 'setThresholds((uint16,uint16,uint16))' @('(1,6667,7000)') $thresholdGasLimit
  Write-Output ("Lower thresholds tx: {0}" -f $lowerThresholdTx.TxHash)
  Write-Output ('Thresholds now: ' + (Invoke-CastCall $validation 'getThresholds()((uint16,uint16,uint16))'))

  Write-Output "Submitting root dataset $rootId"
  $submitRootTx = Invoke-CastSend $router 'submitDataset(bytes32,(uint8,uint16,uint32,uint32,bytes32,bytes32,string),string,bytes32)' @(
    $projectKey,
    "(0,1,140,8200,$rootSourceHash,$rootTransformHash,$rootSubmissionId)",
    'ipfs://datumx-live/xrpl/root-fastpath',
    $zeroHash
  ) $submitGasLimit
  Write-Output ("Root submit tx: {0}" -f $submitRootTx.TxHash)
  $rootDataset = Get-DatasetTuple $rootId
  Write-Output ('Root dataset: ' + $rootDataset)

  Write-Output "Reviewing root dataset $rootId"
  $reviewRootTx = Invoke-CastSend $validation 'submitReview(uint256,bool,uint16,string)' @(
    "$rootId",
    'true',
    '8200',
    'ipfs://datumx-live/xrpl/review-root-fastpath'
  ) $reviewGasLimit
  Write-Output ("Root review tx: {0}" -f $reviewRootTx.TxHash)

  Write-Output "Finalizing root dataset $rootId"
  $finalizeRootTx = Invoke-CastSend $validation 'finalizeDataset(uint256)' @("$rootId") $finalizeGasLimit
  Write-Output ("Root finalize tx: {0}" -f $finalizeRootTx.TxHash)
  $rootFinal = Get-DatasetTuple $rootId
  Write-Output ('Root finalized: ' + $rootFinal)

  $rootContentHash = [regex]::Matches($rootFinal, '0x[a-fA-F0-9]{64}')[1].Value
  Write-Output ('Root content hash: ' + $rootContentHash)

  Write-Output "Submitting child dataset $childId"
  $submitChildTx = Invoke-CastSend $router 'submitDataset(bytes32,(uint8,uint16,uint32,uint32,bytes32,bytes32,string),string,bytes32)' @(
    $projectKey,
    "(1,1,140,8100,$childSourceHash,$childTransformHash,$childSubmissionId)",
    'ipfs://datumx-live/xrpl/child-fastpath',
    $rootContentHash
  ) $submitGasLimit
  Write-Output ("Child submit tx: {0}" -f $submitChildTx.TxHash)
  $childDataset = Get-DatasetTuple $childId
  Write-Output ('Child dataset: ' + $childDataset)

  Write-Output "Reviewing child dataset $childId"
  $reviewChildTx = Invoke-CastSend $validation 'submitReview(uint256,bool,uint16,string)' @(
    "$childId",
    'true',
    '8100',
    'ipfs://datumx-live/xrpl/review-child-fastpath'
  ) $reviewGasLimit
  Write-Output ("Child review tx: {0}" -f $reviewChildTx.TxHash)

  Write-Output "Finalizing child dataset $childId"
  $finalizeChildTx = Invoke-CastSend $validation 'finalizeDataset(uint256)' @("$childId") $finalizeGasLimit
  Write-Output ("Child finalize tx: {0}" -f $finalizeChildTx.TxHash)
  $childFinal = Get-DatasetTuple $childId
  Write-Output ('Child finalized: ' + $childFinal)
  Write-Output ('Child parent id: ' + (Invoke-CastCall $datasetRegistry 'getParentDatasetId(uint256)(uint256)' @("$childId")))
  Write-Output ('Root children: ' + (Invoke-CastCall $datasetRegistry 'getChildDatasetIds(uint256)(uint256[])' @("$rootId")))
}
finally {
  Write-Output 'Restoring thresholds to (3, 6667, 7000)'
  $restoreThresholdTx = Invoke-CastSend $validation 'setThresholds((uint16,uint16,uint16))' @('(3,6667,7000)') $thresholdGasLimit
  Write-Output ("Restore thresholds tx: {0}" -f $restoreThresholdTx.TxHash)
  Write-Output ('Thresholds restored: ' + (Invoke-CastCall $validation 'getThresholds()((uint16,uint16,uint16))'))
}
