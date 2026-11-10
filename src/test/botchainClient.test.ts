import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Hex } from 'viem'

const mocks = vi.hoisted(() => ({
  rpcChainId: vi.fn(),
  getBytecode: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  readContract: vi.fn(),
  getBalance: vi.fn(),
  simulateContract: vi.fn(),
  estimateContractGas: vi.fn(),
  getGasPrice: vi.fn(),
  walletChainId: vi.fn(),
  walletAddresses: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem')
  return {
    ...actual,
    createPublicClient: () => ({
      getChainId: mocks.rpcChainId,
      getBytecode: mocks.getBytecode,
      waitForTransactionReceipt: mocks.waitForTransactionReceipt,
      readContract: mocks.readContract,
      getBalance: mocks.getBalance,
      simulateContract: mocks.simulateContract,
      estimateContractGas: mocks.estimateContractGas,
      getGasPrice: mocks.getGasPrice,
    }),
    createWalletClient: () => ({
      getChainId: mocks.walletChainId,
      getAddresses: mocks.walletAddresses,
      writeContract: mocks.writeContract,
    }),
    http: () => ({}),
    custom: () => ({}),
  }
})

vi.mock('../lib/network', () => ({
  getEthereumProvider: () => ({ request: vi.fn() }),
}))

vi.mock('../lib/botchainConfig', () => ({
  BOTCHAIN_TESTNET: {
    chainId: 968,
    chainIdHex: '0x3c8',
    name: 'Bohr Testnet',
    rpcUrl: 'https://rpc.bohr.life',
    blockExplorerUrl: 'https://scan.bohr.life',
    nativeCurrency: { name: 'Test BOT', symbol: 'BOT', decimals: 18 },
  },
  BOTCHAIN_MAINNET: {
    chainId: 677,
    chainIdHex: '0x2a5',
    name: 'BOT Chain Mainnet',
    rpcUrl: 'https://rpc.botchain.ai',
    blockExplorerUrl: 'https://scan.botchain.ai',
    nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  },
  BOTCHAIN_PILOT_CONFIG: {
    pilotRegistryAddress: '0x1111111111111111111111111111111111111111',
    mainnetRegistryAddress: undefined,
    getRegistryAddress: (id?: number) => (id === 677 ? undefined : '0x1111111111111111111111111111111111111111'),
  },
  BOTCHAIN_MAINNET_CONFIG: {
    registryAddress: undefined,
  },
}))

import {
  readBotchainDataset,
  verifyBotchainDatasetHash,
  submitBotchainDataset,
  prepareRegisterBotchainDataset,
  validateRegistrationPrerequisites,
  checkSubmitterPermissions,
  prepareSetAuthorizedSubmitter,
  executeSetAuthorizedSubmitter,
} from '../lib/botchainClient'

const ACCOUNT = '0x2222222222222222222222222222222222222222' as Hex
const TX = ('0x' + '3'.repeat(64)) as Hex
const args = {
  account: ACCOUNT,
  datasetId: ('0x' + '4'.repeat(64)) as Hex,
  datasetHash: ('0x' + '5'.repeat(64)) as Hex,
  version: '1.0.0',
  metadataURI: 'https://example.org/datumx/synthetic.json',
}

describe('BOT Chain transactions never claim success without chain evidence', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.rpcChainId.mockResolvedValue(968)
    mocks.getBytecode.mockResolvedValue('0x60016000')
    mocks.walletChainId.mockResolvedValue(968)
    mocks.walletAddresses.mockResolvedValue([ACCOUNT])
    mocks.writeContract.mockResolvedValue(TX)
    mocks.waitForTransactionReceipt.mockResolvedValue({ status: 'success', transactionHash: TX })
    mocks.readContract.mockResolvedValue(true)
    mocks.getBalance.mockResolvedValue(10_000_000_000_000_000n)
    mocks.simulateContract.mockResolvedValue({ request: {} })
    mocks.estimateContractGas.mockResolvedValue(220_500n)
    mocks.getGasPrice.mockResolvedValue(20_000_000_000n)
  })

  it('waits for an actual successful receipt before returning a transaction hash', async () => {
    await expect(submitBotchainDataset(args)).resolves.toBe(TX)
    expect(mocks.waitForTransactionReceipt).toHaveBeenCalledWith(expect.objectContaining({ hash: TX }))
    expect(mocks.writeContract).toHaveBeenCalledOnce()
  })

  it('refuses to broadcast if the RPC responds with the wrong chain', async () => {
    mocks.rpcChainId.mockResolvedValue(677)
    await expect(submitBotchainDataset({ ...args, walletChainId: 968 })).rejects.toThrow(/chain|network/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('refuses to broadcast if the RPC lookup fails or times out', async () => {
    mocks.rpcChainId.mockRejectedValue(new Error('RPC request timed out'))
    await expect(submitBotchainDataset(args)).rejects.toThrow(/RPC network lookup failed|timed out/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('refuses to broadcast if the RPC returns chain ID 0', async () => {
    mocks.rpcChainId.mockResolvedValue(0)
    await expect(submitBotchainDataset(args)).rejects.toThrow(/chain|network/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('refuses to broadcast if the wallet is on the wrong chain', async () => {
    mocks.walletChainId.mockResolvedValue(1)
    await expect(submitBotchainDataset(args)).rejects.toThrow(/chain|network/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('refuses to broadcast to an address with no contract code', async () => {
    mocks.getBytecode.mockResolvedValue(undefined)
    await expect(submitBotchainDataset(args)).rejects.toThrow(/contract|bytecode|code/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('refuses to broadcast if contract does not implement the expected registry ABI', async () => {
    mocks.readContract.mockRejectedValue(new Error('Function publicRegistrationEnabled not found'))
    await expect(submitBotchainDataset(args)).rejects.toThrow(/does not implement the expected BotChainDatasetRegistry interface/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('refuses to broadcast if submitting wallet lacks permission (registration closed and not allowlisted)', async () => {
    mocks.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'publicRegistrationEnabled') return false
      if (functionName === 'owner') return '0x0000000000000000000000000000000000000001'
      if (functionName === 'authorizedSubmitters') return false
      return true
    })
    await expect(submitBotchainDataset(args)).rejects.toThrow(/lacks permission to register datasets/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('refuses to broadcast if submitting wallet has insufficient gas balance', async () => {
    mocks.getBalance.mockResolvedValue(100n)
    await expect(submitBotchainDataset(args)).rejects.toThrow(/Insufficient gas funds on Bohr Testnet/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('rejects failed transaction receipts instead of displaying success', async () => {
    mocks.waitForTransactionReceipt.mockResolvedValue({ status: 'reverted', transactionHash: TX })
    await expect(submitBotchainDataset(args)).rejects.toThrow(/revert|fail/i)
  })

  it('rejects a wallet account that does not match the requested signer', async () => {
    mocks.walletAddresses.mockResolvedValue(['0x3333333333333333333333333333333333333333'])
    await expect(submitBotchainDataset(args)).rejects.toThrow(/account|wallet|signer/i)
    expect(mocks.writeContract).not.toHaveBeenCalled()
  })

  it('does not read from an unverified chain or missing contract', async () => {
    mocks.getBytecode.mockResolvedValue(undefined)
    await expect(readBotchainDataset(args.datasetId, 968)).rejects.toThrow(/contract|code/i)
    expect(mocks.readContract).not.toHaveBeenCalled()
  })

  it('executes on-chain verifyDatasetHash and returns true on matching candidate hash', async () => {
    mocks.readContract.mockResolvedValue(true)
    const result = await verifyBotchainDatasetHash(args.datasetId, args.datasetHash, 968)
    expect(result).toBe(true)
    expect(mocks.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'verifyDatasetHash',
        args: [args.datasetId, args.datasetHash],
      }),
    )
  })

  it('executes on-chain verifyDatasetHash and returns false on mismatching candidate hash', async () => {
    mocks.readContract.mockResolvedValue(false)
    const alteredHash = ('0x' + '9'.repeat(64)) as Hex
    const result = await verifyBotchainDatasetHash(args.datasetId, alteredHash, 968)
    expect(result).toBe(false)
    expect(mocks.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'verifyDatasetHash',
        args: [args.datasetId, alteredHash],
      }),
    )
  })

  it('refuses to verify against an unverified chain or missing contract', async () => {
    mocks.getBytecode.mockResolvedValue(undefined)
    await expect(verifyBotchainDatasetHash(args.datasetId, args.datasetHash, 968)).rejects.toThrow(/contract|code/i)
    expect(mocks.readContract).not.toHaveBeenCalled()
  })

  // Regression tests for Chains 677, 968, and 1449000
  describe('multi-chain regression guards (677, 968, 1449000)', () => {
    it('strictly rejects XRPL EVM (1449000) when validating BOT Chain prerequisites', async () => {
      mocks.walletChainId.mockResolvedValue(1449000)
      await expect(
        validateRegistrationPrerequisites({ walletChainId: 1449000, targetChainId: 677 })
      ).rejects.toThrow(/Incorrect network: Connected wallet is on chain ID 1449000/i)
    })

    it('fails closed when BOT Chain Mainnet registry is unconfigured', async () => {
      mocks.rpcChainId.mockResolvedValue(677)
      await expect(
        validateRegistrationPrerequisites({ walletChainId: 677, targetChainId: 677 })
      ).rejects.toThrow(/No verified BOT Chain Mainnet registry contract address configured/i)
    })

    it('rejects wrong wallet chain on Mainnet target (e.g. wallet on 968 while targeting 677)', async () => {
      mocks.rpcChainId.mockResolvedValue(677)
      await expect(
        validateRegistrationPrerequisites({ walletChainId: 968, targetChainId: 677 })
      ).rejects.toThrow(/Connected wallet is on chain ID 968.*BOT Chain Mainnet.*required/i)
    })
  })

  describe('owner allowlist governance helpers', () => {
    const LEON_W1 = '0xF226C920957BD4B648EaF1A8d1f859057Ec605a4' as Hex

    it('reads submitter permissions accurately when wallet is neither owner nor allowlisted', async () => {
      mocks.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
        if (functionName === 'owner') return ACCOUNT
        if (functionName === 'publicRegistrationEnabled') return false
        if (functionName === 'authorizedSubmitters') return false
        return false
      })
      mocks.getBalance.mockResolvedValue(30_374_540_000_000_000n)

      const perm = await checkSubmitterPermissions(LEON_W1, 968)
      expect(perm.address).toBe(LEON_W1)
      expect(perm.isOwner).toBe(false)
      expect(perm.isAuthorizedSubmitter).toBe(false)
      expect(perm.canRegister).toBe(false)
    })

    it('rejects non-owner wallet when preparing setAuthorizedSubmitter', async () => {
      mocks.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
        if (functionName === 'owner') return '0x31A826bB9D5F6087d94CDA31945C1234d061b788'
        return false
      })

      await expect(
        prepareSetAuthorizedSubmitter({
          ownerAccount: ACCOUNT,
          submitter: LEON_W1,
          authorized: true,
          walletChainId: 968,
          targetChainId: 968,
        }),
      ).rejects.toThrow(/Owner authorization required/i)
    })

    it('detects already-authorized wallet cleanly during preparation without simulating write', async () => {
      mocks.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
        if (functionName === 'owner') return ACCOUNT
        if (functionName === 'authorizedSubmitters') return true
        return false
      })

      const prepared = await prepareSetAuthorizedSubmitter({
        ownerAccount: ACCOUNT,
        submitter: LEON_W1,
        authorized: true,
        walletChainId: 968,
        targetChainId: 968,
      })

      expect(prepared.alreadyInTargetState).toBe(true)
      expect(mocks.simulateContract).not.toHaveBeenCalled()
    })

    it('simulates, estimates gas, submits, waits for receipt, and verifies post-state on authorization', async () => {
      let authorizedState = false
      mocks.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
        if (functionName === 'owner') return ACCOUNT
        if (functionName === 'authorizedSubmitters') return authorizedState
        return false
      })
      mocks.simulateContract.mockResolvedValue({ request: {} })
      mocks.estimateContractGas.mockResolvedValue(46_200n)
      mocks.getGasPrice.mockResolvedValue(20_000_000_000n)
      mocks.writeContract.mockImplementation(async () => {
        authorizedState = true
        return TX
      })
      mocks.waitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        transactionHash: TX,
        blockNumber: 29300001n,
      })

      const prepared = await prepareSetAuthorizedSubmitter({
        ownerAccount: ACCOUNT,
        submitter: LEON_W1,
        authorized: true,
        walletChainId: 968,
        targetChainId: 968,
      })
      expect(prepared.alreadyInTargetState).toBe(false)
      expect(prepared.gasEstimate).toBe(46_200n)

      authorizedState = false
      const executed = await executeSetAuthorizedSubmitter({
        ownerAccount: ACCOUNT,
        submitter: LEON_W1,
        authorized: true,
        walletChainId: 968,
        targetChainId: 968,
      })
      expect(executed.txHash).toBe(TX)
      expect(executed.blockNumber).toBe(29300001n)
      expect(executed.authorized).toBe(true)
    })

    it('rejects failed/reverted receipt in executeSetAuthorizedSubmitter', async () => {
      mocks.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
        if (functionName === 'owner') return ACCOUNT
        if (functionName === 'authorizedSubmitters') return false
        return false
      })
      mocks.simulateContract.mockResolvedValue({ request: {} })
      mocks.estimateContractGas.mockResolvedValue(46_200n)
      mocks.getGasPrice.mockResolvedValue(20_000_000_000n)
      mocks.waitForTransactionReceipt.mockResolvedValue({
        status: 'reverted',
        transactionHash: TX,
      })

      await expect(
        executeSetAuthorizedSubmitter({
          ownerAccount: ACCOUNT,
          submitter: LEON_W1,
          authorized: true,
          walletChainId: 968,
          targetChainId: 968,
        }),
      ).rejects.toThrow(/failed or reverted/i)
    })
  })

  describe('prepareRegisterBotchainDataset — duplicate, simulation & fee checks', () => {
    it('rejects duplicate dataset IDs before MetaMask signature', async () => {
      mocks.readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
        if (functionName === 'getDataset') {
          return {
            datasetId: args.datasetId,
            datasetHash: args.datasetHash,
            version: '1.0.0',
            metadataURI: args.metadataURI,
            submitter: ACCOUNT,
            timestamp: 1794000000n,
            exists: true,
          }
        }
        return true
      })

      await expect(prepareRegisterBotchainDataset({ ...args, walletChainId: 968, targetChainId: 968 })).rejects.toThrow(
        /Duplicate dataset ID/i,
      )
      expect(mocks.simulateContract).not.toHaveBeenCalled()
    })

    it('fails closed if registerDataset contract simulation reverts', async () => {
      mocks.simulateContract.mockRejectedValue(new Error('Execution reverted: Unauthorized'))

      await expect(prepareRegisterBotchainDataset({ ...args, walletChainId: 968, targetChainId: 968 })).rejects.toThrow(
        /Contract simulation failed/i,
      )
      expect(mocks.writeContract).not.toHaveBeenCalled()
    })

    it('rejects when wallet balance is below simulated transaction gas fee', async () => {
      mocks.getBalance.mockResolvedValue(600_000_000_000_000n) // 0.0006 BOT > minRequiredGasWei
      mocks.estimateContractGas.mockResolvedValue(225_000n)
      mocks.getGasPrice.mockResolvedValue(20_000_000_000n) // cost = 0.0045 BOT

      await expect(prepareRegisterBotchainDataset({ ...args, walletChainId: 968, targetChainId: 968 })).rejects.toThrow(
        /Insufficient BOT balance for estimated transaction fee/i,
      )
    })

    it('returns full fee estimate and contract call preview when simulation succeeds', async () => {
      const prepared = await prepareRegisterBotchainDataset({ ...args, walletChainId: 968, targetChainId: 968 })
      expect(prepared.senderAddress).toBe(ACCOUNT)
      expect(prepared.gasEstimate).toBe(220_500n)
      expect(prepared.estimatedCostWei).toBe(220_500n * 20_000_000_000n)
      expect(prepared.estimatedCostBot).toBe('0.00441')
    })
  })
})
