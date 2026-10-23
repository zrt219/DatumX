# DatumX × BOT Chain: Friday Technical Handoff

**Checkpoint Date**: Friday, October 23, 2026  
**Review Audience**: Leon, Roy, and Josh (BOT Chain) & ZRT Team  
**Status**: AUDITED & TESTED LOCALLY — ON-CHAIN BROADCAST AWAITING FAUCET GAS & EXPLICIT AUTHORIZATION

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

## 3. Four-Tier Status: Implemented, Locally Tested, Testnet Verified, and Blocked

| Status Tier | Scope & Features | Evidence / Artifacts |
|---|---|---|
| **Implemented** | • Standalone registry contract: `BotChainDatasetRegistry.sol`<br>• Hardened deployment script: `DeployBotChainRegistry.s.sol`<br>• Dual-network config: `botchainConfig.ts`<br>• Cryptographic serialization: `canonicalHash.ts`<br>• Interactive pilot panel: `BotChainPilotPanel.tsx`<br>• Fail-closed client & write/read workflow: `botchainClient.ts` | • `contracts/botchain/BotChainDatasetRegistry.sol`<br>• `script/DeployBotChainRegistry.s.sol`<br>• `src/lib/botchainClient.ts`<br>• `src/components/botchain/BotChainPilotPanel.tsx` |
| **Locally Tested** | • 47 Solidity unit tests (30 XRPL protocol + 8 BOT Chain registry + 8 deployment security tests + 1 deployment guard test)<br>• 45 Vitest unit and integration tests across 10 test suites<br>• Zero-error TypeScript build (`tsc -b && vite build`)<br>• Clean ESLint check (`eslint .`)<br>• RFC 8785 test vectors evaluated for ordering, literals, and number serialization | • `forge test -vv` (47/47 passed)<br>• `npm run test` (45/45 passed)<br>• `npm run build` (Clean production bundle)<br>• `npm run lint` (0 errors, 0 warnings) |
| **Testnet Verified** | • Bohr Testnet RPC responsiveness and chain identity confirmed live | • `https://rpc.bohr.life` responds with Chain ID `968` |
| **Blocked** | • Live Bohr Testnet contract deployment broadcast<br>• Live on-chain transaction submission and block explorer confirmation | • **Blocker 1**: No explicit deployment authorization (`BOTCHAIN_DEPLOY_AUTHORIZED=true` not set)<br>• **Blocker 2**: No funded deployment signing key (`BOTCHAIN_PRIVATE_KEY` not configured; Anvil fallback removed for security)<br>• **Blocker 3**: Test wallet requires faucet gas tokens |

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

### B. Frontend Vitest Suite (45 Tests Total)
```text
Test Files  10 passed (10)
Tests       45 passed (45)
  ✓ src/test/canonicalHashStrict.test.ts (4 tests)
  ✓ src/test/canonicalHash.test.ts (6 tests)
  ✓ src/test/botchainClient.test.ts (7 tests)
  ✓ src/test/network.test.ts (7 tests)
  ✓ src/test/useDrillProofTransactions.test.tsx (2 tests)
  ✓ src/test/useWallet.test.tsx (1 test)
  ✓ src/test/LineageGraph.test.tsx (1 test)
  ✓ src/test/useDrillProof.test.tsx (2 tests)
  ✓ src/test/botchainIntegration.test.ts (14 tests)
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
- No Botchain mainnet deployment or financial commitment is authorized. Separate user approval is required for testnet broadcasting.
