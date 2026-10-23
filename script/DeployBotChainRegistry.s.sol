// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {BotChainDatasetRegistry} from "../contracts/botchain/BotChainDatasetRegistry.sol";

/**
 * @title DeployBotChainRegistry
 * @notice Deterministic deployment script for the DatumX × BOT Chain technical pilot registry.
 * @dev Intended for execution on Bohr Testnet (Chain ID 968).
 */
contract DeployBotChainRegistry is Script {
    function run() external returns (address registryAddress) {
        uint256 chainId = block.chainid;
        console2.log("Deploying BotChainDatasetRegistry on Chain ID:", chainId);

        // Security check: Guard against accidental deployment to unintended networks
        if (chainId != 968 && chainId != 31337) {
            console2.log("WARNING: Target chain is not Bohr Testnet (968) or local anvil (31337)!");
        }

        uint256 deployerPrivateKey = vm.envOr(
            "BOTCHAIN_PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80) // Anvil default test key fallback
        );

        vm.startBroadcast(deployerPrivateKey);

        // Deploy with public registration enabled for seamless Friday technical walkthrough
        BotChainDatasetRegistry registry = new BotChainDatasetRegistry(true);
        registryAddress = address(registry);

        vm.stopBroadcast();

        console2.log("BotChainDatasetRegistry deployed at:", registryAddress);
        console2.log("Owner:", registry.owner());
        console2.log("Public Registration Enabled:", registry.publicRegistrationEnabled());
    }
}
