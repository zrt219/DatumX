# DatumX × BOT Chain Mainnet — Partner Dataset Registration Guide (Leon & Team)

**Live App:** https://datumx.vercel.app  
**Contract (`BotChainDatasetRegistry`):** `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`  
**Partner Allowlist Status:** **BOTH WALLETS AUTHORIZED ON-CHAIN (`Chain ID 677`)**  
- **Wallet 1 (`0xF226C920957BD4B648EaF1A8d1f859057Ec605a4`)**: Confirmed `true` ([Tx `0xe3f5dacd...`](https://scan.botchain.ai/tx/0xe3f5dacd8a74f802a088a523fdd3b8fab4403cc0c5c03cd5133881007eec5e20), Block `29743054`), Balance `0.03037 BOT`  
- **Wallet 2 (`0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2`)**: Confirmed `true` ([Tx `0x0b0318b7...`](https://scan.botchain.ai/tx/0x0b0318b73078f68bb21cd61cc21060dfc7b6f893011135006f84fa55d72dcc64), Block `29743076`), Balance `0.03251 BOT`  

*(Target: Complete **3 partner registrations** across Wallet 1 and Wallet 2 to reach **5 total registrations across 3 independent wallets** alongside DatumX Owner's 2 confirmed registrations.)*

---

## Quick Copy-Paste Telegram Guide

```text
DatumX × BOT Chain Mainnet — Ready for Registration (Both Wallets Authorized)

Both of your wallets are now verified on-chain (authorizedSubmitters = true) and funded with ~0.03 BOT for gas:
• Wallet 1: 0xF226C920957BD4B648EaF1A8d1f859057Ec605a4 (Suggested: 2 registrations -> W1 Tx 1 & W1 Tx 2)
• Wallet 2: 0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2 (Suggested: 1 registration  -> W2 Tx 1)

1) MetaMask Network Settings (BOT Chain Mainnet)
• Network Name: BOT Chain Mainnet
• RPC URL: https://rpc.botchain.ai
• Chain ID: 677
• Currency Symbol: BOT
• Block Explorer: https://scan.botchain.ai

2) Connect to DatumX
• Open https://datumx.vercel.app
• Select Wallet 1 (0xF226...05a4) in MetaMask, click "Connect Wallet", and approve.
• Click "Open BOT Chain Console" (or "BOT Chain Mainnet" in the sidebar).
• If prompted, click "Switch to BOT Chain Mainnet (677)" and approve in MetaMask.
• Confirm the blue status box says:
  "LIVE ON-CHAIN READY" and "Wallet Role: Authorized Submitter (Registration Enabled)".

3) Load Prepared Synthetic Preset & Preview Fee (Step 1)
We pre-tested 3 unique synthetic fixtures (1-click buttons inside Step 1):
• With Wallet 1 connected:
  - First registration: click preset "W1 Tx 1" (loads BOT-SYNTH-PILOT-W1-001)
  - Second registration: click preset "W1 Tx 2" (loads BOT-SYNTH-PILOT-W1-002)
• Then switch MetaMask to Wallet 2 (0xe75d...7Af2):
  - Third registration: click preset "W2 Tx 1" (loads BOT-SYNTH-PILOT-W2-001)
• (Or click "New Unique ID" if entering your own synthetic dataset ID.)
• Click "Simulate & Preview Fee" -> verifies uniqueness on-chain and shows the exact contract, wallet, hashes, and ~0.0044 BOT gas estimate.
• Click "Confirm & Sign in MetaMask" and approve the MetaMask popup.

4) Copy Your BOTScan Transaction URL (Step 2)
• Step 2 ("2. Read Stored Record") will automatically load your confirmed on-chain record from RPC.
• Click "Copy URL" beside "Transaction:" (https://scan.botchain.ai/tx/0x...).

5) Verify Data Integrity (Step 3)
• Click "Verify On-Chain (verifyDatasetHash)" -> confirm green:
  MATCH [ON-CHAIN SMART CONTRACT VERIFIED].
• Optional tamper test: click "Simulate Tampered Reading" -> "Verify On-Chain" -> turns red:
  MISMATCH [PAYLOAD ALTERED].

6) Reply With:
For each of the 3 registrations, please send:
1. Wallet address used
2. Dataset Identifier (e.g. BOT-SYNTH-PILOT-W1-001)
3. Full BOTScan transaction URL (https://scan.botchain.ai/tx/0x...)
4. Screenshot of Step 2 ("CONFIRMED ON-CHAIN") & Step 3 ("MATCH") if handy
```

---

## Pre-Verified Synthetic Presets (Live RPC Simulation Tested)

*(All three fixtures are strictly synthetic test data for protocol review, never real satellite observations or authentic field measurements.)*

| Preset Button | Assigned Wallet | Dataset Identifier | Computed `bytes32` ID | Canonical SHA-256 Hash | Simulated Gas (`20 gwei`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`W1 Tx 1`** | Wallet 1 (`0xF226...05a4`) | `BOT-SYNTH-PILOT-W1-001` | `0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff` | `0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5` | `220,497` (`~0.00441 BOT`) |
| **`W1 Tx 2`** | Wallet 1 (`0xF226...05a4`) | `BOT-SYNTH-PILOT-W1-002` | `0xe02c93248d410d67c1761f4341fe5c4b6a6f019dac43a00cb49099c8d406c274` | `0xff2a0d3d505bfff72ca8bc22636ca1fe82d109768b7c2f321b08acc2b50158f1` | `220,509` (`~0.00441 BOT`) |
| **`W2 Tx 1`** | Wallet 2 (`0xe75d...7Af2`) | `BOT-SYNTH-PILOT-W2-001` | `0xfd7fdbbe38427ae2bdf84ec322c83cd5870bcf1fa8fee95d36e7867427a3049f` | `0xeb0fa956cb31251a458783b95d73d5a45124f600032eccebbaa4ca27c045439d` | `220,497` (`~0.00441 BOT`) |

---

## Common Errors & Troubleshooting

| Error Message | Cause | Fix |
| :--- | :--- | :--- |
| `Duplicate dataset ID: ... is already registered on BOT Chain Mainnet` | That Dataset ID already exists on-chain (`BOT-SYNTH-002` or reused preset). | Select a different unused preset (`W1 Tx 2`, `W2 Tx 1`) or click **New Unique ID**. |
| `Submitting wallet ... lacks permission to register datasets` | Active MetaMask account is neither Owner nor Wallet 1 / Wallet 2. | Switch active MetaMask account to `0xF226...05a4` or `0xe75d...7Af2`. |
| `Incorrect network: Connected wallet is on chain ID ...` | MetaMask is not on BOT Chain Mainnet (`677`). | Click **Switch to BOT Chain Mainnet (677)** and approve in MetaMask. |
| `Insufficient BOT balance for estimated transaction fee` | Account lacks `~0.0044 BOT`. | Verify you are on the pre-funded Wallet 1 (`0.03037 BOT`) or Wallet 2 (`0.03251 BOT`). |
| `Contract simulation failed for registerDataset` | Empty version, malformed input, duplicate ID, or unauthorized caller. | Verify `Version` is non-empty (`1.0.0`) and Dataset ID is unique, then click **Simulate & Preview Fee**. |
