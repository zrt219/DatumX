# BOT Chain Integration Research & Network Architecture

**Document Version**: 1.0.0  
**Date**: October 23, 2026  
**Audience**: DatumX Engineering, Leon, Roy, and Josh (BOT Chain)  

---

## 1. Executive Summary

This research document records the technical integration parameters for connecting **DatumX** with **BOT Chain (Bohr)**. DatumX is an industrial release-governance and lineage protocol originally deployed on XRPL EVM Testnet (Chain ID `1449000`).

To prepare for Friday's technical review with the BOT Chain core team, DatumX is providing an isolated, lightweight dataset registry pilot on BOT / Bohr Testnet (`968`), ensuring complete independence from the existing XRPL deployment.

---

## 2. Official Reference Sources

| Resource | URL / Location | Purpose |
|---|---|---|
| BOT Chain Portal | https://www.botchain.ai/ | Ecosystem overview & roadmap |
| Ecosystem Support | https://www.botchain.ai/en/ecosystem-support/ | Developer and partner ecosystem grant program |
| Developer Quick Guide | https://dev-docs.botchain.ai/docs/Developers/quick-guide/ | Official RPC, faucet, EVM guidelines |
| GitHub Organization | https://github.com/BOTChain-bot | Official SDKs, sample contracts, and templates |
| Integration Guide (Internal) | BOT Chain Project Integration Guide | Architecture notes from Leon / Roy |

---

## 3. Network Configuration Matrix

| Parameter | XRPL EVM Testnet (Preserved) | BOT / Bohr Testnet (Pilot Target) | BOT Chain Mainnet (Reference Only) |
|---|---|---|---|
| **Network Role** | Primary Production Demo | Isolated Minimum Pilot | Future Target (Out of Scope for Friday) |
| **Chain ID** | `1449000` (`0x161b28`) | `968` (`0x3c8`) | `677` (`0x2a5`) |
| **RPC Endpoint** | `https://rpc.testnet.xrplevm.org/` | `https://rpc.bohr.life` | `https://rpc.botchain.ai` |
| **Block Explorer** | `https://explorer.testnet.xrplevm.org` | `https://scan.bohr.life` | `https://scan.botchain.ai` |
| **Native Gas Asset** | `XRP` (18 decimals) | `Test BOT` / `BOT` (18 decimals) | `BOT` (18 decimals) |
| **EVM Version** | Shanghai / Cancun compatible | EVM compatible (Solidity `^0.8.20`–`^0.8.24`) | EVM compatible |
| **Live RPC Status** | Verified | **Verified** (`eth_chainId` -> `0x3c8` / `968`, block >27.8M) | **Verified** (`eth_chainId` -> `0x2a5` / `677`) |

> **Important**: BOT Chain Mainnet (`677`) is strictly documented for reference. No deployment or automated transaction flows target Mainnet.

---

## 4. Technical Dependencies & Pilot Scope

The minimum pilot requested by Leon focuses on **Register → Read → Verify**:

```
[Synthetic Dataset Payload] 
       │
       ▼
 [Canonical Canonicalizer] ───> Compute SHA-256 (32 bytes)
       │
       ▼
 [BotChainDatasetRegistry] ───> Store (datasetId, datasetHash, version, metadataURI, submitter, timestamp)
       │
       ▼
   [Readback] ───> Retrieve on-chain record & check: Recalculated Hash == Stored Hash
```

### Key Technical Guardrails:
1. **Zero Storage of Raw Data On-Chain**: Only cryptographic hashes (`bytes32`), identifiers, version strings, and metadata URIs are committed to state.
2. **Canonical Hash Format**: Inputs are serialized into a strict JSON canonical structure before computing `SHA-256`.
3. **No Cross-Chain Leakage**: Contracts, deployment manifests, and provider state on BOT Chain testnet are completely segregated from XRPL EVM contracts.

---

## 5. Identified Technical Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| RPC rate limiting or timeouts on `rpc.bohr.life` | Deployment script or readback failure | Implement client-side retry logic and clear UI error indicators. |
| Test BOT faucet unavailability | Unable to execute live on-chain deployment before Friday | Provide complete Foundry test suite + pre-compiled deployment artifact and dry-run script. |
| Explorer indexing delay on `scan.bohr.life` | Transaction not immediately visible in web explorer | UI confirms transaction receipt directly via JSON-RPC block confirmation before linking explorer. |
| Accidental wallet submission to wrong chain | Failed transactions or lost gas | Strict EIP-1193 network detection (`chainId === 968`), blocking submit button if chain mismatch is detected. |

---

## 6. Questions for Roy and Josh (BOT Chain Engineering)

1. **Environment Confirmation**: Is `https://rpc.bohr.life` (Chain ID `968`) the designated staging environment for ecosystem pilot integrations?
2. **Faucet & Test Gas**: Is there an official faucet or developer dispensary for `Test BOT` on Bohr Testnet for integration CI/CD?
3. **Contract Verification**: Does `scan.bohr.life` support standard Foundry Blockscout / Etherscan API verification, or is verification managed via Sourcify / UI upload?
4. **Permissions Architecture**: For enterprise dataset registration, does BOT Chain recommend an owner-only registry pattern or a decentralized validator role model like DatumX's XRPL V5 architecture?
5. **Node Reliability**: Are there backup/secondary RPC nodes recommended for production pilots on Bohr Testnet?
