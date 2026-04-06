import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { getEthereumProvider } from './network'
import { XRPL_EVM_TESTNET } from './web3Config'

export const xrplTestnetChain = {
  id: XRPL_EVM_TESTNET.chainId,
  name: XRPL_EVM_TESTNET.name,
  nativeCurrency: XRPL_EVM_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [XRPL_EVM_TESTNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: XRPL_EVM_TESTNET.name,
      url: XRPL_EVM_TESTNET.blockExplorerUrl,
    },
  },
} as const

export const publicClient = createPublicClient({
  chain: xrplTestnetChain,
  transport: http(XRPL_EVM_TESTNET.rpcUrl),
})

export function getWalletTransport() {
  const provider = getEthereumProvider()
  return provider ? custom(provider) : undefined
}

export function getWalletClient() {
  const transport = getWalletTransport()
  if (!transport) return undefined

  return createWalletClient({
    chain: xrplTestnetChain,
    transport,
  })
}
