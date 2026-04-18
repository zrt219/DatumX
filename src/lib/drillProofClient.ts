import { BaseError, decodeErrorResult, pad, stringToHex, type Address, type Hex } from 'viem'
import type { DatasetStage, DatasetSubmissionDraft, ReviewSubmissionDraft } from '../types'
import { drillProofContracts, hasLiveProtocolConfig, liveCompatibilityNotice } from './contracts'
import { publicClient, getWalletClient } from './web3'
import { XRPL_TX_DEFAULTS } from './web3Config'

const ZERO_BYTES32 = `0x${'0'.repeat(64)}` as const
const VALIDATION_MODULE_NAME = 'ValidationModule'
const REVIEW_FUNCTION_NAME = 'submitReview'

const drillProofAccessAbi = [
  {
    type: 'function',
    name: 'VALIDATOR_ROLE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'hasRole',
    stateMutability: 'view',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
] as const

type OnchainDatasetRecord = {
  datasetId: bigint
  projectKey: Hex
  datasetType: number
  status: number
  contentHash: Hex
  parentDatasetHash: Hex
  uri: string
  schemaVersion: number
  recordCount: number
  aggregateConfidenceBps: number
  approvalCount: number
  rejectionCount: number
  submitter: Address
  createdAt: bigint
  updatedAt: bigint
  finalizedAt: bigint
}

type OnchainReviewRecord = {
  exists: boolean
  approved: boolean
  confidenceBps: number
  reviewUri: string
  reviewer: Address
  createdAt: bigint
}

type OnchainProjectMetadata = {
  name: string
  basin: string
  commodity: string
  depositType: string
  jurisdiction: string
  active: boolean
  adapter: Address
}

type DecodedContractError = {
  errorName: string
  args?: unknown
}

type ReviewDiagnostics = {
  chainId: {
    wallet: number
    rpc: number
  }
  contract: {
    validationModule: Address
    accessController?: Address
    datasetRegistry?: Address
    projectRegistry?: Address
    bytecodePresent?: boolean
  }
  caller: Address
  functionName: typeof REVIEW_FUNCTION_NAME
  args: {
    serialized: string
    datasetId: bigint
    datasetLabel: string
    approved: boolean
    decisionWireValue: 0 | 1
    confidenceBps: number
    confidencePercent: number
    confidenceEncoding: string
    reviewUri: string
  }
  dataset?: {
    exists: boolean
    statusCode?: number
    statusLabel?: string
    acceptsReview?: boolean
    approvalCount?: number
    rejectionCount?: number
    aggregateConfidenceBps?: number
    schemaVersion?: number
    projectKey?: Hex
    uri?: string
  }
  project?: {
    key?: Hex
    adapterAddress?: Address
    active?: boolean
  }
  reviewer: {
    hasValidatorRole?: boolean
    existingReview?: {
      exists: boolean
      approved?: boolean
      confidenceBps?: number
      reviewUri?: string
    }
  }
  simulation?: {
    ok?: boolean
    revert?: DecodedContractError | null
  }
}

const DATASET_STAGE_ENUM: Record<DatasetStage, number> = {
  'Raw Scan Batch': 0,
  'Extracted Gamma Traces': 1,
  'Interpreted Mineralized Intervals': 2,
  'Composite Summary': 3,
  'Targeting Package': 4,
}

function toBytes32Text(value: string) {
  return pad(stringToHex(value), { size: 32 })
}

function requireContractAddress(address: `0x${string}` | undefined, contractName: string) {
  if (!address) {
    throw new Error(`${contractName} address is not configured for live XRPL EVM usage.`)
  }
  return address
}

function toDebugJson(value: unknown) {
  return JSON.stringify(value, (_, currentValue) => (typeof currentValue === 'bigint' ? currentValue.toString() : currentValue), 2)
}

function logReviewDebug(label: string, diagnostics: ReviewDiagnostics) {
  console.groupCollapsed(`[DatumX][submitReview] ${label}`)
  console.log(diagnostics)
  console.groupEnd()
}

function createDebuggableError(message: string, diagnostics: ReviewDiagnostics, txHash?: `0x${string}`) {
  return Object.assign(new Error(message), { diagnostics, txHash })
}

function datasetIdToLabel(datasetId: bigint | number) {
  return `DS-${String(datasetId).padStart(3, '0')}`
}

function datasetStatusLabel(status: number) {
  if (status === 0) return 'Submitted'
  if (status === 1) return 'In Review'
  if (status === 2) return 'Approved'
  if (status === 3) return 'Rejected'
  if (status === 4) return 'Finalized'
  return `Unknown(${status})`
}

function decodeContractError(error: unknown, abi: typeof drillProofContracts.validationModule.abi): DecodedContractError | null {
  const rawData =
    typeof error === 'object' && error !== null && 'data' in error
      ? (error as { data?: unknown }).data
      : typeof error === 'object' && error !== null && 'cause' in error
        ? (error as { cause?: { data?: unknown } }).cause?.data
        : undefined

  if (!rawData) return null

  if (typeof rawData === 'string') {
    try {
      const decoded = decodeErrorResult({ abi, data: rawData as Hex })
      return {
        errorName: decoded.errorName,
        args: decoded.args,
      }
    } catch {
      return null
    }
  }

  if (typeof rawData === 'object' && rawData !== null) {
    const errorName =
      'errorName' in rawData && typeof rawData.errorName === 'string'
        ? rawData.errorName
        : 'abiItem' in rawData &&
            typeof rawData.abiItem === 'object' &&
            rawData.abiItem !== null &&
            'name' in rawData.abiItem &&
            typeof rawData.abiItem.name === 'string'
          ? rawData.abiItem.name
          : undefined

    if (errorName) {
      return {
        errorName,
        args: 'args' in rawData ? (rawData as { args?: unknown }).args : undefined,
      }
    }
  }

  return null
}

function buildSubmitReviewErrorMessage(decodedError: DecodedContractError | null, diagnostics: ReviewDiagnostics) {
  const datasetLabel = diagnostics.args.datasetLabel
  const confidenceHelp = 'Review confidence must be encoded as uint16 basis points between 0 and 10000. Example: 85.00% => 8500.'

  switch (decodedError?.errorName) {
    case 'Unauthorized':
    case 'AccessControlUnauthorizedAccount':
      return `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted: reviewer ${diagnostics.caller} is not authorized as a validator on XRPL EVM Testnet.`
    case 'ReviewAlreadySubmitted':
      return `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted: reviewer ${diagnostics.caller} has already submitted a review for ${datasetLabel}.`
    case 'DatasetNotFound':
      return `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted: ${datasetLabel} does not exist on the active XRPL deployment.`
    case 'SubmissionClosed':
      return `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted: ${datasetLabel} is ${diagnostics.dataset?.statusLabel ?? 'closed'} and no longer accepts review submissions.`
    case 'InvalidConfidence':
      return `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted: invalid confidence encoding. ${confidenceHelp}`
    case 'EmptyUri':
      return `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted: review URI is empty.`
    case 'ProtocolPaused':
    case 'EnforcedPause':
      return `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted: the DatumX protocol is currently paused.`
    default:
      return decodedError
        ? `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted with ${decodedError.errorName}.`
        : `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} reverted on XRPL EVM, but the node did not return a decodable custom error.`
  }
}

function formatTxError(error: unknown, contractName: string, functionName: string) {
  const message = error instanceof Error ? error.message : 'Unknown transaction failure.'

  if (message.startsWith(`${contractName}.${functionName}`)) {
    return message
  }

  if (message.includes('User rejected') || message.includes('rejected')) {
    return `${contractName}.${functionName} was rejected in the wallet.`
  }

  if (message.includes('execution reverted') || message.includes('unknown reason')) {
    return `${contractName}.${functionName} reverted on XRPL EVM. The node did not return a custom revert payload, so inspect the receipt and protocol-state preconditions.`
  }

  if (message.includes('insufficient funds')) {
    return `${contractName}.${functionName} could not be broadcast because the connected account does not have enough XRP for gas.`
  }

  return `${contractName}.${functionName} failed: ${message}`
}

function createReceiptFailure(message: string, txHash: `0x${string}`) {
  return Object.assign(new Error(message), { txHash })
}

async function buildReviewDiagnostics(
  draft: ReviewSubmissionDraft,
  account: Address,
  validationModuleAddress: Address,
  walletChainId: number,
): Promise<ReviewDiagnostics> {
  const reviewArgs = [BigInt(draft.datasetId), draft.approved, draft.confidenceBps, draft.reviewUri] as const
  const rpcChainId = await publicClient.getChainId()

  const diagnostics: ReviewDiagnostics = {
    chainId: {
      wallet: walletChainId,
      rpc: rpcChainId,
    },
    contract: {
      validationModule: validationModuleAddress,
    },
    caller: account,
    functionName: REVIEW_FUNCTION_NAME,
    args: {
      serialized: toDebugJson(reviewArgs),
      datasetId: reviewArgs[0],
      datasetLabel: datasetIdToLabel(reviewArgs[0]),
      approved: draft.approved,
      decisionWireValue: draft.approved ? 1 : 0,
      confidenceBps: draft.confidenceBps,
      confidencePercent: draft.confidenceBps / 100,
      confidenceEncoding: 'uint16 basis points (0-10000). Example: 85.00% => 8500.',
      reviewUri: draft.reviewUri,
    },
    reviewer: {},
  }

  diagnostics.contract.bytecodePresent = Boolean(await publicClient.getBytecode({ address: validationModuleAddress }))

  const [accessController, datasetRegistry] = await Promise.all([
    publicClient.readContract({
      address: validationModuleAddress,
      abi: drillProofContracts.validationModule.abi,
      functionName: 'accessController',
    }) as Promise<Address>,
    publicClient.readContract({
      address: validationModuleAddress,
      abi: drillProofContracts.validationModule.abi,
      functionName: 'datasetRegistry',
    }) as Promise<Address>,
  ])

  diagnostics.contract.accessController = accessController
  diagnostics.contract.datasetRegistry = datasetRegistry

  const [validatorRole, paused] = await Promise.all([
    publicClient.readContract({
      address: accessController,
      abi: drillProofAccessAbi,
      functionName: 'VALIDATOR_ROLE',
    }) as Promise<Hex>,
    publicClient.readContract({
      address: accessController,
      abi: drillProofAccessAbi,
      functionName: 'paused',
    }) as Promise<boolean>,
  ])

  diagnostics.reviewer.hasValidatorRole = await publicClient.readContract({
    address: accessController,
    abi: drillProofAccessAbi,
    functionName: 'hasRole',
    args: [validatorRole, account],
  }) as boolean

  if (paused) {
    diagnostics.simulation = {
      ok: false,
      revert: { errorName: 'ProtocolPaused' },
    }
  }

  let dataset: OnchainDatasetRecord | undefined
  try {
    dataset = await publicClient.readContract({
      address: datasetRegistry,
      abi: drillProofContracts.datasetRegistry.abi,
      functionName: 'getDataset',
      args: [BigInt(draft.datasetId)],
    }) as OnchainDatasetRecord

    diagnostics.dataset = {
      exists: true,
      statusCode: dataset.status,
      statusLabel: datasetStatusLabel(dataset.status),
      acceptsReview: dataset.status === 0 || dataset.status === 1,
      approvalCount: dataset.approvalCount,
      rejectionCount: dataset.rejectionCount,
      aggregateConfidenceBps: dataset.aggregateConfidenceBps,
      schemaVersion: dataset.schemaVersion,
      projectKey: dataset.projectKey,
      uri: dataset.uri,
    }

    const projectRegistryAddress = await publicClient.readContract({
      address: datasetRegistry,
      abi: drillProofContracts.datasetRegistry.abi,
      functionName: 'projectRegistry',
    }) as Address

    diagnostics.contract.projectRegistry = projectRegistryAddress

    const project = await publicClient.readContract({
      address: projectRegistryAddress,
      abi: drillProofContracts.projectRegistry.abi,
      functionName: 'getProject',
      args: [dataset.projectKey],
    }) as OnchainProjectMetadata

    diagnostics.project = {
      key: dataset.projectKey,
      adapterAddress: project.adapter,
      active: project.active,
    }
  } catch {
    diagnostics.dataset = {
      exists: false,
      acceptsReview: false,
    }
  }

  const existingReview = await publicClient.readContract({
    address: validationModuleAddress,
    abi: drillProofContracts.validationModule.abi,
    functionName: 'getReview',
    args: [BigInt(draft.datasetId), account],
  }) as OnchainReviewRecord

  diagnostics.reviewer.existingReview = existingReview.exists
    ? {
        exists: true,
        approved: existingReview.approved,
        confidenceBps: existingReview.confidenceBps,
        reviewUri: existingReview.reviewUri,
      }
    : { exists: false }

  return diagnostics
}

export function getSubmissionPrefix(projectKey: string) {
  if (projectKey === 'SHIRLEY_CENTRAL') return 'SC-'
  if (projectKey === 'SHIRLEY_EAST') return 'SE-'
  return 'DC-'
}

export function projectKeyToBytes32(projectKey: string) {
  return toBytes32Text(projectKey)
}

export function toAdapterPayload(draft: DatasetSubmissionDraft) {
  return {
    datasetType: DATASET_STAGE_ENUM[draft.datasetType],
    schemaVersion: draft.schemaVersion,
    recordCount: draft.recordCount,
    claimedConfidenceBps: draft.claimedConfidenceBps,
    sourceHash: draft.sourceHash,
    transformHash: draft.transformHash,
    submissionId: draft.submissionId,
  } as const
}

export async function checkDrillProofCompatibility() {
  if (!hasLiveProtocolConfig()) {
    return {
      compatible: false,
      message: liveCompatibilityNotice,
    }
  }

  try {
    const projectRegistryAddress = requireContractAddress(drillProofContracts.projectRegistry.address, 'ProjectRegistry')
    const projectRouterAddress = requireContractAddress(drillProofContracts.projectRouter.address, 'ProjectRouter')
    const validationModuleAddress = requireContractAddress(drillProofContracts.validationModule.address, 'ValidationModule')

    const [projectRegistryBytecode, projectRouterBytecode, validationModuleBytecode] = await Promise.all([
      publicClient.getBytecode({ address: projectRegistryAddress }),
      publicClient.getBytecode({ address: projectRouterAddress }),
      publicClient.getBytecode({ address: validationModuleAddress }),
    ])

    if (!projectRegistryBytecode || !projectRouterBytecode || !validationModuleBytecode) {
      return {
        compatible: false,
        message: 'One or more configured DatumX contracts do not have bytecode on XRPL EVM Testnet.',
      }
    }

    await Promise.all([
      publicClient.readContract({
        address: projectRegistryAddress,
        abi: drillProofContracts.projectRegistry.abi,
        functionName: 'getProjectKeys',
      }),
      publicClient.readContract({
        address: validationModuleAddress,
        abi: drillProofContracts.validationModule.abi,
        functionName: 'getThresholds',
      }),
    ])

    return {
      compatible: true,
      message: 'Live DatumX protocol deployment detected on XRPL EVM Testnet.',
    }
  } catch {
    return {
      compatible: false,
      message: liveCompatibilityNotice,
    }
  }
}

export async function submitDatasetTransaction(draft: DatasetSubmissionDraft) {
  const walletClient = getWalletClient()
  if (!walletClient) throw new Error('Wallet client unavailable.')

  const [account] = await walletClient.getAddresses()
  if (!account) throw new Error('No connected account available for dataset submission.')
  const projectRouterAddress = requireContractAddress(drillProofContracts.projectRouter.address, 'ProjectRouter')

  try {
    const txHash = await walletClient.writeContract({
      address: projectRouterAddress,
      abi: drillProofContracts.projectRouter.abi,
      account,
      functionName: 'submitDataset',
      args: [projectKeyToBytes32(draft.projectKey), toAdapterPayload(draft), draft.uri, draft.parentDatasetHash ?? ZERO_BYTES32],
      gas: XRPL_TX_DEFAULTS.gasLimits.datasetSubmit,
      gasPrice: XRPL_TX_DEFAULTS.legacyGasPrice,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (receipt.status !== 'success') {
      throw createReceiptFailure('ProjectRouter.submitDataset was broadcast, but the XRPL receipt shows a failed execution.', txHash)
    }
    return receipt
  } catch (error) {
    const txHash = typeof error === 'object' && error !== null && 'txHash' in error ? (error as { txHash?: `0x${string}` }).txHash : undefined
    throw Object.assign(new Error(formatTxError(error, 'ProjectRouter', 'submitDataset')), txHash ? { txHash } : {})
  }
}

export async function submitReviewTransaction(draft: ReviewSubmissionDraft) {
  const walletClient = getWalletClient()
  if (!walletClient) throw new Error('Wallet client unavailable.')

  const [account] = await walletClient.getAddresses()
  if (!account) throw new Error('No connected account available for review submission.')
  const validationModuleAddress = requireContractAddress(drillProofContracts.validationModule.address, 'ValidationModule')
  const walletChainId = await walletClient.getChainId()
  const diagnostics = await buildReviewDiagnostics(draft, account, validationModuleAddress, walletChainId)

  logReviewDebug('preflight', diagnostics)

  if (diagnostics.chainId.wallet !== diagnostics.chainId.rpc) {
    const message = `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} failed: wrong chain. Wallet is on ${diagnostics.chainId.wallet}, but the configured XRPL RPC is on ${diagnostics.chainId.rpc}.`
    console.error('[DatumX][submitReview] chain mismatch', diagnostics)
    throw createDebuggableError(message, diagnostics)
  }

  try {
    await publicClient.simulateContract({
      address: validationModuleAddress,
      abi: drillProofContracts.validationModule.abi,
      account,
      functionName: REVIEW_FUNCTION_NAME,
      args: [BigInt(draft.datasetId), draft.approved, draft.confidenceBps, draft.reviewUri],
      gas: XRPL_TX_DEFAULTS.gasLimits.reviewSubmit,
      gasPrice: XRPL_TX_DEFAULTS.legacyGasPrice,
    })

    diagnostics.simulation = { ok: true }
    logReviewDebug('simulate:ok', diagnostics)

    const txHash = await walletClient.writeContract({
      address: validationModuleAddress,
      abi: drillProofContracts.validationModule.abi,
      account,
      functionName: REVIEW_FUNCTION_NAME,
      args: [BigInt(draft.datasetId), draft.approved, draft.confidenceBps, draft.reviewUri],
      gas: XRPL_TX_DEFAULTS.gasLimits.reviewSubmit,
      gasPrice: XRPL_TX_DEFAULTS.legacyGasPrice,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (receipt.status !== 'success') {
      const message = `${VALIDATION_MODULE_NAME}.${REVIEW_FUNCTION_NAME} was broadcast to ${validationModuleAddress}, but the XRPL receipt still failed. Preflight passed, so protocol state likely changed between simulation and inclusion.`
      console.error('[DatumX][submitReview] receipt failed after simulate', diagnostics)
      throw createDebuggableError(message, diagnostics, txHash)
    }
    return receipt
  } catch (error) {
    const decodedError = decodeContractError(error, drillProofContracts.validationModule.abi)
    if (decodedError) {
      diagnostics.simulation = {
        ok: false,
        revert: decodedError,
      }
      const message = buildSubmitReviewErrorMessage(decodedError, diagnostics)
      console.error('[DatumX][submitReview] simulate/write failed', diagnostics)
      throw createDebuggableError(message, diagnostics)
    }

    const txHash = typeof error === 'object' && error !== null && 'txHash' in error ? (error as { txHash?: `0x${string}` }).txHash : undefined
    if (error instanceof BaseError) {
      console.error('[DatumX][submitReview] unhandled viem error', {
        diagnostics,
        shortMessage: error.shortMessage,
        details: error.details,
      })
    } else {
      console.error('[DatumX][submitReview] unhandled error', { diagnostics, error })
    }
    throw Object.assign(new Error(formatTxError(error, 'ValidationModule', 'submitReview')), txHash ? { txHash } : {})
  }
}

export async function finalizeDatasetTransaction(datasetId: number) {
  const walletClient = getWalletClient()
  if (!walletClient) throw new Error('Wallet client unavailable.')

  const [account] = await walletClient.getAddresses()
  if (!account) throw new Error('No connected account available for dataset finalization.')
  const validationModuleAddress = requireContractAddress(drillProofContracts.validationModule.address, 'ValidationModule')

  try {
    const txHash = await walletClient.writeContract({
      address: validationModuleAddress,
      abi: drillProofContracts.validationModule.abi,
      account,
      functionName: 'finalizeDataset',
      args: [BigInt(datasetId)],
      gas: XRPL_TX_DEFAULTS.gasLimits.finalizeDataset,
      gasPrice: XRPL_TX_DEFAULTS.legacyGasPrice,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (receipt.status !== 'success') {
      throw createReceiptFailure('ValidationModule.finalizeDataset was broadcast, but the XRPL receipt shows a failed execution.', txHash)
    }
    return receipt
  } catch (error) {
    const txHash = typeof error === 'object' && error !== null && 'txHash' in error ? (error as { txHash?: `0x${string}` }).txHash : undefined
    throw Object.assign(new Error(formatTxError(error, 'ValidationModule', 'finalizeDataset')), txHash ? { txHash } : {})
  }
}
