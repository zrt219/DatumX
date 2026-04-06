# DatumX XRPL EVM Testnet V5

## Network
- Network: `XRPL EVM Testnet`
- Chain ID: `1449000`
- RPC: `https://rpc.testnet.xrplevm.org/`
- Explorer: `https://explorer.testnet.xrplevm.org`
- Deployer: `0x31A826bB9D5F6087d94CDA31945C1234d061b788`

## Canonical V5 Contracts
- `DrillProofAccess`: `0x47AA8f1F35DB309Be2bd7aD1b58070092A7dc2e5`
- `ProjectRegistry`: `0x238fc107Dc66A08B93A28107399dCC35968d6687`
- `DatasetRegistry`: `0x0Fa0b1a4C21BB0cbF5DA4441570e9d997EAf5e0B`
- `ValidationModule`: `0xD60BE5B6A28eAF13De6DB6e02726551304E82baf`
- `ProjectRouter`: `0x04dC258B2329114F5907fFD5c8600c72E5BA1637`
- `DuckCreekAdapter`: `0x431B5d8b0D471e51Fff2fF2D05c784B527fc0254`
- `ShirleyCentralAdapter`: `0xD54e7c8298934e850eBcF4aa2E541eFb821a6797`
- `ShirleyEastAdapter`: `0xCB04fEE2D7F8555a9C9b2473442F81A4b64Db993`

## Deployment Transactions
- `DrillProofAccess`: `0xfc5fdf85209bfd92a4247cfa700ca6ba990a5174ac6f1f671868b22352d04924`
- `ProjectRegistry`: `0x6ffc3bf4682ad8bb02d36c502cb2359a436e5bfe2ce478c1b898eeec57d9bbd3`
- `DatasetRegistry`: `0x80a7c83e6f33541c63a8fad3d84036cd0094b8d689c3f83773c9fde69ad9519a`
- `ValidationModule`: `0xf09b52305ec406e9aa3201c71ce2ac5e3fe84e63aecb42643af081ebfbe1d0be`
- `ProjectRouter`: `0x1ebd4414ae0c774473da3dbf314ab5eee29862419c46769755518a77883cd620`
- `DuckCreekAdapter`: `0xf40c6f10edfec5be7df468ec90090b4ff95a2896568c5f5ffaa9decd1bd3b2ac`
- `ShirleyCentralAdapter`: `0x149046e84c163522d1c65a8ff81d0247683fba70fefe786f1413aac41f73fbca`
- `ShirleyEastAdapter`: `0xf12905c2fc3be93d5f0c2bab090012128b2a5a9db0c105f53f62f01f5c5b93eb`

## Post-Deploy Setup
- `grant VALIDATOR_ROLE -> 0x83c4aE468d41aDc1D9E2109ccD4833050Fd19ec0`: `0x868c0961dd7af2f56987ef1d2b0c5b8617ee4a732c4a64cd8b6cf99408398c72`
- `grant VALIDATOR_ROLE -> 0xF96125A22C9C4670A166fabfed0c0B12bE73c1B2`: `0x879c98c0e419ba56c711c3ae65c4abf51f9e4e7fdd909554badfe21aaa735b09`
- `grant VALIDATOR_ROLE -> 0xA34f17AD281bC2F585AB929c8054a789e9B6fBD8`: `0x56a77d845d077b7faab1394366d9afd6dc7e5d349390489a27ecbeebab5786ee`
- `DatasetRegistry.setRouter`: `0xce0d9c363c9ef6baabc55f61c56750ee6687dbd5d35548bebe3f571d38c52289`
- `DatasetRegistry.setValidationModule`: `0xe0de73060623abd09cf971a7aeafafec72dc5466ecf0426cdaff32f2b3e467d5`
- `register DUCK_CREEK`: `0xac9e03ccf27ab2ed4e1cdcb15a4f3bebcfff895b398672851b1368af525cd5c9`
- `register SHIRLEY_CENTRAL`: `0x22c28c2bb63b3395062ae4a7e2b7fb69423cc61fe735d971acb50ff83ce89645`
- `register SHIRLEY_EAST`: `0x047407f331a15af5f4718924ee27a6b5897e6fab1f3147f8a8f9eef65b21de8a`

## Protocol Configuration
- `DatasetRegistry.router()`: `0x04dC258B2329114F5907fFD5c8600c72E5BA1637`
- `DatasetRegistry.validationModule()`: `0xD60BE5B6A28eAF13De6DB6e02726551304E82baf`
- `ProjectRegistry.getProjectKeys()`: `DUCK_CREEK`, `SHIRLEY_CENTRAL`, `SHIRLEY_EAST`
- `ValidationModule.getThresholds()`: `minValidatorCount=3`, `minApprovalRatioBps=6667`, `minConfidenceBps=7000`

## Live Protocol Exercise

### Validator set
- `0x83c4aE468d41aDc1D9E2109ccD4833050Fd19ec0`
- `0xF96125A22C9C4670A166fabfed0c0B12bE73c1B2`
- `0xA34f17AD281bC2F585AB929c8054a789e9B6fBD8`

### Stage 1: root dataset
- Submit root dataset: `0xc38e6d451f302740bd8fa6398405ce11d162e7532f636b44927ecad94599a6e8`
- Root dataset ID: `1`
- Root content hash: `0x522d3830fd58e6dd40f4414715de154dae30725c57aada958f475e1a2590ab79`
- Review 1: `0x0d6f6e2d426fe4a9447bd0ce7f3ac15eb5b2329d7626a6809d0783a1de84184c`
- Review 2: `0x7b936dcf4faac54f04e0d193b1b4c1d20a68016082a34bd10169a7bc5b6e7967`
- Review 3: `0xbef952b4f4750c6194813e0b597165c04479470ad9ed67afa277200213635a36`
- Finalize root dataset: `0x57fdf994da619d999a5750b9469cb02b51ba6dcdae73d6a183ba483032cd6705`

### Stage 2: child dataset
- Submit child dataset: `0x8a8ab32b0b6b0621bdfcfadb395fc8fa2c9099c18333fa0b11532b0056ea8bdd`
- Child dataset ID: `2`
- Child content hash: `0xc0b7e16b3cb6f1fc2d30acd72373f87675f392ed2ab969a2fc930fc29b718262`
- Review 1: `0xb34ff58759c6dc16540ee163abb4635fe67d9cae448281b6646e183711f895ca`
- Review 2: `0xb40dc64156cb6da3a5c847d66acb5fbb44d0bacfd271b778c1c5eca43b284145`
- Review 3: `0x5a358b8241ced8fd927449071efc095e097822ffe999f72cd1cce8e99cbc3ad9`
- Finalize child dataset: `0x57770356b9776a046415f32d7ed52d1d99eaa92cc02f6ac348b3c4595d8e5c0f`

## Final Onchain State
- `DatasetRegistry.getProjectDatasetIds(SHIRLEY_CENTRAL)`: `[1, 2]`
- `DatasetRegistry.getChildDatasetIds(1)`: `[2]`
- `DatasetRegistry.getDataset(2)` resolved to:
  - `status = FINALIZED`
  - `aggregateConfidenceBps = 8550`
  - `approvalCount = 3`
  - `rejectionCount = 0`
  - `parentDatasetHash = 0x522d3830fd58e6dd40f4414715de154dae30725c57aada958f475e1a2590ab79`

## Admin Fast-Path Smoke Test

### Result
- Thresholds were temporarily lowered to `minValidatorCount=1`
- A fresh root/child lineage pair was exercised on live XRPL testnet
- Thresholds were restored to `minValidatorCount=3`, `minApprovalRatioBps=6667`, `minConfidenceBps=7000`
- Project key exercised: `SHIRLEY_CENTRAL`
- Dataset types exercised:
  - root `3`: `RAW_SCAN_BATCH`
  - child `4`: `EXTRACTED_TRACES`

### Execution profile
- Flow used fixed gas limits and legacy gas send mode for XRPL EVM compatibility
- Smoke runner avoids `eth_estimateGas`
- Confirmed stages:
  - lower thresholds
  - submit root
  - review root
  - finalize root
  - submit child
  - review child
  - finalize child
  - verify lineage linkage
  - restore thresholds

### Threshold management
- Lower thresholds: `0x56b7797abcc95b022e5007dd47d7cc5576519d5073b962ed9c4899426caa433f`
- Restore thresholds: `0x99a639b01dbd0ed81cceeb8eade9088fcde05ae50c40c16c29f157336a9148fa`

### Root dataset
- Dataset ID: `3`
- Dataset type: `RAW_SCAN_BATCH`
- URI: `ipfs://datumx-live/xrpl/root-fastpath`
- Content hash: `0xe9ae03ac4d889f59e2c895d5da9f4111a8ee27f9ee7b1bec83f082ccb881c9d5`
- Submit: `0x23241778cc15a87e4af6c17674e568fdd2d32f703746344e1743763dc65e8d8d`
- Review: `0x6d0eb5deadc6630693e7939d053f30f113924329037ad3fc41b88fc6fe6c92fa`
- Finalize: `0xbc668f21a9b0ae2c7653de25f2e3750d96d2c73e76b9d28fd40ec5a87749d20d`

### Child dataset
- Dataset ID: `4`
- Dataset type: `EXTRACTED_TRACES`
- Parent dataset ID: `3`
- URI: `ipfs://datumx-live/xrpl/child-fastpath`
- Content hash: `0xcf4a529af77fb023c566d87cb6fd0b1f2f4f42c1830278cec0f9a9762b26d8c0`
- Submit: `0x5fd7a7630d8ad2588772840b2984ed62da92d8f90038a40328081368e1887a6d`
- Review: `0x978c688a5e859325e3714a166f93ec61f2d52a102abccd6b4bf51635d4d00c2d`
- Finalize: `0x1360e79b394105c56daa82a56c1e07c7e938becd72e94efa6ca529572162be85`

### Verification
- `DatasetRegistry.getParentDatasetId(4)`: `3`
- `DatasetRegistry.getChildDatasetIds(3)`: `[4]`
- `ValidationModule.getThresholds()` after restore:
  - `minValidatorCount=3`
  - `minApprovalRatioBps=6667`
  - `minConfidenceBps=7000`

## Release-Candidate Smoke Verification

### Result
- A fresh admin fast-path smoke run was executed against the same canonical V5 deployment
- Thresholds were temporarily lowered to `minValidatorCount=1`
- A new root->child lineage pair was created and finalized on XRPL EVM Testnet
- Thresholds were restored to `minValidatorCount=3`, `minApprovalRatioBps=6667`, `minConfidenceBps=7000`

### Threshold management
- Lower thresholds: `0x319f25e36aba86209ed361d5456f1d2a431be73baaaeff31fb8af054c2cb2744`
- Restore thresholds: `0xa8bd9b575fa02d2f00abe902cfa6aa700d4fba08e26906815b41cb3d58713d5d`

### Root dataset
- Dataset ID: `5`
- Dataset type: `RAW_SCAN_BATCH`
- URI: `ipfs://datumx-live/xrpl/root-fastpath`
- Content hash: `0x54ff1efb688a968f02d3ff011acf7b75b936ce0ad642eaa82c837dc2002a5d12`
- Submit: `0x5643c2e16114c7b833d9975e7fca353f79d7aa2b49bd50b5d4f249424ffb098f`
- Review: `0xb9c8957e613c925233f52e81183257ddaee40516e0e2467a63bc56e472ddb50b`
- Finalize: `0xcada91ccf516fdce022ae3d4b7b3b3b84950115a3e0522f3fd16aeeb41509796`

### Child dataset
- Dataset ID: `6`
- Dataset type: `EXTRACTED_TRACES`
- Parent dataset ID: `5`
- URI: `ipfs://datumx-live/xrpl/child-fastpath`
- Content hash: `0xb5b47b4fc5637e71f1cbcaf3cc8d51be4cc26c645b62662650cf584fd499f5e4`
- Submit: `0x4300189c7ed95062629ae6931a91ca8f4f6e61793636da09ce217396dac62b3f`
- Review: `0xb2d1edf2a0c3b2c5279f1cdd44a4e6cf933bf6d6d9ac1c2c2ebd7c005f0733d4`
- Finalize: `0x47b285551172bde367cbaf78839e891a8e6b5d4a32f09e55786af0ae2595742b`

### Verification
- `DatasetRegistry.getParentDatasetId(6)`: `5`
- `DatasetRegistry.getChildDatasetIds(5)`: `[6]`
- `ValidationModule.getThresholds()` after restore:
  - `minValidatorCount=3`
  - `minApprovalRatioBps=6667`
  - `minConfidenceBps=7000`

## Explorer Verification Bundle
- Current V5 Standard JSON and constructor-argument artifacts were regenerated on `2026-04-04`.
- Canonical bundle directory: [deployments/verification/xrpl-testnet](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\verification\xrpl-testnet)
- Regeneration command: `npm run contracts:verify-artifacts:xrpl`
- Manual verification notes: [xrpl-testnet-verification.md](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\xrpl-testnet-verification.md)
- Explorer submission command: `npm run contracts:submit-verification:xrpl`
- Submission outcome on `2026-04-04`: all 8 contracts accepted by the XRPL Blockscout verification API, but none transitioned to verified state during the observed confirmation window
- One-at-a-time retry outcome on `2026-04-04`: `DrillProofAccess` and `DuckCreekAdapter` were resubmitted individually and still did not transition to verified state
- Local evidence for `DrillProofAccess`: deployed runtime bytecode, creation bytecode, and constructor args all match the current verification bundle exactly

### Explorer Links
- DrillProofAccess: [https://explorer.testnet.xrplevm.org/address/0x47AA8f1F35DB309Be2bd7aD1b58070092A7dc2e5](https://explorer.testnet.xrplevm.org/address/0x47AA8f1F35DB309Be2bd7aD1b58070092A7dc2e5)
- ProjectRegistry: [https://explorer.testnet.xrplevm.org/address/0x238fc107Dc66A08B93A28107399dCC35968d6687](https://explorer.testnet.xrplevm.org/address/0x238fc107Dc66A08B93A28107399dCC35968d6687)
- DatasetRegistry: [https://explorer.testnet.xrplevm.org/address/0x0Fa0b1a4C21BB0cbF5DA4441570e9d997EAf5e0B](https://explorer.testnet.xrplevm.org/address/0x0Fa0b1a4C21BB0cbF5DA4441570e9d997EAf5e0B)
- ValidationModule: [https://explorer.testnet.xrplevm.org/address/0xD60BE5B6A28eAF13De6DB6e02726551304E82baf](https://explorer.testnet.xrplevm.org/address/0xD60BE5B6A28eAF13De6DB6e02726551304E82baf)
- ProjectRouter: [https://explorer.testnet.xrplevm.org/address/0x04dC258B2329114F5907fFD5c8600c72E5BA1637](https://explorer.testnet.xrplevm.org/address/0x04dC258B2329114F5907fFD5c8600c72E5BA1637)
- Lower thresholds tx: [https://explorer.testnet.xrplevm.org/tx/0x56b7797abcc95b022e5007dd47d7cc5576519d5073b962ed9c4899426caa433f](https://explorer.testnet.xrplevm.org/tx/0x56b7797abcc95b022e5007dd47d7cc5576519d5073b962ed9c4899426caa433f)
- Root submit tx: [https://explorer.testnet.xrplevm.org/tx/0x23241778cc15a87e4af6c17674e568fdd2d32f703746344e1743763dc65e8d8d](https://explorer.testnet.xrplevm.org/tx/0x23241778cc15a87e4af6c17674e568fdd2d32f703746344e1743763dc65e8d8d)
- Root review tx: [https://explorer.testnet.xrplevm.org/tx/0x6d0eb5deadc6630693e7939d053f30f113924329037ad3fc41b88fc6fe6c92fa](https://explorer.testnet.xrplevm.org/tx/0x6d0eb5deadc6630693e7939d053f30f113924329037ad3fc41b88fc6fe6c92fa)
- Root finalize tx: [https://explorer.testnet.xrplevm.org/tx/0xbc668f21a9b0ae2c7653de25f2e3750d96d2c73e76b9d28fd40ec5a87749d20d](https://explorer.testnet.xrplevm.org/tx/0xbc668f21a9b0ae2c7653de25f2e3750d96d2c73e76b9d28fd40ec5a87749d20d)
- Child submit tx: [https://explorer.testnet.xrplevm.org/tx/0x5fd7a7630d8ad2588772840b2984ed62da92d8f90038a40328081368e1887a6d](https://explorer.testnet.xrplevm.org/tx/0x5fd7a7630d8ad2588772840b2984ed62da92d8f90038a40328081368e1887a6d)
- Child review tx: [https://explorer.testnet.xrplevm.org/tx/0x978c688a5e859325e3714a166f93ec61f2d52a102abccd6b4bf51635d4d00c2d](https://explorer.testnet.xrplevm.org/tx/0x978c688a5e859325e3714a166f93ec61f2d52a102abccd6b4bf51635d4d00c2d)
- Child finalize tx: [https://explorer.testnet.xrplevm.org/tx/0x1360e79b394105c56daa82a56c1e07c7e938becd72e94efa6ca529572162be85](https://explorer.testnet.xrplevm.org/tx/0x1360e79b394105c56daa82a56c1e07c7e938becd72e94efa6ca529572162be85)
- Restore thresholds tx: [https://explorer.testnet.xrplevm.org/tx/0x99a639b01dbd0ed81cceeb8eade9088fcde05ae50c40c16c29f157336a9148fa](https://explorer.testnet.xrplevm.org/tx/0x99a639b01dbd0ed81cceeb8eade9088fcde05ae50c40c16c29f157336a9148fa)

## Archive Note
- Previous V4/V4.5 deployment metadata is preserved at [xrpl-testnet-v4.json](C:\Users\Zhane\Documents\New%20project\DatumX\deployments\archive\xrpl-testnet-v4.json)
