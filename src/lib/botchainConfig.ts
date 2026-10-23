/**
 * BOT Chain Network Configuration and Constants
 * 
 * Target Pilot Network: BOT / Bohr Testnet (Chain ID 968)
 * Reference Mainnet: BOT Chain Mainnet (Chain ID 677) - strictly for reference
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

export const BOTCHAIN_MAINNET_REFERENCE: NetworkConfig = {
  chainId: 677,
  chainIdHex: '0x2a5',
  name: 'BOT Chain Mainnet (Reference Only)',
  rpcUrl: 'https://rpc.botchain.ai',
  blockExplorerUrl: 'https://scan.botchain.ai',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
}

export const BOTCHAIN_PILOT_CONFIG = {
  testnet: BOTCHAIN_TESTNET,
  mainnetReference: BOTCHAIN_MAINNET_REFERENCE,
  // Fallback pilot contract address or placeholder for live Bohr testnet deployment
  pilotRegistryAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
}
