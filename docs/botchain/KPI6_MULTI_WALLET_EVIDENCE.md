# DatumX × BOT Chain Mainnet — KPI 6 Multi-Wallet Evidence Ledger

**Registry Contract:** [`0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`](https://scan.botchain.ai/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7)  
**Network:** BOT Chain Mainnet (`Chain ID 677`, `https://rpc.botchain.ai`)  
**Contract Owner:** `0x31A826bB9D5F6087d94CDA31945C1234d061b788`  
**Public Registration Policy:** `publicRegistrationEnabled = false` (Owner-managed allowlist strictly enforced)  
**KPI 6 Target:** At least **5 verified `registerDataset` transactions across 3 independent wallets** (Owner + Leon Wallet 1 + Leon Wallet 2).

> [!IMPORTANT]
> This report strictly distinguishes **contract deployment**, **owner allowlist authorization transactions** (`setAuthorizedSubmitter`), and actual **`registerDataset` dataset-registration transactions**. Only genuine, confirmed on-chain receipts verified via RPC/BOTScan are marked `CONFIRMED`. All unexecuted owner approvals or partner registrations are marked `PENDING`.

---

## 1. Non-Registration Baseline & Owner Allowlist Authorizations

*(Excluded from the 5-registration target count.)*

| Action Type | Target / Wallet | Transaction Hash | BOTScan URL | Receipt Status | Block | On-Chain Permission Verified |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **Contract Creation** | `BotChainDatasetRegistry(false)` | `0x717bcc1a6a5eab9d02e124f43332aab89cf6393d4f6f3a0314d370d16d81630b` | [scan.botchain.ai/tx/0x717bcc...](https://scan.botchain.ai/tx/0x717bcc1a6a5eab9d02e124f43332aab89cf6393d4f6f3a0314d370d16d81630b) | `success` | `29237813` | `owner() = 0x31A8...b788`, `public = false` |
| **Allowlist Wallet 1** | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` | `PENDING_METAMASK_SIGNATURE` | `PENDING` | `PENDING` | `PENDING` | `authorizedSubmitters = false` (awaiting owner tx) |
| **Allowlist Wallet 2** | `0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2` | `PENDING_METAMASK_SIGNATURE` | `PENDING` | `PENDING` | `PENDING` | `authorizedSubmitters = false` (awaiting owner tx) |

---

## 2. Dataset Registration Ledger (`registerDataset` Only)

Current Confirmed On-Chain `totalRecords()` on `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`: **`2`** (from **1** distinct wallet so far).  
Remaining to reach KPI 6 threshold (**5 total across 3 independent wallets**): **3 registrations from Leon's 2 wallets** (after owner allowlist confirmation).

| # | Participant Role | Wallet Address | Dataset Identifier / `bytes32` | Registration Tx Hash | BOTScan Transaction URL | Receipt Status | Block Number | On-Chain `submitter` Readback | Hash Verification Result (`verifyDatasetHash`) |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **1** | Wallet A (DatumX Owner) | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | `BOT-SYNTH-002`<br>(`0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d`) | `0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59` | [scan.botchain.ai/tx/0xee9afc...](https://scan.botchain.ai/tx/0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59) | `success` | `29237966` | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | **MATCH (`true`)** / Altered **MISMATCH (`false`)** |
| **2** | Wallet A (DatumX Owner) | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | `0xa9900893df2d0dacb65ec829c67b5131d28d86a520920ed92a06326edceda000` | `0xf1bcfe32ce3cd2865709d8eeed533ed517813d50ac3f2e316b3778625d8b559b` | [scan.botchain.ai/tx/0xf1bcfe...](https://scan.botchain.ai/tx/0xf1bcfe32ce3cd2865709d8eeed533ed517813d50ac3f2e316b3778625d8b559b) | `success` | `29250068` | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | Stored hash `0x8446f6...484e` (`exists: true`) |
| **3** | Wallet B (Leon Wallet 1) | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` | `PENDING` (partner submission) | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |
| **4** | Wallet B (Leon Wallet 1) | `0xF226C920957BD4B648EaF1A8d1f859057Ec605a4` | `PENDING` (partner submission) | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |
| **5** | Wallet C (Leon Wallet 2) | `0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2` | `PENDING` (partner submission) | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |

---

## 3. Progress Toward KPI 6 Completion

- **Independent Wallets Confirmed with Live `registerDataset` Txs**: **1 / 3** (`Owner`; `Wallet 1` & `Wallet 2` pending authorization + partner signing)
- **Confirmed `registerDataset` Transactions on Chain ID 677**: **2 / 5**
- **Overall KPI 6 Multi-Wallet Status**: **PENDING PARTNER SIGNING (Awaiting Owner MetaMask Allowlist Approvals & Leon's Wallet 1 / Wallet 2 Submissions)**
