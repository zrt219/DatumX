// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {BotChainDatasetRegistry} from "../contracts/botchain/BotChainDatasetRegistry.sol";

/**
 * @title DeployBotChainRegistry
 * @notice Deterministic deployment script for the DatumX × BOT Chain technical pilot registry.
 * @dev Enforces strict chain validation, explicit authorization, and safe permission defaults.
 */
contract DeployBotChainRegistry is Script {
    error InvalidTargetChain();
    error MainnetDeploymentProhibited();
    error DeploymentNotAuthorized();
    error MissingDeployerKey();

    function run() external returns (address registryAddress) {
        uint256 chainId = block.chainid;
        bool isAuthorized = vm.envOr("BOTCHAIN_DEPLOY_AUTHORIZED", false);
        uint256 deployerPrivateKey = vm.envOr("BOTCHAIN_PRIVATE_KEY", uint256(0));
        bool enablePublic = vm.envOr("BOTCHAIN_ENABLE_PUBLIC_REGISTRATION", false);

        return deploy(chainId, isAuthorized, deployerPrivateKey, enablePublic);
    }

    function deploy(
        uint256 chainId,
        bool isAuthorized,
        uint256 deployerPrivateKey,
        bool enablePublic
    ) public returns (address registryAddress) {
        console2.log("Evaluating deployment for Chain ID:", chainId);

        // Security check 1: Hard revert on mainnet (Chain ID 677)
        if (chainId == 677) {
            revert MainnetDeploymentProhibited();
        }

        // Security check 2: Hard revert on unsupported chains (only Bohr Testnet 968 or Anvil 31337 allowed)
        if (chainId != 968 && chainId != 31337) {
            revert InvalidTargetChain();
        }

        // Security check 3: Never broadcast without explicit authorization
        if (!isAuthorized) {
            revert DeploymentNotAuthorized();
        }

        // Security check 4: Require an explicitly configured signing method (NO public Anvil key fallback)
        if (deployerPrivateKey == 0) {
            revert MissingDeployerKey();
        }

        vm.startBroadcast(deployerPrivateKey);

        BotChainDatasetRegistry registry = new BotChainDatasetRegistry(enablePublic);
        registryAddress = address(registry);

        vm.stopBroadcast();

        console2.log("BotChainDatasetRegistry deployed at:", registryAddress);
        console2.log("Owner:", registry.owner());
        console2.log("Public Registration Enabled:", registry.publicRegistrationEnabled());
    }
}
