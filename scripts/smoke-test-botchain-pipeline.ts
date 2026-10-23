/**
 * Programmatic BOT Chain Synthetic Registry End-to-End Pipeline Smoke Test
 * 
 * Smoke Test 2 verifies the complete 4-stage pipeline:
 *   Stage 1: Canonicalization using canonicalJsonStringify() with synthetic benchmark payload BOT-SYNTH-BENCHMARK-001
 *   Stage 2: SHA-256 Digest Computation using computeSha256Hex() producing EVM bytes32 formatted hex string
 *   Stage 3: Registry Record Generation generating on-chain dataset record state
 *   Stage 4: State Match & Mismatch Verification validating exact match, order invariance, and tamper rejection
 */

import { canonicalJsonStringify, computeSha256Hex } from '../src/lib/canonicalHash.ts'
import { BOTCHAIN_TESTNET, BOTCHAIN_PILOT_CONFIG } from '../src/lib/botchainConfig.ts'

interface SensorSample {
  depth: number
  gammaCount: number
  status: string
}

interface BenchmarkPayload {
  benchmarkId: string
  projectName: string
  samples: SensorSample[]
  timestamp: number
}

interface StoredPilotRecord {
  datasetId: `0x${string}`
  datasetHash: `0x${string}`
  version: string
  metadataURI: string
  submitter: `0x${string}`
  timestamp: number
  exists: boolean
  txHash?: string
}

class EmulatedBotChainRegistry {
  private records = new Map<string, StoredPilotRecord>()
  private recordIds: string[] = []

  public registerDataset(
    datasetId: `0x${string}`,
    datasetHash: `0x${string}`,
    version: string,
    metadataURI: string,
    submitter: `0x${string}`,
    timestamp: number
  ): boolean {
    if (!datasetId || datasetId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      throw new Error('EmptyIdentifier')
    }
    if (!datasetHash || datasetHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      throw new Error('EmptyHash')
    }
    if (!version || version.trim().length === 0) {
      throw new Error('EmptyVersion')
    }
    if (this.records.has(datasetId)) {
      throw new Error('RecordAlreadyExists')
    }

    const record: StoredPilotRecord = {
      datasetId,
      datasetHash,
      version,
      metadataURI,
      submitter,
      timestamp,
      exists: true,
      txHash: undefined, // Simulated record: strictly NO fabricated or random transaction hashes
    }

    this.records.set(datasetId, record)
    this.recordIds.push(datasetId)
    return true
  }

  public getDataset(datasetId: `0x${string}`): StoredPilotRecord {
    const record = this.records.get(datasetId)
    if (!record || !record.exists) {
      throw new Error('RecordNotFound')
    }
    return record
  }

  public verifyDatasetHash(datasetId: `0x${string}`, candidateHash: `0x${string}`): boolean {
    const record = this.getDataset(datasetId)
    return record.datasetHash.toLowerCase() === candidateHash.toLowerCase()
  }

  public totalRecords(): number {
    return this.records.size
  }

  public getRecordIdAt(index: number): string {
    if (index >= this.recordIds.length) {
      throw new Error('Index out of bounds')
    }
    return this.recordIds[index]
  }
}

/**
 * Calculates bitwise Hamming distance between two 256-bit hexadecimal strings.
 */
function calculateHammingDistance(hexA: string, hexB: string): number {
  const cleanA = hexA.startsWith('0x') ? hexA.slice(2) : hexA
  const cleanB = hexB.startsWith('0x') ? hexB.slice(2) : hexB
  let differingBits = 0

  for (let i = 0; i < 64; i += 8) {
    const chunkA = parseInt(cleanA.substring(i, i + 8), 16)
    const chunkB = parseInt(cleanB.substring(i, i + 8), 16)
    let xor = (chunkA ^ chunkB) >>> 0
    while (xor !== 0) {
      differingBits += xor & 1
      xor >>>= 1
    }
  }
  return differingBits
}

export async function runBotChainPipelineSmokeTest() {
  console.log('='.repeat(80))
  console.log('  DATUMX × BOT CHAIN PILOT: PROGRAMMATIC SYNTHETIC REGISTRY E2E PIPELINE')
  console.log('  Smoke Test 2 — Canonicalization, SHA-256 Digest, Registration & Tamper Proof')
  console.log('='.repeat(80))
  console.log(`[Config] Target Network : ${BOTCHAIN_TESTNET.name} (Chain ID: ${BOTCHAIN_TESTNET.chainId} / ${BOTCHAIN_TESTNET.chainIdHex})`)
  console.log(`[Config] RPC URL        : ${BOTCHAIN_TESTNET.rpcUrl}`)
  console.log(`[Config] Explorer URL   : ${BOTCHAIN_TESTNET.blockExplorerUrl}`)
  console.log(`[Config] Pilot Contract : ${BOTCHAIN_PILOT_CONFIG.pilotRegistryAddress}`)
  console.log('-'.repeat(80))

  // =========================================================================
  // STAGE 1: Canonicalization
  // =========================================================================
  console.log('\n>>> STAGE 1: CANONICALIZATION (RFC-8785 Compliant JCS Implementation)')

  const benchmarkPayload: BenchmarkPayload = {
    benchmarkId: 'BOT-SYNTH-BENCHMARK-001',
    projectName: 'Bohr Clean Energy Sensor Grid',
    samples: [
      { depth: 10.5, gammaCount: 142.8, status: 'validated' },
      { depth: 21.0, gammaCount: 198.4, status: 'validated' },
      { depth: 31.5, gammaCount: 312.0, status: 'anomalous_high' },
    ],
    timestamp: 1792732800,
  }

  // Intentionally shuffled keys to prove insertion-order invariance
  const disorderedPayload = {
    timestamp: 1792732800,
    projectName: 'Bohr Clean Energy Sensor Grid',
    samples: [
      { status: 'validated', depth: 10.5, gammaCount: 142.8 },
      { gammaCount: 198.4, status: 'validated', depth: 21.0 },
      { depth: 31.5, status: 'anomalous_high', gammaCount: 312.0 },
    ],
    benchmarkId: 'BOT-SYNTH-BENCHMARK-001',
  }

  const canonicalString = canonicalJsonStringify(benchmarkPayload)
  const disorderedCanonical = canonicalJsonStringify(disorderedPayload)

  console.log(`  [Payload] Original Benchmark ID : ${benchmarkPayload.benchmarkId}`)
  console.log(`  [Payload] Sensor Samples Count  : ${benchmarkPayload.samples.length}`)
  console.log(`  [Payload] Timestamp             : ${benchmarkPayload.timestamp}`)
  console.log(`  [Result]  Canonical String      : ${canonicalString}`)
  console.log(`  [Result]  Canonical Byte Length : ${new TextEncoder().encode(canonicalString).length} bytes`)

  if (canonicalString !== disorderedCanonical) {
    throw new Error('STAGE 1 FAILED: Canonical string varies with key insertion order!')
  }
  console.log('  [Check]   Order Invariance Check: PASS (Disordered payload yielded identical canonical string)')

  // =========================================================================
  // STAGE 2: SHA-256 Digest Computation
  // =========================================================================
  console.log('\n>>> STAGE 2: CRYPTOGRAPHIC SHA-256 DIGEST COMPUTATION')

  const datasetHash = await computeSha256Hex(canonicalString)
  const rawDatasetId = 'BOT-SYNTH-001'
  const datasetId = (await computeSha256Hex(rawDatasetId)) as `0x${string}`

  console.log(`  [Input]  Canonical Payload to Digest : ${canonicalString.slice(0, 60)}...`)
  console.log(`  [Result] Calculated Dataset Hash     : ${datasetHash}`)
  console.log(`  [Result] Computed Dataset ID (bytes32): ${datasetId}`)

  const bytes32Regex = /^0x[a-f0-9]{64}$/
  if (!bytes32Regex.test(datasetHash)) {
    throw new Error(`STAGE 2 FAILED: datasetHash does not match EVM bytes32 format: ${datasetHash}`)
  }
  if (!bytes32Regex.test(datasetId)) {
    throw new Error(`STAGE 2 FAILED: datasetId does not match EVM bytes32 format: ${datasetId}`)
  }
  console.log('  [Check]  EVM bytes32 Formatting Check: PASS (Length 66, prefix 0x, 64 hex chars)')

  // =========================================================================
  // STAGE 3: Registry Record Generation & State Storage
  // =========================================================================
  console.log('\n>>> STAGE 3: REGISTRY RECORD GENERATION & ON-CHAIN STATE EMULATION')

  const registry = new EmulatedBotChainRegistry()
  const version = '1.0.0'
  const metadataURI = 'https://datumx.io/meta/bot-synth-001.json'
  const submitter = '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`
  const registrationTimestamp = 1792732800

  const registered = registry.registerDataset(
    datasetId,
    datasetHash,
    version,
    metadataURI,
    submitter,
    registrationTimestamp
  )

  if (!registered) {
    throw new Error('STAGE 3 FAILED: Registry returned false on registration')
  }

  const storedRecord = registry.getDataset(datasetId)
  console.log('  [State] Stored Record Retrieved:')
  console.log(`          - datasetId   : ${storedRecord.datasetId}`)
  console.log(`          - datasetHash : ${storedRecord.datasetHash}`)
  console.log(`          - version     : ${storedRecord.version}`)
  console.log(`          - metadataURI : ${storedRecord.metadataURI}`)
  console.log(`          - submitter   : ${storedRecord.submitter}`)
  console.log(`          - timestamp   : ${storedRecord.timestamp}`)
  console.log(`          - exists      : ${storedRecord.exists}`)
  console.log(`          - txHash      : ${storedRecord.txHash || 'None (Emulated Simulation — No Fake On-Chain Hash)'}`)
  console.log(`  [State] Total Records Registered: ${registry.totalRecords()}`)

  if (storedRecord.datasetHash !== datasetHash || storedRecord.datasetId !== datasetId) {
    throw new Error('STAGE 3 FAILED: Stored record attributes do not match registered inputs')
  }
  console.log('  [Check] Registry State Persistence Check: PASS')

  // =========================================================================
  // STAGE 4: State Match & Mismatch Verification (Tamper Resistance)
  // =========================================================================
  console.log('\n>>> STAGE 4: STATE MATCH & MISMATCH VERIFICATION (TAMPER RESISTANCE)')

  // 4.1 Exact Match Test
  const candidateCanonicalExact = canonicalJsonStringify(benchmarkPayload)
  const candidateHashExact = await computeSha256Hex(candidateCanonicalExact)
  const matchResultExact = registry.verifyDatasetHash(datasetId, candidateHashExact)

  console.log('  [Case 4.1] Exact Payload Verification:')
  console.log(`             Candidate Hash : ${candidateHashExact}`)
  console.log(`             Stored Hash    : ${storedRecord.datasetHash}`)
  console.log(`             Match Result   : ${matchResultExact ? 'MATCH [RECORD INTEGRITY VERIFIED]' : 'FAIL'}`)

  if (!matchResultExact) {
    throw new Error('STAGE 4.1 FAILED: Exact payload failed to match stored record')
  }

  // 4.2 Permuted Order Match Test
  const candidateCanonicalPermuted = canonicalJsonStringify(disorderedPayload)
  const candidateHashPermuted = await computeSha256Hex(candidateCanonicalPermuted)
  const matchResultPermuted = registry.verifyDatasetHash(datasetId, candidateHashPermuted)

  console.log('  [Case 4.2] Permuted Payload Order Verification:')
  console.log(`             Permuted Hash  : ${candidateHashPermuted}`)
  console.log(`             Stored Hash    : ${storedRecord.datasetHash}`)
  console.log(`             Match Result   : ${matchResultPermuted ? 'MATCH [ZERO DRIFT CONFIRMED]' : 'FAIL'}`)

  if (!matchResultPermuted) {
    throw new Error('STAGE 4.2 FAILED: Permuted payload failed to match stored record')
  }

  // 4.3 Tampered Payload Mismatch Test (Subtle single-value modification)
  const tamperedPayload: BenchmarkPayload = {
    ...benchmarkPayload,
    samples: [
      { depth: 10.5, gammaCount: 142.800001, status: 'validated' }, // Altered by 0.000001
      { depth: 21.0, gammaCount: 198.4, status: 'validated' },
      { depth: 31.5, gammaCount: 312.0, status: 'anomalous_high' },
    ],
  }

  const candidateCanonicalTampered = canonicalJsonStringify(tamperedPayload)
  const candidateHashTampered = await computeSha256Hex(candidateCanonicalTampered)
  const matchResultTampered = registry.verifyDatasetHash(datasetId, candidateHashTampered)

  console.log('  [Case 4.3] Tampered Payload Verification (Altered gammaCount 142.8 -> 142.800001):')
  console.log(`             Tampered Hash  : ${candidateHashTampered}`)
  console.log(`             Stored Hash    : ${storedRecord.datasetHash}`)
  console.log(`             Match Result   : ${!matchResultTampered ? 'MISMATCH [TAMPER DETECTED / PAYLOAD ALTERED]' : 'FAIL - Tamper was not detected!'}`)

  if (matchResultTampered) {
    throw new Error('STAGE 4.3 FAILED: Tampered payload falsely verified as matching!')
  }

  // 4.4 Cryptographic Avalanche Analysis
  const differingBits = calculateHammingDistance(datasetHash, candidateHashTampered)
  const avalanchePercentage = ((differingBits / 256) * 100).toFixed(2)

  console.log('  [Case 4.4] Cryptographic Avalanche Effect:')
  console.log(`             Differing Bits : ${differingBits} / 256 bits`)
  console.log(`             Bit Flip Rate  : ${avalanchePercentage}% (Expected ~50% for SHA-256)`)

  // 4.5 Boundary & Duplicate Tests
  console.log('  [Case 4.5] Boundary & Revert Checks:')
  try {
    registry.registerDataset(datasetId, datasetHash, '1.0.1', metadataURI, submitter, registrationTimestamp)
    throw new Error('Duplicate registration should have reverted!')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'RecordAlreadyExists') {
      console.log('             Duplicate Registration Guard : PASS (Caught RecordAlreadyExists)')
    } else {
      throw err
    }
  }

  try {
    const bogusId = '0x1111111111111111111111111111111111111111111111111111111111111111' as `0x${string}`
    registry.getDataset(bogusId)
    throw new Error('Querying missing record should have reverted!')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'RecordNotFound') {
      console.log('             Non-existent Record Guard    : PASS (Caught RecordNotFound)')
    } else {
      throw err
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('  ALL 4 STAGES PASSED SUCCESSFULLY — ZERO-DRIFT INTEGRITY VERIFIED')
  console.log('='.repeat(80))

  return {
    success: true,
    datasetId,
    datasetHash,
    canonicalString,
    tamperedHash: candidateHashTampered,
    differingBits,
    avalanchePercentage,
  }
}

// Auto-run if executed as main CLI script
runBotChainPipelineSmokeTest().catch((err) => {
  console.error('\n[FATAL] Pipeline Smoke Test Failed:', err)
  process.exit(1)
})
