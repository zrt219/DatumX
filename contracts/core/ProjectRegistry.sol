// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {IProjectAdapter} from "../interfaces/IProjectAdapter.sol";
import {DrillProofAccess} from "./DrillProofAccess.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";
import {DrillProofEvents} from "../libraries/DrillProofEvents.sol";

contract ProjectRegistry is IDrillProofTypes {
    DrillProofAccess public immutable accessController;

    mapping(bytes32 => ProjectMetadata) private _projects;
    bytes32[] private _projectKeys;

    constructor(address accessController_) {
        if (accessController_ == address(0)) revert DrillProofErrors.ZeroAddress();
        accessController = DrillProofAccess(accessController_);
    }

    modifier onlyProjectManager() {
        if (
            !accessController.hasRole(accessController.DEFAULT_ADMIN_ROLE(), msg.sender)
                && !accessController.hasRole(accessController.PROJECT_ADMIN_ROLE(), msg.sender)
        ) revert DrillProofErrors.Unauthorized();
        _;
    }

    modifier whenProtocolActive() {
        if (accessController.paused()) revert DrillProofErrors.ProtocolPaused();
        _;
    }

    function registerProject(bytes32 projectKey, ProjectMetadata calldata metadata) external onlyProjectManager whenProtocolActive {
        if (projectKey == bytes32(0)) revert DrillProofErrors.InvalidProjectKey();
        if (bytes(metadata.name).length == 0) revert DrillProofErrors.EmptyProjectName();
        if (metadata.adapter == address(0)) revert DrillProofErrors.ZeroAddress();
        if (_projects[projectKey].adapter != address(0)) revert DrillProofErrors.ProjectAlreadyRegistered();
        _validateAdapterBinding(projectKey, metadata.adapter);

        _projects[projectKey] = metadata;
        _projectKeys.push(projectKey);

        emit DrillProofEvents.ProjectRegistered(projectKey, metadata.name, metadata.adapter, metadata.active);
    }

    function updateProject(bytes32 projectKey, ProjectMetadata calldata metadata) external onlyProjectManager whenProtocolActive {
        if (_projects[projectKey].adapter == address(0)) revert DrillProofErrors.ProjectNotFound();
        if (bytes(metadata.name).length == 0) revert DrillProofErrors.EmptyProjectName();
        if (metadata.adapter == address(0)) revert DrillProofErrors.ZeroAddress();
        _validateAdapterBinding(projectKey, metadata.adapter);

        _projects[projectKey] = metadata;

        emit DrillProofEvents.ProjectUpdated(projectKey, metadata.adapter, metadata.active);
    }

    function setProjectActive(bytes32 projectKey, bool active) external onlyProjectManager whenProtocolActive {
        if (_projects[projectKey].adapter == address(0)) revert DrillProofErrors.ProjectNotFound();
        _projects[projectKey].active = active;

        emit DrillProofEvents.ProjectUpdated(projectKey, _projects[projectKey].adapter, active);
    }

    function getProject(bytes32 projectKey) external view returns (ProjectMetadata memory metadata) {
        metadata = _projects[projectKey];
        if (metadata.adapter == address(0)) revert DrillProofErrors.ProjectNotFound();
    }

    function isProjectActive(bytes32 projectKey) external view returns (bool active) {
        ProjectMetadata memory metadata = _projects[projectKey];
        if (metadata.adapter == address(0)) revert DrillProofErrors.ProjectNotFound();
        active = metadata.active;
    }

    function getAdapter(bytes32 projectKey) external view returns (address adapter) {
        ProjectMetadata memory metadata = _projects[projectKey];
        if (metadata.adapter == address(0)) revert DrillProofErrors.ProjectNotFound();
        adapter = metadata.adapter;
    }

    function getProjectKeys() external view returns (bytes32[] memory projectKeys) {
        projectKeys = _projectKeys;
    }

    function _validateAdapterBinding(bytes32 projectKey, address adapter) internal view {
        try IProjectAdapter(adapter).expectedProjectKey() returns (bytes32 adapterProjectKey) {
            if (adapterProjectKey != projectKey) revert DrillProofErrors.AdapterBindingMismatch();
        } catch {
            revert DrillProofErrors.AdapterBindingMismatch();
        }
    }
}
