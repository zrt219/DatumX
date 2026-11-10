/**
 * BOT Chain Network Configuration and Constants
 * 
 * Target Pilot Network: BOT / Bohr Testnet (Chain ID 968)
 * Production Mainnet: BOT Chain Mainnet (Chain ID 677)
 */

export interface NetworkConfig {
  chainId: number
  chainIdHex: string
  name: string
  rpcUrl: string
  blockExplorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export const BOTCHAIN_TESTNET: NetworkConfig = {
  chainId: 968,
  chainIdHex: '0x3c8',
  name: 'BOT / Bohr Testnet',
  rpcUrl: 'https://rpc.bohr.life',
  blockExplorerUrl: 'https://scan.bohr.life',
  nativeCurrency: {
    name: 'Test BOT',
    symbol: 'BOT',
    decimals: 18,
  },
}

export const BOTCHAIN_MAINNET: NetworkConfig = {
  chainId: 677,
  chainIdHex: '0x2a5',
  name: 'BOT Chain Mainnet',
  rpcUrl: 'https://rpc.botchain.ai',
  blockExplorerUrl: 'https://scan.botchain.ai',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
}

// Default production network is BOT Chain Mainnet
export const DEFAULT_BOTCHAIN_NETWORK: NetworkConfig = BOTCHAIN_MAINNET

// Backwards compatibility alias
export const BOTCHAIN_MAINNET_REFERENCE: NetworkConfig = BOTCHAIN_MAINNET

// Configured contract address for Bohr Testnet (Chain ID 968).
// Must be a verified, network-specific address. Placeholder addresses are forbidden.
let activeTestnetRegistryAddress: `0x${string}` | undefined = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOTCHAIN_REGISTRY_ADDRESS
    ? (import.meta.env.VITE_BOTCHAIN_REGISTRY_ADDRESS as `0x${string}`)
    : '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7'
)

// Configured contract address for BOT Mainnet (Chain ID 677).
// Deployed and verified live on-chain at block 29237813.
let activeMainnetRegistryAddress: `0x${string}` | undefined = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOTCHAIN_MAINNET_REGISTRY_ADDRESS
    ? (import.meta.env.VITE_BOTCHAIN_MAINNET_REGISTRY_ADDRESS as `0x${string}`)
    : '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7'
)

export const BOTCHAIN_PILOT_CONFIG = {
  defaultNetwork: BOTCHAIN_MAINNET,
  mainnet: BOTCHAIN_MAINNET,
  testnet: BOTCHAIN_TESTNET,
  mainnetReference: BOTCHAIN_MAINNET_REFERENCE,
  get pilotRegistryAddress(): `0x${string}` | undefined {
    // For backwards compatibility with testnet-specific references
    return activeTestnetRegistryAddress
  },
  get mainnetRegistryAddress(): `0x${string}` | undefined {
    return activeMainnetRegistryAddress
  },
  getRegistryAddress(chainId: number = BOTCHAIN_MAINNET.chainId): `0x${string}` | undefined {
    if (chainId === BOTCHAIN_MAINNET.chainId) {
      return activeMainnetRegistryAddress
    }
    if (chainId === BOTCHAIN_TESTNET.chainId) {
      return activeTestnetRegistryAddress
    }
    return undefined
  },
}

export function setBotchainRegistryAddress(address?: `0x${string}`) {
  activeTestnetRegistryAddress = address
}

export const BOTCHAIN_MAINNET_CONFIG = {
  network: BOTCHAIN_MAINNET,
  get registryAddress(): `0x${string}` | undefined {
    return activeMainnetRegistryAddress
  },
}

export function setBotchainMainnetRegistryAddress(address?: `0x${string}`) {
  activeMainnetRegistryAddress = address
}
