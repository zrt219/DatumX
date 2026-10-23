# DatumX × BOT Chain Pilot — Comprehensive Technical Master Dossier

**Working Branch**: `feature/botchain-registry-pilot`  
**Reference Origin**: `zrt219-patch-1` (Commit `57ca541e58aa942cb2faf469b0ae62878fe21a15`)  
**Target Review Date**: Friday, October 23, 2026  
**Audience**: Leon, Roy, and Josh (BOT Chain Core Team) & ZRT Protocol Team  
**Audit & Readiness Verdict**: **LOCALLY VERIFIED & AUDITED (Awaiting Testnet Authorization & Faucet)**  

---

## 1. Executive Mission & Strategic Context

This branch establishes an isolated, lightweight, and high-integrity **BOT Chain Dataset Registry Pilot** (Register → Read → Verify) designed specifically to meet the technical readiness checkpoint requested by Leon, Roy, and Josh.

### Core Strategic Mandates:
1. **Zero Impact on Canonical XRPL EVM Testnet**: The existing V5 deployment on XRPL EVM Testnet (Chain ID `1449000`), its deployment manifest (`deployments/xrpl-testnet.json`), contracts, and recorded lineage proofs (`1->2`, `3->4`, `5->6`, `7->8`) remain 100% independent and untouched.
2. **Deterministic Cryptographic Verification**: Proves that dataset releases can be registered, retrieved, and cryptographically verified on-chain using canonical RFC 8785 JSON serialization and SHA-256 hashing.
3. **Honest Architectural Boundaries**: Completely avoids simulated or fabricated transaction hashes (`Math.random()`), providing honest client-side staging when un-deployed and real viem contract client bindings for live Bohr Testnet deployment.
4. **Clean Code Separation**: All pilot contracts, configurations, ABIs, test runners, and handoff dossiers live strictly on `feature/botchain-registry-pilot`.

---

## 2. Multi-Network Architecture & Isolation Model

```
+--------------------------------------------------------------------------------------------------+
|                                    DatumX Unified Console Shell                                  |
|                                                                                                  |
|   [Active Chain Switcher & EIP-1193 Provider Detection]                                          |
|            │                                                                                     |
|            ├───► Chain ID: 1449000 (XRPL EVM Testnet)                                            |
|            │     • Purpose: Full Industrial Release Governance                                   |
|            │     • Contracts: DatasetRegistry, ProjectRouter, ValidationModule, DrillProofAccess |
|            │     • Lineage: Strict multi-stage parent->child dependency DAG                      |
|            │     • Explorer: https://explorer.testnet.xrplevm.org                                |
|            │                                                                                     |
|            └───► Chain ID: 968 (BOT / Bohr Testnet)                                              |
|                  • Purpose: Lightweight Dataset Integrity Pilot (Register -> Read -> Verify)     |
|                  • Contract: BotChainDatasetRegistry.sol                                         |
|                  • Lineage: Direct cryptographic proof anchoring & verification                  |
|                  • Explorer: https://scan.bohr.life                                              |
+--------------------------------------------------------------------------------------------------+
```

### Network Matrix

| Network Parameter | XRPL EVM Testnet (Preserved Canonical) | BOT / Bohr Testnet (Pilot Environment) | BOT Chain Mainnet (Documented Reference) |
| :--- | :--- | :--- | :--- |
| **Role** | Canonical Industrial Provenance Demo | Isolated Technical Pilot Staging | Future Production Target (Out of Scope) |
| **Chain ID** | `1449000` (`0x161b28`) | `968` (`0x3c8`) | `677` (`0x2a5`) |
| **JSON-RPC Endpoint** | `https://rpc.testnet.xrplevm.org/` | `https://rpc.bohr.life` (Verified Live) | `https://rpc.botchain.ai` (Verified Live) |
| **Block Explorer** | `https://explorer.testnet.xrplevm.org` | `https://scan.bohr.life` | `https://scan.botchain.ai` |
| **Native Gas Asset** | `XRP` (18 decimals) | `Test BOT` / `BOT` (18 decimals) | `BOT` (18 decimals) |
| **EVM Target** | Shanghai / Cancun compatible | EVM compatible (`^0.8.20` - `^0.8.24`) | EVM compatible |
| **Deployment State** | Canonical V5 Live (`deployments/xrpl-testnet.json`) | Bytecode & Script Ready for Faucet Allocation | Deployment Automation Disabled |

---

## 3. Detailed Component Breakdown

### A. Smart Contract Architecture (`contracts/botchain/`)
- **File**: [`contracts/botchain/BotChainDatasetRegistry.sol`](contracts/botchain/BotChainDatasetRegistry.sol)
  - **Storage Architecture**:
    ```solidity
    struct DatasetRecord {
        bytes32 datasetId;
        bytes32 datasetHash;
        string version;
        string metadataURI;
        address submitter;
        uint64 timestamp;
        bool exists;
    }
    ```
  - **State Guardrails**:
    - `registerDataset(datasetId, datasetHash, version, metadataURI)`: Validates that `datasetId != 0`, `datasetHash != 0`, and `bytes(version).length > 0`. Reverts with `RecordAlreadyExists()` if the ID has already been registered, preventing overwrite or revision collisions.
    - `getDataset(bytes32 datasetId)`: Constant-time $O(1)$ state retrieval. Reverts with `RecordNotFound()` if the record does not exist.
    - `verifyDatasetHash(bytes32 datasetId, bytes32 candidateHash)`: On-chain cryptographic comparison between stored hash and external candidate hash.
  - **Permission Model**:
    - `canRegister`: Restricts writes to authorized submitters or contract owner when closed, or allows open testnet registrations when `publicRegistrationEnabled == true`.
    - `setPublicRegistration(bool)` & `setAuthorizedSubmitter(address, bool)`: Owner-restricted administrative functions.
- **Deployment Script**: [`script/DeployBotChainRegistry.s.sol`](script/DeployBotChainRegistry.s.sol)
  - Hard-reverts on unsupported networks or mainnet (`677`, `1`).
  - Requires explicit authorization (`BOTCHAIN_DEPLOY_AUTHORIZED=true`) and explicitly configured private key (`BOTCHAIN_PRIVATE_KEY != 0`). Removed public Anvil key fallback.
  - Defaults registry permissions to allowlisted registration unless public registration is explicitly approved.
- **Contract Tests**:
  - [`test/BotChainDatasetRegistry.t.sol`](test/BotChainDatasetRegistry.t.sol): 8 unit test cases validating registration success, duplicate rejection, zero-parameter validation, getter functions, and access control.
  - [`test/DeployBotChainRegistry.t.sol`](test/DeployBotChainRegistry.t.sol): 8 deployment security test cases verifying hard reverts on mainnet/unsupported chains, authorization gates, and permission defaults.

### B. Client Cryptography & Serialization (`src/lib/`)
- **File**: [`src/lib/canonicalHash.ts`](src/lib/canonicalHash.ts)
  - **RFC 8785 Canonical JSON Serialization** (`canonicalJsonStringify`):
    - Recursively traverses JSON objects and sorts keys by UTF-16 code units prior to serialization.
    - Tested against official RFC 8785 Section 3.2 vectors for key ordering, number formatting, and literal preservation.
  - **Web Crypto SHA-256** (`computeSha256Hex`):
    - Native browser cryptographic digest producing standardized `0x`-prefixed 64-character hexadecimal hashes.
- **File**: [`src/lib/botchainClient.ts`](src/lib/botchainClient.ts)
  - Real `viem` contract client interface connecting `botChainRegistryAbi` with `publicClient` and `walletClient`.
  - Implements 5 fail-closed pre-flight checks (`validateRegistrationPrerequisites`): chain ID 968 validation, bytecode existence check, ABI compatibility, submitting wallet permissions, and gas sufficiency check.
  - Implements `submitBotchainDataset` executing `walletClient.writeContract`, awaiting genuine transaction receipt, verifying successful status, independently reading back on-chain record via RPC public client, and cryptographically validating the input hash against retrieved state.
  - Implements `readBotchainDataset` for live `publicClient.readContract` execution.
  - Provides `isBotchainContractDeployed()` detection to seamlessly toggle between live on-chain execution and honest client-side staging.
- **File**: [`src/lib/network.ts`](src/lib/network.ts)
  - Multi-chain switching routines (`switchToBotChainTestnet`, `addBotChainTestnet`, `switchToXRPLTestnet`).
  - Chain-aware explorer URL builder resolving transaction links to `https://scan.bohr.life/tx/{txHash}`.

### C. Interactive Frontend Console (`src/components/botchain/`)
- **File**: [`src/components/botchain/BotChainPilotPanel.tsx`](src/components/botchain/BotChainPilotPanel.tsx)
  - **Deployment Posture Banner**: Clearly identifies whether the registry contract is active on Bohr Testnet or operating in local simulation mode. Displays `LOCAL SIMULATION — NO ON-CHAIN TRANSACTION` when undeployed.
  - **Step 1 — Register Dataset**:
    - Interactive synthetic payload editor with preloaded clean energy benchmark data.
    - One-click "Canonicalize & Hash" generating deterministic SHA-256.
    - Submits live transaction via wallet if deployed, or stages record cleanly without fake transaction hashes.
  - **Step 2 — Read Stored Record**:
    - Real-time display of on-chain/staged attributes: `Dataset ID`, `Stored Content Hash`, `Version`, `Timestamp`, and `Submitter Address`.
    - If live on-chain, provides a direct clickable link to Bohr block explorer. If staged in simulation, clearly discloses that no on-chain transaction exists.
  - **Step 3 — Verify Integrity**:
    - Candidate payload editor allowing real-time modification of parameters.
    - Recalculates SHA-256 and compares against stored hash:
      - Live on-chain: Displays `MATCH [ON-CHAIN RECORD INTEGRITY VERIFIED]`.
      - Local simulation: Disables claims of on-chain verification; displays `MATCH [LOCAL SIMULATION ONLY — NOT ON-CHAIN]`.
      - Tampered: Displays prominent red `MISMATCH [PAYLOAD ALTERED]`.

---

## 4. Verification, Testing & Audits

### A. Execution Log Evidence
- **Foundry Smart Contracts (`forge test -vv`)**:
  - Invocations: **47 total unit tests across 4 suites**.
  - `test/DatumXProtocol.t.sol`: 30 passed (XRPL canonical suite).
  - `test/BotChainDatasetRegistry.t.sol`: 8 passed (BOT Chain registry suite).
  - `test/DeployBotChainRegistry.t.sol`: 8 passed (Deployment security suite).
  - `test/DeployBotChainGuard.t.sol`: 1 passed (Deployment guard suite).
  - Pass Rate: **100% (47/47 passed, 0 failed, 0 skipped)**.
- **Vitest Frontend Suites (`npm run test`)**:
  - Invocations: **45 total tests across 10 test suites**.
  - `src/test/canonicalHashStrict.test.ts`: 4 passed (strict RFC 8785 rejection).
  - `src/test/canonicalHash.test.ts`: 6 passed (RFC 8785 Section 3.2 vectors & sorting).
  - `src/test/botchainClient.test.ts`: 7 passed (client security & network refusal).
  - `src/test/network.test.ts`: 7 passed.
  - `src/test/useDrillProofTransactions.test.tsx`: 2 passed.
  - `src/test/useWallet.test.tsx`: 1 passed.
  - `src/test/LineageGraph.test.tsx`: 1 passed.
  - `src/test/useDrillProof.test.tsx`: 2 passed.
  - `src/test/botchainIntegration.test.ts`: 14 passed (5 fail-closed pre-flight checks, negative receipt tests, and write/readback verification).
  - `src/test/app.test.tsx`: 1 passed.
  - Pass Rate: **100% (45/45 passed, 0 failed, 0 skipped)**.
- **TypeScript Production Build (`npm run build`)**:
  - Clean production build (`tsc -b && vite build`) bundling 2,160 modules in 9.91s with 0 errors.
- **ESLint Code Quality (`npm run lint`)**:
  - Clean lint inspection with 0 errors and 0 warnings.

### B. Disclosure of Browser Test Mocks
- **Headless Browser Test (`scripts/smoke-test-browser.cjs`)**: Injects a mock EIP-1193 Ethereum provider (`window.ethereum`) with synthetic accounts (`0x90F7...`) to test navigation and network badges across headless Chromium without a physical wallet extension.
- **Frontend Unit Tests (`src/test/*.test.tsx`)**: Use Vitest mocks for React hook state and viem client methods to isolate component rendering.
- **Console Demo Views (`src/data/demoData.ts`)**: Display static benchmark records when no live wallet is connected.

### C. Clean-Room Verification Status
- **Anti-Cheating & Invariant Check**: Zero skipped tests, zero mock transaction hashes, real viem writeContract / waitForTransactionReceipt / readContract workflow implemented.
- **Verification Status**: **Locally Verified & Audited**. Live testnet broadcast held safely until deployment is explicitly authorized and funded.

---

## 5. Security, Ownership & Asset Protection Audit

- **Licensing Disclosure**: There is currently no root `LICENSE` file committed to the repository. While internal pilot files contain SPDX MIT headers, repository-wide licensing and external code reuse rights require explicit authorization from project ownership (ZRT Protocol team).
- **Proprietary Exploration Asset Exclusion**:
  - The pilot uses **strictly synthetic public benchmark datasets**.
  - Commercial mining borehole logs, gamma traces, and confidential survey references (Noble Plains Uranium) are strictly excluded from the pilot.
- **Zero Secrets Committed**: Audited working tree confirms zero private keys, mnemonic phrases, or RPC credentials committed.
- **Fail-Safe Client Protection**: The console rejects transactions when connected to an incorrect network, preventing lost gas or accidental broadcast.

---

## 6. Actionable Discussion Points for Friday Review

### Questions for Roy & Josh (Engineering):
1. **Target Environment**: Can you confirm that Bohr Testnet (`https://rpc.bohr.life`, Chain ID `968`) is the designated environment for ecosystem technical pilots?
2. **Faucet & Test Gas**: What is the official faucet or dispenser address for obtaining `Test BOT` to broadcast live contract deployments?
3. **Contract Verification**: Does `scan.bohr.life` support standard Foundry/Blockscout API verification (`forge verify-contract`), or is manual UI flattening required?
4. **Relayer Architecture**: For enterprise data submissions, does BOT Chain recommend an allowlisted relayer pattern or direct multi-sig wallet transactions?

### Questions for Leon (Ecosystem & Leadership):
1. **Scope Alignment**: Does the 3-step Register → Read → Verify workflow fulfill the initial pilot scope you envisioned?
2. **Phase 2 Expansion**: Would you like the next phase to incorporate DatumX's multi-validator consensus mechanism onto BOT Chain, or maintain a lightweight single-source registry?
3. **Ecosystem Program**: What are the subsequent evaluation criteria and milestones for formal inclusion in the BOT Chain Ecosystem Support Program?

---

### Branch Metadata
- **Branch**: [`feature/botchain-registry-pilot`](https://github.com/zrt219/DatumX/tree/feature/botchain-registry-pilot)
- **Git Remote**: `https://github.com/zrt219/DatumX.git`
- **Current HEAD SHA**: Query dynamically via `git rev-parse HEAD`.
- **Status**: Review branch with new safeguards, locally verified and audited; live BOT Chain testnet deployment blocked pending explicit authorization and funded deployer key.

## Current review caveat

Earlier smoke tests relied on emulated registries and mocked browser wallets. The current branch adds hard chain/network and signer checks, bytecode existence checks, transaction receipt confirmation, and strict client-side status labeling (`LOCAL SIMULATION — NO ON-CHAIN TRANSACTION`). The real Bohr testnet contract address and receipt are not yet supplied as no deployment is authorized. No mainnet deployment is authorized.
