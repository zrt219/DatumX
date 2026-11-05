# DatumX × BOT Chain: Phase 3 Mainnet Broadcast Authorization Gate

**Document Version**: 2.0.0  
**Effective Date**: November 5, 2026  
**Audience**: DatumX Engineering Lead, ZRT Protocol Authority, Leon & BOT Chain Core  
**Gate Status**: **BROADCAST EXECUTED & CONFIRMED LIVE ON MAINNET (CHAIN ID 677)**  

---

## 1. Safety Guardrail & Execution Record

> [!NOTE]
> **Mainnet Deployment Complete**:  
> In accordance with project instructions and following explicit human authorization (`"Approved to deploy to BOT Chain Mainnet"`), the `BotChainDatasetRegistry` contract was successfully broadcast and confirmed on BOT Chain Mainnet.
>
> - **Deployment Tx**: [`0x717bcc1a6a5eab9d02e124f43332aab89cf6393d4f6f3a0314d370d16d81630b`](https://scan.botchain.ai/tx/0x717bcc1a6a5eab9d02e124f43332aab89cf6393d4f6f3a0314d370d16d81630b)
> - **Inclusion Block**: `29237813`
> - **Contract Address**: [`0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`](https://scan.botchain.ai/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7)
> - **Benchmark Registration Tx**: [`0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59`](https://scan.botchain.ai/tx/0xee9afc89570a2f0f26d6e55b31da1d58de10cdb5f0ba4149453b460e4a896f59) (Block `29237966`)
> - **Post-Deployment Balance**: `0.97993404 BOT` (Verified)

---

## 2. On-Chain Pre-Flight Verification Audit

Every parameter required for a flawless smart contract deployment has been verified via live JSON-RPC calls to `https://rpc.botchain.ai`:

| Parameter | Required Value | Verified On-Chain State | Status |
| :--- | :--- | :--- | :---: |
| **Target Network** | BOT Chain Mainnet | Chain ID `677` (`0x2a5`) | **PASS** |
| **JSON-RPC Endpoint** | `https://rpc.botchain.ai` | Responding (Block `29094261+`) | **PASS** |
| **Block Explorer** | `https://scan.botchain.ai` | Active & Indexed | **PASS** |
| **Signer Account** | `0x31A826bB9D5F6087d94CDA31945C1234d061b788` | Valid EOA | **PASS** |
| **Signer Balance** | $\ge 0.05\text{ BOT}$ | **`1.000000000000000000 BOT`** | **PASS** |
| **Funding Tx Hash** | Provenance anchor | [`0xb989a24ecb5491c6f023fdd7a3ede1365749720d2566f135387d8d3fdc859ea9`](https://scan.botchain.ai/tx/0xb989a24ecb5491c6f023fdd7a3ede1365749720d2566f135387d8d3fdc859ea9) | **PASS** |
| **Signer Nonce** | Expected `0` | **`0`** (Clean slate) | **PASS** |
| **Gas Price** | Fixed / Dynamic base | `20.0 gwei` (`20,000,000,000 wei`) | **PASS** |
| **Execution Gas Units** | Estimated $\le 850,000$ | **`728,572 gas`** (Foundry simulated run) | **PASS** |
| **Total Deployment Cost** | Measured BOT | **`0.01457144 BOT`** (Only 1.46% of balance) | **PASS** |
| **Predicted Contract Address** | Nonce 0 deterministic address | **`0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7`** | **PASS** |
| **Address State Before Deploy** | Unallocated bytecode | Code = `0x` (No collision) | **PASS** |

---

## 3. Deployment Script & Hardened Invariants

The deployment script [`script/DeployBotChainRegistryMainnet.s.sol`](file:///d:/programming/Blockchain%20development/DatumX/script/DeployBotChainRegistryMainnet.s.sol) enforces four (4) non-negotiable security layers:

```solidity
// Layer 1: Strict Chain ID Enforcement
if (block.chainid != 677) {
    revert UnsupportedChainId(block.chainid);
}

// Layer 2: Explicit Human Authorization Gate
bool authorized = vm.envOr("BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED", false);
if (!authorized) {
    revert DeploymentNotAuthorized();
}

// Layer 3: Mandatory Signing Key Assertion
uint256 deployerPrivateKey = vm.envOr("BOTCHAIN_MAINNET_PRIVATE_KEY", uint256(0));
if (deployerPrivateKey == 0) {
    revert MissingDeployerKey();
}

// Layer 4: Hardened Public Registration Prohibition
BotChainDatasetRegistry registry = new BotChainDatasetRegistry(false);
```

10 comprehensive Foundry tests in [`test/DeployBotChainRegistryMainnet.t.sol`](file:///d:/programming/Blockchain%20development/DatumX/test/DeployBotChainRegistryMainnet.t.sol) guarantee that:
- Any attempt to deploy to Anvil (`31337`), Ethereum (`1`), Bohr Testnet (`968`), or XRPL (`1449000`) hard-reverts immediately.
- Execution without `BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED=true` reverts immediately.
- Execution without a configured private key reverts immediately.
- Any attempt to pass public registration flags is ignored—`publicRegistrationEnabled` is hardcoded to `false`.

---

## 4. Execution Procedure (When Authorized by User)

When the project lead or repository owner provides explicit authorization to execute the mainnet broadcast, the following single command is executed:

```powershell
$env:BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED="true"
$env:BOTCHAIN_MAINNET_PRIVATE_KEY="<AUTHORIZED_KEY_PROVIDED_BY_USER>"

forge script script/DeployBotChainRegistryMainnet.s.sol:DeployBotChainRegistryMainnet `
  --rpc-url https://rpc.botchain.ai `
  --broadcast `
  --slow `
  -vvvv
```

### Post-Broadcast Actions (Immediate Automated Next Steps):
1. Capture transaction receipt and deployment block from broadcast log.
2. Confirm bytecode deployment at `0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` via `eth_getCode`.
3. Update `deployments/botchain-mainnet.json` with contract address, block number, and deployer address.
4. Set `VITE_BOTCHAIN_MAINNET_REGISTRY_ADDRESS=0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7` in production environment.
5. Trigger Vercel production deployment and verify live browser UI.
6. Execute live canonical benchmark registration (`BOT-SYNTH-002`) and capture on-chain MATCH / MISMATCH proofs.
7. Publish the pre-drafted official launch thread on X (Twitter).
