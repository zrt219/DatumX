import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  getAddress,
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
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'
const PLACEHOLDER_ADDRESS = '0x1234567890123456789012345678901234567890'

function resolveRegistryAddress(targetChainId: number): `0x${string}` | undefined {
  return targetChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress ||
        config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress ||
        config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(BOTCHAIN_MAINNET.chainId))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress ||
        config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(BOTCHAIN_TESTNET.chainId))
}

function isUsableRegistryAddress(address?: string): address is `0x${string}` {
  if (!address || !isAddress(address)) return false
  const lower = address.toLowerCase()
  return lower !== ZERO_ADDRESS && lower !== PLACEHOLDER_ADDRESS
}

export function isBotchainContractConfigured(chainId?: number): boolean {
  let address: string | undefined
  if (chainId === BOTCHAIN_MAINNET.chainId) {
    address = config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677)
  } else if (chainId === BOTCHAIN_TESTNET.chainId) {
    address = config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968)
  } else {
    // If no chainId specified: check active testnet address for backwards compatibility with tests
    address = config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress
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
  const expectedChainId = targetChainId ?? (customClient === botchainMainnetPublicClient ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  const client = customClient || (expectedChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)
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
  const expectedChainId = targetChainId ?? BOTCHAIN_TESTNET.chainId
  const client = expectedChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient
  const network = expectedChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET

  const address = expectedChainId === BOTCHAIN_MAINNET.chainId
    ? (config.BOTCHAIN_MAINNET_CONFIG?.registryAddress || config.BOTCHAIN_PILOT_CONFIG?.mainnetRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(677))
    : (config.BOTCHAIN_PILOT_CONFIG?.pilotRegistryAddress || config.BOTCHAIN_PILOT_CONFIG?.getRegistryAddress?.(968))

  if (!isBotchainContractConfigured(expectedChainId) || !address) {
    throw new Error(`${network.name} registry contract address not configured.`)
  }

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
  const expectedChainId = targetChainId ?? BOTCHAIN_TESTNET.chainId
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
  const expectedChainId = targetChainId ?? BOTCHAIN_TESTNET.chainId
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
  const expectedChainId = targetChainId ?? BOTCHAIN_TESTNET.chainId
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
  publicClient?: typeof botchainPublicClient
}

export interface PreparedDatasetRegistration {
  registryAddress: `0x${string}`
  senderAddress: `0x${string}`
  datasetId: `0x${string}`
  datasetHash: `0x${string}`
  version: string
  metadataURI: string
  gasEstimate: bigint
  gasPriceWei: bigint
  estimatedCostWei: bigint
  estimatedCostBot: string
}

/**
 * Validates prerequisites, checks dataset ID uniqueness, simulates registerDataset with the intended
 * sender wallet, and estimates gas/BOT fee before requesting an explicit MetaMask signature.
 */
export async function prepareRegisterBotchainDataset(
  params: SubmitBotchainDatasetParams,
): Promise<PreparedDatasetRegistration> {
  if (!params.datasetId || params.datasetId.toLowerCase() === ZERO_BYTES32) {
    throw new Error('Dataset identifier bytes32 hash cannot be empty or zero.')
  }
  if (!params.datasetHash || params.datasetHash.toLowerCase() === ZERO_BYTES32) {
    throw new Error('Dataset content SHA-256 hash cannot be empty or zero.')
  }
  if (!params.version || !params.version.trim()) {
    throw new Error('Dataset version string is required.')
  }

  const targetChainId =
    params.targetChainId ??
    (params.walletChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  const network = targetChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const client =
    params.publicClient ||
    (targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)

  await validateRegistrationPrerequisites({
    walletChainId: params.walletChainId,
    account: params.account,
    targetChainId,
    publicClient: client,
  })

  const address = resolveRegistryAddress(targetChainId)
  if (!isUsableRegistryAddress(address)) {
    throw new Error(`No verified ${network.name} registry contract address configured.`)
  }

  const checksummedSender = getAddress(params.account)

  // Check duplicate dataset ID on-chain via direct O(1) getDataset read
  let duplicateFound = false
  try {
    const existing = await client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'getDataset',
      args: [params.datasetId],
    })
    if (
      existing &&
      typeof existing === 'object' &&
      'exists' in existing &&
      Boolean(existing.exists) &&
      existing.datasetHash &&
      existing.datasetHash.toLowerCase() !== ZERO_BYTES32
    ) {
      duplicateFound = true
    }
  } catch {
    // Expected revert (RecordNotFound / 0x3e07f1a1) when datasetId is unused
  }

  if (duplicateFound) {
    throw new Error(
      `Duplicate dataset ID: ${params.datasetId} is already registered on ${network.name}. Choose a new unique Dataset Identifier.`,
    )
  }

  // Simulate registerDataset with intended sender address
  if (typeof client.simulateContract === 'function') {
    try {
      await client.simulateContract({
        account: checksummedSender,
        address,
        abi: botChainRegistryAbi,
        functionName: 'registerDataset',
        args: [params.datasetId, params.datasetHash, params.version, params.metadataURI],
      })
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err)
      throw new Error(`Contract simulation failed for registerDataset: ${detail}`)
    }
  }

  const gasEstimate =
    typeof client.estimateContractGas === 'function'
      ? await client.estimateContractGas({
          account: checksummedSender,
          address,
          abi: botChainRegistryAbi,
          functionName: 'registerDataset',
          args: [params.datasetId, params.datasetHash, params.version, params.metadataURI],
        })
      : 225_000n

  const gasPriceWei = typeof client.getGasPrice === 'function' ? await client.getGasPrice() : 20_000_000_000n
  const estimatedCostWei = gasEstimate * gasPriceWei
  const balance = await client.getBalance({ address: checksummedSender }).catch(() => 0n)

  if (balance < estimatedCostWei) {
    throw new Error(
      `Insufficient BOT balance for estimated transaction fee: wallet has ${formatEther(balance)} BOT, requires ~${formatEther(estimatedCostWei)} BOT.`,
    )
  }

  return {
    registryAddress: address,
    senderAddress: checksummedSender,
    datasetId: params.datasetId,
    datasetHash: params.datasetHash,
    version: params.version,
    metadataURI: params.metadataURI,
    gasEstimate,
    gasPriceWei,
    estimatedCostWei,
    estimatedCostBot: formatEther(estimatedCostWei),
  }
}

/**
 * Submits dataset registration on BOT Chain with rigorous pre-flight simulation and receipt verification.
 */
export async function submitBotchainDataset(
  params: SubmitBotchainDatasetParams,
): Promise<Hex> {
  const targetChainId = params.targetChainId ?? (params.walletChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET.chainId : BOTCHAIN_TESTNET.chainId)
  const network = targetChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const chain = targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetChain : botchainTestnetChain
  const client =
    params.publicClient ||
    (targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)

  const prepared = await prepareRegisterBotchainDataset({
    ...params,
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

  // Submit on-chain transaction
  const txHash = await walletClient.writeContract({
    chain,
    account: prepared.senderAddress,
    address: prepared.registryAddress,
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

export interface SubmitterPermissionStatus {
  address: `0x${string}`
  owner: `0x${string}`
  isOwner: boolean
  isAuthorizedSubmitter: boolean
  publicRegistrationEnabled: boolean
  canRegister: boolean
  balanceWei: bigint
  balanceFormatted: string
}

/**
 * Reads live owner, allowlist permission, and gas balance for a candidate submitter wallet.
 */
export async function checkSubmitterPermissions(
  account: string,
  targetChainId: number = BOTCHAIN_MAINNET.chainId,
  customClient?: typeof botchainPublicClient,
): Promise<SubmitterPermissionStatus> {
  if (!isAddress(account) || account.toLowerCase() === ZERO_ADDRESS) {
    throw new Error(`Invalid wallet address: ${account}`)
  }

  const checksummed = getAddress(account)
  const network = targetChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const client = customClient || (targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)
  const address = resolveRegistryAddress(targetChainId)

  if (!isUsableRegistryAddress(address)) {
    throw new Error(`${network.name} registry contract address not configured.`)
  }

  const rpcChainId = await client.getChainId()
  if (rpcChainId !== network.chainId) {
    throw new Error(`BOT Chain RPC network mismatch: ${network.name} (Chain ID ${network.chainId}) required.`)
  }

  const bytecode = await client.getBytecode({ address })
  if (!bytecode || bytecode === '0x') {
    throw new Error(`BOT Chain contract bytecode not deployed at configured address: ${address}`)
  }

  const [ownerAddress, publicReg, isAllowed, balanceWei] = await Promise.all([
    client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'owner',
    }),
    client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'publicRegistrationEnabled',
    }),
    client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'authorizedSubmitters',
      args: [checksummed],
    }),
    client.getBalance({ address: checksummed }),
  ])

  const owner = getAddress(ownerAddress)
  const isOwner = owner.toLowerCase() === checksummed.toLowerCase()
  const isAuthorizedSubmitter = Boolean(isAllowed)
  const publicRegistrationEnabled = Boolean(publicReg)

  return {
    address: checksummed,
    owner,
    isOwner,
    isAuthorizedSubmitter,
    publicRegistrationEnabled,
    canRegister: publicRegistrationEnabled || isOwner || isAuthorizedSubmitter,
    balanceWei,
    balanceFormatted: formatEther(balanceWei),
  }
}

export interface SetAuthorizedSubmitterParams {
  ownerAccount: `0x${string}`
  submitter: string
  authorized: boolean
  walletChainId?: number
  targetChainId?: number
  publicClient?: typeof botchainPublicClient
}

export interface PreparedSubmitterAuthorization {
  registryAddress: `0x${string}`
  ownerAddress: `0x${string}`
  submitterAddress: `0x${string}`
  authorized: boolean
  alreadyInTargetState: boolean
  gasEstimate: bigint
  gasPriceWei: bigint
  estimatedCostWei: bigint
  estimatedCostBot: string
}

export interface ExecutedSubmitterAuthorization {
  txHash: Hex
  blockNumber: bigint | null
  registryAddress: `0x${string}`
  ownerAddress: `0x${string}`
  submitterAddress: `0x${string}`
  authorized: boolean
  receiptStatus: 'success' | 'reverted'
}

/**
 * Validates ownership, network, allowlist state, contract simulation, and gas estimate
 * prior to requesting an explicit MetaMask signature for setAuthorizedSubmitter.
 */
export async function prepareSetAuthorizedSubmitter(
  params: SetAuthorizedSubmitterParams,
): Promise<PreparedSubmitterAuthorization> {
  if (!isAddress(params.ownerAccount) || params.ownerAccount.toLowerCase() === ZERO_ADDRESS) {
    throw new Error('Connected owner wallet address is invalid.')
  }
  if (!isAddress(params.submitter) || params.submitter.toLowerCase() === ZERO_ADDRESS) {
    throw new Error(`Target submitter address is invalid or zero: ${params.submitter}`)
  }

  const checksummedOwner = getAddress(params.ownerAccount)
  const checksummedSubmitter = getAddress(params.submitter)
  const targetChainId = params.targetChainId ?? BOTCHAIN_MAINNET.chainId
  const network = targetChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const client = params.publicClient || (targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)

  if (params.walletChainId !== undefined && params.walletChainId !== network.chainId) {
    throw new Error(
      `Incorrect network: Connected wallet is on chain ID ${params.walletChainId}. ${network.name} (Chain ID ${network.chainId}) is required.`,
    )
  }

  const rpcChainId = await client.getChainId()
  if (rpcChainId !== network.chainId) {
    throw new Error(
      `Incorrect RPC network: Connected RPC is on chain ID ${rpcChainId}. ${network.name} (Chain ID ${network.chainId}) is required.`,
    )
  }

  const address = resolveRegistryAddress(targetChainId)
  if (!isUsableRegistryAddress(address)) {
    throw new Error(`No verified ${network.name} registry contract address configured.`)
  }

  const bytecode = await client.getBytecode({ address })
  if (!bytecode || bytecode === '0x') {
    throw new Error(`No contract bytecode deployed at configured address ${address} on ${network.name}.`)
  }

  const contractOwner = getAddress(
    await client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'owner',
    }),
  )

  if (contractOwner.toLowerCase() !== checksummedOwner.toLowerCase()) {
    throw new Error(
      `Owner authorization required: Connected wallet ${checksummedOwner} is not the contract owner (${contractOwner}).`,
    )
  }

  const currentlyAuthorized = Boolean(
    await client.readContract({
      address,
      abi: botChainRegistryAbi,
      functionName: 'authorizedSubmitters',
      args: [checksummedSubmitter],
    }),
  )

  if (currentlyAuthorized === params.authorized) {
    return {
      registryAddress: address,
      ownerAddress: contractOwner,
      submitterAddress: checksummedSubmitter,
      authorized: params.authorized,
      alreadyInTargetState: true,
      gasEstimate: 0n,
      gasPriceWei: 0n,
      estimatedCostWei: 0n,
      estimatedCostBot: '0',
    }
  }

  if (typeof client.simulateContract === 'function') {
    await client.simulateContract({
      account: checksummedOwner,
      address,
      abi: botChainRegistryAbi,
      functionName: 'setAuthorizedSubmitter',
      args: [checksummedSubmitter, params.authorized],
    })
  }

  const gasEstimate =
    typeof client.estimateContractGas === 'function'
      ? await client.estimateContractGas({
          account: checksummedOwner,
          address,
          abi: botChainRegistryAbi,
          functionName: 'setAuthorizedSubmitter',
          args: [checksummedSubmitter, params.authorized],
        })
      : 50_000n

  const gasPriceWei = typeof client.getGasPrice === 'function' ? await client.getGasPrice() : 20_000_000_000n
  const estimatedCostWei = gasEstimate * gasPriceWei

  return {
    registryAddress: address,
    ownerAddress: contractOwner,
    submitterAddress: checksummedSubmitter,
    authorized: params.authorized,
    alreadyInTargetState: false,
    gasEstimate,
    gasPriceWei,
    estimatedCostWei,
    estimatedCostBot: formatEther(estimatedCostWei),
  }
}

/**
 * Executes setAuthorizedSubmitter(submitter, authorized) via the connected MetaMask owner wallet,
 * waits for on-chain receipt confirmation, and verifies the resulting authorizedSubmitters state.
 */
export async function executeSetAuthorizedSubmitter(
  params: SetAuthorizedSubmitterParams,
): Promise<ExecutedSubmitterAuthorization> {
  const prepared = await prepareSetAuthorizedSubmitter(params)
  if (prepared.alreadyInTargetState) {
    throw new Error(
      `Wallet ${prepared.submitterAddress} already has authorizedSubmitters = ${params.authorized}. No transaction needed.`,
    )
  }

  const targetChainId = params.targetChainId ?? BOTCHAIN_MAINNET.chainId
  const network = targetChainId === BOTCHAIN_MAINNET.chainId ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET
  const chain = targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetChain : botchainTestnetChain
  const client = params.publicClient || (targetChainId === BOTCHAIN_MAINNET.chainId ? botchainMainnetPublicClient : botchainPublicClient)

  const walletClient = getBotchainWalletClient(targetChainId)
  if (!walletClient) {
    throw new Error(`No Ethereum wallet detected for ${network.name} owner signing.`)
  }

  const walletChain = await walletClient.getChainId()
  if (walletChain !== network.chainId) {
    throw new Error(`Wrong wallet chain: ${network.name} (Chain ID ${network.chainId}) required.`)
  }

  const accounts = await walletClient.getAddresses()
  if (!accounts.some((a) => a.toLowerCase() === prepared.ownerAddress.toLowerCase())) {
    throw new Error(`Wallet account mismatch: Active MetaMask account is not contract owner (${prepared.ownerAddress}).`)
  }

  const txHash = await walletClient.writeContract({
    chain,
    account: prepared.ownerAddress,
    address: prepared.registryAddress,
    abi: botChainRegistryAbi,
    functionName: 'setAuthorizedSubmitter',
    args: [prepared.submitterAddress, params.authorized],
  })

  const receipt = await client.waitForTransactionReceipt({ hash: txHash, confirmations: 1 })
  if (receipt.status !== 'success' || receipt.transactionHash.toLowerCase() !== txHash.toLowerCase()) {
    throw new Error(
      `Owner authorization transaction failed or reverted on-chain with status "${receipt.status}". Tx: ${txHash}`,
    )
  }

  const verifiedState = Boolean(
    await client.readContract({
      address: prepared.registryAddress,
      abi: botChainRegistryAbi,
      functionName: 'authorizedSubmitters',
      args: [prepared.submitterAddress],
    }),
  )

  if (verifiedState !== params.authorized) {
    throw new Error(
      `Post-receipt verification failed: authorizedSubmitters(${prepared.submitterAddress}) returned ${verifiedState}, expected ${params.authorized}.`,
    )
  }

  return {
    txHash,
    blockNumber: receipt.blockNumber ?? null,
    registryAddress: prepared.registryAddress,
    ownerAddress: prepared.ownerAddress,
    submitterAddress: prepared.submitterAddress,
    authorized: verifiedState,
    receiptStatus: receipt.status,
  }
}
