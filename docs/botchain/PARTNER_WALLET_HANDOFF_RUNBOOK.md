# DatumX × BOT Chain Mainnet: Partner Wallet Hand-Off Runbook

**Document Title**: BOT Chain Mainnet Partner Wallet Hand-Off & Execution Runbook  
**Target Milestone**: Milestone 3 / Partner KPI 6 (Multi-Wallet Technical Registration)  
**Contract Name**: `BotChainDatasetRegistry`  
**Contract Address**: `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`  
**Network**: BOT Chain Mainnet (`Chain ID 677` / `0x2a5`)  
**Target Audience**: Leon, Roy, Josh (BOT Chain Core), external partner node operators, and DatumX engineering  
**Effective Date**: November 10, 2026  
**Security & Independence Classification**: Strict Non-Custodial (Adheres strictly to Requirement R3)

---

## 🔒 Mandatory Safety, Custody & Integrity Policy (Requirement R3)

This runbook adheres strictly to the following non-negotiable security mandates:

1. **Strict Non-Custodial Operation**: Partner teams (Leon, Roy, Josh) must retain exclusive custody of their signing keys. **No private keys, seed phrases, or mnemonics are ever shared, requested, stored, or committed to code repositories.**
2. **True Wallet Independence**: Automated or simulated multi-wallet identities controlled by a single signer are prohibited. The transactions documented in this runbook must be signed independently by the respective designated partner wallets.
3. **Zero Unattended Mainnet Broadcasts**: Mainnet transactions cannot be triggered autonomously by AI subagents or unattended background daemons. Each transaction requires explicit human confirmation via MetaMask or an interactive CLI prompt.
4. **Anti-Fabrication Guarantee**: All transaction hashes, block numbers, gas metrics, and receipts documented here and returned by partner teams must reflect genuine state transitions verifiable on `https://scan.botchain.ai` and `https://rpc.botchain.ai`.

---

## 1. Executive Summary & Objective

The DatumX Verifiable Dataset Registry is live on **BOT Chain Mainnet (`Chain ID 677`)** at address `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`.

To fulfill **Partner KPI 6** (Multi-Wallet Evidence Ledger), the protocol requires a total of **at least 5 verified `registerDataset` transactions executed across at least 3 distinct, independent wallets**.

### Current On-Chain State:
- **Wallet A (DatumX Protocol Owner `0x31A8...b788`)**: **2 confirmed registrations** on-chain:
  1. `BOT-SYNTH-002`: [Tx `0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59`](https://scan.botchain.ai/tx/0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59) (Block `29237966`)
  2. `0xa9900893...`: [Tx `0xf1bcfe32ce3cd2865709d8eeed533ed517813d50ac3f2e316b3778625d8b559b`](https://scan.botchain.ai/tx/0xf1bcfe32ce3cd2865709d8eeed533ed517813d50ac3f2e316b3778625d8b559b) (Block `29250068`)
- **Wallet B (Leon Wallet 1 `0xF226...05a4`)**: Authorized on-chain (`authorizedSubmitters = true`), pre-funded with **`0.03037 BOT`**. Target: **2 registrations** (`W1 Tx 1` and `W1 Tx 2`).
- **Wallet C (Leon Wallet 2 `0xe75d...7Af2`)**: Authorized on-chain (`authorizedSubmitters = true`), pre-funded with **`0.03251 BOT`**. Target: **1 registration** (`W2 Tx 1`).

**Goal**: Execute the remaining **3 registrations** across Wallet 1 and Wallet 2 to achieve **5 / 5 confirmed registrations across 3 independent wallets**.

---

## 2. On-Chain Contract & Network Specifications

### 2.1 Network Parameters

| Parameter | Value | Details |
| :--- | :--- | :--- |
| **Network Name** | `BOT Chain Mainnet` | Official EVM Production Network |
| **Chain ID** | `677` | Hexadecimal: `0x2a5` |
| **RPC Endpoint** | `https://rpc.botchain.ai` | High-performance public JSON-RPC |
| **Block Explorer** | `https://scan.botchain.ai` | Blockscout v2 EVM Explorer |
| **Native Currency** | `BOT` | Decimals: `18` |

### 2.2 Smart Contract Architecture

| Parameter | Value | Verified Reference |
| :--- | :--- | :--- |
| **Contract Name** | `BotChainDatasetRegistry` | Cancun EVM target, Solc 0.8.24 |
| **Contract Address** | `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` | [BOTScan Address Page](https://scan.botchain.ai/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7) |
| **Deployment Tx** | `0x717bcc1a6a5eab9d02e124f43332aab89cf6393d4f6f3a0314d370d16d81630b` | Block `29237813` |
| **Owner Address** | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | DatumX Protocol Deployer |
| **Registration Policy** | `publicRegistrationEnabled = false` | Whitelist-gated against public spam |

### 2.3 Target Solidity Function

```solidity
function registerDataset(
    bytes32 datasetId,
    bytes32 datasetHash,
    string calldata version,
    string calldata metadataURI
) external returns (bool);
```

- **Function Signature**: `registerDataset(bytes32,bytes32,string,string)`
- **4-Byte Method Selector**: `0xfdd8e481`
- **Access Modifier**: `canRegister` (`msg.sender == owner || authorizedSubmitters[msg.sender]`)

---

## 3. Partner Wallet Authorizations & Gas Economics

### 3.1 On-Chain Allowlist Verification

Both partner wallets were explicitly authorized by the contract owner via `setAuthorizedSubmitter(address, true)`:

| Partner Wallet | Address | Allowlist Status | Authorization Tx Hash | Block Height | Native BOT Balance |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **Leon Wallet 1** | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` | **`true`** | [`0xe3f5dacd...5e20`](https://scan.botchain.ai/tx/0xe3f5dacd8a74f802a088a523fdd3b8fab4403cc0c5c03cd5133881007eec5e20) | `29743054` | `0.03037454 BOT` |
| **Leon Wallet 2** | `0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2` | **`true`** | [`0x0b0318b7...cc64`](https://scan.botchain.ai/tx/0x0b0318b73078f68bb21cd61cc21060dfc7b6f893011135006f84fa55d72dcc64) | `29743076` | `0.03250888 BOT` |

### 3.2 Gas Economics & Safety Margins

Simulated pre-flight execution against BOT Chain Mainnet produces the following economics:
- **Estimated Gas Limit**: `220,500 gas` per registration transaction.
- **Gas Price**: `20 gwei` (`20,000,000,000 wei`).
- **Estimated Cost per Transaction**:
  $$\text{Cost} = 220,500 \times 20 \times 10^{-9} \text{ BOT} \approx 0.00441 \text{ BOT}$$

#### Wallet Balance Solvency Check:
- **Leon Wallet 1**:
  - Balance: `0.03037454 BOT`
  - Cost for 2 registrations: `0.00882 BOT`
  - **Surplus**: `0.02155 BOT` (Wallet holds **3.4×** the required gas; >240% safety buffer).
- **Leon Wallet 2**:
  - Balance: `0.03250888 BOT`
  - Cost for 1 registration: `0.00441 BOT`
  - **Surplus**: `0.02810 BOT` (Wallet holds **7.3×** the required gas; >630% safety buffer).

*Conclusion*: Both wallets possess ample gas reserves to complete their designated registrations without faucet re-funding.

---

## 4. Master Dataset Payloads (The 3 Partner Registrations)

Below are the exact cryptographic payloads, canonical RFC 8785 JSON bodies, hash fingerprints, and raw calldata strings for each registration.

---

### Registration 1: Leon Wallet 1 — Tx 1

| Property | Value |
| :--- | :--- |
| **Assigned Signer** | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` (Leon Wallet 1) |
| **UI Preset Button** | **`W1 Tx 1`** |
| **Dataset Identifier Code** | `BOT-SYNTH-PILOT-W1-001` |
| **`bytes32 datasetId`** | `0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff` |
| **`string version`** | `1.0.0` |
| **`string metadataURI`** | `https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json` |
| **Content SHA-256 (`datasetHash`)** | `0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5` |
| **Gas Estimate** | `220,497 gas` (`~0.00441 BOT`) |

#### Canonical RFC 8785 JSON Payload:
```json
{"assignedSigner":"0xF226C920957BD4B648EaF1A8d1f859057Ec605a4","datasetCode":"BOT-SYNTH-PILOT-W1-001","fixtureNotice":"Synthetic KPI 6 partner review test fixture; not authentic field or satellite telemetry.","readings":[{"classification":"nominal","readingValue":112.4,"sensorSlot":"sim-slot-A1","unit":"cps"},{"classification":"nominal","readingValue":184.9,"sensorSlot":"sim-slot-A2","unit":"cps"},{"classification":"elevated","readingValue":298.1,"sensorSlot":"sim-slot-A3","unit":"cps"}],"sequenceNumber":101,"syntheticFixture":true}
```

#### Raw ABI-Encoded Calldata (`0xfdd8e481`):
```text
0xfdd8e481a560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ffea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000005312e302e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e68747470733a2f2f646174756d782e76657263656c2e6170702f6d657461646174612f626f742d73796e74682d70696c6f742d77312d3030312e6a736f6e0000
```

---

### Registration 2: Leon Wallet 1 — Tx 2

| Property | Value |
| :--- | :--- |
| **Assigned Signer** | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` (Leon Wallet 1) |
| **UI Preset Button** | **`W1 Tx 2`** |
| **Dataset Identifier Code** | `BOT-SYNTH-PILOT-W1-002` |
| **`bytes32 datasetId`** | `0xe02c93248d410d67c1761f4341fe5c4b6a6f019dac43a00cb49099c8d406c274` |
| **`string version`** | `1.0.0` |
| **`string metadataURI`** | `https://datumx.vercel.app/metadata/bot-synth-pilot-w1-002.json` |
| **Content SHA-256 (`datasetHash`)** | `0xff2a0d3d505bfff72ca8bc22636ca1fe82d109768b7c2f321b08acc2b50158f1` |
| **Gas Estimate** | `220,509 gas` (`~0.00441 BOT`) |

#### Canonical RFC 8785 JSON Payload:
```json
{"assignedSigner":"0xF226C920957BD4B648EaF1A8d1f859057Ec605a4","datasetCode":"BOT-SYNTH-PILOT-W1-002","fixtureNotice":"Synthetic KPI 6 partner review test fixture; not authentic field or satellite telemetry.","readings":[{"classification":"nominal","readingValue":129.6,"sensorSlot":"sim-slot-B1","unit":"cps"},{"classification":"nominal","readingValue":204.2,"sensorSlot":"sim-slot-B2","unit":"cps"},{"classification":"elevated","readingValue":332.7,"sensorSlot":"sim-slot-B3","unit":"cps"}],"sequenceNumber":102,"syntheticFixture":true}
```

#### Raw ABI-Encoded Calldata (`0xfdd8e481`):
```text
0xfdd8e481e02c93248d410d67c1761f4341fe5c4b6a6f019dac43a00cb49099c8d406c274ff2a0d3d505bfff72ca8bc22636ca1fe82d109768b7c2f321b08acc2b50158f1000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000005312e302e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e68747470733a2f2f646174756d782e76657263656c2e6170702f6d657461646174612f626f742d73796e74682d70696c6f742d77312d3030322e6a736f6e0000
```

---

### Registration 3: Leon Wallet 2 — Tx 1

| Property | Value |
| :--- | :--- |
| **Assigned Signer** | `0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2` (Leon Wallet 2) |
| **UI Preset Button** | **`W2 Tx 1`** |
| **Dataset Identifier Code** | `BOT-SYNTH-PILOT-W2-001` |
| **`bytes32 datasetId`** | `0xfd7fdbbe38427ae2bdf84ec322c83cd5870bcf1fa8fee95d36e7867427a3049f` |
| **`string version`** | `1.0.0` |
| **`string metadataURI`** | `https://datumx.vercel.app/metadata/bot-synth-pilot-w2-001.json` |
| **Content SHA-256 (`datasetHash`)** | `0xeb0fa956cb31251a458783b95d73d5a45124f600032eccebbaa4ca27c045439d` |
| **Gas Estimate** | `220,497 gas` (`~0.00441 BOT`) |

#### Canonical RFC 8785 JSON Payload:
```json
{"assignedSigner":"0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2","datasetCode":"BOT-SYNTH-PILOT-W2-001","fixtureNotice":"Synthetic KPI 6 partner review test fixture; not authentic field or satellite telemetry.","readings":[{"classification":"nominal","readingValue":141.3,"sensorSlot":"sim-slot-C1","unit":"cps"},{"classification":"nominal","readingValue":219.8,"sensorSlot":"sim-slot-C2","unit":"cps"},{"classification":"elevated","readingValue":361.5,"sensorSlot":"sim-slot-C3","unit":"cps"}],"sequenceNumber":201,"syntheticFixture":true}
```

#### Raw ABI-Encoded Calldata (`0xfdd8e481`):
```text
0xfdd8e481fd7fdbbe38427ae2bdf84ec322c83cd5870bcf1fa8fee95d36e7867427a3049feb0fa956cb31251a458783b95d73d5a45124f600032eccebbaa4ca27c045439d000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000005312e302e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e68747470733a2f2f646174756d782e76657263656c2e6170702f6d657461646174612f626f742d73796e74682d70696c6f742d77322d3030312e6a736f6e0000
```

---

## 5. Dual Execution Pathways

Partner operators may choose either **Method A (Web UI via MetaMask)** or **Method B (Direct CLI / Script)**. Both methods produce identical cryptographic state records on BOT Chain Mainnet.

```
                    +------------------------------------------+
                    |  Choose Execution Pathway for Partner    |
                    +--------------------+---------------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
    [Method A: Live Web UI]                             [Method B: Direct CLI / Script]
    - Open https://datumx.vercel.app                    - Foundry cast send
    - Connect MetaMask                                  - Node.js / Viem script
    - Click Preset Button (W1 / W2)                     - Ethers.js script
    - Simulate & Confirm in Wallet                      - Python web3.py script
               |                                                   |
               +-------------------------+-------------------------+
                                         |
                                         v
                         [Verified On-Chain Receipt]
                         - status: 0x1 (success)
                         - scan.botchain.ai/tx/0x...
                         - Readback & verifyDatasetHash = true
```

---

### Method A: Live Web UI Walkthrough (Recommended)

This graphical method is the fastest, safest, and most intuitive path for partner reviewers.

#### Step 1: Open DatumX Console
1. In Google Chrome, Brave, or Edge with MetaMask installed, navigate to:  
   👉 **`https://datumx.vercel.app`**
2. In MetaMask, switch to **Leon Wallet 1** (`0xF226...05a4`).
3. Click the top-right button **"Connect Wallet"** and approve the connection in MetaMask.
4. Click **"Open BOT Chain Console"** on the hero banner (or click **"BOT Chain Mainnet"** in the left sidebar).
5. If your wallet is on another network, a prominent amber banner will appear:  
   Click **"Switch to BOT Chain Mainnet (677)"** and confirm the network switch in MetaMask.
6. Verify the status badges:
   - Green badge: **`LIVE ON-CHAIN READY`**
   - Registry address: `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`
   - Wallet role: **`Authorized Submitter (Registration Enabled)`**

---

#### Step 2: Execute Registration 1 (Leon Wallet 1 — Preset W1 Tx 1)
1. In the Step 1 card (*"1. Register Dataset (On-Chain Pilot)"*), locate the quick preset buttons:  
   `[ W1 Tx 1 ]` `[ W1 Tx 2 ]` `[ W2 Tx 1 ]`
2. Click **`W1 Tx 1`**.
   - Notice the fields populate automatically:
     - *Dataset Identifier*: `BOT-SYNTH-PILOT-W1-001`
     - *Version*: `1.0.0`
     - *Metadata URI*: `https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json`
     - *Computed Hash*: `0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5`
     - Info Banner: *"Loaded preset BOT-SYNTH-PILOT-W1-001 for Leon Wallet 1..."*
3. Click **"Simulate & Preview Fee"**.
   - The UI simulates the contract call via RPC and verifies your wallet authorization.
   - A blue simulation card appears showing:
     - Target Contract: `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`
     - Estimated Gas: `~220,497`
     - Estimated Cost: `~0.00441 BOT`
4. Click **"Confirm & Sign in MetaMask"**.
5. Approve the transaction in the MetaMask popup.
6. Wait 3–6 seconds for block inclusion.
   - The card transitions to Step 2 (*"2. Read Stored Record"*), displaying:  
     **`CONFIRMED ON-CHAIN (RPC READBACK)`**
7. Beside the transaction row, click **"Copy URL"** to copy your BOTScan transaction link (`https://scan.botchain.ai/tx/0x...`). Save this URL.

---

#### Step 3: Execute Registration 2 (Leon Wallet 1 — Preset W1 Tx 2)
1. Remaining on Leon Wallet 1, scroll up to Step 1.
2. Click preset button **`W1 Tx 2`**.
   - Populates `BOT-SYNTH-PILOT-W1-002` and computed hash `0xff2a0d3d...8f1`.
3. Click **"Simulate & Preview Fee"**.
4. Click **"Confirm & Sign in MetaMask"** and approve the MetaMask popup.
5. Wait for the confirmation card in Step 2.
6. Copy and save your second transaction URL from Step 2.

---

#### Step 4: Execute Registration 3 (Leon Wallet 2 — Preset W2 Tx 1)
1. Open the MetaMask extension and switch accounts to **Leon Wallet 2** (`0xe75d...7Af2`).
2. Refresh the DatumX page (or wait 2 seconds for auto-detection).
3. Confirm the status header updates to:  
   `Connected to 677` • Wallet: `0xe75d...7Af2` • Role: `Authorized Submitter`.
4. In Step 1, click preset button **`W2 Tx 1`**.
   - Populates `BOT-SYNTH-PILOT-W2-001` and computed hash `0xeb0fa956...39d`.
5. Click **"Simulate & Preview Fee"**.
6. Click **"Confirm & Sign in MetaMask"** and approve the MetaMask popup.
7. Wait for the confirmation card in Step 2.
8. Copy and save your third transaction URL.

---

#### Step 5: Test Cryptographic Verification & Tamper Detection (Step 3)
1. In Step 3 (*"3. Verify Cryptographic Integrity"*), click **"Verify On-Chain (verifyDatasetHash)"**.
   - The smart contract evaluates `record.datasetHash == candidateHash`.
   - The green box confirms:  
     **`MATCH [ON-CHAIN SMART CONTRACT VERIFIED]`**
2. *(Optional demonstration)*: Click **"Simulate Tampered Reading"**.
   - The payload modifies sensor slot reading `gammaCount: 999.9`.
   - Click **"Verify On-Chain (verifyDatasetHash)"**.
   - The red box confirms:  
     **`MISMATCH [PAYLOAD ALTERED]`** (Proving deterministic on-chain tamper rejection).

---

### Method B: Direct CLI & Script Execution

For developers, CI/CD runners, and terminal operators who prefer command-line execution.

#### 1. Foundry `cast send` Execution

Ensure [Foundry](https://getfoundry.sh) is installed on your workstation. `cast` allows signing via private key, hardware wallet (Ledger/Trezor), or keystore.

##### Network Environment Variables:
```bash
export RPC_URL="https://rpc.botchain.ai"
export CHAIN_ID=677
export REGISTRY="0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7"
```

##### Command for Registration 1 (Leon Wallet 1, Tx 1):
```bash
cast send $REGISTRY \
  "registerDataset(bytes32,bytes32,string,string)" \
  0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff \
  0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5 \
  "1.0.0" \
  "https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json" \
  --rpc-url $RPC_URL \
  --gas-limit 250000 \
  --interactive # Prompt for private key securely without logging
```

##### Command for Registration 2 (Leon Wallet 1, Tx 2):
```bash
cast send $REGISTRY \
  "registerDataset(bytes32,bytes32,string,string)" \
  0xe02c93248d410d67c1761f4341fe5c4b6a6f019dac43a00cb49099c8d406c274 \
  0xff2a0d3d505bfff72ca8bc22636ca1fe82d109768b7c2f321b08acc2b50158f1 \
  "1.0.0" \
  "https://datumx.vercel.app/metadata/bot-synth-pilot-w1-002.json" \
  --rpc-url $RPC_URL \
  --gas-limit 250000 \
  --interactive
```

##### Command for Registration 3 (Leon Wallet 2, Tx 1):
```bash
cast send $REGISTRY \
  "registerDataset(bytes32,bytes32,string,string)" \
  0xfd7fdbbe38427ae2bdf84ec322c83cd5870bcf1fa8fee95d36e7867427a3049f \
  0xeb0fa956cb31251a458783b95d73d5a45124f600032eccebbaa4ca27c045439d \
  "1.0.0" \
  "https://datumx.vercel.app/metadata/bot-synth-pilot-w2-001.json" \
  --rpc-url $RPC_URL \
  --gas-limit 250000 \
  --interactive
```

*(Note: If using a hardware wallet, replace `--interactive` with `--ledger` or `--trezor`.)*

---

#### 2. Standalone TypeScript / Viem Script

Save the script below as `partner-register.ts` and run with `npx tsx partner-register.ts`:

```typescript
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const REGISTRY_ADDRESS = '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7' as const;
const RPC_URL = 'https://rpc.botchain.ai';

const botchainMainnet = {
  id: 677,
  name: 'BOT Chain Mainnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;

const registryAbi = parseAbi([
  'function registerDataset(bytes32 datasetId, bytes32 datasetHash, string version, string metadataURI) external returns (bool)',
  'function getDataset(bytes32 datasetId) external view returns ((bytes32 datasetId, bytes32 datasetHash, string version, string metadataURI, address submitter, uint64 timestamp, bool exists))',
  'function verifyDatasetHash(bytes32 datasetId, bytes32 candidateHash) external view returns (bool)'
]);

async function executePartnerRegistration(
  privateKey: `0x${string}`,
  dataset: { id: `0x${string}`; hash: `0x${string}`; version: string; uri: string }
) {
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({ chain: botchainMainnet, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, chain: botchainMainnet, transport: http(RPC_URL) });

  console.log(`Submitting from: ${account.address}`);
  console.log(`Registering Dataset ID: ${dataset.id}`);

  // 1. Simulate call
  await publicClient.simulateContract({
    account,
    address: REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: 'registerDataset',
    args: [dataset.id, dataset.hash, dataset.version, dataset.uri],
  });
  console.log('Simulation passed successfully.');

  // 2. Broadcast transaction
  const hash = await walletClient.writeContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: 'registerDataset',
    args: [dataset.id, dataset.hash, dataset.version, dataset.uri],
  });
  console.log(`Transaction broadcast! Hash: ${hash}`);

  // 3. Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  console.log(`Confirmed in Block ${receipt.blockNumber}! Status: ${receipt.status}`);
  console.log(`Explorer Link: https://scan.botchain.ai/tx/${hash}`);

  // 4. On-chain readback verification
  const record = await publicClient.readContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: 'getDataset',
    args: [dataset.id],
  });
  console.log('On-chain readback:', record);

  const isValid = await publicClient.readContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: 'verifyDatasetHash',
    args: [dataset.id, dataset.hash],
  });
  console.log(`On-chain Hash Verification (verifyDatasetHash): ${isValid ? 'MATCH (TRUE)' : 'MISMATCH (FALSE)'}`);
}

// Example usage:
// executePartnerRegistration(process.env.PARTNER_KEY as `0x${string}`, {
//   id: '0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff',
//   hash: '0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5',
//   version: '1.0.0',
//   uri: 'https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json',
// });
```

---

#### 3. Standalone Python (`web3.py`) Script

```python
from web3 import Web3
import os

w3 = Web3(Web3.HTTPProvider("https://rpc.botchain.ai"))
contract_address = Web3.to_checksum_address("0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7")

abi = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "datasetId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "datasetHash", "type": "bytes32"},
            {"internalType": "string", "name": "version", "type": "string"},
            {"internalType": "string", "name": "metadataURI", "type": "string"}
        ],
        "name": "registerDataset",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

contract = w3.eth.contract(address=contract_address, abi=abi)
private_key = os.environ.get("PARTNER_PRIVATE_KEY")
account = w3.eth.account.from_key(private_key)

dataset_id = bytes.fromhex("a560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff")
dataset_hash = bytes.fromhex("ea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5")
version = "1.0.0"
metadata_uri = "https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json"

tx = contract.functions.registerDataset(
    dataset_id, dataset_hash, version, metadata_uri
).build_transaction({
    'chainId': 677,
    'gas': 250000,
    'gasPrice': w3.to_wei(20, 'gwei'),
    'nonce': w3.eth.get_transaction_count(account.address),
})

signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
print(f"Broadcasted Tx: {tx_hash.hex()}")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Mined in block {receipt.blockNumber} with status {receipt.status}")
```

---

## 6. Verification & Post-Submission Procedures

### 6.1 Instant RPC Readback with `cast call`

Once a transaction has mined, verify that the state is live and immutable by querying the contract directly:

```bash
# Query the on-chain record for Registration 1:
cast call 0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7 \
  "getDataset(bytes32)((bytes32,bytes32,string,string,address,uint64,bool))" \
  0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff \
  --rpc-url https://rpc.botchain.ai

# Test on-chain cryptographic verification (must return true):
cast call 0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7 \
  "verifyDatasetHash(bytes32,bytes32)(bool)" \
  0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff \
  0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5 \
  --rpc-url https://rpc.botchain.ai
```

### 6.2 Hand-Off Confirmation Template (For Leon / Roy / Josh)

Once the 3 registrations are signed and confirmed, please copy, fill out, and send back this confirmation snippet via Telegram / Discord / Email:

```text
======================================================================
DATUMX × BOT CHAIN MAINNET: PARTNER REGISTRATION CONFIRMATION
======================================================================
Signer 1 (Leon Wallet 1): 0xF226C920957BD4B648EaF1A8d1f859057Ec605a4
- Tx 1 (BOT-SYNTH-PILOT-W1-001):
  Tx Hash: 0x_________________________________________________________
  BOTScan: https://scan.botchain.ai/tx/0x_____________________________
- Tx 2 (BOT-SYNTH-PILOT-W1-002):
  Tx Hash: 0x_________________________________________________________
  BOTScan: https://scan.botchain.ai/tx/0x_____________________________

Signer 2 (Leon Wallet 2): 0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2
- Tx 3 (BOT-SYNTH-PILOT-W2-001):
  Tx Hash: 0x_________________________________________________________
  BOTScan: https://scan.botchain.ai/tx/0x_____________________________

Status: All 3 registrations signed, confirmed, and verified on BOT Chain Mainnet (Chain ID 677).
======================================================================
```

---

## 7. Troubleshooting & Error Diagnosis

| Error Symptom / Custom Error | Cause | Resolution |
| :--- | :--- | :--- |
| `0x82b42900` (`Unauthorized()`) | Active signer account is not authorized (`authorizedSubmitters == false`). | Ensure your active MetaMask or CLI wallet is `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` or `0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2`. |
| `0xb51da823` (`RecordAlreadyExists()`) | The `datasetId` has already been registered on-chain. | Do not resubmit an already-confirmed preset. Choose the next preset or click **"New Unique ID"**. |
| `0x3e07f1a1` (`RecordNotFound()`) | In Step 2 or 3, querying a dataset ID that has not yet mined. | Ensure the registration transaction mined successfully before calling `getDataset`. |
| `0x7a79ec66` (`EmptyIdentifier()`) | `datasetId == bytes32(0)`. | Ensure the dataset ID hex string is 32 bytes (`0x` + 64 hex characters). |
| `0x8ef436b7` (`EmptyHash()`) | `datasetHash == bytes32(0)`. | Canonicalize and calculate SHA-256 before submitting. |
| `0xa48d1c95` (`EmptyVersion()`) | `version` string length is 0. | Supply a valid semantic version string (e.g. `"1.0.0"`). |
| `Wrong network (expected 677)` | Wallet is on Ethereum, Sepolia, or Bohr Testnet (`968`). | Click **"Switch to BOT Chain Mainnet (677)"** in DatumX console or update MetaMask network settings. |
| `Insufficient funds for gas` | Wallet balance is lower than `0.0044 BOT`. | Check balance on `scan.botchain.ai`. Both authorized partner wallets already possess `~0.03 BOT`. |

---

## 8. Summary of Deliverables & Expected Outcome

Upon execution of these 3 transactions:
1. Total on-chain records in `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` will increment from **`2`** to **`5`**.
2. Independent submitting wallets will increment from **`1`** (`Owner`) to **`3`** (`Owner`, `Leon Wallet 1`, `Leon Wallet 2`).
3. **Partner KPI 6** will transition from `PARTIALLY COMPLETE` to **`100% COMPLETE & VERIFIED`**.
4. The multi-wallet ledger in `docs/botchain/KPI6_MULTI_WALLET_EVIDENCE.md` will be updated with permanent on-chain block and transaction coordinates.
