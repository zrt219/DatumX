# DatumX × BOT Chain: Code Reuse, Security & Ownership Audit

**Document Version**: 1.0.0  
**Date**: October 23, 2026  
**Audience**: DatumX Engineering, ZRT Legal & Technical Leadership, Leon & BOT Chain Reviewers  

---

## 1. Codebase Ownership & Licensing Status

- **Repository**: `https://github.com/zrt219/DatumX`
- **Primary Owner / Author**: ZRT (`zrt219`)
- **Repository License**: MIT License (Copyright (c) 2026 ZRT).
- **Branch Scope**: All BOT Chain pilot code is strictly isolated on branch `feature/botchain-registry-pilot`.

---

## 2. Permitted Code Reuse vs. Excluded Proprietary Assets

| Category | Assets / Components | Status / Permissions | Policy |
|---|---|---|---|
| **Permitted for Pilot** | `BotChainDatasetRegistry.sol`, deployment scripts, general EVM utility libraries, canonical SHA-256 encoding | **Open / MIT** | Free to use, inspect, test, and adapt for BOT Chain integration. |
| **DatumX Protocol Core** | `DatasetGraph.sol`, `ProjectRouter.sol`, `ValidationModule.sol`, `DrillProofAccess.sol` | **ZRT Proprietary Architecture (MIT Core)** | Architecture preserved for XRPL EVM; independent of BOT Chain pilot. |
| **Excluded Client Material** | "Noble Plains Uranium" project references, borehole log extractions, commercial mining drill patterns | **EXCLUDED** | Proprietary demonstration context. The BOT Chain pilot uses **strictly synthetic public benchmarks**. |
| **Branding & Assets** | DatumX logos, UI trademarks, media recordings | **ZRT Proprietary** | Retained by ZRT; not assigned or licensed to external parties without agreement. |

---

## 3. Synthetic Benchmark Dataset Policy

To guarantee zero exposure of proprietary client exploration data or confidential drill telemetry:
1. The BOT Chain pilot registers **only synthetic records**.
2. Example synthetic schema:
   ```json
   {
     "benchmarkId": "BOT-SYNTH-BENCHMARK-001",
     "datasetName": "Synthetic Clean Energy Sensor Grid 2026",
     "records": 1000,
     "generator": "DatumX Synthetic Benchmark Engine v1.0",
     "timestamp": 1792732800
   }
   ```
3. No internal client records, geological survey shapefiles, or unreleased research documents are contained within this branch.

---

## 4. Security & Credential Hygiene Guarantee

A security scan of the `feature/botchain-registry-pilot` working tree confirms:
- **Zero Committed Private Keys**: No `.env` files with private keys or mnemonics are tracked by Git.
- **RPC Endpoints**: Only public JSON-RPC URLs (`https://rpc.bohr.life`, `https://rpc.testnet.xrplevm.org/`) are referenced.
- **Contract Access**: The `BotChainDatasetRegistry` contract contains clear owner access modifiers preventing unauthorized parameter tampering.
- **Fail-Safe Operation**: The frontend requires direct user wallet signature approval (MetaMask/Injected) and does not store or proxy private keys.

---

## 5. Items Requiring Formal Agreement with BOT Chain

Prior to any production mainnet release or commercial partnership:
1. **IP & Brand Co-marketing**: Formal terms for DatumX × BOT Chain public announcements.
2. **Grant / Ecosystem Terms**: Formal documentation under the BOT Chain Ecosystem Support Program.
3. **Smart Contract Audit**: Formal third-party security audit of final smart contracts prior to Mainnet deployment.
