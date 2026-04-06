export const projectRegistryAbi = [
  {
    type: 'function',
    name: 'getProjectKeys',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'projectKeys', type: 'bytes32[]' }],
  },
  {
    type: 'function',
    name: 'getProject',
    stateMutability: 'view',
    inputs: [{ name: 'projectKey', type: 'bytes32' }],
    outputs: [
      {
        name: 'metadata',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'basin', type: 'string' },
          { name: 'commodity', type: 'string' },
          { name: 'depositType', type: 'string' },
          { name: 'jurisdiction', type: 'string' },
          { name: 'active', type: 'bool' },
          { name: 'adapter', type: 'address' },
        ],
      },
    ],
  },
] as const

export const datasetRegistryAbi = [
  {
    type: 'function',
    name: 'getProjectDatasetIds',
    stateMutability: 'view',
    inputs: [{ name: 'projectKey', type: 'bytes32' }],
    outputs: [{ name: 'datasetIds', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getDataset',
    stateMutability: 'view',
    inputs: [{ name: 'datasetId', type: 'uint256' }],
    outputs: [
      {
        name: 'dataset',
        type: 'tuple',
        components: [
          { name: 'datasetId', type: 'uint256' },
          { name: 'projectKey', type: 'bytes32' },
          { name: 'datasetType', type: 'uint8' },
          { name: 'status', type: 'uint8' },
          { name: 'contentHash', type: 'bytes32' },
          { name: 'parentDatasetHash', type: 'bytes32' },
          { name: 'uri', type: 'string' },
          { name: 'schemaVersion', type: 'uint16' },
          { name: 'recordCount', type: 'uint32' },
          { name: 'aggregateConfidenceBps', type: 'uint32' },
          { name: 'approvalCount', type: 'uint32' },
          { name: 'rejectionCount', type: 'uint32' },
          { name: 'submitter', type: 'address' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'updatedAt', type: 'uint64' },
          { name: 'finalizedAt', type: 'uint64' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getParentDatasetId',
    stateMutability: 'view',
    inputs: [{ name: 'datasetId', type: 'uint256' }],
    outputs: [{ name: 'parentDatasetId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getChildDatasetIds',
    stateMutability: 'view',
    inputs: [{ name: 'datasetId', type: 'uint256' }],
    outputs: [{ name: 'childDatasetIds', type: 'uint256[]' }],
  },
] as const

export const projectRouterAbi = [
  {
    type: 'function',
    name: 'submitDataset',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectKey', type: 'bytes32' },
      {
        name: 'payload',
        type: 'tuple',
        components: [
          { name: 'datasetType', type: 'uint8' },
          { name: 'schemaVersion', type: 'uint16' },
          { name: 'recordCount', type: 'uint32' },
          { name: 'claimedConfidenceBps', type: 'uint32' },
          { name: 'sourceHash', type: 'bytes32' },
          { name: 'transformHash', type: 'bytes32' },
          { name: 'submissionId', type: 'string' },
        ],
      },
      { name: 'uri', type: 'string' },
      { name: 'parentDatasetHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'datasetId', type: 'uint256' }],
  },
] as const

export const validationModuleAbi = [
  {
    type: 'function',
    name: 'submitReview',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'datasetId', type: 'uint256' },
      { name: 'approved', type: 'bool' },
      { name: 'confidenceBps', type: 'uint16' },
      { name: 'reviewUri', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getThresholds',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'minValidatorCount', type: 'uint16' },
          { name: 'minApprovalRatioBps', type: 'uint16' },
          { name: 'minConfidenceBps', type: 'uint16' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getReviewers',
    stateMutability: 'view',
    inputs: [{ name: 'datasetId', type: 'uint256' }],
    outputs: [{ name: 'reviewers', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getReview',
    stateMutability: 'view',
    inputs: [
      { name: 'datasetId', type: 'uint256' },
      { name: 'reviewer', type: 'address' },
    ],
    outputs: [
      {
        name: 'review',
        type: 'tuple',
        components: [
          { name: 'exists', type: 'bool' },
          { name: 'approved', type: 'bool' },
          { name: 'confidenceBps', type: 'uint16' },
          { name: 'reviewUri', type: 'string' },
          { name: 'reviewer', type: 'address' },
          { name: 'createdAt', type: 'uint64' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'finalizeDataset',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'datasetId', type: 'uint256' }],
    outputs: [],
  },
] as const
