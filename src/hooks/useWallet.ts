import { useEffect, useState } from 'react'
import { ensureCorrectNetwork, getEthereumProvider } from '../lib/network'
import { XRPL_EVM_TESTNET } from '../lib/web3Config'
import type { WalletState } from '../types'

const initialState: WalletState = {
  isConnected: false,
  isCorrectNetwork: false,
  isMetaMaskAvailable: false,
  isBusy: false,
}

function formatChainName(chainId?: number) {
  if (chainId === XRPL_EVM_TESTNET.chainId) return XRPL_EVM_TESTNET.name
  return chainId ? `Chain ${chainId}` : 'Disconnected'
}

function formatWalletError(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined

  if (code === 4001) return 'Wallet action rejected in MetaMask.'
  if (code === -32002) return 'MetaMask already has a pending request. Open the wallet to continue.'
  return error instanceof Error ? error.message : fallback
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(initialState)

  useEffect(() => {
    const provider = getEthereumProvider()
    if (!provider) {
      setWallet((state) => ({ ...state, isMetaMaskAvailable: false }))
      return
    }

    const syncState = async () => {
      try {
        const [accounts, chainIdHex] = await Promise.all([
          provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
          provider.request({ method: 'eth_chainId' }) as Promise<string>,
        ])
        const chainId = Number.parseInt(chainIdHex, 16)
        setWallet({
          account: accounts[0] as `0x${string}` | undefined,
          chainId,
          chainName: formatChainName(chainId),
          isConnected: accounts.length > 0,
          isCorrectNetwork: chainId === XRPL_EVM_TESTNET.chainId,
          isMetaMaskAvailable: true,
          isBusy: false,
        })
      } catch (error) {
        setWallet((state) => ({
          ...state,
          isMetaMaskAvailable: true,
          isBusy: false,
          error: formatWalletError(error, 'Wallet state could not be initialized.'),
        }))
      }
    }

    void syncState()

    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccounts = (accounts as string[]) ?? []
      setWallet((state) => ({
        ...state,
        account: nextAccounts[0] as `0x${string}` | undefined,
        isConnected: nextAccounts.length > 0,
        chainName: nextAccounts.length > 0 ? state.chainName : 'Disconnected',
        isCorrectNetwork: nextAccounts.length > 0 ? state.isCorrectNetwork : false,
        error: undefined,
      }))
    }

    const handleChainChanged = (chainIdHex: unknown) => {
      const chainId = Number.parseInt(String(chainIdHex), 16)
      setWallet((state) => ({
        ...state,
        chainId,
        chainName: formatChainName(chainId),
        isCorrectNetwork: chainId === XRPL_EVM_TESTNET.chainId,
        error: undefined,
      }))
    }

    const handleDisconnect = () => {
      setWallet((state) => ({
        ...state,
        account: undefined,
        isConnected: false,
        isCorrectNetwork: false,
        chainId: undefined,
        chainName: 'Disconnected',
      }))
    }

    provider.on?.('accountsChanged', handleAccountsChanged)
    provider.on?.('chainChanged', handleChainChanged)
    provider.on?.('disconnect', handleDisconnect)

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged)
      provider.removeListener?.('chainChanged', handleChainChanged)
      provider.removeListener?.('disconnect', handleDisconnect)
    }
  }, [])

  const connectWallet = async () => {
    const provider = getEthereumProvider()
    if (!provider) {
      setWallet((state) => ({ ...state, error: 'MetaMask is required for direct XRPL EVM wallet connectivity.' }))
      return
    }

    setWallet((state) => ({ ...state, isBusy: true, error: undefined }))
    try {
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
      const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string
      const chainId = Number.parseInt(chainIdHex, 16)
      setWallet({
        account: accounts[0] as `0x${string}`,
        chainId,
        chainName: formatChainName(chainId),
        isConnected: true,
        isCorrectNetwork: chainId === XRPL_EVM_TESTNET.chainId,
        isMetaMaskAvailable: true,
        isBusy: false,
      })
    } catch (error) {
      setWallet((state) => ({ ...state, isBusy: false, error: formatWalletError(error, 'Wallet connection failed.') }))
    }
  }

  const ensureNetwork = async () => {
    const provider = getEthereumProvider()
    if (!provider) {
      setWallet((state) => ({ ...state, error: 'MetaMask is required for XRPL EVM network switching.' }))
      return
    }

    setWallet((state) => ({ ...state, isBusy: true, error: undefined }))
    try {
      await ensureCorrectNetwork(provider)
      const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string
      const chainId = Number.parseInt(chainIdHex, 16)
      setWallet((state) => ({
        ...state,
        chainId,
        chainName: formatChainName(chainId),
        isCorrectNetwork: chainId === XRPL_EVM_TESTNET.chainId,
        isBusy: false,
      }))
    } catch (error) {
      setWallet((state) => ({ ...state, isBusy: false, error: formatWalletError(error, 'Unable to switch network.') }))
    }
  }

  return { wallet, connectWallet, ensureNetwork }
}
