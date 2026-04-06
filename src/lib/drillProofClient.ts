import { pad, stringToHex } from 'viem'
import type { DatasetStage, DatasetSubmissionDraft, ReviewSubmissionDraft } from '../types'
import { drillProofContracts, hasLiveProtocolConfig, liveCompatibilityNotice } from './contracts'
import { publicClient, getWalletClient } from './web3'
import { XRPL_TX_DEFAULTS } from './web3Config'

const ZERO_BYTES32 = `0x${'0'.repeat(64)}` as const

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

function formatTxError(error: unknown, contractName: string, functionName: string) {
  const message = error instanceof Error ? error.message : 'Unknown transaction failure.'

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

  try {
    const txHash = await walletClient.writeContract({
      address: validationModuleAddress,
      abi: drillProofContracts.validationModule.abi,
      account,
      functionName: 'submitReview',
      args: [BigInt(draft.datasetId), draft.approved, draft.confidenceBps, draft.reviewUri],
      gas: XRPL_TX_DEFAULTS.gasLimits.reviewSubmit,
      gasPrice: XRPL_TX_DEFAULTS.legacyGasPrice,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (receipt.status !== 'success') {
      throw createReceiptFailure('ValidationModule.submitReview was broadcast, but the XRPL receipt shows a failed execution.', txHash)
    }
    return receipt
  } catch (error) {
    const txHash = typeof error === 'object' && error !== null && 'txHash' in error ? (error as { txHash?: `0x${string}` }).txHash : undefined
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
