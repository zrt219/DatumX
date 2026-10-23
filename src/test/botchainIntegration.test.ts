import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TransactionReceipt } from 'viem'
import {
  isBotchainContractDeployed,
  validateRegistrationPrerequisites,
  submitBotchainDataset,
  readBotchainDataset,
  botchainPublicClient,
} from '../lib/botchainClient'
import { setBotchainRegistryAddress, BOTCHAIN_TESTNET } from '../lib/botchainConfig'

interface EthereumProviderWindow {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  }
}

describe('BotChain integration and security pre-flight checks', () => {
  const dummyContractAddress = '0x1111111111111111111111111111111111111111' as `0x${string}`
  const validAccount = '0x2222222222222222222222222222222222222222' as `0x${string}`
  const unauthorizedAccount = '0x9999999999999999999999999999999999999999' as `0x${string}`
  const dummyDatasetId = '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789' as `0x${string}`
  const dummyDatasetHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`

  beforeEach(() => {
    vi.restoreAllMocks()
    setBotchainRegistryAddress(undefined)
  })

  describe('isBotchainContractDeployed', () => {
    it('returns false when contract address is undefined', () => {
      setBotchainRegistryAddress(undefined)
      expect(isBotchainContractDeployed()).toBe(false)
    })

    it('returns false for placeholder address 0x1234567890123456789012345678901234567890', () => {
      setBotchainRegistryAddress('0x1234567890123456789012345678901234567890')
      expect(isBotchainContractDeployed()).toBe(false)
    })

    it('returns false for zero address', () => {
      setBotchainRegistryAddress('0x0000000000000000000000000000000000000000')
      expect(isBotchainContractDeployed()).toBe(false)
    })

    it('returns true for valid deployed address', () => {
      setBotchainRegistryAddress(dummyContractAddress)
      expect(isBotchainContractDeployed()).toBe(true)
    })
  })

  describe('validateRegistrationPrerequisites — 5 fail-closed conditions', () => {
    it('fails closed when wallet is on an incorrect chain (not 968)', async () => {
      await expect(
        validateRegistrationPrerequisites({
          walletChainId: 1, // Ethereum mainnet
        }),
      ).rejects.toThrow(/Incorrect network: Connected wallet is on chain ID 1/)

      await expect(
        validateRegistrationPrerequisites({
          walletChainId: 1449000, // XRPL EVM testnet
        }),
      ).rejects.toThrow(/Incorrect network: Connected wallet is on chain ID 1449000/)
    })

    it('fails closed when registry address is unconfigured', async () => {
      setBotchainRegistryAddress(undefined)
      await expect(
        validateRegistrationPrerequisites({
          walletChainId: BOTCHAIN_TESTNET.chainId,
        }),
      ).rejects.toThrow(/No verified Bohr Testnet registry contract address configured/)
    })

    it('fails closed when no bytecode exists at configured address', async () => {
      setBotchainRegistryAddress(dummyContractAddress)

      vi.spyOn(botchainPublicClient, 'getBytecode').mockResolvedValue('0x')

      await expect(
        validateRegistrationPrerequisites({
          walletChainId: BOTCHAIN_TESTNET.chainId,
        }),
      ).rejects.toThrow(/No contract bytecode found at configured address/)
    })

    it('fails closed when contract bytecode exists but does not conform to registry ABI', async () => {
      setBotchainRegistryAddress(dummyContractAddress)

      vi.spyOn(botchainPublicClient, 'getBytecode').mockResolvedValue('0x608060405234801561001057600080fd5b50')
      vi.spyOn(botchainPublicClient, 'readContract').mockRejectedValue(new Error('Function does not exist'))

      await expect(
        validateRegistrationPrerequisites({
          walletChainId: BOTCHAIN_TESTNET.chainId,
        }),
      ).rejects.toThrow(/does not implement the expected BotChainDatasetRegistry interface/)
    })

    it('fails closed when submitting wallet lacks permission (closed registration and not allowlisted)', async () => {
      setBotchainRegistryAddress(dummyContractAddress)

      vi.spyOn(botchainPublicClient, 'getBytecode').mockResolvedValue('0x608060405234801561001057600080fd5b50')
      vi.spyOn(botchainPublicClient, 'readContract').mockImplementation(async (args: unknown) => {
        const callArgs = args as { functionName: string }
        if (callArgs.functionName === 'publicRegistrationEnabled') return false as never
        if (callArgs.functionName === 'owner') return dummyContractAddress as never
        if (callArgs.functionName === 'authorizedSubmitters') return false as never
        return true as never
      })

      await expect(
        validateRegistrationPrerequisites({
          walletChainId: BOTCHAIN_TESTNET.chainId,
          account: unauthorizedAccount,
        }),
      ).rejects.toThrow(/lacks permission to register datasets/)
    })

    it('fails closed when wallet has insufficient gas balance', async () => {
      setBotchainRegistryAddress(dummyContractAddress)

      vi.spyOn(botchainPublicClient, 'getBytecode').mockResolvedValue('0x608060405234801561001057600080fd5b50')
      vi.spyOn(botchainPublicClient, 'readContract').mockImplementation(async (args: unknown) => {
        const callArgs = args as { functionName: string }
        if (callArgs.functionName === 'publicRegistrationEnabled') return true as never
        return true as never
      })
      vi.spyOn(botchainPublicClient, 'getBalance').mockResolvedValue(100n) // tiny balance

      await expect(
        validateRegistrationPrerequisites({
          walletChainId: BOTCHAIN_TESTNET.chainId,
          account: validAccount,
        }),
      ).rejects.toThrow(/Insufficient gas funds on Bohr Testnet/)
    })

    it('succeeds when all 5 conditions are fully satisfied', async () => {
      setBotchainRegistryAddress(dummyContractAddress)

      vi.spyOn(botchainPublicClient, 'getBytecode').mockResolvedValue('0x608060405234801561001057600080fd5b50')
      vi.spyOn(botchainPublicClient, 'readContract').mockImplementation(async (args: unknown) => {
        const callArgs = args as { functionName: string }
        if (callArgs.functionName === 'publicRegistrationEnabled') return true as never
        return true as never
      })
      vi.spyOn(botchainPublicClient, 'getBalance').mockResolvedValue(10_000_000_000_000_000n) // 0.01 BOT

      await expect(
        validateRegistrationPrerequisites({
          walletChainId: BOTCHAIN_TESTNET.chainId,
          account: validAccount,
        }),
      ).resolves.toBeUndefined()
    })
  })

  describe('submitBotchainDataset — write/receipt/readback/verify workflow', () => {
    function setupMockProvider(txHash: `0x${string}`) {
      const mockRequest = vi.fn().mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_chainId') return '0x3c8' // 968 in hex
        if (method === 'eth_accounts') return [validAccount]
        if (method === 'eth_sendTransaction') return txHash
        if (method === 'eth_estimateGas') return '0x493e0' // 300,000 gas
        return null
      })
      const win = window as unknown as EthereumProviderWindow
      win.ethereum = { request: mockRequest }
      return mockRequest
    }

    it('fails closed if transaction receipt indicates reverted status', async () => {
      setBotchainRegistryAddress(dummyContractAddress)

      vi.spyOn(botchainPublicClient, 'getChainId').mockResolvedValue(968)
      vi.spyOn(botchainPublicClient, 'getBytecode').mockResolvedValue('0x6080')
      vi.spyOn(botchainPublicClient, 'readContract').mockResolvedValue(true as never)
      vi.spyOn(botchainPublicClient, 'getBalance').mockResolvedValue(1_000_000_000_000_000n)

      const mockTxHash = '0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999' as `0x${string}`
      setupMockProvider(mockTxHash)

      // Mock receipt with reverted status
      vi.spyOn(botchainPublicClient, 'waitForTransactionReceipt').mockResolvedValue({
        status: 'reverted',
        transactionHash: mockTxHash,
      } as unknown as TransactionReceipt)

      await expect(
        submitBotchainDataset({
          account: validAccount,
          datasetId: dummyDatasetId,
          datasetHash: dummyDatasetHash,
          version: '1.0.0',
          metadataURI: 'https://datumx.io/meta.json',
          walletChainId: 968,
        }),
      ).rejects.toThrow(/transaction failed or reverted on-chain with status "reverted"/i)
    })

    it('completes end-to-end receipt wait, status check, RPC readback, and cryptographic verification on success', async () => {
      setBotchainRegistryAddress(dummyContractAddress)

      vi.spyOn(botchainPublicClient, 'getChainId').mockResolvedValue(968)
      vi.spyOn(botchainPublicClient, 'getBytecode').mockResolvedValue('0x6080')
      vi.spyOn(botchainPublicClient, 'readContract').mockImplementation(async (args: unknown) => {
        const callArgs = args as { functionName: string }
        if (callArgs.functionName === 'publicRegistrationEnabled') return true as never
        if (callArgs.functionName === 'getDataset') {
          return {
            datasetId: dummyDatasetId,
            datasetHash: dummyDatasetHash, // EXACT MATCH
            version: '1.0.0',
            metadataURI: 'https://datumx.io/meta.json',
            submitter: validAccount,
            timestamp: 1792732800n,
            exists: true,
          } as never
        }
        return true as never
      })
      vi.spyOn(botchainPublicClient, 'getBalance').mockResolvedValue(1_000_000_000_000_000n)

      const mockTxHash = '0xfeedfacefeedfacefeedfacefeedfacefeedfacefeedfacefeedfacefeedface' as `0x${string}`
      setupMockProvider(mockTxHash)

      vi.spyOn(botchainPublicClient, 'waitForTransactionReceipt').mockResolvedValue({
        status: 'success',
        transactionHash: mockTxHash,
      } as unknown as TransactionReceipt)

      const tx = await submitBotchainDataset({
        account: validAccount,
        datasetId: dummyDatasetId,
        datasetHash: dummyDatasetHash,
        version: '1.0.0',
        metadataURI: 'https://datumx.io/meta.json',
        walletChainId: 968,
      })

      expect(tx).toBe(mockTxHash)

      // Test RPC readback independently
      const record = await readBotchainDataset(dummyDatasetId)
      expect(record.datasetHash).toBe(dummyDatasetHash)
      expect(record.submitter).toBe(validAccount)
      expect(record.exists).toBe(true)
    })
  })

  describe('readBotchainDataset', () => {
    it('throws when contract is not deployed', async () => {
      setBotchainRegistryAddress(undefined)
      await expect(readBotchainDataset(dummyDatasetId)).rejects.toThrow(
        /registry contract address not configured/i,
      )
    })
  })
})
