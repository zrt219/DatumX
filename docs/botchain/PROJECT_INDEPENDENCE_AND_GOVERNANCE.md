# DatumX × BOT Chain: Project Independence & Governance Architecture

**Document Version**: 1.0.0  
**Effective Date**: November 5, 2026  
**Audience**: Leon, Roy, and Josh (BOT Chain Core Leadership) & DatumX / ZRT Protocol Governance  
**Classification**: Public Architecture Specification  

---

## 1. Executive Summary

This document establishes the official governance model, access controls, key custody, and architectural independence of **DatumX** on **BOT Chain Mainnet (Chain ID 677)**. 

To satisfy enterprise data-integrity standards, ensure regulatory compliance, and fulfill partner KPI milestones for Leon, Roy, and Josh, DatumX operates under a zero-compromise multi-chain topology:
1. **Isolated Protocol Deployments**: Complete structural separation between DatumX's canonical industrial lineage architecture on XRPL EVM and its high-throughput dataset registry on BOT Chain Mainnet.
2. **Project-Controlled Key Management**: A dedicated, project-controlled deployment wallet (`0x31A826bB9D5F6087d94CDA31945C1234d061b788`) pre-funded with 1.0 BOT native gas.
3. **Restricted Registration Enforcement**: Mainnet public registration is strictly disabled by default (`publicRegistrationEnabled = false`), restricting dataset write operations to audited, authorized submitters and the contract owner.
4. **Direct $O(1)$ State Verifiability**: Immutable cryptographic proof retrieval (`getDataset` and `verifyDatasetHash`) via state reads (`eth_call`), operating independently of public RPC log restrictions or external indexer downtime.

---

## 2. Multi-Chain Architectural Separation (XRPL EVM vs. BOT Chain)

DatumX purposefully decouples industrial dataset lineage governance from high-speed cryptographic proof anchoring. The networks serve complementary, non-overlapping functions:

```
+--------------------------------------------------------------------------------------------------------+
|                                      DATUMX MULTI-CHAIN ARCHITECTURE                                   |
+--------------------------------------------------------------------------------------------------------+
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
+-------------------------------------------------+                 +------------------------------------+
|             XRPL EVM Testnet                    |                 |         BOT Chain Mainnet          |
|             (Chain ID 1449000)                  |                 |          (Chain ID 677)            |
+-------------------------------------------------+                 +------------------------------------+
| • Industrial Lineage Governance DAG             |                 | • High-Throughput Dataset Registry |
| • Multi-Stage Reviews & Auditor Quorum          |                 | • Canonical Hash Anchoring         |
| • 4 Interlocking Smart Contracts:               |                 | • 1 Self-Contained Smart Contract: |
|   - DatasetGraph.sol                            |                 |   - BotChainDatasetRegistry.sol    |
|   - ProjectRouter.sol                           |                 | • Instant O(1) verifyDatasetHash() |
|   - ValidationModule.sol                        |                 | • Native Gas Token: BOT            |
|   - DrillProofAccess.sol                        |                 | • Public RPC: https://rpc.botchain.ai|
| • Native Gas Token: XRP                         |                 | • Block Explorer: scan.botchain.ai |
| • Deployment: deployments/xrpl-testnet.json     |                 | • Deployment: deployments/botchain-mainnet.json|
+-------------------------------------------------+                 +------------------------------------+
```

### Architectural Safeguards Against Cross-Chain Leakage:
1. **Isolated Smart Contract Bytecode**: Contracts deployed on BOT Chain share zero dependencies, inheritance, or proxy targets with XRPL EVM contracts.
2. **Distinct Deployment Manifests**: `deployments/xrpl-testnet.json` remains immutable and strictly dedicated to Chain ID `1449000`. BOT Chain Mainnet maintains `deployments/botchain-mainnet.json` (Chain ID `677`).
3. **Dedicated RPC Transports**: The client interface switches transports dynamically between `https://rpc.testnet.xrplevm.org` and `https://rpc.botchain.ai`, preventing RPC endpoint collision or cross-network transaction broadcast.
4. **Independent Lineage & State**: Dataset IDs and state proofs on BOT Chain are self-verifying using canonical SHA-256 digests and do not require prior state existence on XRPL.

---

## 3. Deployment Signer & Wallet Governance

All on-chain deployment and governance actions on BOT Chain Mainnet originate from an authorized, project-controlled signer account.

### Wallet Profile:
- **Signer Public Address**: `0x31A826bB9D5F6087d94CDA31945C1234d061b788`
- **Network**: BOT Chain Mainnet (Chain ID `677` / Hex `0x2a5`)
- **Native Gas Balance**: `1.0 BOT` (`1,000,000,000,000,000,000` wei)
- **Funding Transaction Hash**: [`0xb989a24ecb5491c6f023fdd7a3ede1365749720d2566f135387d8d3fdc859ea9`](https://scan.botchain.ai/tx/0xb989a24ecb5491c6f023fdd7a3ede1365749720d2566f135387d8d3fdc859ea9)
- **Funding Block Number**: `29094261` (`0x1bbf175`)
- **Signer Nonce Status**: `0` (Zero prior outgoing transactions; completely clean state)
- **Deterministic Predicted Contract Address (Nonce 0)**: `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`

### Custodial Security Rules:
1. **Zero Secret Key Exposure**: Private keys and seed phrases are never stored in git repositories, continuous integration pipelines, build artifacts, or client-side bundles.
2. **Explicit Human Authorization Gate**: Deployment scripts (`DeployBotChainRegistryMainnet.s.sol`) contain fail-closed assertions requiring `BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED=true` and explicit manual command execution. AI coding assistants and automation workflows are strictly prohibited from broadcasting mainnet transactions without written human confirmation.
3. **Future Multi-Sig Migration**: Post-launch governance roadmaps transfer contract ownership from the single deployer EOA to a multi-signature safe (e.g. 3-of-5 threshold) composed of DatumX and BOT Chain core stakeholders.

---

## 4. Contract Access Control & Permission Architecture

The `BotChainDatasetRegistry` contract enforces a rigorous two-tier security model:

```solidity
// Core Permission Check in BotChainDatasetRegistry.sol
function canRegister(address account) public view returns (bool) {
    if (publicRegistrationEnabled) {
        return true;
    }
    return account == owner || authorizedSubmitters[account];
}
```

### Access Control Matrix:

| Role / Actor | Read Dataset (`getDataset`) | Verify Hash (`verifyDatasetHash`) | Register Dataset (`registerDataset`) | Set Public Reg (`setPublicRegistration`) | Authorize Submitter (`setAuthorizedSubmitter`) | Transfer Ownership (`transferOwnership`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public / Any EOA** | Allowed ($O(1)$) | Allowed ($O(1)$) | Denied (Reverts with `Unauthorized`) | Denied (`OnlyOwner`) | Denied (`OnlyOwner`) | Denied (`OnlyOwner`) |
| **Authorized Submitter** | Allowed | Allowed | Allowed | Denied | Denied | Denied |
| **Contract Owner** (`0x31A8...b788`) | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |

### Restricted Registration Rationale:
- **Spam Prevention**: Open public registration on mainnet risks pollution of the dataset registry with junk hashes, advertising, or denial-of-state attacks.
- **Data Quality Assurance**: Only verified dataset pipelines, automated sensor ingest daemons, or authorized partner applications can record canonical benchmarks.
- **Enterprise SLA**: Restricting write access guarantees institutional reviewers that records in `BotChainDatasetRegistry` originate from audited DatumX workflows.

---

## 5. Mainnet Gas Economics & Resource Allocation

| Metric | Measured Value | Verification Method |
| :--- | :--- | :--- |
| **Contract Creation Gas** | `728,572 gas` | Foundry simulation (`DeployBotChainRegistryMainnet.s.sol`) |
| **Mainnet Gas Price** | `20.0 gwei` (`20,000,000,000 wei`) | Live RPC `eth_gasPrice` query |
| **Contract Deployment Cost** | `0.01457144 BOT` | $728,572 \times 20 \times 10^{-9}$ |
| **Available Wallet Balance** | `1.00000000 BOT` | Live RPC `eth_getBalance` query |
| **Deployment Coverage Ratio** | **68.62x** surplus | $1.0 / 0.01457144$ |
| **Dataset Registration Gas** | $\approx 115,000 - 135,000\text{ gas}$ | On-chain historical testnet calibration |
| **Registration Cost per Dataset**| $\approx 0.0023 - 0.0027\text{ BOT}$ | $125,000 \times 20 \text{ gwei}$ |
| **Subsequent Registrations Funded** | **$> 360$ datasets** | After initial deployment |

---

## 6. Audit & Compliance Signoff

- [x] Multi-chain separation verified: XRPL EVM Testnet (1449000) completely intact.
- [x] Signer funded with 1.0 BOT: Transaction `0xb989a24ecb5491c6f023fdd7a3ede1365749720d2566f135387d8d3fdc859ea9`.
- [x] Nonce zero verified via RPC: No previous transactions sent from deployer wallet.
- [x] Restricted registration invariant verified: Foundry tests confirm `publicRegistrationEnabled = false` is immutable upon deployment.
- [x] Authorization gate armed: Deployment script fails closed without explicit human command.
