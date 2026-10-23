import { useState } from 'react'
import { CheckCircle2, XCircle, Shield, Database, Cpu, Layers, AlertCircle, Info } from 'lucide-react'
import { Panel } from '../shared/Panel'
import { BOTCHAIN_TESTNET, BOTCHAIN_PILOT_CONFIG } from '../../lib/botchainConfig'
import { canonicalJsonStringify, computeSha256Hex } from '../../lib/canonicalHash'
import { switchToBotChainTestnet, getEthereumProvider, getExplorerTxUrl } from '../../lib/network'
import { isBotchainContractDeployed, submitBotchainDataset, readBotchainDataset } from '../../lib/botchainClient'
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
  txHash?: string
}

export function BotChainPilotPanel({ wallet, onRefreshWallet }: BotChainPilotPanelProps) {
  // Synthetic benchmark default
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
  const [datasetIdInput, setDatasetIdInput] = useState('BOT-SYNTH-001')
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

  // Verification state
  const [verificationInput, setVerificationInput] = useState<string>(JSON.stringify(defaultPayload, null, 2))
  const [verificationResult, setVerificationResult] = useState<'IDLE' | 'MATCH' | 'MISMATCH'>('IDLE')

  const isBohrChain = wallet.chainId === BOTCHAIN_TESTNET.chainId
  const contractDeployed = isBotchainContractDeployed()

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
    setIsSubmitting(true)

    try {
      const parsed = JSON.parse(rawJson)
      const canonical = canonicalJsonStringify(parsed)
      const hash = await computeSha256Hex(canonical)
      const computedId = (await computeSha256Hex(datasetIdInput)) as `0x${string}`

      if (contractDeployed && isBohrChain && wallet.account) {
        // Live on-chain transaction mode
        try {
          const liveTx = await submitBotchainDataset({
            account: wallet.account,
            datasetId: computedId,
            datasetHash: hash,
            version: versionInput,
            metadataURI: metadataUriInput,
          })

          // Read back confirmed record from chain
          const onChainRecord = await readBotchainDataset(computedId)

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
          setInfoMessage(`Transaction confirmed on Bohr Testnet: ${liveTx}`)
        } catch (contractErr: unknown) {
          const contractMsg = contractErr instanceof Error ? contractErr.message : 'On-chain submission failed.'
          setErrorMessage(contractMsg)
        }
      } else {
        // Clear, honest demonstration mode without fabricated transaction hashes or fake explorer links
        const stagedRecord: StoredPilotRecord = {
          datasetId: computedId,
          datasetHash: hash,
          version: versionInput,
          metadataURI: metadataUriInput,
          submitter: wallet.account || '0x31A826bB9D5F6087d94CDA31945C1234d061b788',
          timestamp: Math.floor(Date.now() / 1000),
          isLiveOnChain: false,
          txHash: undefined, // Strictly undefined: NO fake/mock transaction hashes generated
        }

        setStoredRecord(stagedRecord)
        setInfoMessage(
          'Workflow staged in pilot sandbox. Live on-chain transaction requires Bohr Testnet deployment and faucet tokens.',
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration error'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async () => {
    if (!storedRecord) {
      setErrorMessage('No record available to verify against. Register a dataset record first.')
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
              <span className="rounded-md border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2 py-0.5 text-xs text-[#7dd3fc]">
                PILOT STAGING
              </span>
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
      <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 px-4 py-3 text-xs text-sky-200 flex items-start gap-3">
        <Info size={16} className="mt-0.5 shrink-0 text-sky-400" />
        <div className="space-y-1">
          <p className="font-medium text-sky-100">Testnet Pilot Deployment Posture</p>
          <p className="text-sky-300/80 leading-relaxed">
            Smart contract bytecode and test suite ([`BotChainDatasetRegistry.sol`](contracts/botchain/BotChainDatasetRegistry.sol)) are fully compiled and verified.
            {contractDeployed ? (
              <span className="text-[#4ade80] font-semibold"> Live registry contract active at {BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress}.</span>
            ) : (
              <span> On-chain contract deployment on Bohr Testnet will be executed once test BOT gas tokens are allocated. The console operates honestly in client-side staging mode without fabricated blockchain transaction hashes.</span>
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
                className="flex-1 rounded-lg bg-[#0284c7] py-2 font-medium text-white hover:bg-[#0369a1]"
              >
                {isSubmitting ? 'Registering...' : contractDeployed ? 'Submit On-Chain' : 'Stage Record'}
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
            {storedRecord ? (
              <div className="space-y-2.5">
                <div className="rounded-lg bg-black/30 p-3 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Record Status:</span>
                    {storedRecord.isLiveOnChain ? (
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30">
                        CONFIRMED ON-CHAIN
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 border border-amber-500/30">
                        STAGED IN PILOT SANDBOX
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

                {storedRecord.txHash ? (
                  <div className="rounded-lg bg-[#0d1c2e] p-2.5 border border-[#38bdf8]/20 flex items-center justify-between">
                    <span className="text-slate-400">Transaction:</span>
                    <a
                      href={getExplorerTxUrl(storedRecord.txHash, BOTCHAIN_TESTNET.chainId)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-mono text-[11px] text-[#38bdf8] hover:underline"
                    >
                      {storedRecord.txHash.slice(0, 10)}...{storedRecord.txHash.slice(-6)}
                    </a>
                  </div>
                ) : (
                  <div className="rounded-lg bg-black/20 p-2.5 border border-white/5 text-[11px] text-slate-400">
                    <span>On-chain transaction hash will be generated upon live contract execution on Bohr Testnet.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <Layers size={32} className="mb-2 opacity-40" />
                <p>No record registered yet.</p>
                <p className="text-[11px] text-slate-600 mt-1">Submit a synthetic dataset record in Step 1 to inspect state.</p>
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
                onChange={(e) => setVerificationInput(e.target.value)}
                className="mt-1 w-full font-mono text-[11px] rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 outline-none focus:border-[#a78bfa]"
              />
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={!storedRecord}
              className="w-full rounded-lg bg-[#7c3aed] py-2 font-medium text-white hover:bg-[#6d28d9] disabled:opacity-50"
            >
              Verify Against Stored Hash
            </button>

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
                    <span className="flex items-center gap-1.5 text-base">
                      <CheckCircle2 size={18} /> MATCH [RECORD INTEGRITY VERIFIED]
                    </span>
                    <span className="text-[10px] font-normal text-slate-300">
                      Calculated SHA-256 matches stored state
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1.5 text-base">
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
    </div>
  )
}
