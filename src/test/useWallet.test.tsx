import { act, renderHook } from '@testing-library/react'
import { useWallet } from '../hooks/useWallet'

describe('useWallet', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'ethereum')
  })

  it('connects without auto-switching networks', async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_accounts') return []
      if (method === 'eth_requestAccounts') return ['0x1234567890abcdef1234567890abcdef12345678']
      if (method === 'eth_chainId') return '0x1'
      return undefined
    })

    const provider = {
      request,
      on: vi.fn(),
      removeListener: vi.fn(),
    }

    Object.defineProperty(window, 'ethereum', {
      value: provider,
      configurable: true,
    })

    const { result } = renderHook(() => useWallet())

    await act(async () => {
      await result.current.connectWallet()
    })

    expect(request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' })
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'wallet_switchEthereumChain' }))
    expect(result.current.wallet.isConnected).toBe(true)
    expect(result.current.wallet.isCorrectNetwork).toBe(false)
  })
})
