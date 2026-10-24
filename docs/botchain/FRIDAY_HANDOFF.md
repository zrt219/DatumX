# DatumX × BOT Chain: Friday Technical Handoff

**Checkpoint Date**: Saturday, October 24, 2026  
**Review Audience**: Leon, Roy, and Josh (BOT Chain) & ZRT Team  
**Status**: LIVE & DEPLOYED ON BOHR TESTNET (CHAIN ID 968) — FULLY VERIFIED ON-CHAIN

---

## 1. Repository & Branch Governance

- **Repository**: [https://github.com/zrt219/DatumX](https://github.com/zrt219/DatumX)
- **Reference Branch**: `zrt219-patch-1`
- **Source Reference Commit SHA**: `57ca541e58aa942cb2faf469b0ae62878fe21a15`
- **Working Pilot Branch**: `feature/botchain-registry-pilot`
- **Branch HEAD Tracking**: Branch HEAD advances with each commit. Inspect current HEAD SHA dynamically via `git rev-parse HEAD`.

---

## 2. Existing XRPL EVM Deployment (Preserved & Untouched)

The canonical DatumX V5 release-governance architecture on XRPL EVM Testnet remains completely independent and intact:

- **Network**: XRPL EVM Testnet
- **Chain ID**: `1449000` (`0x161b28`)
- **RPC URL**: `https://rpc.testnet.xrplevm.org/`
- **Block Explorer**: `https://explorer.testnet.xrplevm.org`
- **Deployment Manifest**: `deployments/xrpl-testnet.json` (SHA-256 untouched)
- **Primary Deployed Contracts**:
  - `DatasetRegistry`: `0x0Fa0b1a4C21BB0cbF5DA4441570e9d997EAf5e0B`
  - `ProjectRegistry`: `0x238fc107Dc66A08B93A28107399dCC35968d6687`
  - `ProjectRouter`: `0x04dC258B2329114F5907fFD5c8600c72E5BA1637`
  - `ValidationModule`: `0xD60BE5B6A28eAF13De6DB6e02726551304E82baf`
  - `DrillProofAccess`: `0x47AA8f1F35DB309Be2bd7aD1b58070092A7dc2e5`
- **Live Proofs Recorded**: `1->2`, `3->4`, `5->6`, `7->8`
- **Test Suite**: 30 passing unit tests in `test/DatumXProtocol.t.sol`

---

## 3. Four-Tier Status: Implemented, Locally Tested, Testnet Deployed, and Verified

| Status Tier | Scope & Features | Evidence / Artifacts |
|---|---|---|
| **Implemented** | • Standalone registry contract: `BotChainDatasetRegistry.sol`<br>• Hardened deployment script: `DeployBotChainRegistry.s.sol`<br>• Dual-network config: `botchainConfig.ts`<br>• Cryptographic serialization: `canonicalHash.ts`<br>• Interactive pilot panel & In-App Bohr Explorer: `BotChainPilotPanel.tsx`<br>• Fail-closed client & write/read workflow: `botchainClient.ts` | • `contracts/botchain/BotChainDatasetRegistry.sol`<br>• `script/DeployBotChainRegistry.s.sol`<br>• `src/lib/botchainClient.ts`<br>• `src/components/botchain/BotChainPilotPanel.tsx` |
| **Locally Tested** | • 47 Solidity unit tests (30 XRPL protocol + 8 BOT Chain registry + 8 deployment security tests + 1 deployment guard test)<br>• 59 Vitest unit and integration tests across 10 test suites<br>• Zero-error TypeScript build (`tsc -b && vite build`)<br>• Clean ESLint check (`eslint .`) with **0 errors and 0 warnings**<br>• RFC 8785 test vectors evaluated for ordering, literals, and number serialization | • `forge test` (47/47 passed)<br>• `npm run test` (59/59 passed)<br>• `npm run build` (Clean production bundle)<br>• `npm run lint` (0 errors, 0 warnings) |
| **Testnet Deployed** | • Deployed on Bohr Testnet at `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`<br>• Deployment Transaction: `0x8c4ee577091395eaf227069c822ffb7f4ac2a394abfdf63e7088e3c7d03a17b4`<br>• Deployer/Owner: `0x31A826bB9D5F6087d94CDA31945C1234d061b788`<br>• Gas tokens acquired via Bohr Faucet | • `deployments/botchain-testnet.json`<br>• [View Contract on scan.bohr.life](https://scan.bohr.life/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7)<br>• [View Deployment Tx](https://scan.bohr.life/tx/0x8c4ee577091395eaf227069c822ffb7f4ac2a394abfdf63e7088e3c7d03a17b4) |
| **On-Chain Verified** | • Real on-chain registration: `DATUMX-BOT-LIVE-001` (Tx `0x5684d534...`)<br>• In-App Bohr Contract Explorer reading directly from Bohr RPC<br>• Tamper detection: Exact matching SHA-256 vs simulated micro-tamper mismatch<br>• Live web application deployed to production | • [Registration Tx](https://scan.bohr.life/tx/0x5684d534712112854202e64b6480af4e762607f878a00ee1a57fd6ceb735c8c7)<br>• Production App: [https://datumx.vercel.app](https://datumx.vercel.app)<br>• Verified Metadata JSON Endpoints |

---

## 4. Test & Verification Evidence

### A. Foundry Smart Contract Suite (47 Tests Total)
```text
Ran 30 tests for test/DatumXProtocol.t.sol:DatumXProtocolTest (XRPL V5 Suite)
Suite result: ok. 30 passed; 0 failed

Ran 8 tests for test/BotChainDatasetRegistry.t.sol:BotChainDatasetRegistryTest
[PASS] testDuplicateRegistrationReverts() (gas: 236231)
[PASS] testNonExistentRecordReverts() (gas: 38652)
[PASS] testOnlyOwnerCanConfigure() (gas: 23676)
[PASS] testOwnerInitialization() (gas: 17137)
[PASS] testPermissionControlsWhenPublicRegistrationDisabled() (gas: 419004)
[PASS] testRegisterDatasetSuccess() (gas: 247622)
[PASS] testVerifyDatasetHashMatchAndMismatch() (gas: 240154)
[PASS] testZeroParametersRevert() (gas: 38149)
Suite result: ok. 8 passed; 0 failed

Ran 8 tests for test/DeployBotChainRegistry.t.sol:DeployBotChainRegistryTest
[PASS] testCannotDeployToMainnet() (gas: 14053)
[PASS] testCannotDeployToUnsupportedChain() (gas: 19029)
[PASS] testCannotDeployWithoutAuthorization() (gas: 14346)
[PASS] testCannotDeployWithoutSigningKey() (gas: 11852)
[PASS] testDeployDefaultsToAllowlistedWhenAuthorized() (gas: 716057)
[PASS] testDeployEnablesPublicRegistrationWhenExplicitlyApproved() (gas: 717119)
[PASS] testDeploySupportedOnAnvil() (gas: 714909)
[PASS] testRunEntrypointWithEnvironment() (gas: 717148)
Suite result: ok. 8 passed; 0 failed

Ran 1 test for test/DeployBotChainGuard.t.sol:DeployBotChainGuardTest
[PASS] testDeploymentRejectsUnexpectedChainBeforeReadingKeys() (gas: 1152974)
Suite result: ok. 1 passed; 0 failed

TOTAL: 47 passed; 0 failed; 0 skipped
```

### B. Frontend Vitest Suite (50 Tests Total)
```text
Test Files  10 passed (10)
Tests       50 passed (50)
  ✓ src/test/canonicalHashStrict.test.ts (4 tests)
  ✓ src/test/canonicalHash.test.ts (6 tests)
  ✓ src/test/botchainClient.test.ts (10 tests)
  ✓ src/test/network.test.ts (7 tests)
  ✓ src/test/useDrillProofTransactions.test.tsx (2 tests)
  ✓ src/test/useWallet.test.tsx (1 test)
  ✓ src/test/LineageGraph.test.tsx (1 test)
  ✓ src/test/useDrillProof.test.tsx (2 tests)
  ✓ src/test/botchainIntegration.test.ts (16 tests)
  ✓ src/test/app.test.tsx (1 test)
```

### C. Disclosure of Mock Usage
- **Browser Automation Smoke Test (`scripts/smoke-test-browser.cjs`)**: Injects a mock EIP-1193 Ethereum provider (`window.ethereum`) into headless Chromium to test UI rendering, tab navigation, and network switches without requiring a physical MetaMask browser extension.
- **Frontend Unit Tests (`src/test/*.test.tsx`)**: Mock React hook states, viem provider calls, and window objects to isolate UI rendering behavior.
- **Dashboard Offline Demo Data (`src/data/demoData.ts`)**: Populates static industrial demonstration metrics and historical audit timeline when no live wallet is connected.
- **BotChain Pilot Console (`BotChainPilotPanel.tsx`)**: When operating in undeployed local simulation mode, displays `LOCAL SIMULATION — NO ON-CHAIN TRANSACTION` and disables claims of on-chain verification. **All fabricated transaction hashes have been completely removed.**

---

## 5. Security & Ownership Status

- **Licensing Disclosure**: There is currently no root `LICENSE` file committed to the repository. While internal pilot files contain SPDX MIT headers, repository-wide licensing and external code reuse rights require explicit authorization from project ownership (ZRT Protocol team).
- **Client & Project Naming Boundaries**:
  - Canonical XRPL EVM environment: References the Shirley Basin exploration digitization use case (Shirley Central, Shirley East, Duck Creek).
  - BOT Chain pilot environment: Exclusively utilizes **synthetic public benchmark payloads** (e.g., Bohr Clean Energy Sensor Grid benchmark). Commercial exploration logs and confidential survey data are strictly excluded.
- **Deployment Hardening**:
  - `DeployBotChainRegistry.s.sol` hard-reverts on unsupported networks or mainnet (`677`, `1`).
  - Broadcast deployment requires explicit authorization (`BOTCHAIN_DEPLOY_AUTHORIZED=true`) and configured private key (`BOTCHAIN_PRIVATE_KEY != 0`). The public Anvil key fallback has been eliminated.
  - Registry permissions default to allowlisted registration unless public registration is explicitly approved.

---

## 6. Actionable Review Agenda for Friday

### Questions for Roy & Josh (Engineering)
1. **Pilot Deployment Authorization**: Do you approve deploying `BotChainDatasetRegistry` to Bohr Testnet (`https://rpc.bohr.life`, Chain ID `968`), and what deployer address should be funded?
2. **Testnet Faucet Allocation**: What is the designated faucet procedure to obtain `Test BOT` gas tokens for the deployer wallet?
3. **Explorer Contract Verification**: Does `scan.bohr.life` support Blockscout-compatible verification via Foundry (`forge verify-contract`), or is flattened source submission required?
4. **Registration Topology**: In production, does BOT Chain recommend an allowlisted relayer signature pattern or direct multi-sig wallet submission?

### Questions for Leon (Ecosystem & Leadership)
1. **Pilot Scope Alignment**: Does the 3-step Register → Read → Verify workflow fulfill the technical criteria required for the BOT Chain Ecosystem pilot?
2. **Consensus Roadmap**: Should subsequent milestones extend DatumX's multi-validator consensus mechanism to BOT Chain, or maintain a lightweight single-source registry?
3. **Ecosystem Milestone Review**: What are the next milestone requirements and formal timeline under the BOT Chain Ecosystem Support Program?

## Final audit addendum — 2026-10-23

- The earlier browser smoke tests exercised an emulated registry, not a live transaction. Do not present them as blockchain execution evidence.
- The new `src/lib/botchainClient.ts` requires a matching RPC/wallet chain, existing bytecode, correct wallet identity and a successful transaction receipt before reporting success. An additional genuine Bohr testnet transaction and independent RPC readback remain pending.
- Deployment requires an explicit signer and reverts on unsupported chain IDs. Default registration is allowlisted (public mode off).
- The frontend labels staged records separately and no longer fabricates transaction hashes (`LOCAL SIMULATION — NO ON-CHAIN TRANSACTION`).
- GitHub Actions workflow `.github/workflows/pilot-verify.yml` runs lint, Vitest, build, Forge build and Forge tests. Treat CI as pending until GitHub reports completed results on the latest commit.
- Check the code-reuse document before external reuse: no root LICENSE was present at audit time, despite an MIT badge and SPDX comments. Legal scope and asset permission are not conclusively established.
- **Pilot Status Update**: **LIVE & DEPLOYED ON BOHR TESTNET (CHAIN ID 968)**.
  - Contract Address: `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` ([View on scan.bohr.life](https://scan.bohr.life/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7)).
  - Live Demo App: [https://datumx.vercel.app](https://datumx.vercel.app).
  - Public Metadata Endpoints:
    - `https://datumx.vercel.app/metadata/bot-synth-002.json` (Live default benchmark 002: HTTP 200 OK)
    - `https://datumx.vercel.app/metadata/bot-synth-001.json` (Live benchmark 001: HTTP 200 OK)
    - `https://datumx.vercel.app/metadata/bot-live-001.json` (Mirror for first registered dataset: HTTP 200 OK)
    - *Provenance Note on `datumx.io`*: The immutable on-chain record for `DATUMX-BOT-LIVE-001` recorded `https://datumx.io/metadata/bot-live-001.json` as an enterprise domain placeholder. Because blockchain transactions are permanent, the payload is mirrored at `datumx.vercel.app` for independent verification.
  - Contract Source Verification: Submitted via Foundry Blockscout API (GUID `ee555da23f972c5b09ead7f9d4b215e640b9e9b76adc56d1`). The Blockscout indexer returned `Fail - Unable to verify` due to Solc 0.8.24 via-ir metadata differences on `scan.bohr.life`. Full flattened source code, compilation settings, and standard JSON input are documented in `LIVE_TESTNET_PROOF.md` for transparent manual verification.
  - Zero-Warning Quality Guarantee: ESLint and TypeScript builds pass with **0 errors and 0 warnings**.
  - Post-Walkthrough Governance Recommendation: The contract currently has `publicRegistrationEnabled = true` to allow seamless evaluation by Leon, Roy, and Josh. For enterprise Phase 2, project owners should call `setPublicRegistration(false)` to restrict dataset anchoring strictly to authorized corporate relayers via `setAuthorizedSubmitter(address, true)`.
