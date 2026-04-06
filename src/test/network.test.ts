import { addXRPLTestnet, ensureCorrectNetwork, getExplorerTxUrl, switchToXRPLTestnet } from '../lib/network'

describe('network helpers', () => {
  it('builds explorer urls', () => {
    expect(getExplorerTxUrl('0xabc')).toBe('https://explorer.testnet.xrplevm.org/tx/0xabc')
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

  it('skips switching when already on the correct chain', async () => {
    const provider = {
      request: vi.fn().mockResolvedValue('0x161b28'),
    }

    await ensureCorrectNetwork(provider)
    expect(provider.request).toHaveBeenCalledTimes(1)
  })

  it('adds the network through the explicit helper', async () => {
    const provider = {
      request: vi.fn().mockResolvedValue(undefined),
    }

    await addXRPLTestnet(provider)
    expect(provider.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'wallet_addEthereumChain',
      }),
    )
  })
})
