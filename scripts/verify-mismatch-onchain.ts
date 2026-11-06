/**
 * Programmatic Bohr Testnet Live On-Chain Mismatch Proof
 * 
 * Target Contract: 0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7
 * Network: Bohr Testnet (Chain ID 968)
 * RPC: https://rpc.bohr.life
 * Explorer: https://scan.bohr.life
 */

import { createPublicClient, http, parseAbi } from 'viem'
import { canonicalJsonStringify, computeSha256Hex } from '../src/lib/canonicalHash.ts'

const REGISTRY_ADDRESS = '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7' as const
const RPC_URL = 'https://rpc.bohr.life'
const CHAIN_ID = 968

const REGISTRY_ABI = parseAbi([
  'function getDataset(bytes32 datasetId) external view returns ((bytes32 datasetId, bytes32 datasetHash, string version, string metadataURI, address submitter, uint64 timestamp, bool exists))',
  'function verifyDatasetHash(bytes32 datasetId, bytes32 candidateHash) external view returns (bool)',
  'function totalRecords() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function publicRegistrationEnabled() external view returns (bool)',
])

async function main() {
  console.log('='.repeat(80))
  console.log('DATUMX × BOT CHAIN: BOHR TESTNET ON-CHAIN MISMATCH PROOF')
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

  // 2. Define Original Payload (BOT-SYNTH-002 Benchmark)
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

  // 3. Compute Canonical Identifiers & Hashes
  const rawDatasetId = 'BOT-SYNTH-002'
  const computedDatasetId = (await computeSha256Hex(rawDatasetId)) as `0x${string}`
  console.log(`[2] Dataset Identifier: "${rawDatasetId}"`)
  console.log(`    Computed bytes32 ID: ${computedDatasetId}`)

  const originalCanonicalJson = canonicalJsonStringify(originalPayload)
  const originalHash = (await computeSha256Hex(originalCanonicalJson)) as `0x${string}`
  console.log(`    Canonical JSON:      ${originalCanonicalJson}`)
  console.log(`    Calculated SHA-256:  ${originalHash}`)
  console.log('')

  // 4. Read Live On-Chain Record from Registry
  console.log('[3] Fetching on-chain record via getDataset()...')
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

  if (record.datasetHash.toLowerCase() !== originalHash.toLowerCase()) {
    throw new Error(
      `Hash mismatch: on-chain record (${record.datasetHash}) != calculated original hash (${originalHash})`,
    )
  }

  // 5. Test Live On-Chain verifyDatasetHash() with Original Hash -> Expect TRUE
  console.log('[4] Querying on-chain verifyDatasetHash() with ORIGINAL hash...')
  const originalVerifyResult = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'verifyDatasetHash',
    args: [computedDatasetId, originalHash],
  })
  console.log(`    Result: ${originalVerifyResult} => MATCH [ON-CHAIN RECORD INTEGRITY VERIFIED]`)
  if (!originalVerifyResult) {
    throw new Error('On-chain verification unexpectedly failed for original hash!')
  }
  console.log('')

  // 6. Introduce Single-Field Modification in gammaCount
  console.log('[5] Applying single-field modification: gammaCount 165.2 -> 999.9')
  const modifiedPayload = JSON.parse(JSON.stringify(originalPayload))
  modifiedPayload.samples[0].gammaCount = 999.9

  const modifiedCanonicalJson = canonicalJsonStringify(modifiedPayload)
  const modifiedHash = (await computeSha256Hex(modifiedCanonicalJson)) as `0x${string}`
  console.log(`    Modified Canonical JSON: ${modifiedCanonicalJson}`)
  console.log(`    Modified SHA-256 Hash:   ${modifiedHash}`)
  console.log('')

  // 7. Test Live On-Chain verifyDatasetHash() with Modified Hash -> Expect FALSE
  console.log('[6] Querying on-chain verifyDatasetHash() with MODIFIED hash...')
  const modifiedVerifyResult = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'verifyDatasetHash',
    args: [computedDatasetId, modifiedHash],
  })
  console.log(`    Result: ${modifiedVerifyResult} => MISMATCH [PAYLOAD ALTERED]`)
  if (modifiedVerifyResult !== false) {
    throw new Error('On-chain verification unexpectedly succeeded for modified hash!')
  }
  console.log('')

  // 8. Summary Table
  console.log('='.repeat(80))
  console.log('EVIDENCE SUMMARY')
  console.log('='.repeat(80))
  console.log(`Dataset ID (String):    ${rawDatasetId}`)
  console.log(`Dataset ID (Bytes32):   ${computedDatasetId}`)
  console.log(`Contract Address:       ${REGISTRY_ADDRESS}`)
  console.log(`Original Hash:          ${originalHash}`)
  console.log(`Modified Hash:          ${modifiedHash}`)
  console.log(`Original verify result: ${originalVerifyResult} (MATCH)`)
  console.log(`Modified verify result: ${modifiedVerifyResult} (MISMATCH)`)
  console.log(`Inclusion Tx Hash:      0xfd233c765f7b86693c27fdfe68d076dba3ce3fa5412cd4610b11a984fe1c10a0`)
  console.log(`Explorer Link:          https://scan.bohr.life/tx/0xfd233c765f7b86693c27fdfe68d076dba3ce3fa5412cd4610b11a984fe1c10a0`)
  console.log(`Contract Explorer Link: https://scan.bohr.life/address/${REGISTRY_ADDRESS}`)
  console.log('='.repeat(80))
}

main().catch((err) => {
  console.error('Execution failed:', err)
  process.exit(1)
})
