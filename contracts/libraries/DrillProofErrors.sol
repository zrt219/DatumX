// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library DrillProofErrors {
    error Unauthorized();
    error ProtocolPaused();
    error ZeroAddress();
    error EmptyUri();
    error InvalidPayload();
    error InvalidProjectKey();
    error EmptyProjectName();
    error ProjectAlreadyRegistered();
    error ProjectNotFound();
    error ProjectInactive();
    error AdapterNotConfigured();
    error InvalidAdapterResponse();
    error DuplicateDataset();
    error DatasetNotFound();
    error ParentDatasetNotFound();
    error ParentProjectMismatch();
    error AdapterProjectKeyMismatch();
    error AdapterBindingMismatch();
    error InvalidLineageTransition();
    error LineageBranchNotAllowed();
    error InvalidStatusTransition();
    error ReviewAlreadySubmitted();
    error InvalidConfidence();
    error SubmissionClosed();
    error FinalizationNotReady();
    error ThresholdOutOfRange();
}
