param(
  [string]$ContractName,
  [int]$PollCount = 16,
  [int]$PollSeconds = 15
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$verificationRoot = Join-Path $repoRoot 'deployments\verification\xrpl-testnet'
$manifestPath = Join-Path $repoRoot 'deployments\xrpl-testnet.json'

if (-not (Test-Path $manifestPath)) {
  throw "Deployment manifest not found at $manifestPath"
}

$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json

$contracts = @(
  @{ Name='DrillProofAccess'; Address=$manifest.contracts.DrillProofAccess; ArgsFile='DrillProofAccess.constructor-args.txt'; StdFile='DrillProofAccess.standard-input.json' },
  @{ Name='ProjectRegistry'; Address=$manifest.contracts.ProjectRegistry; ArgsFile='ProjectRegistry.constructor-args.txt'; StdFile='ProjectRegistry.standard-input.json' },
  @{ Name='DatasetRegistry'; Address=$manifest.contracts.DatasetRegistry; ArgsFile='DatasetRegistry.constructor-args.txt'; StdFile='DatasetRegistry.standard-input.json' },
  @{ Name='ValidationModule'; Address=$manifest.contracts.ValidationModule; ArgsFile='ValidationModule.constructor-args.txt'; StdFile='ValidationModule.standard-input.json' },
  @{ Name='ProjectRouter'; Address=$manifest.contracts.ProjectRouter; ArgsFile='ProjectRouter.constructor-args.txt'; StdFile='ProjectRouter.standard-input.json' },
  @{ Name='DuckCreekAdapter'; Address=$manifest.contracts.DuckCreekAdapter; ArgsFile='DuckCreekAdapter.constructor-args.txt'; StdFile='DuckCreekAdapter.standard-input.json' },
  @{ Name='ShirleyCentralAdapter'; Address=$manifest.contracts.ShirleyCentralAdapter; ArgsFile='ShirleyCentralAdapter.constructor-args.txt'; StdFile='ShirleyCentralAdapter.standard-input.json' },
  @{ Name='ShirleyEastAdapter'; Address=$manifest.contracts.ShirleyEastAdapter; ArgsFile='ShirleyEastAdapter.constructor-args.txt'; StdFile='ShirleyEastAdapter.standard-input.json' }
)

$selectedContracts = if ([string]::IsNullOrWhiteSpace($ContractName)) {
  $contracts
} else {
  $contracts | Where-Object { $_.Name -eq $ContractName }
}

if (-not $selectedContracts) {
  throw "Unknown contract name '$ContractName'. Valid options: $($contracts.Name -join ', ')"
}

$results = @()

foreach ($contract in $selectedContracts) {
  $argsPath = Join-Path $verificationRoot $contract.ArgsFile
  $stdPath = Join-Path $verificationRoot $contract.StdFile
  $constructorArgs = (Get-Content -Raw $argsPath).Trim()

  if ($constructorArgs -eq '0x') {
    $constructorArgs = ''
  } elseif ($constructorArgs.StartsWith('0x')) {
    $constructorArgs = $constructorArgs.Substring(2)
  }

  $headerFile = [System.IO.Path]::GetTempFileName()
  $bodyFile = [System.IO.Path]::GetTempFileName()

  try {
    $curlArgs = @(
      '-sS',
      '-D', $headerFile,
      '-o', $bodyFile,
      '-F', 'compiler_version=v0.8.24+commit.e11b9ed9',
      '-F', "contract_name=$($contract.Name)",
      '-F', 'autodetect_constructor_args=false',
      '-F', "constructor_args=$constructorArgs",
      '-F', 'license_type=mit',
      '-F', "files[0]=@$($stdPath -replace '\\','/');type=application/json",
      "https://explorer.testnet.xrplevm.org/api/v2/smart-contracts/$($contract.Address)/verification/via/standard-input"
    )

    & curl.exe @curlArgs | Out-Null

    $headers = Get-Content -Raw $headerFile
    $body = Get-Content -Raw $bodyFile
    $statusLine = ($headers -split "`r?`n" | Where-Object { $_ -match '^HTTP/' } | Select-Object -Last 1)
    $requestId = (($headers -split "`r?`n" | Where-Object { $_ -match '^x-request-id:' }) -replace '^x-request-id:\s*','' | Select-Object -First 1)

    $results += [PSCustomObject]@{
      name = $contract.Name
      address = $contract.Address
      submitted = $true
      statusLine = $statusLine
      requestId = $requestId
      response = $body.Trim()
      verified = $false
      explorerName = $null
    }
  } catch {
    $results += [PSCustomObject]@{
      name = $contract.Name
      address = $contract.Address
      submitted = $false
      statusLine = $null
      requestId = $null
      response = $_.Exception.Message
      verified = $false
      explorerName = $null
    }
  } finally {
    Remove-Item $headerFile,$bodyFile -ErrorAction SilentlyContinue
  }
}

for ($poll = 1; $poll -le $PollCount; $poll++) {
  foreach ($result in $results | Where-Object { $_.submitted -and -not $_.verified }) {
    try {
      $addressState = Invoke-RestMethod "https://explorer.testnet.xrplevm.org/api/v2/addresses/$($result.address)"
      if ($addressState.is_verified) {
        $result.verified = $true
        $result.explorerName = $addressState.name
      }
    } catch {
      # Keep polling other contracts; explorer submission tracking is best-effort.
    }
  }

  if (-not ($results | Where-Object { $_.submitted -and -not $_.verified })) {
    break
  }

  Start-Sleep -Seconds $PollSeconds
}

$results | ConvertTo-Json -Depth 5
