// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BotChainDatasetRegistry} from "../contracts/botchain/BotChainDatasetRegistry.sol";

contract BotChainDatasetRegistryTest is Test {
    BotChainDatasetRegistry public registry;
    address public deployer = address(0xAA1);
    address public submitter = address(0xBB2);
    address public intruder = address(0xCC3);

    bytes32 public testId = keccak256("BOT-SYNTH-DATASET-001");
    bytes32 public testHash = sha256(abi.encodePacked("canonical-sample-payload-content-v1"));
    string public testVersion = "1.0.0";
    string public testMetadataUri = "https://datumx.io/metadata/bot-synth-001.json";

    function setUp() public {
        vm.prank(deployer);
        // Start with public registration enabled for pilot demonstration
        registry = new BotChainDatasetRegistry(true);
    }

    function testOwnerInitialization() public view {
        assertEq(registry.owner(), deployer);
        assertTrue(registry.publicRegistrationEnabled());
        assertEq(registry.totalRecords(), 0);
    }

    function testRegisterDatasetSuccess() public {
        vm.warp(1792732800);
        vm.prank(submitter);
        bool success = registry.registerDataset(testId, testHash, testVersion, testMetadataUri);
        assertTrue(success);

        assertEq(registry.totalRecords(), 1);
        assertEq(registry.getRecordIdAt(0), testId);

        BotChainDatasetRegistry.DatasetRecord memory record = registry.getDataset(testId);
        assertEq(record.datasetId, testId);
        assertEq(record.datasetHash, testHash);
        assertEq(record.version, testVersion);
        assertEq(record.metadataURI, testMetadataUri);
        assertEq(record.submitter, submitter);
        assertEq(record.timestamp, 1792732800);
        assertTrue(record.exists);
    }

    function testVerifyDatasetHashMatchAndMismatch() public {
        vm.prank(submitter);
        registry.registerDataset(testId, testHash, testVersion, testMetadataUri);

        // Exact match
        assertTrue(registry.verifyDatasetHash(testId, testHash));

        // Tampered payload hash
        bytes32 tamperedHash = sha256(abi.encodePacked("tampered-corrupted-data"));
        assertFalse(registry.verifyDatasetHash(testId, tamperedHash));
    }

    function testDuplicateRegistrationReverts() public {
        vm.prank(submitter);
        registry.registerDataset(testId, testHash, testVersion, testMetadataUri);

        vm.expectRevert(BotChainDatasetRegistry.RecordAlreadyExists.selector);
        vm.prank(submitter);
        registry.registerDataset(testId, testHash, "1.0.1", testMetadataUri);
    }

    function testZeroParametersRevert() public {
        vm.startPrank(submitter);

        // Empty ID
        vm.expectRevert(BotChainDatasetRegistry.EmptyIdentifier.selector);
        registry.registerDataset(bytes32(0), testHash, testVersion, testMetadataUri);

        // Empty Hash
        vm.expectRevert(BotChainDatasetRegistry.EmptyHash.selector);
        registry.registerDataset(testId, bytes32(0), testVersion, testMetadataUri);

        // Empty Version
        vm.expectRevert(BotChainDatasetRegistry.EmptyVersion.selector);
        registry.registerDataset(testId, testHash, "", testMetadataUri);

        vm.stopPrank();
    }

    function testNonExistentRecordReverts() public {
        bytes32 missingId = keccak256("NON-EXISTENT");
        vm.expectRevert(BotChainDatasetRegistry.RecordNotFound.selector);
        registry.getDataset(missingId);

        vm.expectRevert(BotChainDatasetRegistry.RecordNotFound.selector);
        registry.verifyDatasetHash(missingId, testHash);
    }

    function testPermissionControlsWhenPublicRegistrationDisabled() public {
        // Owner disables public registration
        vm.prank(deployer);
        registry.setPublicRegistration(false);
        assertFalse(registry.publicRegistrationEnabled());

        // Unauthorized caller fails
        vm.prank(intruder);
        vm.expectRevert(BotChainDatasetRegistry.Unauthorized.selector);
        registry.registerDataset(testId, testHash, testVersion, testMetadataUri);

        // Owner authorizes submitter
        vm.prank(deployer);
        registry.setAuthorizedSubmitter(submitter, true);
        assertTrue(registry.authorizedSubmitters(submitter));

        // Submitter succeeds
        vm.prank(submitter);
        bool success = registry.registerDataset(testId, testHash, testVersion, testMetadataUri);
        assertTrue(success);

        // Owner can always register
        bytes32 ownerId = keccak256("OWNER-DATASET");
        vm.prank(deployer);
        assertTrue(registry.registerDataset(ownerId, testHash, "1.0.0", "uri"));
    }

    function testOnlyOwnerCanConfigure() public {
        vm.prank(intruder);
        vm.expectRevert(BotChainDatasetRegistry.Unauthorized.selector);
        registry.setPublicRegistration(false);

        vm.prank(intruder);
        vm.expectRevert(BotChainDatasetRegistry.Unauthorized.selector);
        registry.setAuthorizedSubmitter(submitter, true);

        vm.prank(intruder);
        vm.expectRevert(BotChainDatasetRegistry.Unauthorized.selector);
        registry.transferOwnership(intruder);
    }
}
