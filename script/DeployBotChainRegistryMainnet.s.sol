// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {BotChainDatasetRegistry} from "../contracts/botchain/BotChainDatasetRegistry.sol";

/**
 * @title DeployBotChainRegistryMainnet
 * @notice Isolated, high-assurance deployment script for the DatumX × BOT Chain Mainnet registry.
 * @dev Enforces strict Chain ID 677 validation, explicit human authorization flags,
 *      and public registration strictly disabled (owner-controlled submitters only).
 *      Contains ZERO references to testnet addresses or fallback to XRPL.
 */
contract DeployBotChainRegistryMainnet is Script {
    error InvalidMainnetChain();
    error DeploymentNotAuthorized();
    error MissingDeployerKey();

    function run() external returns (address registryAddress) {
        uint256 chainId = block.chainid;
        bool isAuthorized = vm.envOr("BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED", false);
        string memory rawKey = vm.envOr("BOTCHAIN_MAINNET_PRIVATE_KEY", string(""));
        uint256 deployerPrivateKey = 0;
        if (bytes(rawKey).length > 0) {
            if (bytes(rawKey).length == 64) {
                deployerPrivateKey = vm.parseUint(string.concat("0x", rawKey));
            } else {
                deployerPrivateKey = vm.parseUint(rawKey);
            }
        }

        return deploy(chainId, isAuthorized, deployerPrivateKey);
    }

    function deploy(
        uint256 chainId,
        bool isAuthorized,
        uint256 deployerPrivateKey
    ) public returns (address registryAddress) {
        console2.log("Evaluating Mainnet deployment for Chain ID:", chainId);

        // Security check 1: Strictly enforce BOT Mainnet Chain ID 677
        // Hard revert on testnet (968), XRPL (1449000), Anvil (31337), Ethereum Mainnet (1)
        if (chainId != 677) {
            revert InvalidMainnetChain();
        }

        // Security check 2: Never broadcast without explicit human authorization
        if (!isAuthorized) {
            revert DeploymentNotAuthorized();
        }

        // Security check 3: Require explicitly supplied private key (no default or hardcoded keys)
        if (deployerPrivateKey == 0) {
            revert MissingDeployerKey();
        }

        vm.startBroadcast(deployerPrivateKey);

        // Deploy registry with public registration strictly disabled for restricted pilot
        BotChainDatasetRegistry registry = new BotChainDatasetRegistry(false);
        registryAddress = address(registry);

        vm.stopBroadcast();

        console2.log("BotChainDatasetRegistry deployed to BOT Mainnet at:", registryAddress);
        console2.log("Owner Address:", registry.owner());
        console2.log("Public Registration Enabled:", registry.publicRegistrationEnabled());
    }
}
