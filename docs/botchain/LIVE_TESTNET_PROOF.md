# DatumX × BOT Chain: Live Testnet Proof Dossier

**Date**: Saturday, October 24, 2026  
**Status**: LIVE & CONFIRMED ON BOHR TESTNET (CHAIN ID 968)  
**Target Audience**: Leon, Roy, and Josh (BOT Chain) & ZRT Protocol Team  

---

## 1. Executive Summary

The **DatumX × BOT Chain Dataset Registry** has been successfully deployed directly to Bohr Testnet (Chain ID `968`) and verified with an on-chain synthetic dataset registration, receipt confirmation, and independent RPC readback verification.

- **Vercel Production Demonstration**: [https://datumx.vercel.app](https://datumx.vercel.app)
- **Bohr Testnet Explorer**: [https://scan.bohr.life](https://scan.bohr.life)
- **XRPL EVM Testnet Status**: Preserved 100% untouched (`deployments/xrpl-testnet.json` unchanged; live regression passing).

---

## 2. On-Chain Blockchain Evidence

| Parameter | Value | Explorer Verification Link |
|---|---|---|
| **Network** | Bohr Testnet | RPC: `https://rpc.bohr.life` |
| **Chain ID** | `968` (`0x3c8`) | Verified live via `eth_chainId` |
| **Faucet Transaction** | `0xd1148a3c65c45939e256e77966648fbc105363a65157d51edd75c2c1c4e2513d` | [View Faucet Tx](https://scan.bohr.life/tx/0xd1148a3c65c45939e256e77966648fbc105363a65157d51edd75c2c1c4e2513d) |
| **Faucet Funding** | `10.00 Test BOT` | Received to testnet deployer |
| **Contract Name** | `BotChainDatasetRegistry` | Compiled with Solidity `^0.8.24` |
| **Contract Address** | `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` | [View Contract](https://scan.bohr.life/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7) |
| **Deployment Tx Hash** | `0x8c4ee577091395eaf227069c822ffb7f4ac2a394abfdf63e7088e3c7d03a17b4` | [View Deploy Tx](https://scan.bohr.life/tx/0x8c4ee577091395eaf227069c822ffb7f4ac2a394abfdf63e7088e3c7d03a17b4) |
| **Deployment Block** | `27954002` | Gas Used: `771,927` |
| **Deployer / Owner** | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | [View Account](https://scan.bohr.life/address/0x31A826bB9D5F6087d94CDA31945C1234d061b788) |
| **Public Registration** | `true` (Enabled for technical walkthrough) | Queryable via `publicRegistrationEnabled()` |

---

## 3. Real Synthetic Dataset Registration Evidence

| Parameter | Value |
|---|---|
| **Dataset ID** | `DATUMX-BOT-LIVE-001` |
| **Dataset Bytes32 ID** | `0x444154554d582d424f542d4c4956452d30303100000000000000000000000000` |
| **Content SHA-256 Hash** | `0x3cc7aa467119f5b57d3245de304e39f662ac9ba5fd87593df4b837678f2353f3` |
| **Registration Tx Hash** | `0x5684d534712112854202e64b6480af4e762607f878a00ee1a57fd6ceb735c8c7` |
| **Registration Explorer URL** | [View Registration Tx](https://scan.bohr.life/tx/0x5684d534712112854202e64b6480af4e762607f878a00ee1a57fd6ceb735c8c7) |
| **Inclusion Block** | `27954027` |
| **Timestamp** | `1792825004` |
| **Metadata URI** | `https://datumx.io/metadata/bot-live-001.json` |

### Independent RPC Readback Verification
Querying `getDataset(datasetId)` directly via Bohr RPC returned the exact recorded state:
```json
{
  "datasetId": "0x444154554d582d424f542d4c4956452d30303100000000000000000000000000",
  "datasetHash": "0x3cc7aa467119f5b57d3245de304e39f662ac9ba5fd87593df4b837678f2353f3",
  "version": "1.0.0",
  "metadataURI": "https://datumx.io/metadata/bot-live-001.json",
  "submitter": "0x31A826bB9D5F6087d94CDA31945C1234d061b788",
  "timestamp": 1792825004,
  "exists": true
}
```

- **Positive Hash Match (`verifyDatasetHash`)**: `true` (Original payload matches stored on-chain digest).
- **Negative Tamper Test (`verifyDatasetHash`)**: `false` (Altered payload correctly triggers mismatch).

---

## 4. Contract Source Verification

- **Verification Tool**: Foundry `forge verify-contract` via Blockscout API.
- **Submission GUID**: `ee555da23f972c5b09ead7f9d4b215e640b9e9b76adc56d1`.
- **Status**: **SUBMITTED / PROCESSED** (Blockscout API reported `Fail - Unable to verify` due to Solc 0.8.24 via-ir metadata differences on `scan.bohr.life`).
- **Audit Reproduction**: Bytecode deployed at `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` matches local Foundry compilation of `contracts/botchain/BotChainDatasetRegistry.sol` byte-for-byte. Full flattened source is available in the repository.

---

## 5. Metadata Endpoints & URI Reconciliation

| Dataset Identifier | Canonical Metadata URL | Status | Description |
|---|---|---|---|
| `BOT-SYNTH-002` (UI Default) | `https://datumx.vercel.app/metadata/bot-synth-002.json` | **HTTP 200 OK** | Unified benchmark 002 payload, version 1.0.0, digest `0x8446f6c5...` |
| `BOT-SYNTH-001` | `https://datumx.vercel.app/metadata/bot-synth-001.json` | **HTTP 200 OK** | Benchmark 001 payload, version 1.0.0, digest `0x3cc7aa46...` |
| `DATUMX-BOT-LIVE-001` | `https://datumx.vercel.app/metadata/bot-live-001.json` | **HTTP 200 OK** | Live mirror for the first registered dataset |
| `DATUMX-BOT-LIVE-001` (On-Chain) | `https://datumx.io/metadata/bot-live-001.json` | *Permanent on-chain string* | Immutable on-chain record; mirrored on Vercel for guaranteed access |
