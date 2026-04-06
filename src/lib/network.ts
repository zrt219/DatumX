import { EXPLORER_TX_BASE, XRPL_EVM_TESTNET } from './web3Config'

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

export function getExplorerTxUrl(txHash: string) {
  return `${EXPLORER_TX_BASE}${txHash}`
}

export async function addXRPLTestnet(provider: Eip1193Provider) {
  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: XRPL_EVM_TESTNET.chainIdHex,
        chainName: XRPL_EVM_TESTNET.name,
        rpcUrls: [XRPL_EVM_TESTNET.rpcUrl],
        nativeCurrency: XRPL_EVM_TESTNET.nativeCurrency,
        blockExplorerUrls: [XRPL_EVM_TESTNET.blockExplorerUrl],
      },
    ],
  })
}

export async function switchToXRPLTestnet(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: XRPL_EVM_TESTNET.chainIdHex }],
    })
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined
    if (code === 4902) {
      await addXRPLTestnet(provider)
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: XRPL_EVM_TESTNET.chainIdHex }],
      })
      return
    }
    throw error
  }
}

export async function ensureCorrectNetwork(provider: Eip1193Provider) {
  const currentChainId = String(await provider.request({ method: 'eth_chainId' })).toLowerCase()
  if (currentChainId !== XRPL_EVM_TESTNET.chainIdHex.toLowerCase()) {
    await switchToXRPLTestnet(provider)
  }
}
