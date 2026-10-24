// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BotChainDatasetRegistry
 * @notice Isolated, high-integrity dataset registry for the DatumX × BOT Chain technical pilot.
 * @dev Stores cryptographic proofs (SHA-256 hashes), versions, and public metadata references
 *      without persisting raw data payloads on-chain.
 */
contract BotChainDatasetRegistry {
    struct DatasetRecord {
        bytes32 datasetId;
        bytes32 datasetHash;
        string version;
        string metadataURI;
        address submitter;
        uint64 timestamp;
        bool exists;
    }

    address public owner;
    bool public publicRegistrationEnabled;

    mapping(bytes32 => DatasetRecord) private _records;
    mapping(address => bool) public authorizedSubmitters;
    bytes32[] private _recordIds;

    event DatasetRegistered(
        bytes32 indexed datasetId,
        bytes32 indexed datasetHash,
        string version,
        string metadataURI,
        address indexed submitter,
        uint64 timestamp
    );
    event SubmitterAuthorizationChanged(address indexed submitter, bool authorized);
    event PublicRegistrationToggled(bool enabled);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error Unauthorized();
    error ZeroAddress();
    error EmptyIdentifier();
    error EmptyHash();
    error EmptyVersion();
    error RecordAlreadyExists();
    error RecordNotFound();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier canRegister() {
        if (!publicRegistrationEnabled && msg.sender != owner && !authorizedSubmitters[msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    constructor(bool allowPublicRegistration) {
        owner = msg.sender;
        publicRegistrationEnabled = allowPublicRegistration;
        emit OwnershipTransferred(address(0), msg.sender);
        if (allowPublicRegistration) {
            emit PublicRegistrationToggled(true);
        }
    }

    function setPublicRegistration(bool enabled) external onlyOwner {
        publicRegistrationEnabled = enabled;
        emit PublicRegistrationToggled(enabled);
    }

    function setAuthorizedSubmitter(address submitter, bool authorized) external onlyOwner {
        if (submitter == address(0)) revert ZeroAddress();
        authorizedSubmitters[submitter] = authorized;
        emit SubmitterAuthorizationChanged(submitter, authorized);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Register a new dataset record with its canonical content hash.
     * @param datasetId Unique identifier for the dataset (e.g. keccak256("SYNTH-001"))
     * @param datasetHash Cryptographic content hash (e.g. SHA-256 of canonical JSON payload)
     * @param version Version identifier (e.g. "1.0.0")
     * @param metadataURI Off-chain metadata URI (e.g. ipfs://... or https://...)
     */
    function registerDataset(
        bytes32 datasetId,
        bytes32 datasetHash,
        string calldata version,
        string calldata metadataURI
    ) external canRegister returns (bool) {
        if (datasetId == bytes32(0)) revert EmptyIdentifier();
        if (datasetHash == bytes32(0)) revert EmptyHash();
        if (bytes(version).length == 0) revert EmptyVersion();
        if (_records[datasetId].exists) revert RecordAlreadyExists();

        uint64 currentTimestamp = uint64(block.timestamp);

        _records[datasetId] = DatasetRecord({
            datasetId: datasetId,
            datasetHash: datasetHash,
            version: version,
            metadataURI: metadataURI,
            submitter: msg.sender,
            timestamp: currentTimestamp,
            exists: true
        });

        _recordIds.push(datasetId);

        emit DatasetRegistered(datasetId, datasetHash, version, metadataURI, msg.sender, currentTimestamp);
        return true;
    }

    /**
     * @notice Retrieve an existing dataset record by identifier.
     * @param datasetId Identifier of the dataset.
     */
    function getDataset(bytes32 datasetId) external view returns (DatasetRecord memory) {
        DatasetRecord memory record = _records[datasetId];
        if (!record.exists) revert RecordNotFound();
        return record;
    }

    /**
     * @notice Check whether a given content hash matches the stored record.
     * @param datasetId Identifier of the dataset.
     * @param candidateHash Candidate hash to compare against.
     */
    function verifyDatasetHash(bytes32 datasetId, bytes32 candidateHash) external view returns (bool) {
        DatasetRecord memory record = _records[datasetId];
        if (!record.exists) revert RecordNotFound();
        return record.datasetHash == candidateHash;
    }

    /**
     * @notice Returns total number of registered records.
     */
    function totalRecords() external view returns (uint256) {
        return _recordIds.length;
    }

    /**
     * @notice Returns record identifier at index.
     */
    function getRecordIdAt(uint256 index) external view returns (bytes32) {
        require(index < _recordIds.length, "Index out of bounds");
        return _recordIds[index];
    }
}
