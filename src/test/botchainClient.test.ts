import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Hex } from 'viem'

const mocks = vi.hoisted(() => ({
  rpcChainId: vi.fn(),
  getBytecode: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  readContract: vi.fn(),
  walletChainId: vi.fn(),
  walletAddresses: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('viem', () => ({
  createPublicClient: () => ({
    getChainId: mocks.rpcChainId,
    getBytecode: mocks.getBytecode,
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
    readContract: mocks.readContract,
  }),
  createWalletClient: () => ({
    getChainId: mocks.walletChainId,
    getAddresses: mocks.walletAddresses,
    writeContract: mocks.writeContract,
  }),
  http: () => ({}),
  custom: () => ({}),
  isAddress: (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value),
}))

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
  BOTCHAIN_PILOT_CONFIG: {
    pilotRegistryAddress: '0x1111111111111111111111111111111111111111',
  },
}))

import { readBotchainDataset, submitBotchainDataset } from '../lib/botchainClient'

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
  })

  it('waits for an actual successful receipt before returning a transaction hash', async () => {
    await expect(submitBotchainDataset(args)).resolves.toBe(TX)
    expect(mocks.waitForTransactionReceipt).toHaveBeenCalledWith(expect.objectContaining({ hash: TX }))
    expect(mocks.writeContract).toHaveBeenCalledOnce()
  })

  it('refuses to broadcast if the RPC responds with the wrong chain', async () => {
    mocks.rpcChainId.mockResolvedValue(677)
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
    await expect(readBotchainDataset(args.datasetId)).rejects.toThrow(/contract|code/i)
    expect(mocks.readContract).not.toHaveBeenCalled()
  })
})
