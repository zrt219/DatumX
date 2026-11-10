# DatumX × BOT Chain Mainnet — KPI 6 Multi-Wallet Evidence Ledger

**Registry Contract:** [`0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`](https://scan.botchain.ai/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7)  
**Network:** BOT Chain Mainnet (`Chain ID 677`, `https://rpc.botchain.ai`)  
**Contract Owner:** `0x31A826bB9D5F6087d94CDA31945C1234d061b788` (Balance: `0.97372254 BOT`)  
**Public Registration Policy:** `publicRegistrationEnabled = false` (Owner-managed allowlist strictly enforced)  
**KPI 6 Target:** At least **5 verified `registerDataset` transactions across 3 independent wallets** (Owner + Leon Wallet 1 + Leon Wallet 2).  
**Current Audit Verdict:** **PARTIALLY COMPLETE** (`2 / 5` `registerDataset` transactions confirmed from `1 / 3` wallets; both partner wallets verified `authorizedSubmitters = true` on-chain and awaiting partner-signed registrations).

> [!IMPORTANT]
> This ledger strictly distinguishes **contract creation**, **owner allowlist authorizations** (`setAuthorizedSubmitter`), and actual **`registerDataset` dataset registrations**. All statuses below are verified directly against `https://rpc.botchain.ai` via `eth_call`, `eth_getTransactionReceipt`, `eth_getTransactionByHash`, and `eth_getBalance`.

---

## 1. Contract Deployment & Confirmed Owner Allowlist Authorizations

*(These administrative transactions are excluded from the 5-registration count.)*

| Action Type | Target / Wallet | Transaction Hash | BOTScan URL | Receipt Status | Block (Timestamp UTC) | Verified On-Chain State |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Contract Creation** | `BotChainDatasetRegistry(false)` | `0x717bcc1a6a5eab9d02e124f43332aab89cf6393d4f6f3a0314d370d16d81630b` | [scan.botchain.ai/tx/0x717bcc...](https://scan.botchain.ai/tx/0x717bcc1a6a5eab9d02e124f43332aab89cf6393d4f6f3a0314d370d16d81630b) | `success` (`0x1`) | `29237813` (`2026-11-05T21:06:39Z`) | `owner() = 0x31A8...b788`, `publicRegistrationEnabled() = false`, bytecode `6,384` hex chars |
| **Allowlist Wallet 1** | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` | `0xe3f5dacd8a74f802a088a523fdd3b8fab4403cc0c5c03cd5133881007eec5e20` | [scan.botchain.ai/tx/0xe3f5da...](https://scan.botchain.ai/tx/0xe3f5dacd8a74f802a088a523fdd3b8fab4403cc0c5c03cd5133881007eec5e20) | `success` (`0x1`) | `29743054` (`2026-11-10T06:22:12Z`) | **`authorizedSubmitters = true`**, Balance `0.03037454 BOT` |
| **Allowlist Wallet 2** | `0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2` | `0x0b0318b73078f68bb21cd61cc21060dfc7b6f893011135006f84fa55d72dcc64` | [scan.botchain.ai/tx/0x0b0318...](https://scan.botchain.ai/tx/0x0b0318b73078f68bb21cd61cc21060dfc7b6f893011135006f84fa55d72dcc64) | `success` (`0x1`) | `29743076` (`2026-11-10T06:22:29Z`) | **`authorizedSubmitters = true`**, Balance `0.03250888 BOT` |

---

## 2. Dataset Registration Ledger (`registerDataset` Only)

Current Confirmed On-Chain `totalRecords()` on `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`: **`2`** (from **1** distinct wallet: Owner `0x31A8...b788`).  
Remaining needed to satisfy KPI 6 (**5 total across 3 independent wallets**): **3 registrations signed by Leon's Wallet 1 & Wallet 2**.

| # | Participant Role | Wallet Address | Dataset Identifier / `bytes32` | Registration Tx Hash | BOTScan URL | Receipt Status | Block (Timestamp UTC) | Registered `submitter` & `datasetHash` | Verification (`verifyDatasetHash`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **1** | Wallet A (DatumX Owner) | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | `BOT-SYNTH-002`<br>(`0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d`) | `0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59` | [scan.botchain.ai/tx/0xee9afc...](https://scan.botchain.ai/tx/0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59) | `success` (`0x1`) | `29237966` (`2026-11-05T21:08:34Z`) | `0x31A8...b788`<br>`0x8446f6...484e` | **`true`** (`MATCH`) / Altered **`false`** (`MISMATCH`) |
| **2** | Wallet A (DatumX Owner) | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | `0xa9900893df2d0dacb65ec829c67b5131d28d86a520920ed92a06326edceda000` | `0xf1bcfe32ce3cd2865709d8eeed533ed517813d50ac3f2e316b3778625d8b559b` | [scan.botchain.ai/tx/0xf1bcfe...](https://scan.botchain.ai/tx/0xf1bcfe32ce3cd2865709d8eeed533ed517813d50ac3f2e316b3778625d8b559b) | `success` (`0x1`) | `29250068` (`2026-11-05T23:39:50Z`) | `0x31A8...b788`<br>`0x8446f6...484e` | **`true`** (`MATCH`) |
| **3** | Wallet B (Leon Wallet 1) | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` | `BOT-SYNTH-PILOT-W1-001`<br>(`0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff`) | `PENDING_PARTNER_SIGNATURE` | `PENDING` | `PENDING` | `PENDING` | `PENDING` (Simulated Hash: `0xea0dcdd1...df5`, `220,497` gas) | `PENDING` |
| **4** | Wallet B (Leon Wallet 1) | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` | `BOT-SYNTH-PILOT-W1-002`<br>(`0xe02c93248d410d67c1761f4341fe5c4b6a6f019dac43a00cb49099c8d406c274`) | `PENDING_PARTNER_SIGNATURE` | `PENDING` | `PENDING` | `PENDING` | `PENDING` (Simulated Hash: `0xff2a0d3d...8f1`, `220,509` gas) | `PENDING` |
| **5** | Wallet C (Leon Wallet 2) | `0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2` | `BOT-SYNTH-PILOT-W2-001`<br>(`0xfd7fdbbe38427ae2bdf84ec322c83cd5870bcf1fa8fee95d36e7867427a3049f`) | `PENDING_PARTNER_SIGNATURE` | `PENDING` | `PENDING` | `PENDING` | `PENDING` (Simulated Hash: `0xeb0fa956...39d`, `220,497` gas) | `PENDING` |

---

## 3. Summary Checklist for KPI 6 Completion

- **Authorized Independent Wallets on Chain `677`**: **3 / 3** (`Owner`, `Wallet 1`, `Wallet 2` all active)
- **Confirmed `registerDataset` Transactions on Chain `677`**: **2 / 5** (`Owner` x2; `Wallet 1` x0, `Wallet 2` x0)
- **Distinct Submitting Wallets with Confirmed Registrations**: **1 / 3** (`Owner` only)
- **Simulated Ready Synthetic Partner Presets**: **3 / 3** (`W1-001`, `W1-002`, `W2-001` verified unregistered & revert-free via `simulateContract`)
- **Explicit Status**: **PARTIALLY COMPLETE** (Awaiting Leon's MetaMask registrations for Rows 3, 4, and 5)
