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

// Backwards compatibility alias
export const BOTCHAIN_MAINNET_REFERENCE: NetworkConfig = BOTCHAIN_MAINNET

// Configured contract address for Bohr Testnet (Chain ID 968).
// Must be a verified, network-specific address. Placeholder addresses are forbidden.
let activePilotRegistryAddress: `0x${string}` | undefined = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOTCHAIN_REGISTRY_ADDRESS
    ? (import.meta.env.VITE_BOTCHAIN_REGISTRY_ADDRESS as `0x${string}`)
    : '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7'
)

export const BOTCHAIN_PILOT_CONFIG = {
  testnet: BOTCHAIN_TESTNET,
  mainnetReference: BOTCHAIN_MAINNET_REFERENCE,
  get pilotRegistryAddress(): `0x${string}` | undefined {
    return activePilotRegistryAddress
  },
}

export function setBotchainRegistryAddress(address?: `0x${string}`) {
  activePilotRegistryAddress = address
}

// Configured contract address for BOT Mainnet (Chain ID 677).
// Strictly undefined until explicit authorized mainnet deployment.
let activeMainnetRegistryAddress: `0x${string}` | undefined = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOTCHAIN_MAINNET_REGISTRY_ADDRESS
    ? (import.meta.env.VITE_BOTCHAIN_MAINNET_REGISTRY_ADDRESS as `0x${string}`)
    : undefined
)

export const BOTCHAIN_MAINNET_CONFIG = {
  network: BOTCHAIN_MAINNET,
  get registryAddress(): `0x${string}` | undefined {
    return activeMainnetRegistryAddress
  },
}

export function setBotchainMainnetRegistryAddress(address?: `0x${string}`) {
  activeMainnetRegistryAddress = address
}
