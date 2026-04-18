# DatumX - Executive Technical Brief

- Subtitle: Smart-Contract Protocol for Trusted AI-Transformed Exploration Data
- Value Proposition: "DatumX converts transformed industrial datasets from ambiguous files into governed analytical releases with deterministic lineage, validator consensus, and auditor-controlled closure."
- Stack: XRPL EVM Testnet | Solidity 0.8.24 | Foundry | React | Vite | TypeScript | viem | OpenZeppelin AccessControl
- Live URL: https://datumx.vercel.app
- Deployed Contract Set: DrillProofAccess `0x47AA8f1F35DB309Be2bd7aD1b58070092A7dc2e5`, ProjectRegistry `0x238fc107Dc66A08B93A28107399dCC35968d6687`, DatasetRegistry `0x0Fa0b1a4C21BB0cbF5DA4441570e9d997EAf5e0B`, ValidationModule `0xD60BE5B6A28eAF13De6DB6e02726551304E82baf`, ProjectRouter `0x04dC258B2329114F5907fFD5c8600c72E5BA1637`
- Design Tokens: primary `#78A37B`, secondary `#5F7FA7`, callout fill `#EEF4EE`

## Executive Summary

DatumX is a release-governance protocol for AI-transformed industrial datasets, built for environments where the real bottleneck is no longer extraction but trust. The immediate use case is uranium exploration data: scanned historical drill records, interpreted traces, composite statistics, and targeting packages that are materially important once they begin to influence technical review and capital allocation. DatumX addresses that problem by treating each transformed dataset as a governed analytical release. Every release is registered on-chain with a canonical content hash, a project key, a lifecycle state, a lineage reference, review counts, and a finalization outcome. The result is not a storage layer. It is a deterministic release system.

The hardest technical constraint was not Solidity itself. It was building a protocol that stayed strict under XRPL EVM testnet realities while still preserving clean release semantics. The current V5 deployment runs on XRPL EVM chain `1449000`, with Foundry configured for Solidity `0.8.24`, `via_ir = true`, and `evm_version = "cancun"`. The deployment and smoke flows had to be designed around legacy transaction mode, explicit gas posture, and an operational model that does not trust `eth_estimateGas` to behave like a standard EVM baseline. On the protocol side, the earlier V4.5 posture was replaced because the submission boundary and lineage semantics were not strict enough. V5 corrected that by moving to a typed `AdapterPayload`, enforcing finalized-parent lineage, and blocking branching at the registry layer.

The outcome is a live, explorer-backed system with a canonical V5 contract set and repeated root-to-child lineage proofs already exercised on XRPL EVM Testnet. DatumX has recorded a canonical validator-reviewed `1->2` lineage path, admin fast-path proof runs for `3->4` and `5->6`, and a follow-up proof run for `7->8`, with thresholds restored to `minValidatorCount=3`, `minApprovalRatioBps=6667`, and `minConfidenceBps=7000` after every fast-path exercise. That proves more than successful deployment. It proves the engineering capability to define a release state machine, operate it on a non-trivial testnet environment, instrument it for auditability, and document the resulting system in a way that stands up to technical diligence.

## Problem Statement

Modern exploration programs increasingly depend on transformed data rather than raw source artifacts. Historical drill logs, gamma traces, and scanned interval sheets can now be digitized at useful scale with computer vision, parsing pipelines, and downstream interpretation systems. That changes the operational bottleneck. The scarce resource is no longer access to raw information. It is confidence that the transformed release being used for review or targeting is the right one, derived from the right parent, reviewed by the right actors, and finalized under the right thresholds.

Conventional data systems fail precisely at that boundary. Shared drives preserve files but not governed release semantics. Version folders preserve chronology but not deterministic lineage. Internal dashboards can expose metrics without proving who approved a transformed package, what confidence it carried, or whether it was actually eligible for downstream use. If a child release is derived from a parent that was never finalized, or if a transformed package is duplicated under a different label, a conventional stack usually notices too late.

DatumX solves that by enforcing protocol-native provenance. A dataset is not just a URI. It is a `DatasetRecord` keyed by `datasetId`, `projectKey`, `datasetType`, `contentHash`, `parentDatasetHash`, `schemaVersion`, `recordCount`, approval counts, rejection counts, aggregate confidence, submitter, and timestamps. Confidence and thresholds are integer-encoded in basis points, not floating abstractions, so the live protocol posture can be read directly as `6667` for minimum approval ratio and `7000` for minimum confidence. Reviews are on-chain events. Finalization is a discrete state transition. The audit trail is event-based, filterable, and externally inspectable through XRPL explorer links.

## Solidity Architecture

### Contract Design

DatumX compiles under Solidity `0.8.24` with Foundry using `optimizer = true`, `optimizer_runs = 200`, `via_ir = true`, and `evm_version = "cancun"`. That profile is appropriate for the current contract surface because the protocol relies on multiple small contracts, integer-encoded state, and explicit control flow rather than dynamic upgrade patterns. The dependency strategy is intentionally narrow: OpenZeppelin `AccessControl` and `Pausable` are used for role discipline and emergency pause behavior, while the release-specific logic lives in local contracts and libraries.

Storage is split by responsibility rather than collapsed into one contract. `ProjectRegistry` owns project metadata and adapter bindings. `DatasetRegistry` owns canonical release records, duplicate protection, and lifecycle state. `ValidationModule` owns per-reviewer review mappings, reviewer lists, running confidence totals, and threshold resolution. `DatasetGraph` stores parent-to-child adjacency. This layout keeps storage responsibilities inspectable, reduces accidental coupling, and makes it easier to audit invariants contract by contract.

Bytecode and gas posture reflect the fact that DatumX is a release-governance system, not an AMM or high-frequency settlement path. Storage writes are accepted where they improve auditability: explicit review records, explicit child linkage, and explicit status events are all worth the cost because the entire protocol thesis is that transformed releases should be inspectable after the fact. Attack surface is reduced through immutability and narrow writes. There is no proxy layer, no upgrade admin, and no generic delegatecall surface.

### State Machine

The protocol uses two related state machines: dataset-stage progression and dataset-status progression.

The stage machine is encoded in the `DatasetType` enum:

1. `RAW_SCAN_BATCH`
2. `EXTRACTED_TRACES`
3. `INTERPRETED_INTERVALS`
4. `COMPOSITE_STATISTICS`
5. `DRILL_TARGET_PACKAGE`

This is not decorative taxonomy. `DatasetRegistry.submitCanonicalDataset(...)` enforces that a child dataset can only be accepted if its `datasetType` is exactly one stage ahead of its finalized parent. A child cannot skip stages, cannot change projects, and cannot branch off a parent that already has a child.

The lifecycle machine is encoded in the `DatasetStatus` enum:

1. `PENDING`
2. `UNDER_REVIEW`
3. `APPROVED`
4. `REJECTED`
5. `FINALIZED`

Datasets begin as `PENDING`. The first successful review moves a dataset into `UNDER_REVIEW`. Once threshold math resolves, the dataset becomes `APPROVED` or `REJECTED`. Only an auditor can convert `APPROVED` into `FINALIZED`. Terminal handling is strict: finalized datasets cannot re-enter review, and children cannot reference parents that are merely approved but not finalized.

The payload strategy is equally important. V5 uses a typed `AdapterPayload` with `datasetType`, `schemaVersion`, `recordCount`, `claimedConfidenceBps`, `sourceHash`, `transformHash`, and `submissionId`. That payload is normalized into a `CanonicalDatasetInput` containing the fields the registry actually records. This separation is what turned the V5 submission boundary from permissive to disciplined.

### Access Control

DatumX uses a role-based security model implemented in `DrillProofAccess`, not an `onlyOwner` pattern. The current roles are:

- `DEFAULT_ADMIN_ROLE`
- `PROJECT_ADMIN_ROLE`
- `VALIDATOR_ROLE`
- `AUDITOR_ROLE`
- `PAUSER_ROLE`

This separation matters because the protocol is making trust distinctions, not just permission checks. Project admins can manage project bindings. Validators can submit reviews. Auditors can finalize approved datasets. Pausers can stop the protocol. Default admin can configure system-level posture such as thresholds. No single operational role doubles as every other role in the intended design, even though the deployer address is initially granted all roles in the bootstrap deployment.

Upgradeability is explicitly not part of the current architecture. DatumX is deployed as direct contracts with immutable addresses recorded in a versioned manifest. Version changes are expressed through redeployment and manifest rollover, not proxy mutation. That is the correct tradeoff for a protocol whose primary value proposition is auditability.

### Custom Errors

DatumX uses custom errors extensively through `DrillProofErrors`. The active set includes `Unauthorized`, `ProtocolPaused`, `InvalidPayload`, `ProjectInactive`, `DuplicateDataset`, `ParentDatasetNotFound`, `ParentProjectMismatch`, `AdapterBindingMismatch`, `InvalidLineageTransition`, `LineageBranchNotAllowed`, `ReviewAlreadySubmitted`, `InvalidConfidence`, `SubmissionClosed`, `FinalizationNotReady`, and `ThresholdOutOfRange`.

This is materially better than `require` strings for the current system. It reduces deploy bytecode and revert cost, and it makes the protocol failure modes enumerable. That became especially important in the XRPL debugging pass on `submitReview`, where decoding custom errors and simulating the call path exposed `ReviewAlreadySubmitted()` before broadcast.

### Events

The protocol's logging strategy is deliberate and centered on auditability. The key events are:

- `ProjectRegistered(bytes32 indexed projectKey, string name, address indexed adapter, bool active)`
- `ProjectUpdated(bytes32 indexed projectKey, address indexed adapter, bool active)`
- `RouterConfigured(address indexed router)`
- `ValidationModuleConfigured(address indexed validationModule)`
- `DatasetSubmissionRouted(bytes32 indexed projectKey, address indexed adapter, address indexed submitter, bytes32 contentHash)`
- `DatasetRecorded(uint256 indexed datasetId, bytes32 indexed projectKey, bytes32 indexed contentHash, address submitter)`
- `DatasetStatusUpdated(uint256 indexed datasetId, DatasetStatus status, uint32 approvals, uint32 rejections)`
- `DatasetFinalized(uint256 indexed datasetId, uint64 finalizedAt)`
- `ReviewSubmitted(uint256 indexed datasetId, address indexed reviewer, bool approved, uint16 confidenceBps)`
- `ThresholdsUpdated(uint16 minValidatorCount, uint16 minApprovalRatioBps, uint16 minConfidenceBps)`

Indexed project keys, dataset IDs, reviewers, and content hashes make post-hoc filtering and analytics practical. This is essential because DatumX is supposed to function as a verifiable release ledger, not just a state container.

### Capacity and Constraint Logic

Capacity enforcement is one of DatumX's strongest qualities. The registry rejects duplicate `contentHash` values, enforces active project state, requires nonzero schema version and record count, and blocks confidence inputs outside `0..10000`. If a `parentDatasetHash` is provided, it must resolve to an existing dataset in the same project, that parent must already be finalized, and that parent must not already have a child.

The no-branch rule is concrete, not rhetorical. `DatasetRegistry.submitCanonicalDataset(...)` checks `_childDatasetIds[parentDatasetId].length != 0` and reverts with `LineageBranchNotAllowed()` if the parent already has a child. That turns lineage from "recorded association" into deterministic progression.

### State and Stage Lifecycle

The critical lifecycle constraints are:

- root datasets may be submitted without a parent
- child datasets require an existing finalized parent
- child stage must be exactly parent stage plus one
- dataset status can move from `PENDING` to `UNDER_REVIEW`, then to `APPROVED` or `REJECTED`
- only `APPROVED` datasets can be finalized
- finalized datasets cannot be reviewed again

This is the core reason DatumX matters. The protocol does not simply remember that a release existed. It encodes whether that release was eligible to exist, eligible to progress, and eligible to be closed.

## Chain and Infrastructure Specifics

DatumX runs on XRPL EVM Testnet, an EVM execution environment with chain ID `1449000`. The deployed frontend targets:

- RPC: `https://rpc.testnet.xrplevm.org/`
- Explorer: `https://explorer.testnet.xrplevm.org`
- Native token: `XRP`
- Wallet path: MetaMask-first

The contract toolchain is standard Foundry, but the operational posture is not standard-mainnet Ethereum. DatumX's live deployment and smoke tooling use legacy transactions. The XRPL scripts assume explicit gas posture and avoid leaning on `eth_estimateGas` as a source of truth. This is not theoretical; it is encoded in the deployment and smoke runbooks and reinforced by the recorded XRPL proof exercises.

The main incompatibilities and overrides are:

- legacy transaction mode is required for the current deploy/smoke path
- gas estimation is not treated as canonical
- gas price assumptions must preserve explicit headroom
- stale `out`, `cache`, or `broadcast` artifacts are operationally dangerous for verification and reconciliation
- explorer verification can accept submissions without resolving them into verified state in a useful time window

These are not cosmetic inconveniences. They shape how a serious XRPL EVM deployment should be operated.

## Build Log - Debug and Engineering War Diary

| # | Issue | Root Cause | Technical Fix | Tries | Impact if Missed |
| --- | --- | --- | --- | --- | --- |
| 1 | V4.5 submission boundary was too loose | Adapters and registry semantics did not yet force the stricter typed-payload and deterministic-lineage posture needed for production-grade release governance | V5 standardized `AdapterPayload`, tightened adapter normalization, and enforced finalized-parent + no-branch lineage in the registry | 2 recorded network deploy versions | DatumX would have looked governed while still allowing ambiguous progression semantics |
| 2 | XRPL deploy and smoke flows could not rely on standard gas assumptions | XRPL EVM testnet behavior did not justify treating `eth_estimateGas` or default modern fee handling as dependable | Deployment and smoke runbooks standardized on `--legacy`, explicit gas posture, and deterministic transaction sequencing | 3 full smoke cycles plus deploy runs | The protocol would appear sound in code but fail as an operational system |
| 3 | Explorer verification remained incomplete despite accepted submissions | Blockscout accepted verification payloads but did not move them to a verified state in the observed queue window | Exported canonical Standard JSON bundles, logged the queue state, and documented the accepted-but-unverified outcome instead of overstating verification | 2 submission modes: bulk plus one-by-one retry | Leadership or reviewers could falsely assume source verification was complete |
| 4 | `ValidationModule.submitReview` failed after wallet broadcast | The dataset under review (`DS-006`) was already closed, and the same validator had already submitted a review, but the UI only surfaced a generic failed receipt message | Added preflight simulation, custom-error decoding, structured logs, and state reads before broadcast; the flow now surfaces `ReviewAlreadySubmitted()` and closed-submission states explicitly | 1 failed live tx + 1 debug pass | Operators would keep broadcasting failing transactions without understanding the protocol reason |
| 5 | Threshold-lowering smoke tests risked leaving the system in a weak posture | Fast-path execution required `minValidatorCount=1`, which is incompatible with the intended live consensus posture | Every smoke cycle recorded both lower and restore transactions, and the manifest now captures restored thresholds as canonical state | 3 recorded fast-path exercises | Test posture could be confused with live posture, weakening trust in the deployment record |
| 6 | Windows local-run behavior broke under `\\?\\` path mode | `npm` launched `cmd.exe` from a UNC-style PowerShell path, causing `vite` resolution failures | Documented normal-drive-path execution and standard repo-local run posture | 1 reproduced local environment issue | Reviewers could incorrectly interpret a local shell-path bug as an application failure |

## Engineering Principles

1. Treat transformed releases as governed state, not as files with nicer metadata.
2. Keep normalization project-specific, but keep release semantics canonical.
3. Encode lineage so the protocol can reject ambiguity, not just display it.
4. Separate validator judgment from auditor closure so review legitimacy and final release authority do not collapse into one actor.
5. Design deployment tooling for the actual chain you are on, not the EVM you wish you had.
6. Prefer explicit custom errors, integer-encoded thresholds, and event-backed state changes over prose assumptions in off-chain documentation.

## Forward Look - Production Architecture

The current system is intentionally disciplined but still early-stage. A production extension path would keep the same core release model while hardening governance and evidentiary depth.

The first upgrade is role hardening. Default admin should move behind a multisig or a deliberately separated operations/governance split so threshold changes, project registration, and emergency pause powers are not concentrated in a single operator key.

The second upgrade is provenance enrichment. DatumX already hashes transformed releases, but future versions could attach Merkle commitments for drill-level or interval-level verification so a release hash can be tied back to a more granular evidentiary tree.

The third upgrade is attestation depth. Adapter payloads could be extended with execution attestations or oracle-fed transform metadata so a downstream reviewer can see not only the resulting release hash but also which model/runtime configuration produced it.

The fourth upgrade is domain generalization. The core pattern is not limited to uranium exploration. Any workflow that transforms operationally meaningful data through staged pipelines can use the same structure: typed input, canonical normalization, deterministic lineage, reviewer consensus, and explicit finalization.

The fifth upgrade is privacy and financing alignment. Where disclosure sensitivity matters, selected provenance or review artifacts could eventually be combined with privacy-preserving proofs, while the finalization status of releases could feed financing or diligence workflows that need stronger evidence than a document folder can provide.
