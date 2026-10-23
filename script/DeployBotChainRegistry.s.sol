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
    error InvalidTargetChain(uint256 chainId);
    error MissingDeployerKey();
    function run() external returns (address registryAddress) {
        uint256 chainId = block.chainid;
        console2.log("Deploying BotChainDatasetRegistry on Chain ID:", chainId);

        // Security check: Guard against accidental deployment to unintended networks
        if (chainId != 968 && chainId != 31337) {
            revert InvalidTargetChain(chainId);
        }

        uint256 deployerPrivateKey = vm.envOr("BOTCHAIN_PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) revert MissingDeployerKey();

        vm.startBroadcast(deployerPrivateKey);

        // Deploy with public registration enabled for seamless Friday technical walkthrough
        BotChainDatasetRegistry registry = new BotChainDatasetRegistry(false);
        registryAddress = address(registry);

        vm.stopBroadcast();

        console2.log("BotChainDatasetRegistry deployed at:", registryAddress);
        console2.log("Owner:", registry.owner());
        console2.log("Public Registration Enabled:", registry.publicRegistrationEnabled());
    }
}
