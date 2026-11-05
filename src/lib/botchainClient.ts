import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  type Hex,
} from 'viem'
import { botChainRegistryAbi } from './abi/botchainRegistryAbi'
import * as config from './botchainConfig'
import { getEthereumProvider } from './network'

export const BOTCHAIN_MAINNET: config.NetworkConfig = config.BOTCHAIN_MAINNET ?? {
  chainId: 677,
  chainIdHex: '0x2a5',
  name: 'BOT Chain Mainnet',
  rpcUrl: 'https://rpc.botchain.ai',
  blockExplorerUrl: 'https://scan.botchain.ai',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
}

export const BOTCHAIN_TESTNET: config.NetworkConfig = config.BOTCHAIN_TESTNET ?? {
  chainId: 968,
  chainIdHex: '0x3c8',
  name: 'Bohr Testnet',
  rpcUrl: 'https://rpc.bohr.life',
  blockExplorerUrl: 'https://scan.bohr.life',
  nativeCurrency: { name: 'Test BOT', symbol: 'BOT', decimals: 18 },
}

export const botchainMainnetChain = {
  id: BOTCHAIN_MAINNET.chainId,
  name: BOTCHAIN_MAINNET.name,
  nativeCurrency: BOTCHAIN_MAINNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [BOTCHAIN_MAINNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: BOTCHAIN_MAINNET.name,
      url: BOTCHAIN_MAINNET.blockExplorerUrl,
    },
  },
} as const

export const botchainTestnetChain = {
  id: BOTCHAIN_TESTNET.chainId,
  name: BOTCHAIN_TESTNET.name,
  nativeCurrency: BOTCHAIN_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [BOTCHAIN_TESTNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: BOTCHAIN_TESTNET.name,
      url: BOTCHAIN_TESTNET.blockExplorerUrl,
    },
  },
} as const

export const botchainMainnetPublicClient = createPublicClient({
  chain: botchainMainnetChain,
  transport: http(BOTCHAIN_MAINNET.rpcUrl),
})

export const botchainTestnetPublicClient = createPublicClient({
  chain: botchainTestnetChain,
  transport: http(BOTCHAIN_TESTNET.rpcUrl),
})

// Default publicClient for backwards compatibility
export const botchainPublicClient = botchainTestnetPublicClient

export function getBotchainPublicClient(chainId: number = BOTCHAIN_MAINNET.chainId) {
  if (chainId === BOTCHAIN_TESTNET.chainId) {
    return botchainTestnetPublicClient
  }
  return botchainMainnetPublicClient
}

export function getBotchainWalletClient(chainId: number = BOTCHAIN_MAINNET.chainId) {
  const provider = getEthereumProvider()
  if (!provider) return undefined

  const chain = chainId === BOTCHAIN_TESTNET.chainId ? botchainTestnetChain : botchainMainnetChain

  return createWalletClient({
    chain,
    transport: custom(provider),
  })
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function isBotchainContractConfigured(chainId?: number): boolean {
  let address: string | undefined
  if (chainId === BOTCHAIN_MAINNET.chainId) {
    address = config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677)
  } else if (chainId === BOTCHAIN_TESTNET.chainId) {
    address = config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968)
  } else {
    // If no chainId specified: check if testnet or mainnet address is configured
    address = config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_MAINNET_CONFIG?.registryAddress
  }
  if (!address) return false
  if (!isAddress(address)) return false
  const lower = address.toLowerCase()
  if (lower === ZERO_ADDRESS) return false
  if (lower === '0x1234567890123456789012345678901234567890') return false
  return true
}

export const isBotchainContractDeployed = isBotchainContractConfigured

export type RegistryDeploymentStatus =
  | 'UNCONFIGURED'
  | 'CHECKING'
  | 'LIVE_VERIFIED'
  | 'NOT_DEPLOYED'
  | 'WRONG_CHAIN'
  | 'RPC_ERROR'

export interface RegistryLiveCheckResult {
  status: RegistryDeploymentStatus
  address?: `0x${string}`
  error?: string
}

export async function checkBotchainRegistryLiveStatus(
  customClient?: typeof botchainPublicClient,
  targetChainId?: number,
): Promise<RegistryLiveCheckResult> {
  const client = customClient || (targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)

  // Target resolution:
  // If targetChainId is provided, use that.
  // Else if mainnet registry address is configured, default to mainnet.
  // Else default to testnet (for backward compatibility).
  const expectedChainId = targetChainId ?? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  const network = expectedChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET

  const address = expectedChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (!isBotchainContractConfigured(expectedChainId) || !address) {
    return { status: 'UNCONFIGURED' }
  }

  let rpcChainId: number
  try {
    rpcChainId = await client.getChainId()
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return { status: 'RPC_ERROR', address, error: `RPC network lookup failed: ${detail}` }
  }

  if (rpcChainId !== network.chainId) {
    return {
      status: 'WRONG_CHAIN',
      address,
      error: `Connected RPC is on chain ID ${rpcChainId}. ${network.name} (Chain ID ${network.chainId}) required.`,
    }
  }

  try {
    const bytecode = await client.getBytecode({ address })
    if (!bytecode || bytecode === '0x') {
      return {
        status: 'NOT_DEPLOYED',
        address,
        error: `No contract bytecode deployed at configured address ${address} on ${network.name}.`,
      }
    }

    await client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'publicRegistrationEnabled',
    })

    return { status: 'LIVE_VERIFIED', address }
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return {
      status: 'NOT_DEPLOYED',
      address,
      error: `Registry interface check failed at ${address}: ${detail}`,
    }
  }
}

export async function ensureRegistryExists(targetChainId?: number): Promise<void> {
  const expectedChainId = targetChainId ?? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  const client = expectedChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient
  const network = expectedChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET

  let rpcChainId: number
  try {
    rpcChainId = await client.getChainId()
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`RPC network lookup failed: ${detail}`)
  }

  if (rpcChainId !== network.chainId) {
    throw new Error(`BOT Chain RPC network mismatch: ${network.name} (Chain ID ${network.chainId}) required.`)
  }

  const address = expectedChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (!isBotchainContractConfigured(expectedChainId) || !address) {
    throw new Error(`${network.name} registry contract address not configured.`)
  }

  const bytecode = await client.getBytecode({ address })
  if (!bytecode || bytecode === '0x') {
    throw new Error(`BOT Chain contract bytecode not deployed at configured address: ${address}`)
  }
}

export interface RegistrationPrerequisiteOptions {
  walletChainId?: number
  account?: `0x${string}`
  publicClient?: typeof botchainPublicClient
  targetChainId?: number
}

/**
 * Validates all 5 mandatory prerequisites before enabling or executing live registration:
 * 1. Validate chain ID (wallet and RPC).
 * 2. Check that contract bytecode exists at the configured address.
 * 3. Validate the ABI and expected registry interface.
 * 4. Confirm the submitting wallet's permissions.
 * 5. Confirm sufficient gas.
 * 
 * Fails closed whenever any condition is unmet.
 */
export async function validateRegistrationPrerequisites(
  options: RegistrationPrerequisiteOptions = {},
): Promise<void> {
  let targetChainId = options.targetChainId
  if (!targetChainId) {
    if (options.walletChainId === BOTCHAIN_MAINNET.chainId || options.walletChainId === BOTCHAIN_TESTNET.chainId) {
      targetChainId = options.walletChainId
    } else {
      targetChainId = BOTCHAIN_TESTNET.chainId
    }
  }

  const network = targetChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const client = options.publicClient || (targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)
  const chainLabel = targetChainId === BOTCHAIN_MAINNET.chainId ? 'BOT Chain Mainnet' : 'Bohr Testnet'

  // 1. Validate chain ID (wallet and RPC)
  if (options.walletChainId !== undefined && options.walletChainId !== network.chainId) {
    throw new Error(
      `Incorrect network: Connected wallet is on chain ID ${options.walletChainId}. ${chainLabel} (chain ID ${network.chainId}) is required.`,
    )
  }

  let rpcChainId: number
  try {
    rpcChainId = await client.getChainId()
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`RPC network lookup failed: Unable to verify ${chainLabel} connection: ${detail}`)
  }

  if (rpcChainId !== network.chainId) {
    throw new Error(
      `Incorrect RPC network: Connected RPC is on chain ID ${rpcChainId}. ${chainLabel} (chain ID ${network.chainId}) is required.`,
    )
  }

  const address = targetChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (
    !address ||
    !isAddress(address) ||
    address.toLowerCase() === ZERO_ADDRESS ||
    address.toLowerCase() === '0x1234567890123456789012345678901234567890'
  ) {
    throw new Error(
      `No verified ${chainLabel} registry contract address configured. Set a valid address before initiating live on-chain operations.`,
    )
  }

  // 2. Check contract bytecode exists at configured address
  const bytecode = await client.getBytecode({ address }).catch(() => null)
  if (!bytecode || bytecode === '0x') {
    throw new Error(
      `No contract bytecode found at configured address ${address}. Deployment to ${chainLabel} is required.`,
    )
  }

  // 3. Validate ABI and expected registry interface
  try {
    await client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'publicRegistrationEnabled',
    })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Contract at ${address} does not implement the expected BotChainDatasetRegistry interface: ${detail}`,
    )
  }

  // 4. Confirm submitting wallet's permissions (if account provided)
  if (options.account) {
    const isPublic = await client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'publicRegistrationEnabled',
    })

    if (!isPublic) {
      const ownerAddress = await client.readContract({
        address,
        abi: botChainRegistryAbi,
        functionName: 'owner',
      })

      const isOwner = ownerAddress.toLowerCase() === options.account.toLowerCase()
      if (!isOwner) {
        const isAllowed = await client.readContract({
          address,
          abi: botChainRegistryAbi,
          functionName: 'authorizedSubmitters',
          args: [options.account],
        })

        if (!isAllowed) {
          throw new Error(
            `Submitting wallet ${options.account} lacks permission to register datasets (public registration is disabled and account is not allowlisted).`,
          )
        }
      }
    }
  }

  // 5. Confirm sufficient gas (if account provided)
  if (options.account) {
    const balance = await client.getBalance({ address: options.account }).catch(() => 0n)
    const minRequiredGasWei = 500_000_000_000_000n
    if (balance < minRequiredGasWei) {
      const gasType = targetChainId === BOTCHAIN_MAINNET.chainId ? 'Gas' : 'Faucet'
      throw new Error(
        `Insufficient gas funds on ${chainLabel}: Wallet ${options.account} has ${balance} wei. ${gasType} allocation required before submitting live transactions.`,
      )
    }
  }
}

export async function readBotchainDataset(datasetId: `0x${string}`, targetChainId?: number) {
  const expectedChainId = targetChainId ?? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  await ensureRegistryExists(expectedChainId)
  const client = expectedChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient
  const network = expectedChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const address = expectedChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (!address) {
    throw new Error(`BotChainDatasetRegistry is not deployed or configured on ${network.name}.`)
  }

  return client.readContract({
    address,
    abi: botChainRegistryAbi,
    functionName: 'getDataset',
    args: [datasetId],
  })
}

/**
 * Executes genuine on-chain smart contract hash verification via verifyDatasetHash(bytes32,bytes32).
 */
export async function verifyBotchainDatasetHash(
  datasetId: `0x${string}`,
  candidateHash: `0x${string}`,
  targetChainId?: number,
): Promise<boolean> {
  const expectedChainId = targetChainId ?? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  await ensureRegistryExists(expectedChainId)
  const client = expectedChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient
  const network = expectedChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const address = expectedChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (!address) {
    throw new Error(`BotChainDatasetRegistry is not deployed or configured on ${network.name}.`)
  }

  return client.readContract({
    address,
    abi: botChainRegistryAbi,
    functionName: 'verifyDatasetHash',
    args: [datasetId, candidateHash],
  })
}


/**
 * Fetches all registered dataset records from the active BOT Chain registry contract.
 */
export async function fetchAllBotchainDatasets(targetChainId?: number): Promise<Array<{
  datasetId: `0x${string}`
  datasetHash: `0x${string}`
  version: string
  metadataURI: string
  submitter: `0x${string}`
  timestamp: number
  exists: boolean
}>> {
  const expectedChainId = targetChainId ?? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  const client = expectedChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient
  const address = expectedChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (!address) return []

  try {
    const total = await client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'totalRecords',
    })

    const count = Number(total)
    const records = []
    for (let i = count - 1; i >= 0; i--) {
      try {
        const id = await client.readContract({
          address,
          abi: botChainRegistryAbi,
          functionName: 'getRecordIdAt',
          args: [BigInt(i)],
        })
        const dataset = await client.readContract({
          address,
          abi: botChainRegistryAbi,
          functionName: 'getDataset',
          args: [id],
        })
        records.push({
          datasetId: id,
          datasetHash: dataset.datasetHash,
          version: dataset.version,
          metadataURI: dataset.metadataURI,
          submitter: dataset.submitter,
          timestamp: Number(dataset.timestamp),
          exists: dataset.exists,
        })
      } catch (err) {
        console.warn(`Failed to read dataset at index ${i}:`, err)
      }
    }
    return records
  } catch (err) {
    console.warn('Failed to fetch totalRecords from BotChain registry:', err)
    return []
  }
}

export interface SubmitBotchainDatasetParams {
  account: `0x${string}`
  datasetId: `0x${string}`
  datasetHash: `0x${string}`
  version: string
  metadataURI: string
  walletChainId?: number
  targetChainId?: number
}

/**
 * Submits dataset registration on BOT Chain with rigorous end-to-end verification.
 */
export async function submitBotchainDataset(
  params: SubmitBotchainDatasetParams,
): Promise<Hex> {
  const targetChainId = params.targetChainId ?? (params.walletChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  const network = targetChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const chain = targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetChain : botchainTestnetChain
  const client = targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient

  // Validate all 5 prerequisites fail-closed before broadcasting
  await validateRegistrationPrerequisites({
    walletChainId: params.walletChainId,
    account: params.account,
    targetChainId,
    publicClient: client,
  })

  const walletClient = getBotchainWalletClient(targetChainId)
  if (!walletClient) {
    throw new Error(`No Ethereum wallet connected for ${network.name} transaction.`)
  }

  const actualChain = await walletClient.getChainId()
  if (actualChain !== network.chainId) {
    throw new Error(`Wrong wallet chain: ${network.name} (Chain ID ${network.chainId}) required.`)
  }

  if (params.walletChainId !== undefined && params.walletChainId !== network.chainId) {
    throw new Error(`Wrong wallet chain: ${network.name} (Chain ID ${network.chainId}) required.`)
  }

  const accounts = await walletClient.getAddresses()
  if (!accounts.some((a) => a.toLowerCase() === params.account.toLowerCase())) {
    throw new Error('Wallet account mismatch: Connected account does not match requested signer.')
  }

  const address = targetChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (!address) {
    throw new Error('Registry address not configured.')
  }

  // Submit on-chain transaction
  const txHash = await walletClient.writeContract({
    chain,
    account: params.account,
    address,
    abi: botChainRegistryAbi,
    functionName: 'registerDataset',
    args: [params.datasetId, params.datasetHash, params.version, params.metadataURI],
  })

  // Wait for actual transaction receipt
  const receipt = await client.waitForTransactionReceipt({ hash: txHash, confirmations: 1 })

  // Require successful status
  if (receipt.status !== 'success' || receipt.transactionHash.toLowerCase() !== txHash.toLowerCase()) {
    throw new Error(
      `BOT Chain transaction failed or reverted on-chain with status "${receipt.status}". Tx: ${txHash}`,
    )
  }

  return txHash
}
