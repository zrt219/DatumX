# DatumX × BOT Chain Mainnet — Partner Dataset Registration Guide (Leon & Team)

**Live App:** https://datumx.vercel.app  
**Contract (`BotChainDatasetRegistry`):** `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`  
**Target Requirement:** 5 verified dataset registrations across 3 independent wallets before **November 13, 2026** (DatumX owner wallet already has 2 confirmed on-chain; Leon's Wallet 1 & Wallet 2 will complete independent registrations directly via MetaMask).

---

## Quick Copy-Paste Telegram Guide

```text
DatumX × BOT Chain Mainnet — Quick Registration Guide

1) MetaMask Network Settings (BOT Chain Mainnet)
• Network Name: BOT Chain Mainnet
• RPC URL: https://rpc.botchain.ai
• Chain ID: 677
• Currency Symbol: BOT
• Block Explorer: https://scan.botchain.ai

2) Connect to DatumX
• Open https://datumx.vercel.app
• Select the active wallet in MetaMask:
  - Wallet 1: 0xF226C920957BD4B648EaF1A8d1f859057Ec605a4
  - Wallet 2: 0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2
• Click "Connect Wallet" in the top-right bar and approve in MetaMask.
• Click "Open BOT Chain Console" on the homepage (or "BOT Chain Mainnet" in the left menu).
• If prompted, click "Switch to BOT Chain Mainnet (677)" and approve in MetaMask.
• Confirm the status bar says:
  "LIVE ON-CHAIN READY" and "Wallet Role: Authorized Submitter (Registration Enabled)"
  (Note: Once DatumX owner approves your address on-chain, this badge updates automatically.)

3) Register a Unique Synthetic Dataset (Step 1)
• Dataset Identifier: MUST be brand-new and unique for every transaction!
  - Use the "New Unique ID" button, OR type your own like:
    - Wallet 1 Tx #1: BOT-REVIEW-W1-001
    - Wallet 1 Tx #2: BOT-REVIEW-W1-002
    - Wallet 2 Tx #1: BOT-REVIEW-W2-001
    - Wallet 2 Tx #2: BOT-REVIEW-W2-002
  (Never reuse BOT-SYNTH-002 — duplicate IDs are rejected by the smart contract.)
• Version: 1.0.0
• Public Metadata URI: keep default or use a synthetic URI like https://datumx.vercel.app/metadata/review-001.json
• Synthetic Payload (JSON): optionally tweak a number (like gammaCount: 188.4) so each dataset has a unique payload hash.
• Click "Canonicalize & Hash" -> confirms valid JSON and shows the SHA-256 hash.
• Click "Submit On-Chain" -> review gas in BOT and click Confirm in MetaMask.
• Wait ~2–5 seconds for confirmation.

4) Copy Your BOTScan Transaction URL (Step 2)
• Step 2 ("2. Read Stored Record") will automatically load your confirmed on-chain record from RPC.
• Click the "Copy URL" button next to "Transaction:" (or click the link to open scan.botchain.ai/tx/0x...).
• Save that full BOTScan transaction URL!

5) Verify Data Integrity (Step 3)
• Confirm Step 3 shows your submitted JSON payload, then click "Verify On-Chain (verifyDatasetHash)".
• You should see green: MATCH [ON-CHAIN SMART CONTRACT VERIFIED].
• (Optional tamper check) Click "Simulate Tampered Reading" -> "Verify On-Chain (verifyDatasetHash)" -> it turns red: MISMATCH [PAYLOAD ALTERED].

6) What to Send Back to DatumX
For each registration transaction, please reply with:
1. Wallet address used
2. Dataset Identifier string (e.g. BOT-REVIEW-W1-001)
3. Full BOTScan transaction URL (https://scan.botchain.ai/tx/0x...)
4. Screenshot of Step 2 ("CONFIRMED ON-CHAIN (RPC READBACK)") & Step 3 ("MATCH") if available
```

---

## Official BOT Chain Mainnet Parameters

| Parameter | Value |
| :--- | :--- |
| **Network Name** | BOT Chain Mainnet |
| **RPC URL** | `https://rpc.botchain.ai` |
| **Chain ID** | `677` (`0x2a5`) |
| **Currency Symbol** | `BOT` |
| **Block Explorer URL** | `https://scan.botchain.ai` |
| **Registry Contract Address** | `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` |

---

## Authorized Partner Wallets & Recommended Distribution

- **Wallet 1 (`0xF226C920957BD4B648EaF1A8d1f859057Ec605a4`)**: Pre-funded (`0.03037 BOT`), suggest 2 unique registrations (e.g., `BOT-REVIEW-W1-001`, `BOT-REVIEW-W1-002`).
- **Wallet 2 (`0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2`)**: Pre-funded (`0.03251 BOT`), suggest 1–2 unique registrations (e.g., `BOT-REVIEW-W2-001`, `BOT-REVIEW-W2-002`).
- **DatumX Owner Wallet (`0x31A826bB9D5F6087d94CDA31945C1234d061b788`)**: Already holds 2 verified registrations on-chain, bringing the combined total to **5+ genuine `registerDataset` transactions across 3 independent wallets**.

---

## Common Errors & Troubleshooting

| Error Message | Cause | Fix |
| :--- | :--- | :--- |
| `Dataset ID "..." is already registered on-chain` | Someone already registered that ID (e.g., `BOT-SYNTH-002`). | Click **New Unique ID** or enter a fresh string (e.g. `BOT-REVIEW-W1-001`). |
| `Submitting wallet ... lacks permission to register datasets` | Your address has not been allowlisted by the owner yet, or the wrong MetaMask account is active. | Make sure you selected Wallet 1 or Wallet 2 in MetaMask and confirm allowlist status in the **Owner Allowlist** tab says `AUTHORIZED ON MAINNET`. |
| `Incorrect network: Connected wallet is on chain ID ...` | MetaMask is on Ethereum, XRPL, or Bohr Testnet instead of BOT Chain Mainnet. | Click **Switch to BOT Chain Mainnet (677)** and approve the network switch in MetaMask. |
| `Insufficient gas funds on BOT Chain Mainnet` | Wallet holds under `0.0005 BOT`. | Check you selected the funded Wallet 1 / Wallet 2 account (`~0.03 BOT` each). |
| `Invalid JSON syntax in raw dataset payload` | Missing comma or quote after editing the JSON box. | Verify valid JSON formatting (all keys double-quoted, no trailing commas) and click **Canonicalize & Hash**. |
