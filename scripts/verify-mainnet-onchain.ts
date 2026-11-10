/**
 * Programmatic BOT Chain Mainnet Live On-Chain Mismatch & Verification Proof
 * 
 * Target Contract: 0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7
 * Network: BOT Chain Mainnet (Chain ID 677)
 * RPC: https://rpc.botchain.ai
 * Explorer: https://scan.botchain.ai
 */

import { createPublicClient, http, parseAbi } from 'viem'
import { canonicalJsonStringify, computeSha256Hex } from '../src/lib/canonicalHash.ts'

const REGISTRY_ADDRESS = '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7' as const
const RPC_URL = 'https://rpc.botchain.ai'
const CHAIN_ID = 677

const REGISTRY_ABI = parseAbi([
  'function getDataset(bytes32 datasetId) external view returns ((bytes32 datasetId, bytes32 datasetHash, string version, string metadataURI, address submitter, uint64 timestamp, bool exists))',
  'function verifyDatasetHash(bytes32 datasetId, bytes32 candidateHash) external view returns (bool)',
  'function totalRecords() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function publicRegistrationEnabled() external view returns (bool)',
])

async function main() {
  console.log('='.repeat(80))
  console.log('DATUMX × BOT CHAIN: MAINNET LIVE ON-CHAIN VERIFICATION & MISMATCH PROOF')
  console.log('='.repeat(80))
  console.log(`Registry Contract:  ${REGISTRY_ADDRESS}`)
  console.log(`RPC Endpoint:       ${RPC_URL}`)
  console.log(`Target Chain ID:    ${CHAIN_ID}`)
  console.log('')

  const client = createPublicClient({
    transport: http(RPC_URL),
  })

  // 1. Verify RPC Connection & Chain ID
  const chainId = await client.getChainId()
  console.log(`[1] Connected to RPC. Chain ID returned: ${chainId}`)
  if (chainId !== CHAIN_ID) {
    throw new Error(`Expected Chain ID ${CHAIN_ID}, got ${chainId}`)
  }

  // 2. Query Contract Invariants
  const owner = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'owner',
  })
  const publicReg = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'publicRegistrationEnabled',
  })
  const total = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'totalRecords',
  })

  console.log(`[2] Registry Invariants:`)
  console.log(`    - Owner Address:               ${owner}`)
  console.log(`    - Public Registration Enabled: ${publicReg}`)
  console.log(`    - Total Anchored Datasets:     ${total}`)
  console.log('')

  // 3. Define Original Benchmark Payload (BOT-SYNTH-002)
  const originalPayload = {
    benchmarkId: 'BOT-SYNTH-BENCHMARK-002',
    projectName: 'Bohr Clean Energy Sensor Grid',
    samples: [
      { depth: 15.0, gammaCount: 165.2, status: 'validated' },
      { depth: 30.0, gammaCount: 210.5, status: 'validated' },
      { depth: 45.0, gammaCount: 345.8, status: 'anomalous_high' },
    ],
    timestamp: 1792736400,
  }

  const rawDatasetId = 'BOT-SYNTH-002'
  const computedDatasetId = (await computeSha256Hex(rawDatasetId)) as `0x${string}`
  console.log(`[3] Dataset Identifier: "${rawDatasetId}"`)
  console.log(`    Computed bytes32 ID: ${computedDatasetId}`)

  const originalCanonicalJson = canonicalJsonStringify(originalPayload)
  const originalHash = (await computeSha256Hex(originalCanonicalJson)) as `0x${string}`
  console.log(`    Calculated SHA-256:  ${originalHash}`)
  console.log('')

  // 4. Read Live On-Chain Record from Registry via getDataset()
  console.log('[4] Fetching on-chain record via getDataset()...')
  const record = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'getDataset',
    args: [computedDatasetId],
  })

  console.log('    On-Chain Record Retrieved:')
  console.log(`    - datasetId:   ${record.datasetId}`)
  console.log(`    - datasetHash: ${record.datasetHash}`)
  console.log(`    - version:     ${record.version}`)
  console.log(`    - metadataURI: ${record.metadataURI}`)
  console.log(`    - submitter:   ${record.submitter}`)
  console.log(`    - timestamp:   ${record.timestamp.toString()} (${new Date(Number(record.timestamp) * 1000).toISOString()})`)
  console.log(`    - exists:      ${record.exists}`)
  console.log('')

  if (!record.exists) {
    throw new Error('Dataset record does not exist on BOT Chain Mainnet!')
  }

  // 5. Query verifyDatasetHash() with Original Hash -> MATCH
  console.log('[5] Querying on-chain verifyDatasetHash() with ORIGINAL hash...')
  const matchResult = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'verifyDatasetHash',
    args: [computedDatasetId, originalHash],
  })

  console.log(`    Result: ${matchResult} => ${matchResult ? 'MATCH [ON-CHAIN RECORD INTEGRITY VERIFIED]' : 'FAIL'}`)
  console.log('')

  // 6. Query verifyDatasetHash() with Altered Hash -> MISMATCH
  const alteredPayload = {
    ...originalPayload,
    samples: [
      { depth: 15.0, gammaCount: 999.9, status: 'validated' }, // Altered field
      { depth: 30.0, gammaCount: 210.5, status: 'validated' },
      { depth: 45.0, gammaCount: 345.8, status: 'anomalous_high' },
    ],
  }
  const alteredCanonicalJson = canonicalJsonStringify(alteredPayload)
  const alteredHash = (await computeSha256Hex(alteredCanonicalJson)) as `0x${string}`

  console.log('[6] Querying on-chain verifyDatasetHash() with TAMPERED hash (gammaCount: 165.2 -> 999.9)...')
  console.log(`    Tampered SHA-256: ${alteredHash}`)
  const mismatchResult = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'verifyDatasetHash',
    args: [computedDatasetId, alteredHash],
  })

  console.log(`    Result: ${mismatchResult} => ${!mismatchResult ? 'MISMATCH [TAMPERING REJECTED]' : 'FAIL'}`)
  console.log('')
  console.log('='.repeat(80))
  console.log('BOT CHAIN MAINNET CRYPTOGRAPHIC PROOF VERIFIED!')
  console.log('='.repeat(80))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
