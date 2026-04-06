// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BaseProjectAdapter} from "../contracts/adapters/BaseProjectAdapter.sol";
import {DrillProofAccess} from "../contracts/core/DrillProofAccess.sol";
import {ProjectRegistry} from "../contracts/core/ProjectRegistry.sol";
import {DatasetRegistry} from "../contracts/core/DatasetRegistry.sol";
import {ValidationModule} from "../contracts/core/ValidationModule.sol";
import {ProjectRouter} from "../contracts/core/ProjectRouter.sol";
import {DuckCreekAdapter} from "../contracts/adapters/DuckCreekAdapter.sol";
import {ShirleyCentralAdapter} from "../contracts/adapters/ShirleyCentralAdapter.sol";
import {ShirleyEastAdapter} from "../contracts/adapters/ShirleyEastAdapter.sol";
import {IDrillProofTypes} from "../contracts/interfaces/IDrillProofTypes.sol";
import {DrillProofErrors} from "../contracts/libraries/DrillProofErrors.sol";
import {ProjectKeys} from "../contracts/libraries/ProjectKeys.sol";

contract TestProjectAdapter is BaseProjectAdapter {
    constructor(bytes32 projectKey) BaseProjectAdapter(projectKey, 1, "TP-") {}

    function _validateProjectSpecific(IDrillProofTypes.AdapterPayload calldata) internal pure override {}
}

contract DatumXProtocolTest is Test, IDrillProofTypes {
    DrillProofAccess internal accessController;
    ProjectRegistry internal projectRegistry;
    DatasetRegistry internal datasetRegistry;
    ValidationModule internal validationModule;
    ProjectRouter internal router;

    ShirleyCentralAdapter internal shirleyCentralAdapter;

    address internal admin = address(this);
    address internal projectAdmin = address(0xA11CE);
    address internal validatorOne = address(0xBEEF1);
    address internal validatorTwo = address(0xBEEF2);
    address internal validatorThree = address(0xBEEF3);
    address internal auditor = address(0xA0D17);
    address internal outsider = address(0xC0DE);

    function setUp() public {
        accessController = new DrillProofAccess(admin);
        projectRegistry = new ProjectRegistry(address(accessController));
        datasetRegistry = new DatasetRegistry(address(accessController), address(projectRegistry));
        validationModule = new ValidationModule(
            address(accessController),
            address(datasetRegistry),
            ValidationThresholds({minValidatorCount: 2, minApprovalRatioBps: 6000, minConfidenceBps: 7000})
        );
        router = new ProjectRouter(address(accessController), address(projectRegistry), address(datasetRegistry));

        datasetRegistry.setRouter(address(router));
        datasetRegistry.setValidationModule(address(validationModule));

        accessController.grantRole(accessController.PROJECT_ADMIN_ROLE(), projectAdmin);
        accessController.grantRole(accessController.VALIDATOR_ROLE(), validatorOne);
        accessController.grantRole(accessController.VALIDATOR_ROLE(), validatorTwo);
        accessController.grantRole(accessController.VALIDATOR_ROLE(), validatorThree);
        accessController.grantRole(accessController.AUDITOR_ROLE(), auditor);

        shirleyCentralAdapter = new ShirleyCentralAdapter();

        projectRegistry.registerProject(
            ProjectKeys.SHIRLEY_CENTRAL,
            ProjectMetadata({
                name: "Shirley Central",
                basin: "Powder River Basin",
                commodity: "Uranium",
                depositType: "Roll-front ISR",
                jurisdiction: "United States",
                active: true,
                adapter: address(shirleyCentralAdapter)
            })
        );

        projectRegistry.registerProject(
            ProjectKeys.SHIRLEY_EAST,
            ProjectMetadata({
                name: "Shirley East",
                basin: "Powder River Basin",
                commodity: "Uranium",
                depositType: "Roll-front ISR",
                jurisdiction: "United States",
                active: true,
                adapter: address(new ShirleyEastAdapter())
            })
        );

        projectRegistry.registerProject(
            ProjectKeys.DUCK_CREEK,
            ProjectMetadata({
                name: "Duck Creek",
                basin: "Williston",
                commodity: "Uranium",
                depositType: "Sandstone-hosted",
                jurisdiction: "United States",
                active: true,
                adapter: address(new DuckCreekAdapter())
            })
        );
    }

    function testProjectRegistrationAllowsProjectAdmin() public {
        bytes32 newProjectKey = "NEW_PROJECT";
        TestProjectAdapter adapter = new TestProjectAdapter(newProjectKey);

        vm.prank(projectAdmin);
        projectRegistry.registerProject(
            newProjectKey,
            ProjectMetadata({
                name: "New Project",
                basin: "Basin",
                commodity: "Uranium",
                depositType: "ISR",
                jurisdiction: "United States",
                active: true,
                adapter: address(adapter)
            })
        );

        ProjectMetadata memory metadata = projectRegistry.getProject(newProjectKey);
        assertTrue(metadata.adapter != address(0));
        assertTrue(metadata.active);
    }

    function testProjectRegistrationRejectsDuplicateKeys() public {
        ShirleyCentralAdapter duplicateAdapter = new ShirleyCentralAdapter();
        vm.expectRevert(DrillProofErrors.ProjectAlreadyRegistered.selector);
        projectRegistry.registerProject(
            ProjectKeys.SHIRLEY_CENTRAL,
            ProjectMetadata({
                name: "Duplicate",
                basin: "Basin",
                commodity: "Uranium",
                depositType: "ISR",
                jurisdiction: "US",
                active: true,
                adapter: address(duplicateAdapter)
            })
        );
    }

    function testAdapterBindingMismatchRejectedAtRegistration() public {
        vm.expectRevert(DrillProofErrors.AdapterBindingMismatch.selector);
        projectRegistry.registerProject(
            "BAD_PROJECT",
            ProjectMetadata({
                name: "Bad Project",
                basin: "Basin",
                commodity: "Uranium",
                depositType: "ISR",
                jurisdiction: "United States",
                active: true,
                adapter: address(shirleyCentralAdapter)
            })
        );
    }

    function testRootDatasetSubmissionSuccess() public {
        uint256 datasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.RAW_SCAN_BATCH, "SC-RAW-001", 1211, 8400),
            "ipfs://dataset/raw",
            bytes32(0)
        );

        DatasetRecord memory dataset = datasetRegistry.getDataset(datasetId);
        assertEq(dataset.datasetId, 1);
        assertEq(uint256(dataset.datasetType), uint256(DatasetType.RAW_SCAN_BATCH));
        assertEq(uint256(dataset.status), uint256(DatasetStatus.PENDING));
        assertEq(dataset.projectKey, ProjectKeys.SHIRLEY_CENTRAL);
    }

    function testChildDatasetLinkageSuccess() public {
        uint256 rootDatasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.RAW_SCAN_BATCH, "SC-RAW-001", 1211, 8400),
            "ipfs://dataset/raw",
            bytes32(0)
        );
        _approveDataset(rootDatasetId);

        vm.prank(auditor);
        validationModule.finalizeDataset(rootDatasetId);

        bytes32 parentHash = datasetRegistry.getDataset(rootDatasetId).contentHash;
        uint256 childDatasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.EXTRACTED_TRACES, "SC-TRACE-001", 1211, 8300),
            "ipfs://dataset/traces",
            parentHash
        );

        assertEq(datasetRegistry.getParentDatasetId(childDatasetId), rootDatasetId);
        uint256[] memory children = datasetRegistry.getChildDatasetIds(rootDatasetId);
        assertEq(children.length, 1);
        assertEq(children[0], childDatasetId);

        uint256[] memory ancestry = datasetRegistry.getAncestry(childDatasetId, 4);
        assertEq(ancestry.length, 1);
        assertEq(ancestry[0], rootDatasetId);
    }

    function testAdapterRoutingStoresDataset() public {
        uint256 datasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.DRILL_TARGET_PACKAGE, "SC-TARGET-001", 1211, 8400),
            "ipfs://dataset/target",
            bytes32(0)
        );

        DatasetRecord memory dataset = datasetRegistry.getDataset(datasetId);
        assertEq(uint256(dataset.datasetType), uint256(DatasetType.DRILL_TARGET_PACKAGE));
        assertEq(uint256(dataset.status), uint256(DatasetStatus.PENDING));
    }

    function testAdapterNormalizationRejectsWrongPrefix() public {
        vm.expectRevert(DrillProofErrors.InvalidPayload.selector);
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.DRILL_TARGET_PACKAGE, "BAD-001", 1211, 8400),
            "ipfs://dataset/invalid",
            bytes32(0)
        );
    }

    function testAdapterRejectsProjectKeyMismatch() public {
        vm.expectRevert(DrillProofErrors.AdapterProjectKeyMismatch.selector);
        shirleyCentralAdapter.normalizeSubmission(
            ProjectKeys.DUCK_CREEK,
            _payload(DatasetType.DRILL_TARGET_PACKAGE, "SC-TARGET-001", 1211, 8400),
            "ipfs://dataset/invalid",
            bytes32(0),
            address(this)
        );
    }

    function testDuplicateDatasetRejection() public {
        AdapterPayload memory payload = _payload(DatasetType.DRILL_TARGET_PACKAGE, "SC-TARGET-001", 1211, 8400);
        router.submitDataset(ProjectKeys.SHIRLEY_CENTRAL, payload, "ipfs://dataset/one", bytes32(0));
        vm.expectRevert(DrillProofErrors.DuplicateDataset.selector);
        router.submitDataset(ProjectKeys.SHIRLEY_CENTRAL, payload, "ipfs://dataset/one", bytes32(0));
    }

    function testBadParentLinkageRejection() public {
        vm.expectRevert(DrillProofErrors.ParentDatasetNotFound.selector);
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.EXTRACTED_TRACES, "SC-TRACE-001", 1211, 8400),
            "ipfs://dataset/two",
            keccak256("missing")
        );
    }

    function testParentMustBeFinalizedBeforeChildSubmission() public {
        uint256 rootDatasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.RAW_SCAN_BATCH, "SC-RAW-001", 1211, 8400),
            "ipfs://dataset/raw",
            bytes32(0)
        );
        bytes32 parentHash = datasetRegistry.getDataset(rootDatasetId).contentHash;

        vm.expectRevert(DrillProofErrors.InvalidLineageTransition.selector);
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.EXTRACTED_TRACES, "SC-TRACE-001", 1211, 8300),
            "ipfs://dataset/traces",
            parentHash
        );
    }

    function testChildSubmissionRejectsSameStageReplacement() public {
        uint256 rootDatasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.RAW_SCAN_BATCH, "SC-RAW-001", 1211, 8400),
            "ipfs://dataset/raw",
            bytes32(0)
        );
        _approveDataset(rootDatasetId);

        vm.prank(auditor);
        validationModule.finalizeDataset(rootDatasetId);

        bytes32 parentHash = datasetRegistry.getDataset(rootDatasetId).contentHash;
        vm.expectRevert(DrillProofErrors.InvalidLineageTransition.selector);
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.RAW_SCAN_BATCH, "SC-RAW-002", 1211, 8200),
            "ipfs://dataset/raw-v2",
            parentHash
        );
    }

    function testChildSubmissionRejectsSkippedStage() public {
        uint256 rootDatasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.RAW_SCAN_BATCH, "SC-RAW-001", 1211, 8400),
            "ipfs://dataset/raw",
            bytes32(0)
        );
        _approveDataset(rootDatasetId);

        vm.prank(auditor);
        validationModule.finalizeDataset(rootDatasetId);

        bytes32 parentHash = datasetRegistry.getDataset(rootDatasetId).contentHash;
        vm.expectRevert(DrillProofErrors.InvalidLineageTransition.selector);
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.INTERPRETED_INTERVALS, "SC-INT-001", 1211, 8200),
            "ipfs://dataset/interpreted",
            parentHash
        );
    }

    function testLineageBranchingRejected() public {
        uint256 rootDatasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.RAW_SCAN_BATCH, "SC-RAW-001", 1211, 8400),
            "ipfs://dataset/raw",
            bytes32(0)
        );
        _approveDataset(rootDatasetId);

        vm.prank(auditor);
        validationModule.finalizeDataset(rootDatasetId);

        bytes32 parentHash = datasetRegistry.getDataset(rootDatasetId).contentHash;
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.EXTRACTED_TRACES, "SC-TRACE-001", 1211, 8300),
            "ipfs://dataset/traces",
            parentHash
        );

        vm.expectRevert(DrillProofErrors.LineageBranchNotAllowed.selector);
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.EXTRACTED_TRACES, "SC-TRACE-002", 1211, 8250),
            "ipfs://dataset/traces-branch",
            parentHash
        );
    }

    function testInactiveProjectRejected() public {
        projectRegistry.setProjectActive(ProjectKeys.DUCK_CREEK, false);
        vm.expectRevert(DrillProofErrors.ProjectInactive.selector);
        router.submitDataset(
            ProjectKeys.DUCK_CREEK,
            _payload(DatasetType.EXTRACTED_TRACES, "DC-TRACE-001", 120, 6000),
            "ipfs://duck/one",
            bytes32(0)
        );
    }

    function testMalformedCanonicalSubmissionRejectedEvenFromConfiguredRouter() public {
        CanonicalDatasetInput memory malformed = CanonicalDatasetInput({
            projectKey: ProjectKeys.SHIRLEY_CENTRAL,
            datasetType: DatasetType.RAW_SCAN_BATCH,
            contentHash: bytes32(0),
            parentDatasetHash: bytes32(0),
            uri: "ipfs://dataset/malformed",
            schemaVersion: 1,
            recordCount: 1211,
            claimedConfidenceBps: 8200
        });

        vm.prank(address(router));
        vm.expectRevert(DrillProofErrors.InvalidPayload.selector);
        datasetRegistry.submitCanonicalDataset(malformed, address(this));
    }

    function testCanonicalSubmissionRejectsZeroSchemaVersion() public {
        CanonicalDatasetInput memory malformed = CanonicalDatasetInput({
            projectKey: ProjectKeys.SHIRLEY_CENTRAL,
            datasetType: DatasetType.RAW_SCAN_BATCH,
            contentHash: keccak256("malformed"),
            parentDatasetHash: bytes32(0),
            uri: "ipfs://dataset/malformed",
            schemaVersion: 0,
            recordCount: 1211,
            claimedConfidenceBps: 8200
        });

        vm.prank(address(router));
        vm.expectRevert(DrillProofErrors.InvalidPayload.selector);
        datasetRegistry.submitCanonicalDataset(malformed, address(this));
    }

    function testRouterAndValidationModuleRejectZeroAddressConfiguration() public {
        vm.expectRevert(DrillProofErrors.ZeroAddress.selector);
        datasetRegistry.setRouter(address(0));

        vm.expectRevert(DrillProofErrors.ZeroAddress.selector);
        datasetRegistry.setValidationModule(address(0));
    }

    function testReviewSubmissionAndDoubleReviewRejection() public {
        uint256 datasetId = _submitTargetDataset();

        vm.prank(validatorOne);
        validationModule.submitReview(datasetId, true, 8400, "ipfs://review/one");

        vm.prank(validatorOne);
        vm.expectRevert(DrillProofErrors.ReviewAlreadySubmitted.selector);
        validationModule.submitReview(datasetId, true, 8500, "ipfs://review/two");
    }

    function testUnauthorizedReviewRejection() public {
        uint256 datasetId = _submitTargetDataset();
        vm.prank(outsider);
        vm.expectRevert(DrillProofErrors.Unauthorized.selector);
        validationModule.submitReview(datasetId, true, 8000, "ipfs://review/outsider");
    }

    function testAdminCannotReviewWithoutValidatorRole() public {
        accessController.revokeRole(accessController.VALIDATOR_ROLE(), admin);
        uint256 datasetId = _submitTargetDataset();

        vm.expectRevert(DrillProofErrors.Unauthorized.selector);
        validationModule.submitReview(datasetId, true, 8200, "ipfs://review/admin");
    }

    function testInvalidConfidenceBoundsRejection() public {
        uint256 datasetId = _submitTargetDataset();
        vm.prank(validatorOne);
        vm.expectRevert(DrillProofErrors.InvalidConfidence.selector);
        validationModule.submitReview(datasetId, true, 10_001, "ipfs://review/invalid");
    }

    function testReviewAggregationAndRejectionMath() public {
        uint256 datasetId = _submitTargetDataset();

        vm.prank(validatorOne);
        validationModule.submitReview(datasetId, true, 8000, "ipfs://review/one");

        vm.prank(validatorTwo);
        validationModule.submitReview(datasetId, false, 6000, "ipfs://review/two");

        DatasetRecord memory dataset = datasetRegistry.getDataset(datasetId);
        assertEq(dataset.approvalCount, 1);
        assertEq(dataset.rejectionCount, 1);
        assertEq(dataset.aggregateConfidenceBps, 7000);
        assertEq(uint256(dataset.status), uint256(DatasetStatus.REJECTED));
    }

    function testPrematureFinalizationRejected() public {
        uint256 datasetId = _submitTargetDataset();

        vm.prank(validatorOne);
        validationModule.submitReview(datasetId, true, 8200, "ipfs://review/one");

        vm.expectRevert(DrillProofErrors.FinalizationNotReady.selector);
        vm.prank(auditor);
        validationModule.finalizeDataset(datasetId);
    }

    function testSuccessfulFinalizationByAuditor() public {
        uint256 datasetId = _submitTargetDataset();
        _approveDataset(datasetId);

        vm.prank(auditor);
        validationModule.finalizeDataset(datasetId);

        DatasetRecord memory dataset = datasetRegistry.getDataset(datasetId);
        assertEq(uint256(dataset.status), uint256(DatasetStatus.FINALIZED));
        assertGt(dataset.finalizedAt, 0);
    }

    function testAdminCannotFinalizeWithoutAuditorRole() public {
        uint256 datasetId = _submitTargetDataset();
        _approveDataset(datasetId);

        accessController.revokeRole(accessController.AUDITOR_ROLE(), admin);
        vm.expectRevert(DrillProofErrors.Unauthorized.selector);
        validationModule.finalizeDataset(datasetId);
    }

    function testThresholdUpdatesAndRoleEnforcement() public {
        vm.prank(outsider);
        vm.expectRevert(DrillProofErrors.Unauthorized.selector);
        validationModule.setThresholds(
            ValidationThresholds({minValidatorCount: 3, minApprovalRatioBps: 7000, minConfidenceBps: 7500})
        );

        validationModule.setThresholds(
            ValidationThresholds({minValidatorCount: 3, minApprovalRatioBps: 7000, minConfidenceBps: 7500})
        );

        ValidationThresholds memory thresholds = validationModule.getThresholds();
        assertEq(thresholds.minValidatorCount, 3);
        assertEq(thresholds.minApprovalRatioBps, 7000);
        assertEq(thresholds.minConfidenceBps, 7500);
    }

    function testPausedProtocolBlocksSubmissionAndReview() public {
        uint256 datasetId = _submitTargetDataset();
        accessController.pause();

        vm.expectRevert(DrillProofErrors.ProtocolPaused.selector);
        router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.DRILL_TARGET_PACKAGE, "SC-TARGET-PAUSED", 1211, 8200),
            "ipfs://dataset/paused",
            bytes32(0)
        );

        vm.prank(validatorOne);
        vm.expectRevert(DrillProofErrors.ProtocolPaused.selector);
        validationModule.submitReview(datasetId, true, 8200, "ipfs://review/paused");
    }

    function testFuzzReviewConfidenceBounds(uint16 confidenceBps) public {
        vm.assume(confidenceBps > 10_000);
        uint256 datasetId = _submitTargetDataset();

        vm.prank(validatorOne);
        vm.expectRevert(DrillProofErrors.InvalidConfidence.selector);
        validationModule.submitReview(datasetId, true, confidenceBps, "ipfs://review/fuzz");
    }

    function testFuzzDistinctSubmissionIdsProduceDistinctHashes(bytes32 leftSeed, bytes32 rightSeed) public view {
        vm.assume(leftSeed != rightSeed);

        CanonicalDatasetInput memory left = shirleyCentralAdapter.normalizeSubmission(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.DRILL_TARGET_PACKAGE, _submissionId(leftSeed), 1211, 8400),
            "ipfs://dataset/left",
            bytes32(0),
            address(this)
        );

        CanonicalDatasetInput memory right = shirleyCentralAdapter.normalizeSubmission(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.DRILL_TARGET_PACKAGE, _submissionId(rightSeed), 1211, 8400),
            "ipfs://dataset/right",
            bytes32(0),
            address(this)
        );

        assertTrue(left.contentHash != right.contentHash);
    }

    function _submitTargetDataset() internal returns (uint256 datasetId) {
        datasetId = router.submitDataset(
            ProjectKeys.SHIRLEY_CENTRAL,
            _payload(DatasetType.DRILL_TARGET_PACKAGE, "SC-TARGET-001", 1211, 8400),
            "ipfs://dataset/one",
            bytes32(0)
        );
    }

    function _approveDataset(uint256 datasetId) internal {
        vm.prank(validatorOne);
        validationModule.submitReview(datasetId, true, 8200, "ipfs://review/one");

        vm.prank(validatorTwo);
        validationModule.submitReview(datasetId, true, 8100, "ipfs://review/two");
    }

    function _payload(DatasetType datasetType, string memory submissionId, uint32 recordCount, uint32 confidence)
        internal
        pure
        returns (AdapterPayload memory)
    {
        return AdapterPayload({
            datasetType: datasetType,
            schemaVersion: 1,
            recordCount: recordCount,
            claimedConfidenceBps: confidence,
            sourceHash: keccak256("source"),
            transformHash: keccak256(abi.encode(submissionId)),
            submissionId: submissionId
        });
    }

    function _submissionId(bytes32 seed) internal pure returns (string memory) {
        return string(abi.encodePacked("SC-", seed));
    }
}
