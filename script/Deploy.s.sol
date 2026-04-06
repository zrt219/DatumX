// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console2} from "forge-std/console2.sol";
import {Script} from "forge-std/Script.sol";
import {DrillProofAccess} from "../contracts/core/DrillProofAccess.sol";
import {ProjectRegistry} from "../contracts/core/ProjectRegistry.sol";
import {DatasetRegistry} from "../contracts/core/DatasetRegistry.sol";
import {ValidationModule} from "../contracts/core/ValidationModule.sol";
import {ProjectRouter} from "../contracts/core/ProjectRouter.sol";
import {DuckCreekAdapter} from "../contracts/adapters/DuckCreekAdapter.sol";
import {ShirleyCentralAdapter} from "../contracts/adapters/ShirleyCentralAdapter.sol";
import {ShirleyEastAdapter} from "../contracts/adapters/ShirleyEastAdapter.sol";
import {IDrillProofTypes} from "../contracts/interfaces/IDrillProofTypes.sol";
import {ProjectKeys} from "../contracts/libraries/ProjectKeys.sol";

contract DeployScript is Script {
    struct DeploymentResult {
        address admin;
        address projectAdmin;
        address auditor;
        address pauser;
        DrillProofAccess accessController;
        ProjectRegistry projectRegistry;
        DatasetRegistry datasetRegistry;
        ValidationModule validationModule;
        ProjectRouter router;
        DuckCreekAdapter duckCreekAdapter;
        ShirleyCentralAdapter shirleyCentralAdapter;
        ShirleyEastAdapter shirleyEastAdapter;
    }

    function run() external {
        string memory rpcUrl = vm.envString("RPC_URL");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        address projectAdmin = vm.envOr("PROJECT_ADMIN_ADDRESS", admin);
        address auditor = vm.envOr("AUDITOR_ADDRESS", admin);
        address pauser = vm.envOr("PAUSER_ADDRESS", admin);
        address validator = vm.envOr("VALIDATOR_ADDRESS", admin);
        address validatorOne = vm.envOr("VALIDATOR_ADDRESS_1", address(0));
        address validatorTwo = vm.envOr("VALIDATOR_ADDRESS_2", address(0));
        address validatorThree = vm.envOr("VALIDATOR_ADDRESS_3", address(0));
        IDrillProofTypes.ValidationThresholds memory thresholds = IDrillProofTypes.ValidationThresholds({
            minValidatorCount: uint16(vm.envOr("MIN_VALIDATOR_COUNT", uint256(3))),
            minApprovalRatioBps: uint16(vm.envOr("MIN_APPROVAL_RATIO_BPS", uint256(6667))),
            minConfidenceBps: uint16(vm.envOr("MIN_CONFIDENCE_BPS", uint256(7000)))
        });

        vm.startBroadcast(deployerPrivateKey);

        DeploymentResult memory deployment;
        deployment.admin = admin;
        deployment.projectAdmin = projectAdmin;
        deployment.auditor = auditor;
        deployment.pauser = pauser;

        deployment.accessController = new DrillProofAccess(admin);
        deployment.projectRegistry = new ProjectRegistry(address(deployment.accessController));
        deployment.datasetRegistry =
            new DatasetRegistry(address(deployment.accessController), address(deployment.projectRegistry));
        deployment.validationModule = new ValidationModule(
            address(deployment.accessController), address(deployment.datasetRegistry), thresholds
        );
        deployment.router =
            new ProjectRouter(address(deployment.accessController), address(deployment.projectRegistry), address(deployment.datasetRegistry));

        deployment.duckCreekAdapter = new DuckCreekAdapter();
        deployment.shirleyCentralAdapter = new ShirleyCentralAdapter();
        deployment.shirleyEastAdapter = new ShirleyEastAdapter();

        _grantOptionalRole(deployment.accessController.PROJECT_ADMIN_ROLE(), admin, projectAdmin, deployment.accessController);
        _grantOptionalRole(deployment.accessController.VALIDATOR_ROLE(), admin, validator, deployment.accessController);
        _grantOptionalRole(deployment.accessController.VALIDATOR_ROLE(), admin, validatorOne, deployment.accessController);
        _grantOptionalRole(deployment.accessController.VALIDATOR_ROLE(), admin, validatorTwo, deployment.accessController);
        _grantOptionalRole(deployment.accessController.VALIDATOR_ROLE(), admin, validatorThree, deployment.accessController);
        _grantOptionalRole(deployment.accessController.AUDITOR_ROLE(), admin, auditor, deployment.accessController);
        _grantOptionalRole(deployment.accessController.PAUSER_ROLE(), admin, pauser, deployment.accessController);

        deployment.datasetRegistry.setRouter(address(deployment.router));
        deployment.datasetRegistry.setValidationModule(address(deployment.validationModule));

        deployment.projectRegistry.registerProject(
            ProjectKeys.DUCK_CREEK,
            IDrillProofTypes.ProjectMetadata({
                name: "Duck Creek",
                basin: "Williston",
                commodity: "Uranium",
                depositType: "Sandstone-hosted",
                jurisdiction: "United States",
                active: true,
                adapter: address(deployment.duckCreekAdapter)
            })
        );

        deployment.projectRegistry.registerProject(
            ProjectKeys.SHIRLEY_CENTRAL,
            IDrillProofTypes.ProjectMetadata({
                name: "Shirley Central",
                basin: "Powder River Basin",
                commodity: "Uranium",
                depositType: "Roll-front ISR",
                jurisdiction: "United States",
                active: true,
                adapter: address(deployment.shirleyCentralAdapter)
            })
        );

        deployment.projectRegistry.registerProject(
            ProjectKeys.SHIRLEY_EAST,
            IDrillProofTypes.ProjectMetadata({
                name: "Shirley East",
                basin: "Powder River Basin",
                commodity: "Uranium",
                depositType: "Roll-front ISR",
                jurisdiction: "United States",
                active: true,
                adapter: address(deployment.shirleyEastAdapter)
            })
        );

        vm.stopBroadcast();

        console2.log("RPC URL", rpcUrl);
        console2.log("Chain ID", block.chainid);
        console2.log("Admin", deployment.admin);
        console2.log("Project Admin", deployment.projectAdmin);
        console2.log("Validator", validator);
        console2.log("Validator 1", validatorOne);
        console2.log("Validator 2", validatorTwo);
        console2.log("Validator 3", validatorThree);
        console2.log("Auditor", deployment.auditor);
        console2.log("Pauser", deployment.pauser);
        console2.log("Threshold minValidatorCount", thresholds.minValidatorCount);
        console2.log("Threshold minApprovalRatioBps", thresholds.minApprovalRatioBps);
        console2.log("Threshold minConfidenceBps", thresholds.minConfidenceBps);
        console2.log("DrillProofAccess", address(deployment.accessController));
        console2.log("ProjectRegistry", address(deployment.projectRegistry));
        console2.log("DatasetRegistry", address(deployment.datasetRegistry));
        console2.log("ValidationModule", address(deployment.validationModule));
        console2.log("ProjectRouter", address(deployment.router));
        console2.log("DuckCreekAdapter", address(deployment.duckCreekAdapter));
        console2.log("ShirleyCentralAdapter", address(deployment.shirleyCentralAdapter));
        console2.log("ShirleyEastAdapter", address(deployment.shirleyEastAdapter));
    }

    function _grantOptionalRole(bytes32 role, address admin, address assignee, DrillProofAccess accessController) internal {
        if (assignee == admin || assignee == address(0)) return;
        accessController.grantRole(role, assignee);
    }
}
