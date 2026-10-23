import { createPublicClient, createWalletClient, custom, http, isAddress } from 'viem'
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

export function isBotchainContractDeployed(): boolean {
  const address = BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress
  return Boolean(
    address &&
      isAddress(address) &&
      address.toLowerCase() !== '0x1234567890123456789012345678901234567890' &&
      address.toLowerCase() !== '0x0000000000000000000000000000000000000000',
  )
}

export async function readBotchainDataset(datasetId: `0x${string}`) {
  if (!isBotchainContractDeployed()) {
    throw new Error('BotChainDatasetRegistry is not yet deployed on Bohr Testnet.')
  }

  return botchainPublicClient.readContract({
    address: BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress,
    abi: botChainRegistryAbi,
    functionName: 'getDataset',
    args: [datasetId],
  })
}

export async function submitBotchainDataset(params: {
  account: `0x${string}`
  datasetId: `0x${string}`
  datasetHash: `0x${string}`
  version: string
  metadataURI: string
}): Promise<`0x${string}`> {
  const walletClient = getBotchainWalletClient()
  if (!walletClient) {
    throw new Error('No Ethereum wallet connected for Bohr Testnet transaction.')
  }

  if (!isBotchainContractDeployed()) {
    throw new Error(
      'BotChainDatasetRegistry contract address is not configured. Deploy the contract using script/DeployBotChainRegistry.s.sol before broadcasting live transactions.',
    )
  }

  const hash = await walletClient.writeContract({
    account: params.account,
    address: BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress,
    abi: botChainRegistryAbi,
    functionName: 'registerDataset',
    args: [params.datasetId, params.datasetHash, params.version, params.metadataURI],
  })

  return hash
}
