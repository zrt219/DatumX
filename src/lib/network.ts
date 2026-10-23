import { EXPLORER_TX_BASE, XRPL_EVM_TESTNET } from './web3Config'
import { BOTCHAIN_TESTNET, type NetworkConfig } from './botchainConfig'

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

export function getEthereumProvider() {
  return window.ethereum
}

export function getExplorerTxUrl(txHash: string, chainId: number = XRPL_EVM_TESTNET.chainId) {
  if (chainId === BOTCHAIN_TESTNET.chainId) {
    return `${BOTCHAIN_TESTNET.blockExplorerUrl}/tx/${txHash}`
  }
  return `${EXPLORER_TX_BASE}${txHash}`
}

export async function addEthereumChain(provider: Eip1193Provider, network: NetworkConfig) {
  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: network.chainIdHex,
        chainName: network.name,
        rpcUrls: [network.rpcUrl],
        nativeCurrency: network.nativeCurrency,
        blockExplorerUrls: [network.blockExplorerUrl],
      },
    ],
  })
}

export async function addXRPLTestnet(provider: Eip1193Provider) {
  await addEthereumChain(provider, XRPL_EVM_TESTNET)
}

export async function addBotChainTestnet(provider: Eip1193Provider) {
  await addEthereumChain(provider, BOTCHAIN_TESTNET)
}

export async function switchToNetwork(provider: Eip1193Provider, network: NetworkConfig) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainIdHex }],
    })
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined
    if (code === 4902) {
      await addEthereumChain(provider, network)
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainIdHex }],
      })
      return
    }
    throw error
  }
}

export async function switchToXRPLTestnet(provider: Eip1193Provider) {
  await switchToNetwork(provider, XRPL_EVM_TESTNET)
}

export async function switchToBotChainTestnet(provider: Eip1193Provider) {
  await switchToNetwork(provider, BOTCHAIN_TESTNET)
}

export async function ensureCorrectNetwork(provider: Eip1193Provider, targetChainId: number = XRPL_EVM_TESTNET.chainId) {
  const currentChainId = String(await provider.request({ method: 'eth_chainId' })).toLowerCase()
  const targetNetwork = targetChainId === BOTCHAIN_TESTNET.chainId ? BOTCHAIN_TESTNET : XRPL_EVM_TESTNET
  if (currentChainId !== targetNetwork.chainIdHex.toLowerCase()) {
    await switchToNetwork(provider, targetNetwork)
  }
}
