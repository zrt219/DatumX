import { useState } from 'react'
import type { DatasetSubmissionDraft, ReviewSubmissionDraft, TransactionState, WalletState } from '../types'

const idleState: TransactionState = { status: 'idle' }

async function loadDrillProofClient() {
  return import('../lib/drillProofClient')
}

function getWalletGuardMessage(wallet: WalletState) {
  if (!wallet.isMetaMaskAvailable) return 'MetaMask is required for XRPL EVM Testnet transactions.'
  if (!wallet.isConnected) return 'Connect MetaMask before submitting a transaction.'
  if (!wallet.isCorrectNetwork) return 'Switch to XRPL EVM Testnet before submitting a transaction.'
  return null
}

function buildErrorState(error: unknown, fallbackMessage: string): TransactionState {
  const message = error instanceof Error ? error.message : fallbackMessage
  const txHash =
    typeof error === 'object' && error !== null && 'txHash' in error ? (error as { txHash?: `0x${string}` }).txHash : undefined

  return {
    status: 'error',
    message,
    txHash,
  }
}

export function useDrillProofTransactions(wallet: WalletState, onTransactionConfirmed?: () => Promise<unknown> | unknown) {
  const [datasetSubmissionState, setDatasetSubmissionState] = useState<TransactionState>(idleState)
  const [reviewSubmissionState, setReviewSubmissionState] = useState<TransactionState>(idleState)
  const [finalizeSubmissionState, setFinalizeSubmissionState] = useState<TransactionState>(idleState)

  const submitDataset = async (draft: DatasetSubmissionDraft) => {
    const walletGuard = getWalletGuardMessage(wallet)
    if (walletGuard) {
      setDatasetSubmissionState({ status: 'error', message: walletGuard })
      return
    }

    setDatasetSubmissionState({ status: 'pending', message: 'Checking live contract compatibility...' })
    const client = await loadDrillProofClient()
    const compatibility = await client.checkDrillProofCompatibility()
    if (!compatibility.compatible) {
      setDatasetSubmissionState({ status: 'error', message: compatibility.message })
      return
    }

    try {
      setDatasetSubmissionState({ status: 'pending', message: 'Submitting dataset transaction through MetaMask...' })
      const receipt = await client.submitDatasetTransaction(draft)
      setDatasetSubmissionState({
        status: 'success',
        message: 'Dataset transaction confirmed on XRPL EVM Testnet.',
        txHash: receipt.transactionHash,
      })
      await onTransactionConfirmed?.()
    } catch (error) {
      setDatasetSubmissionState(buildErrorState(error, 'Dataset transaction failed.'))
    }
  }

  const submitReview = async (draft: ReviewSubmissionDraft) => {
    const walletGuard = getWalletGuardMessage(wallet)
    if (walletGuard) {
      setReviewSubmissionState({ status: 'error', message: walletGuard })
      return
    }

    setReviewSubmissionState({ status: 'pending', message: 'Checking live contract compatibility...' })
    const client = await loadDrillProofClient()
    const compatibility = await client.checkDrillProofCompatibility()
    if (!compatibility.compatible) {
      setReviewSubmissionState({ status: 'error', message: compatibility.message })
      return
    }

    try {
      setReviewSubmissionState({ status: 'pending', message: 'Submitting review transaction through MetaMask...' })
      const receipt = await client.submitReviewTransaction(draft)
      setReviewSubmissionState({
        status: 'success',
        message: 'Review transaction confirmed on XRPL EVM Testnet.',
        txHash: receipt.transactionHash,
      })
      await onTransactionConfirmed?.()
    } catch (error) {
      setReviewSubmissionState(buildErrorState(error, 'Review transaction failed.'))
    }
  }

  const finalizeDataset = async (datasetId: number) => {
    const walletGuard = getWalletGuardMessage(wallet)
    if (walletGuard) {
      setFinalizeSubmissionState({ status: 'error', message: walletGuard })
      return
    }

    setFinalizeSubmissionState({ status: 'pending', message: 'Checking live contract compatibility...' })
    const client = await loadDrillProofClient()
    const compatibility = await client.checkDrillProofCompatibility()
    if (!compatibility.compatible) {
      setFinalizeSubmissionState({ status: 'error', message: compatibility.message })
      return
    }

    try {
      setFinalizeSubmissionState({ status: 'pending', message: 'Submitting finalize transaction through MetaMask...' })
      const receipt = await client.finalizeDatasetTransaction(datasetId)
      setFinalizeSubmissionState({
        status: 'success',
        message: 'Finalize transaction confirmed on XRPL EVM Testnet.',
        txHash: receipt.transactionHash,
      })
      await onTransactionConfirmed?.()
    } catch (error) {
      setFinalizeSubmissionState(buildErrorState(error, 'Finalize transaction failed.'))
    }
  }

  return {
    datasetSubmissionState,
    reviewSubmissionState,
    finalizeSubmissionState,
    submitDataset,
    submitReview,
    finalizeDataset,
    resetDatasetSubmissionState: () => setDatasetSubmissionState(idleState),
    resetReviewSubmissionState: () => setReviewSubmissionState(idleState),
    resetFinalizeSubmissionState: () => setFinalizeSubmissionState(idleState),
  }
}
