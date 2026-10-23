import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  type Hex,
} from 'viem'
import { botChainRegistryAbi } from './abi/botchainRegistryAbi'
import { BOTCHAIN_PILOT_CONFIG, BOTCHAIN_TESTNET } from './botchainConfig'
import { getEthereumProvider } from './network'

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

export const botchainPublicClient = createPublicClient({
  chain: botchainTestnetChain,
  transport: http(BOTCHAIN_TESTNET.rpcUrl),
})

export function getBotchainWalletClient() {
  const provider = getEthereumProvider()
  if (!provider) return undefined

  return createWalletClient({
    chain: botchainTestnetChain,
    transport: custom(provider),
  })
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function isBotchainContractDeployed(): boolean {
  const address = BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress
  if (!address) return false
  if (!isAddress(address)) return false
  const lower = address.toLowerCase()
  if (lower === ZERO_ADDRESS) return false
  if (lower === '0x1234567890123456789012345678901234567890') return false
  return true
}

export async function ensureRegistryExists(): Promise<void> {
  const chainId = await botchainPublicClient.getChainId()
  if (chainId !== BOTCHAIN_TESTNET.chainId) {
    throw new Error('BOT Chain RPC network mismatch: Bohr Testnet (Chain ID 968) required.')
  }
  const address = BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress
  if (!isBotchainContractDeployed() || !address) {
    throw new Error('BOT Chain registry contract address not configured.')
  }
  const bytecode = await botchainPublicClient.getBytecode({ address })
  if (!bytecode || bytecode === '0x') {
    throw new Error(`BOT Chain contract bytecode not deployed at configured address: ${address}`)
  }
}

export interface RegistrationPrerequisiteOptions {
  walletChainId?: number
  account?: `0x${string}`
  publicClient?: typeof botchainPublicClient
}

/**
 * Validates all 5 mandatory prerequisites before enabling or executing live registration:
 * 1. Validate chain ID 968.
 * 2. Check that contract bytecode exists at the configured address.
 * 3. Validate the ABI and expected registry interface.
 * 4. Confirm the submitting wallet's permissions.
 * 5. Confirm sufficient test gas.
 * 
 * Fails closed whenever any condition is unmet.
 */
export async function validateRegistrationPrerequisites(
  options: RegistrationPrerequisiteOptions = {},
): Promise<void> {
  const client = options.publicClient || botchainPublicClient

  // 1. Validate chain ID 968
  if (options.walletChainId !== undefined && options.walletChainId !== BOTCHAIN_TESTNET.chainId) {
    throw new Error(
      `Incorrect network: Connected wallet is on chain ID ${options.walletChainId}. Bohr Testnet (chain ID ${BOTCHAIN_TESTNET.chainId}) is required.`,
    )
  }

  const address = BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress
  if (!address || !isAddress(address) || address.toLowerCase() === ZERO_ADDRESS) {
    throw new Error(
      'No verified Bohr Testnet registry contract address configured. Set a valid address before initiating live on-chain operations.',
    )
  }

  // 2. Check contract bytecode exists at configured address
  const bytecode = await client.getBytecode({ address }).catch(() => null)
  if (!bytecode || bytecode === '0x') {
    throw new Error(
      `No contract bytecode found at configured address ${address}. Deployment to Bohr Testnet is required.`,
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

  // 5. Confirm sufficient test gas (if account provided)
  if (options.account) {
    const balance = await client.getBalance({ address: options.account }).catch(() => 0n)
    const minRequiredGasWei = 500_000_000_000_000n
    if (balance < minRequiredGasWei) {
      throw new Error(
        `Insufficient gas funds on Bohr Testnet: Wallet ${options.account} has ${balance} wei. Faucet allocation required before submitting live transactions.`,
      )
    }
  }
}

export async function readBotchainDataset(datasetId: `0x${string}`) {
  await ensureRegistryExists()
  const address = BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress
  if (!address) {
    throw new Error('BotChainDatasetRegistry is not deployed or configured on Bohr Testnet.')
  }

  return botchainPublicClient.readContract({
    address,
    abi: botChainRegistryAbi,
    functionName: 'getDataset',
    args: [datasetId],
  })
}

export interface SubmitBotchainDatasetParams {
  account: `0x${string}`
  datasetId: `0x${string}`
  datasetHash: `0x${string}`
  version: string
  metadataURI: string
  walletChainId?: number
}

/**
 * Submits dataset registration on Bohr Testnet with rigorous end-to-end verification:
 * 1. Checks RPC network and contract existence.
 * 2. Validates wallet chain ID and account identity.
 * 3. Executes walletClient.writeContract().
 * 4. Awaits the genuine transaction receipt.
 * 5. Requires successful receipt status.
 * 6. Returns the genuine transaction hash.
 */
export async function submitBotchainDataset(
  params: SubmitBotchainDatasetParams,
): Promise<Hex> {
  await ensureRegistryExists()

  const walletClient = getBotchainWalletClient()
  if (!walletClient) {
    throw new Error('No Ethereum wallet connected for Bohr Testnet transaction.')
  }

  const actualChain = await walletClient.getChainId()
  if (actualChain !== BOTCHAIN_TESTNET.chainId) {
    throw new Error(`Wrong wallet chain: Bohr Testnet (Chain ID ${BOTCHAIN_TESTNET.chainId}) required.`)
  }

  if (params.walletChainId !== undefined && params.walletChainId !== BOTCHAIN_TESTNET.chainId) {
    throw new Error(`Wrong wallet chain: Bohr Testnet (Chain ID ${BOTCHAIN_TESTNET.chainId}) required.`)
  }

  const accounts = await walletClient.getAddresses()
  if (!accounts.some((a) => a.toLowerCase() === params.account.toLowerCase())) {
    throw new Error('Wallet account mismatch: Connected account does not match requested signer.')
  }

  const address = BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress
  if (!address) {
    throw new Error('Registry address not configured.')
  }

  // Submit on-chain transaction
  const txHash = await walletClient.writeContract({
    chain: botchainTestnetChain,
    account: params.account,
    address,
    abi: botChainRegistryAbi,
    functionName: 'registerDataset',
    args: [params.datasetId, params.datasetHash, params.version, params.metadataURI],
  })

  // Wait for actual transaction receipt
  const receipt = await botchainPublicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 })

  // Require successful status
  if (receipt.status !== 'success' || receipt.transactionHash.toLowerCase() !== txHash.toLowerCase()) {
    throw new Error(
      `BOT Chain transaction failed or reverted on-chain with status "${receipt.status}". Tx: ${txHash}`,
    )
  }

  return txHash
}
