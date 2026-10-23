# DatumX × BOT Chain: Code Reuse, Security & Ownership Audit

**Document Version**: 1.0.0  
**Date**: October 23, 2026  
**Audience**: DatumX Engineering, ZRT Legal & Technical Leadership, Leon & BOT Chain Reviewers  

---

## 1. Codebase Ownership & Licensing Status

- **Repository**: `https://github.com/zrt219/DatumX`
- **Primary Owner / Author**: ZRT (`zrt219`)
- **Repository License**: Not conclusively established. The README advertises MIT and selected Solidity files carry MIT SPDX headers, but a root `LICENSE` file was not found on this branch. Do not infer that every source or asset is MIT-licensed.
- **Branch Scope**: All BOT Chain pilot code is strictly isolated on branch `feature/botchain-registry-pilot`.

---

## 2. Permitted Code Reuse vs. Excluded Proprietary Assets

| Category | Assets / Components | Status / Permissions | Policy |
|---|---|---|---|
| **Permitted for Pilot** | `BotChainDatasetRegistry.sol`, deployment scripts, general EVM utility libraries, canonical SHA-256 encoding | **Review pending** | Public inspection is available; reuse beyond applicable existing licenses needs a definitive ownership and licensing review. |
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

A prior report asserted the following; this audit did not independently execute a complete secret scan:
- **Zero Committed Private Keys**: No `.env` files with private keys or mnemonics are tracked by Git.
- **RPC Endpoints**: Only public JSON-RPC URLs (`https://rpc.bohr.life`, `https://rpc.testnet.xrplevm.org/`) are referenced.
- **Contract Access**: The `BotChainDatasetRegistry` contract contains clear owner access modifiers preventing unauthorized parameter tampering.
- **Fail-Safe Operation**: New frontend client has network, account, contract-bytecode and successful-receipt guards. These changes require completed CI and a separately authorized real testnet proof before launch.

---

## 5. Items Requiring Formal Agreement with BOT Chain

Prior to any production mainnet release or commercial partnership:
1. **IP & Brand Co-marketing**: Formal terms for DatumX × BOT Chain public announcements.
2. **Grant / Ecosystem Terms**: Formal documentation under the BOT Chain Ecosystem Support Program.
3. **Smart Contract Audit**: Formal third-party security audit of final smart contracts prior to Mainnet deployment.


## Audit limitation

The repository is public, but that does not resolve ownership or licensing of third-party source material, screenshots, client names, industrial dataset examples or branding. No license changes or grants have been made in this pilot audit. Obtain necessary permissions before external reuse or licensing statements.
