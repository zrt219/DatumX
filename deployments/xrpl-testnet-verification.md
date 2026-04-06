# DatumX XRPL Testnet Verification Notes

## Current Status
- Canonical deployment is V5 and is recorded in [xrpl-testnet.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\xrpl-testnet.json).
- The release-candidate XRPL smoke rerun completed successfully against the canonical V5 deployment and is recorded in both [xrpl-testnet.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\xrpl-testnet.json) and [xrpl-testnet.md](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\xrpl-testnet.md).
- V5 explorer verification artifacts were regenerated on `2026-04-04` into [deployments/verification/xrpl-testnet](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet).
- The regenerated Standard JSON files reflect the current V5 contract source, including the stricter canonical payload checks in `DatasetRegistry` and the configuration events emitted by `DatasetRegistry` after the release-candidate hardening pass.

## Compiler Settings
Use the same compiler settings encoded in [foundry.toml](C:\Users\Zhane\Documents\New%20project\DatumX\foundry.toml):
- `solc = 0.8.24`
- optimizer enabled
- `optimizer_runs = 200`
- `via_ir = true`
- `evm_version = cancun`

## Artifact Export Command
The verification bundle can now be regenerated deterministically with:

```powershell
npm run contracts:verify-artifacts:xrpl
```

This command runs [export-xrpl-verification-artifacts.ps1](C:\Users\Zhane\Documents\New%20project\DatumX\script\export-xrpl-verification-artifacts.ps1), reads the canonical V5 addresses from [xrpl-testnet.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\xrpl-testnet.json), ABI-encodes the constructor arguments, and writes both constructor-arg and Standard JSON files into the verification bundle directory.

## Manual Explorer Submission Map
Each contract now has two canonical files:
- `*.constructor-args.txt`
- `*.standard-input.json`

Bundle directory:
- [deployments/verification/xrpl-testnet](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet)

Submission mapping:
- `DrillProofAccess` at `0x47AA8f1F35DB309Be2bd7aD1b58070092A7dc2e5`
  - [DrillProofAccess.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\DrillProofAccess.standard-input.json)
  - [DrillProofAccess.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\DrillProofAccess.constructor-args.txt)
- `ProjectRegistry` at `0x238fc107Dc66A08B93A28107399dCC35968d6687`
  - [ProjectRegistry.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ProjectRegistry.standard-input.json)
  - [ProjectRegistry.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ProjectRegistry.constructor-args.txt)
- `DatasetRegistry` at `0x0Fa0b1a4C21BB0cbF5DA4441570e9d997EAf5e0B`
  - [DatasetRegistry.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\DatasetRegistry.standard-input.json)
  - [DatasetRegistry.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\DatasetRegistry.constructor-args.txt)
- `ValidationModule` at `0xD60BE5B6A28eAF13De6DB6e02726551304E82baf`
  - [ValidationModule.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ValidationModule.standard-input.json)
  - [ValidationModule.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ValidationModule.constructor-args.txt)
- `ProjectRouter` at `0x04dC258B2329114F5907fFD5c8600c72E5BA1637`
  - [ProjectRouter.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ProjectRouter.standard-input.json)
  - [ProjectRouter.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ProjectRouter.constructor-args.txt)
- `DuckCreekAdapter` at `0x431B5d8b0D471e51Fff2fF2D05c784B527fc0254`
  - [DuckCreekAdapter.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\DuckCreekAdapter.standard-input.json)
  - [DuckCreekAdapter.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\DuckCreekAdapter.constructor-args.txt)
- `ShirleyCentralAdapter` at `0xD54e7c8298934e850eBcF4aa2E541eFb821a6797`
  - [ShirleyCentralAdapter.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ShirleyCentralAdapter.standard-input.json)
  - [ShirleyCentralAdapter.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ShirleyCentralAdapter.constructor-args.txt)
- `ShirleyEastAdapter` at `0xCB04fEE2D7F8555a9C9b2473442F81A4b64Db993`
  - [ShirleyEastAdapter.standard-input.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ShirleyEastAdapter.standard-input.json)
  - [ShirleyEastAdapter.constructor-args.txt](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet\ShirleyEastAdapter.constructor-args.txt)

## Explorer Targets
- [XRPL EVM Explorer](https://explorer.testnet.xrplevm.org)
- [DrillProofAccess](https://explorer.testnet.xrplevm.org/address/0x47AA8f1F35DB309Be2bd7aD1b58070092A7dc2e5)
- [ProjectRegistry](https://explorer.testnet.xrplevm.org/address/0x238fc107Dc66A08B93A28107399dCC35968d6687)
- [DatasetRegistry](https://explorer.testnet.xrplevm.org/address/0x0Fa0b1a4C21BB0cbF5DA4441570e9d997EAf5e0B)
- [ValidationModule](https://explorer.testnet.xrplevm.org/address/0xD60BE5B6A28eAF13De6DB6e02726551304E82baf)
- [ProjectRouter](https://explorer.testnet.xrplevm.org/address/0x04dC258B2329114F5907fFD5c8600c72E5BA1637)
- [DuckCreekAdapter](https://explorer.testnet.xrplevm.org/address/0x431B5d8b0D471e51Fff2fF2D05c784B527fc0254)
- [ShirleyCentralAdapter](https://explorer.testnet.xrplevm.org/address/0xD54e7c8298934e850eBcF4aa2E541eFb821a6797)
- [ShirleyEastAdapter](https://explorer.testnet.xrplevm.org/address/0xCB04fEE2D7F8555a9C9b2473442F81A4b64Db993)

## Deployment + Runtime Cross-Checks
- Canonical deployment addresses are still unchanged from V5.
- Release-candidate smoke proof remains valid:
  - root dataset `5`
  - child dataset `6`
  - thresholds restored to `(3, 6667, 7000)`
- The XRPL smoke runner keeps fixed gas, legacy mode, and avoids `eth_estimateGas`, matching the assumptions used during the confirmed fast-path exercise.

## Explorer Submission Pass - 2026-04-04
An actual XRPL explorer verification submission pass was executed against the Blockscout verification API using the regenerated V5 Standard JSON bundle.

Submission command:

```powershell
npm run contracts:submit-verification:xrpl
```

Single-contract retry command:

```powershell
powershell -ExecutionPolicy Bypass -File script/submit-xrpl-explorer-verification.ps1 -ContractName DrillProofAccess -PollCount 20 -PollSeconds 15
```

Observed behavior:
- All 8 V5 contracts were accepted by the explorer with `HTTP/1.1 200 OK`
- Each submission returned `{"message":"Smart-contract verification started"}`
- Each submission also returned a concrete Blockscout request id
- None of the contracts transitioned to `is_verified=true` during the post-submit polling window
- An additional delayed recheck was performed after the initial polling window and still showed all contracts as unverified

Per-contract results:
- `DrillProofAccess` - request id `GKMmbQa5whm_ztvyEJPB` - submitted, not verified
- `ProjectRegistry` - request id `GKMmbR_3j-2GhvLyEJsB` - submitted, not verified
- `DatasetRegistry` - request id `GKMmbTia0N2NXyXyEJ-h` - submitted, not verified
- `ValidationModule` - request id `GKMmbVJe1y2yhBvyEKBB` - submitted, not verified
- `ProjectRouter` - request id `GKMmbWtUgO6fiejyEKHB` - submitted, not verified
- `DuckCreekAdapter` - request id `GKMmbYSqkrNO9EnyEKbh` - submitted, not verified
- `ShirleyCentralAdapter` - request id `GKMmbZmQOW3p_MnyEKzh` - submitted, not verified
- `ShirleyEastAdapter` - request id `GKMmba25MnKmb3zyEK8h` - submitted, not verified

Explorer confirmation checks used:
- `GET /api/v2/addresses/<address>` and the `is_verified` field
- `GET /api?module=contract&action=getsourcecode&address=<address>` as the Etherscan-compatible fallback check

Observed blocker:
- The XRPL Blockscout instance accepted every verification job but did not promote any of the contracts into verified state during the observed window.
- This now looks like an explorer-side processing or queue issue, not a missing local verification bundle.

Additional fallback findings:
- A direct `forge verify-contract` Blockscout submission for `DrillProofAccess` returned `Fail - Unable to verify`
- A Sourcify fallback attempt failed because chain `1449000` is not supported by Sourcify on this path

Current end state:
- V5 verification artifacts: complete
- Explorer submissions: complete
- Explorer confirmations: blocked externally
- Deployment record: complete and truthful about the remaining verification gap

## One-at-a-Time Retry Pass - 2026-04-04
Two additional single-contract retries were executed after the bulk submission pass to rule out queue saturation and bad batch behavior.

Retry targets:
- `DrillProofAccess` - request id `GKNMgi-hjTb9zhroKIvh`
- `DuckCreekAdapter` - request id `GKNMzj3A-CZh-p6i07dC`

Observed behavior:
- Both one-at-a-time submissions were accepted with `HTTP/1.1 200 OK`
- Both again returned `{"message":"Smart-contract verification started"}`
- `DrillProofAccess` was polled for 20 cycles at 15 seconds each and never transitioned to `is_verified=true`
- `DuckCreekAdapter` was polled for 12 cycles at 15 seconds each and never transitioned to `is_verified=true`

Additional local verification evidence for `DrillProofAccess`:
- Current local runtime bytecode matches the live deployed runtime bytecode exactly
- Current local creation bytecode plus constructor args matches the explorer-reported `creation_bytecode` exactly
- Constructor args in the verification bundle match the original deployment transaction input exactly

Conclusion after single-contract pass:
- This is no longer consistent with a malformed local verification bundle
- The remaining blocker is most likely inside the XRPL explorer's Blockscout verification pipeline rather than inside DatumX's source, compiler settings, or constructor-arg encoding

## Archive Note
- Previous V4/V4.5 deployment metadata is preserved at [xrpl-testnet-v4.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\archive\xrpl-testnet-v4.json).
