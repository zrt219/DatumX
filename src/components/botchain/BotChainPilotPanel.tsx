import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Shield, Database, Cpu, Layers, AlertCircle, Info, ExternalLink, Activity, RefreshCw } from 'lucide-react'
import { Panel } from '../shared/Panel'
import { BOTCHAIN_TESTNET, BOTCHAIN_PILOT_CONFIG } from '../../lib/botchainConfig'
import { canonicalJsonStringify, computeSha256Hex } from '../../lib/canonicalHash'
import { switchToBotChainTestnet, getEthereumProvider, getExplorerTxUrl } from '../../lib/network'
import {
  isBotchainContractConfigured,
  checkBotchainRegistryLiveStatus,
  readBotchainDataset,
  submitBotchainDataset,
  validateRegistrationPrerequisites,
  fetchAllBotchainDatasets,
  type RegistryLiveCheckResult,
} from '../../lib/botchainClient'
import type { WalletState } from '../../types'

interface BotChainPilotPanelProps {
  wallet: WalletState
  onRefreshWallet: () => Promise<void>
}

interface StoredPilotRecord {
  datasetId: `0x${string}`
  datasetHash: `0x${string}`
  version: string
  metadataURI: string
  submitter: string
  timestamp: number
  isLiveOnChain: boolean
  txHash?: `0x${string}`
}

export function BotChainPilotPanel({ wallet, onRefreshWallet }: BotChainPilotPanelProps) {
  // Synthetic benchmark default (strictly synthetic, non-confidential)
  const defaultPayload = {
    benchmarkId: 'BOT-SYNTH-BENCHMARK-001',
    projectName: 'Bohr Clean Energy Sensor Grid',
    samples: [
      { depth: 10.5, gammaCount: 142.8, status: 'validated' },
      { depth: 21.0, gammaCount: 198.4, status: 'validated' },
      { depth: 31.5, gammaCount: 312.0, status: 'anomalous_high' },
    ],
    timestamp: 1792732800,
  }

  const [rawJson, setRawJson] = useState(JSON.stringify(defaultPayload, null, 2))
  const [datasetIdInput, setDatasetIdInput] = useState('BOT-SYNTH-002')
  const [versionInput, setVersionInput] = useState('1.0.0')
  const [metadataUriInput, setMetadataUriInput] = useState('https://datumx.io/meta/bot-synth-001.json')

  // Hash state
  const [calculatedHash, setCalculatedHash] = useState<string>('')
  const [isHashing, setIsHashing] = useState(false)

  // Interaction state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [storedRecord, setStoredRecord] = useState<StoredPilotRecord | null>(null)
  const [loadDatasetIdInput, setLoadDatasetIdInput] = useState<string>('')
  const [isLoadingRecord, setIsLoadingRecord] = useState<boolean>(false)

  // Verification state
  const [verificationInput, setVerificationInput] = useState<string>(JSON.stringify(defaultPayload, null, 2))
  const [verificationResult, setVerificationResult] = useState<'IDLE' | 'MATCH' | 'MISMATCH'>('IDLE')

  const isBohrChain = wallet.chainId === BOTCHAIN_TESTNET.chainId
  const [registryLiveResult, setRegistryLiveResult] = useState<RegistryLiveCheckResult>(
    isBotchainContractConfigured() ? { status: 'CHECKING' } : { status: 'UNCONFIGURED' },
  )

  useEffect(() => {
    let isMounted = true
    if (!isBotchainContractConfigured()) {
      setRegistryLiveResult({ status: 'UNCONFIGURED' })
      return
    }

    setRegistryLiveResult({ status: 'CHECKING', address: BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress })
    checkBotchainRegistryLiveStatus()
      .then((res) => {
        if (isMounted) {
          setRegistryLiveResult(res)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setRegistryLiveResult({
            status: 'RPC_ERROR',
            address: BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [wallet.chainId])

  const isLiveReady = registryLiveResult.status === 'LIVE_VERIFIED'

  const [recentRecords, setRecentRecords] = useState<Array<{
    datasetId: `0x${string}`
    datasetHash: `0x${string}`
    version: string
    metadataURI: string
    submitter: `0x${string}`
    timestamp: number
    exists: boolean
  }>>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)

  const loadActivityStream = async () => {
    if (!isLiveReady) return
    setIsLoadingActivity(true)
    try {
      const records = await fetchAllBotchainDatasets()
      setRecentRecords(records)
    } catch (e) {
      console.warn('Failed to load activity stream:', e)
    } finally {
      setIsLoadingActivity(false)
    }
  }

  useEffect(() => {
    if (isLiveReady) {
      loadActivityStream()
    }
  }, [isLiveReady])

  const handleComputeHash = async () => {
    setIsHashing(true)
    setErrorMessage(null)
    setInfoMessage(null)
    try {
      const parsed = JSON.parse(rawJson)
      const canonical = canonicalJsonStringify(parsed)
      const hash = await computeSha256Hex(canonical)
      setCalculatedHash(hash)
    } catch {
      setErrorMessage('Invalid JSON syntax in raw dataset payload.')
    } finally {
      setIsHashing(false)
    }
  }

  const handleSwitchToBotChain = async () => {
    const provider = getEthereumProvider()
    if (!provider) {
      setErrorMessage('No Ethereum browser wallet detected.')
      return
    }
    try {
      await switchToBotChainTestnet(provider)
      await onRefreshWallet()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch network'
      setErrorMessage(msg)
    }
  }

  const handleRegisterRecord = async () => {
    setErrorMessage(null)
    setInfoMessage(null)
    setStoredRecord(null)
    setVerificationResult('IDLE')
    setIsSubmitting(true)

    try {
      const parsed = JSON.parse(rawJson)
      const canonical = canonicalJsonStringify(parsed)
      const hash = await computeSha256Hex(canonical)
      const computedId = (await computeSha256Hex(datasetIdInput)) as `0x${string}`

      if (isLiveReady) {
        if (!isBohrChain) {
          throw new Error(
            `Connected wallet must be on Bohr Testnet (Chain ID ${BOTCHAIN_TESTNET.chainId}). Currently on chain ID ${wallet.chainId}.`,
          )
        }
        if (!wallet.account) {
          throw new Error('Please connect an authorized wallet on Bohr Testnet before submitting.')
        }

        // Validate all 5 prerequisites fail-closed before live submission
        await validateRegistrationPrerequisites({
          walletChainId: wallet.chainId,
          account: wallet.account as `0x${string}`,
        })

        // Pre-flight check: prevent re-registering existing dataset ID
        try {
          const existing = await readBotchainDataset(computedId)
          if (existing.exists || (existing.datasetHash && existing.datasetHash !== '0x0000000000000000000000000000000000000000000000000000000000000000')) {
            throw new Error(`Dataset ID "${datasetIdInput}" is already registered on-chain. Please use a new unique ID (e.g. BOT-SYNTH-002, BOT-SYNTH-003) or query it in Step 2.`)
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes('already registered')) throw e
          // RecordNotFound or empty is expected for new records
        }

        // Live on-chain write -> receipt -> readback -> verify pipeline
        const liveTx = await submitBotchainDataset({
          account: wallet.account,
          datasetId: computedId,
          datasetHash: hash,
          version: versionInput,
          metadataURI: metadataUriInput,
          walletChainId: wallet.chainId,
        })

        // Read back confirmed record from chain
        const onChainRecord = await readBotchainDataset(computedId)

        // Verify input hash matches on-chain hash
        if (onChainRecord.datasetHash.toLowerCase() !== hash.toLowerCase()) {
          throw new Error(
            `Verification failed: On-chain stored hash (${onChainRecord.datasetHash}) does not match submitted dataset hash (${hash}).`,
          )
        }

        // Never substitute local React state for blockchain readback:
        // Populate directly from the independently read on-chain record
        setStoredRecord({
          datasetId: computedId,
          datasetHash: onChainRecord.datasetHash,
          version: onChainRecord.version,
          metadataURI: onChainRecord.metadataURI,
          submitter: onChainRecord.submitter,
          timestamp: Number(onChainRecord.timestamp),
          isLiveOnChain: true,
          txHash: liveTx,
        })

        setInfoMessage(`Transaction confirmed on Bohr Testnet! Tx: ${liveTx}`)
        loadActivityStream()
      } else {
        // LOCAL SIMULATION — NO ON-CHAIN TRANSACTION
        // Remove all fabricated transaction hashes. Never substitute local state for on-chain proof.
        const stagedRecord: StoredPilotRecord = {
          datasetId: computedId,
          datasetHash: hash,
          version: versionInput,
          metadataURI: metadataUriInput,
          submitter: wallet.account || '0x0000000000000000000000000000000000000000',
          timestamp: Math.floor(Date.now() / 1000),
          isLiveOnChain: false,
          txHash: undefined, // Strictly undefined: NO fabricated or mock hashes
        }

        setStoredRecord(stagedRecord)
        setInfoMessage(
          'LOCAL SIMULATION ONLY — Record staged in memory. No on-chain transaction was broadcast because BotChainDatasetRegistry is not yet deployed on Bohr Testnet.',
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFetchOnChainRecord = async () => {
    setErrorMessage(null)
    setInfoMessage(null)
    setVerificationResult('IDLE')

    const rawId = loadDatasetIdInput.trim()
    if (!rawId) {
      setErrorMessage('Please enter a dataset ID to fetch.')
      return
    }

    if (!isLiveReady) {
      setErrorMessage(
        `Cannot query on-chain record: BotChainDatasetRegistry is not verified live on Bohr Testnet (${registryLiveResult.error || 'bytecode not deployed'}).`,
      )
      return
    }

    setIsLoadingRecord(true)
    try {
      // Determine if ID is already 32-byte hex (0x...) or human-readable identifier
      let computedId: `0x${string}`
      if (rawId.startsWith('0x') && rawId.length === 66) {
        computedId = rawId as `0x${string}`
      } else {
        computedId = (await computeSha256Hex(rawId)) as `0x${string}`
      }

      const onChainRecord = await readBotchainDataset(computedId)

      if (!onChainRecord.datasetHash || onChainRecord.datasetHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        throw new Error(`Dataset ID ${rawId} was not found on Bohr Testnet registry.`)
      }

      setStoredRecord({
        datasetId: computedId,
        datasetHash: onChainRecord.datasetHash,
        version: onChainRecord.version,
        metadataURI: onChainRecord.metadataURI,
        submitter: onChainRecord.submitter,
        timestamp: Number(onChainRecord.timestamp),
        isLiveOnChain: true,
      })

      setInfoMessage(`Successfully loaded dataset record from Bohr Testnet for ID: ${rawId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch on-chain dataset'
      setErrorMessage(msg)
    } finally {
      setIsLoadingRecord(false)
    }
  }

  const handleVerify = async () => {
    if (!storedRecord) {
      setErrorMessage('No record available to verify against. Register or stage a dataset record first.')
      return
    }

    try {
      const parsed = JSON.parse(verificationInput)
      const canonical = canonicalJsonStringify(parsed)
      const recomputed = await computeSha256Hex(canonical)

      if (recomputed.toLowerCase() === storedRecord.datasetHash.toLowerCase()) {
        setVerificationResult('MATCH')
      } else {
        setVerificationResult('MISMATCH')
      }
    } catch {
      setErrorMessage('Invalid JSON syntax in verification input payload.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Network Header Banner */}
      <Panel className="border-[#38bdf8]/20 bg-gradient-to-r from-[#0d1c2e] via-[#0b1623] to-[#0d1c2e]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
              <h2 className="text-lg font-semibold tracking-wide text-white">
                BOT CHAIN TESTNET — CHAIN ID {BOTCHAIN_TESTNET.chainId}
              </h2>
              {isLiveReady ? (
                <span className="rounded-md border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2 py-0.5 text-xs text-[#7dd3fc]">
                  LIVE ON-CHAIN READY
                </span>
              ) : registryLiveResult.status === 'CHECKING' ? (
                <span className="rounded-md border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-300">
                  VERIFYING ON-CHAIN STATUS...
                </span>
              ) : (
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                  LOCAL SIMULATION — NO ON-CHAIN TRANSACTION
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              Deterministic Register → Read → Verify demonstration prepared for Leon, Roy, and Josh.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs">
              <span className="text-slate-500">RPC: </span>
              <span className="font-mono text-slate-300">rpc.bohr.life</span>
            </div>
            {!isBohrChain ? (
              <button
                onClick={handleSwitchToBotChain}
                className="rounded-xl bg-[#0284c7] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#0369a1]"
              >
                Switch to Bohr Testnet
              </button>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2 text-xs font-medium text-[#4ade80]">
                <CheckCircle2 size={14} /> Connected to 968
              </span>
            )}
          </div>
        </div>
      </Panel>

      {/* Deployment & Integrity Notice */}
      <div
        className={`rounded-xl border px-4 py-3 text-xs flex items-start gap-3 ${
          isLiveReady
            ? 'border-sky-500/20 bg-sky-950/20 text-sky-200'
            : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
        }`}
      >
        <Info size={16} className={`mt-0.5 shrink-0 ${isLiveReady ? 'text-sky-400' : 'text-amber-400'}`} />
        <div className="space-y-1">
          <p className="font-medium text-white">
            {isLiveReady
              ? 'Testnet Registry Contract Active'
              : 'LOCAL SIMULATION — NO ON-CHAIN TRANSACTION'}
          </p>
          <p className="leading-relaxed opacity-90">
            {isLiveReady ? (
              <span>
                Verified registry contract active on Bohr Testnet at{' '}
                <span className="font-mono text-[#4ade80]">{registryLiveResult.address}</span>. Live transactions
                require connected wallet on Bohr Testnet (Chain ID 968) and test gas.
              </span>
            ) : registryLiveResult.status === 'NOT_DEPLOYED' ? (
              <span>
                Contract address configured (<span className="font-mono text-amber-300">{registryLiveResult.address}</span>), but no verified contract bytecode was found on Bohr Testnet (Chain ID 968). The console refuses to advertise an unverified contract as live and operates strictly in local simulation mode.
              </span>
            ) : registryLiveResult.status === 'RPC_ERROR' || registryLiveResult.status === 'WRONG_CHAIN' ? (
              <span>
                Bohr Testnet connection unverified: {registryLiveResult.error}. Operating strictly in local simulation mode without fabricating blockchain transaction hashes.
              </span>
            ) : (
              <span>
                BotChainDatasetRegistry is not yet deployed on Bohr Testnet. Claims of on-chain verification are disabled.
                The console operates strictly in local simulation mode without fabricating blockchain transaction hashes or substituting local state for real on-chain readback.
              </span>
            )}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
          <Info size={16} /> {infoMessage}
        </div>
      )}

      {/* 3-Step Pilot Flow */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Step 1: Canonical Hash & Register */}
        <Panel className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Cpu className="text-[#38bdf8]" size={18} />
            <h3 className="font-semibold text-white">1. Register Dataset</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400">Dataset Identifier</label>
              <input
                type="text"
                value={datasetIdInput}
                onChange={(e) => setDatasetIdInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400">Version</label>
                <input
                  type="text"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                />
              </div>
              <div>
                <label className="text-slate-400">Public Metadata URI</label>
                <input
                  type="text"
                  value={metadataUriInput}
                  onChange={(e) => setMetadataUriInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400">Synthetic Payload (JSON)</label>
              <textarea
                rows={6}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                className="mt-1 w-full font-mono text-[11px] rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 outline-none focus:border-[#38bdf8]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleComputeHash}
                disabled={isHashing}
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] py-2 text-slate-200 hover:bg-white/[0.08]"
              >
                {isHashing ? 'Computing...' : 'Canonicalize & Hash'}
              </button>
              <button
                type="button"
                onClick={handleRegisterRecord}
                disabled={isSubmitting}
                className={`flex-1 rounded-lg py-2 font-medium text-white transition ${
                  isLiveReady
                    ? 'bg-[#0284c7] hover:bg-[#0369a1]'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isSubmitting
                  ? 'Processing...'
                  : isLiveReady
                  ? 'Submit On-Chain'
                  : 'Stage Local Simulation'}
              </button>
            </div>

            {calculatedHash && (
              <div className="rounded-lg bg-black/40 p-2.5 font-mono text-[10px] text-slate-300 break-all border border-white/5">
                <span className="text-[#38bdf8]">SHA-256: </span>
                {calculatedHash}
              </div>
            )}
          </div>
        </Panel>

        {/* Step 2: Read Stored Record */}
        <Panel className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Database className="text-[#4ade80]" size={18} />
            <h3 className="font-semibold text-white">2. Read Stored Record</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 space-y-1.5">
              <label className="text-[11px] text-slate-400">Load On-Chain Record by ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID (e.g. BOT-SYNTH-001 or 0x...)"
                  value={loadDatasetIdInput}
                  onChange={(e) => setLoadDatasetIdInput(e.target.value)}
                  className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#4ade80]"
                />
                <button
                  type="button"
                  onClick={handleFetchOnChainRecord}
                  disabled={isLoadingRecord}
                  className="rounded-md bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isLoadingRecord ? 'Fetching...' : 'Query'}
                </button>
              </div>
            </div>

            {storedRecord ? (
              <div className="space-y-2.5">
                <div className="rounded-lg bg-black/30 p-3 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Record Status:</span>
                    {storedRecord.isLiveOnChain ? (
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                        CONFIRMED ON-CHAIN (RPC READBACK)
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                        LOCAL SIMULATION — NO ON-CHAIN TRANSACTION
                      </span>
                    )}
                  </div>

                  <div className="text-slate-400 pt-1">Dataset ID:</div>
                  <div className="font-mono text-[11px] text-[#7dd3fc] break-all">{storedRecord.datasetId}</div>
                  
                  <div className="text-slate-400 pt-1">Stored Content Hash:</div>
                  <div className="font-mono text-[11px] text-[#4ade80] break-all">{storedRecord.datasetHash}</div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-slate-400">Version:</div>
                      <div className="font-mono text-white">{storedRecord.version}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Timestamp:</div>
                      <div className="font-mono text-white">{new Date(storedRecord.timestamp * 1000).toLocaleTimeString()}</div>
                    </div>
                  </div>

                  <div className="text-slate-400 pt-1">Submitter:</div>
                  <div className="font-mono text-[11px] text-slate-300 break-all">{storedRecord.submitter}</div>
                </div>

                {storedRecord.isLiveOnChain && storedRecord.txHash ? (
                  <div className="rounded-lg bg-[#0d1c2e] p-2.5 border border-[#38bdf8]/20 flex items-center justify-between">
                    <span className="text-slate-400">Transaction:</span>
                    <a
                      href={getExplorerTxUrl(storedRecord.txHash, BOTCHAIN_TESTNET.chainId)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-mono text-[11px] text-[#38bdf8] hover:underline"
                    >
                      {storedRecord.txHash.slice(0, 10)}...{storedRecord.txHash.slice(-6)}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-950/30 p-2.5 border border-amber-500/20 text-[11px] text-amber-300">
                    <span>{storedRecord.isLiveOnChain ? 'Record read independently from on-chain state.' : 'Local simulation only. No on-chain transaction hash or block explorer record exists.'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                <Layers size={32} className="mb-2 opacity-40" />
                <p>No record loaded or registered yet.</p>
                <p className="text-[11px] text-slate-600 mt-1">Submit in Step 1 or query an ID above to inspect state.</p>
              </div>
            )}
          </div>
        </Panel>

        {/* Step 3: Verify Integrity */}
        <Panel className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Shield className="text-[#a78bfa]" size={18} />
            <h3 className="font-semibold text-white">3. Verify Integrity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-400 text-[11px]">
              Recalculates canonical SHA-256 against stored hash to verify data integrity without corruption or tampering.
            </p>

            <div>
              <label className="text-slate-400">Verify Candidate Payload (Try modifying a value to test mismatch)</label>
              <textarea
                rows={6}
                value={verificationInput}
                onChange={(e) => { setVerificationInput(e.target.value); setVerificationResult('IDLE') }}
                className="mt-1 w-full font-mono text-[11px] rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 outline-none focus:border-[#a78bfa]"
              />
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={!storedRecord}
              className="w-full rounded-lg bg-[#7c3aed] py-2 font-medium text-white hover:bg-[#6d28d9] disabled:opacity-50"
            >
{storedRecord?.isLiveOnChain ? 'Verify Against On-Chain Hash' : 'Verify Against Staged Simulation Hash'}
            </button>

            {!storedRecord?.isLiveOnChain && storedRecord && (
              <p className="text-[10px] text-amber-300/80 italic">
                * Note: Claims of on-chain verification are disabled during local simulation.
              </p>
            )}

            {verificationResult !== 'IDLE' && (
              <div
                className={`rounded-xl border p-4 text-center font-bold tracking-wider ${
                  verificationResult === 'MATCH'
                    ? 'border-[#22c55e]/40 bg-[#22c55e]/10 text-[#4ade80]'
                    : 'border-red-500/40 bg-red-500/10 text-red-400'
                }`}
              >
                {verificationResult === 'MATCH' ? (
                  <div className="flex flex-col items-center gap-1">
<span className="flex items-center gap-1.5 text-sm">
                      <CheckCircle2 size={18} />
                      {storedRecord?.isLiveOnChain
                        ? 'MATCH [ON-CHAIN RECORD INTEGRITY VERIFIED]'
                        : 'MATCH [LOCAL SIMULATION ONLY — NOT ON-CHAIN]'}
                    </span>
                    <span className="text-[10px] font-normal text-slate-300">
                      {storedRecord?.isLiveOnChain
                        ? 'Calculated SHA-256 matches independently retrieved on-chain state'
                        : 'Calculated SHA-256 matches local simulation record (no on-chain proof)'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
<span className="flex items-center gap-1.5 text-sm">
                      <XCircle size={18} /> MISMATCH [PAYLOAD ALTERED]
                    </span>
                    <span className="text-[10px] font-normal text-slate-300">
                      Recalculated hash does not match stored record
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Live Event Activity Stream Table */}
      {isLiveReady && (
        <Panel className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="text-[#38bdf8]" size={18} />
              <div>
                <h3 className="font-semibold text-white">Live On-Chain Event Activity Stream</h3>
                <p className="text-[11px] text-slate-400">
                  Real-time dataset records anchored into Bohr Testnet contract <span className="font-mono text-slate-300">({registryLiveResult.address?.slice(0, 8)}...{registryLiveResult.address?.slice(-6)})</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadActivityStream}
              disabled={isLoadingActivity}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08]"
            >
              <RefreshCw size={12} className={isLoadingActivity ? 'animate-spin' : ''} />
              {isLoadingActivity ? 'Refreshing...' : 'Refresh Activity'}
            </button>
          </div>

          {recentRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isLoadingActivity ? 'Reading records from Bohr Testnet...' : 'No records registered on-chain yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-medium text-slate-400">
                    <th className="py-2.5 px-3">Dataset ID</th>
                    <th className="py-2.5 px-3">Content SHA-256</th>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3">Submitter</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {recentRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {r.datasetId.startsWith('0x444154554d') ? 'DATUMX-BOT-LIVE-001' : `${r.datasetId.slice(0, 10)}...${r.datasetId.slice(-6)}`}
                      </td>
                      <td className="py-2.5 px-3 text-[#38bdf8]">
                        {r.datasetHash.slice(0, 10)}...{r.datasetHash.slice(-8)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">{r.version}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {r.submitter.slice(0, 6)}...{r.submitter.slice(-4)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400">
                        {new Date(r.timestamp * 1000).toLocaleString([], { hour12: false })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setStoredRecord({
                              datasetId: r.datasetId,
                              datasetHash: r.datasetHash,
                              version: r.version,
                              metadataURI: r.metadataURI,
                              submitter: r.submitter,
                              timestamp: r.timestamp,
                              isLiveOnChain: true,
                            })
                            setInfoMessage(`Loaded dataset ${r.datasetId.slice(0, 10)}... into Step 2 & 3 for verification.`)
                          }}
                          className="rounded bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-400 hover:bg-sky-500/20"
                        >
                          Verify in Step 3
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
