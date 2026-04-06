import { act, renderHook } from '@testing-library/react'
import { useDrillProofTransactions } from '../hooks/useDrillProofTransactions'
import type { WalletState } from '../types'

vi.mock('../lib/drillProofClient', () => ({
  checkDrillProofCompatibility: vi.fn(async () => ({ compatible: false, message: 'Mock-first mode is active.' })),
  submitDatasetTransaction: vi.fn(),
  submitReviewTransaction: vi.fn(),
}))

const connectedWallet: WalletState = {
  account: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 1449000,
  chainName: 'XRPL EVM Testnet',
  isConnected: true,
  isCorrectNetwork: true,
  isMetaMaskAvailable: true,
  isBusy: false,
}

describe('useDrillProofTransactions', () => {
  it('blocks dataset submission when the wallet is disconnected', async () => {
    const { result } = renderHook(() =>
      useDrillProofTransactions({
        ...connectedWallet,
        account: undefined,
        isConnected: false,
      }),
    )

    await act(async () => {
      await result.current.submitDataset({
        projectKey: 'SHIRLEY_CENTRAL',
        datasetType: 'Targeting Package',
        uri: 'ipfs://dataset/test',
        sourceHash: '0x44c6f8f9f2aa8f7157ad2ce521fe9d6f38e8b77f89d487bd9dcf2b49e2e3314a',
        transformHash: '0x55c6f8f9f2aa8f7157ad2ce521fe9d6f38e8b77f89d487bd9dcf2b49e2e3314a',
        schemaVersion: 1,
        recordCount: 100,
        claimedConfidenceBps: 8200,
        submissionId: 'SC-TEST-001',
      })
    })

    expect(result.current.datasetSubmissionState.status).toBe('error')
    expect(result.current.datasetSubmissionState.message).toMatch(/Connect MetaMask/i)
  })

  it('surfaces compatibility failures before live review submission', async () => {
    const { result } = renderHook(() => useDrillProofTransactions(connectedWallet))

    await act(async () => {
      await result.current.submitReview({
        datasetId: 21,
        approved: true,
        confidenceBps: 8400,
        reviewUri: 'ipfs://review/test',
      })
    })

    expect(result.current.reviewSubmissionState.status).toBe('error')
    expect(result.current.reviewSubmissionState.message).toMatch(/Mock-first mode/i)
  })
})
