import { describe, it, expect, vi } from 'vitest'
import {
  addBotChainTestnet,
  ensureCorrectNetwork,
  getExplorerTxUrl,
  switchToXRPLTestnet,
  switchToBotChainTestnet,
} from '../lib/network'
import { BOTCHAIN_TESTNET } from '../lib/botchainConfig'
import { XRPL_EVM_TESTNET } from '../lib/web3Config'

describe('network helpers', () => {
  it('builds explorer urls for XRPL EVM by default', () => {
    expect(getExplorerTxUrl('0xabc')).toBe('https://explorer.testnet.xrplevm.org/tx/0xabc')
  })

  it('builds explorer urls for BOT / Bohr Testnet when chainId is passed', () => {
    expect(getExplorerTxUrl('0xabc', BOTCHAIN_TESTNET.chainId)).toBe('https://scan.bohr.life/tx/0xabc')
  })

  it('switches directly when the chain exists', async () => {
    const requests: string[] = []
    const provider = {
      request: vi.fn(async ({ method }) => {
        requests.push(method)
        return undefined
      }),
    }

    await switchToXRPLTestnet(provider)

    expect(requests).toEqual(['wallet_switchEthereumChain'])
  })

  it('switches to BOT Chain testnet', async () => {
    const requests: string[] = []
    const provider = {
      request: vi.fn(async ({ method }) => {
        requests.push(method)
        return undefined
      }),
    }

    await switchToBotChainTestnet(provider)

    expect(requests).toEqual(['wallet_switchEthereumChain'])
    expect(provider.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BOTCHAIN_TESTNET.chainIdHex }],
    })
  })

  it('adds the xrpl network when switch reports a missing chain', async () => {
    const provider = {
      request: vi.fn().mockRejectedValueOnce({ code: 4902 }).mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined),
    }

    await switchToXRPLTestnet(provider)

    expect(provider.request).toHaveBeenCalledTimes(3)
    expect(provider.request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        method: 'wallet_addEthereumChain',
      }),
    )
    expect(provider.request).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        method: 'wallet_switchEthereumChain',
      }),
    )
  })

  it('adds the botchain network through explicit helper', async () => {
    const provider = {
      request: vi.fn().mockResolvedValue(undefined),
    }

    await addBotChainTestnet(provider)
    expect(provider.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'wallet_addEthereumChain',
        params: [
          expect.objectContaining({
            chainId: '0x3c8',
            rpcUrls: ['https://rpc.bohr.life'],
          }),
        ],
      }),
    )
  })

  it('skips switching when already on the correct chain', async () => {
    const provider = {
      request: vi.fn().mockResolvedValue('0x161b28'),
    }

    await ensureCorrectNetwork(provider, XRPL_EVM_TESTNET.chainId)
    expect(provider.request).toHaveBeenCalledTimes(1)
  })
})
