import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { canonicalJsonStringify, computeSha256Hex } from '../lib/canonicalHash'
import { KPI6_PARTNER_SYNTHETIC_PRESETS } from '../lib/botchainPartnerPresets'

interface SensorGridMetadata {
  name: string
  description: string
  datasetId: string
  version: string
  schema: string
  publisher: `0x${string}`
  network: {
    name: string
    chainId: number
    registryContract: `0x${string}`
  }
  contentDigest: {
    algorithm: string
    serialization: string
    hash: `0x${string}`
  }
  confidentiality: string
}

const ROOT_DIR = path.resolve(__dirname, '../../')
const PUBLIC_METADATA_DIR = path.resolve(ROOT_DIR, 'public/metadata')
const ROOT_METADATA_DIR = path.resolve(ROOT_DIR, 'metadata')

const BENCHMARK_002_PAYLOAD = {
  benchmarkId: 'BOT-SYNTH-BENCHMARK-002',
  projectName: 'Bohr Clean Energy Sensor Grid',
  samples: [
    { depth: 15.0, gammaCount: 165.2, status: 'validated' },
    { depth: 30.0, gammaCount: 210.5, status: 'validated' },
    { depth: 45.0, gammaCount: 345.8, status: 'anomalous_high' },
  ],
  timestamp: 1792736400,
}

const BENCHMARK_001_PAYLOAD = {
  benchmarkId: 'BOT-SYNTH-BENCHMARK-001',
  projectName: 'Bohr Clean Energy Sensor Grid',
  samples: [
    { depth: 10.5, gammaCount: 142.8, status: 'validated' },
    { depth: 21.0, gammaCount: 198.4, status: 'validated' },
    { depth: 31.5, gammaCount: 312.0, status: 'anomalous_high' },
  ],
  timestamp: 1792732800,
}

function assertConformsToSensorGridSchema(data: unknown, fileName: string): asserts data is SensorGridMetadata {
  expect(data, `${fileName} must be an object`).toBeTypeOf('object')
  expect(data).not.toBeNull()

  const meta = data as Record<string, unknown>
  expect(meta.name, `${fileName} name must be string`).toBeTypeOf('string')
  expect((meta.name as string).length).toBeGreaterThan(0)

  expect(meta.description, `${fileName} description must be string`).toBeTypeOf('string')
  expect((meta.description as string).length).toBeGreaterThan(0)

  expect(meta.datasetId, `${fileName} datasetId must be string`).toBeTypeOf('string')
  expect((meta.datasetId as string).length).toBeGreaterThan(0)

  expect(meta.version, `${fileName} version must match semver format`).toMatch(/^\d+\.\d+\.\d+$/)
  expect(meta.schema, `${fileName} schema must be datumx-sensor-grid-v1`).toBe('datumx-sensor-grid-v1')

  expect(meta.publisher, `${fileName} publisher must be valid EVM address`).toMatch(/^0x[0-9a-fA-F]{40}$/)

  expect(meta.network, `${fileName} network must be object`).toBeTypeOf('object')
  const net = meta.network as Record<string, unknown>
  expect(net.name, `${fileName} network.name must be string`).toBeTypeOf('string')
  expect(net.chainId, `${fileName} network.chainId must be number`).toBeTypeOf('number')
  expect(net.registryContract, `${fileName} network.registryContract must be valid EVM address`).toMatch(/^0x[0-9a-fA-F]{40}$/)

  expect(meta.contentDigest, `${fileName} contentDigest must be object`).toBeTypeOf('object')
  const digest = meta.contentDigest as Record<string, unknown>
  expect(digest.algorithm, `${fileName} digest algorithm must be SHA-256`).toBe('SHA-256')
  expect(digest.serialization, `${fileName} digest serialization must be RFC-8785`).toBe('RFC-8785')
  expect(digest.hash, `${fileName} digest hash must be 0x followed by 64 hex chars`).toMatch(/^0x[0-9a-fA-F]{64}$/)

  expect(meta.confidentiality, `${fileName} confidentiality must be string`).toBeTypeOf('string')
}

describe('Static Dataset Metadata Validation Test Suite', () => {
  const expectedFiles = [
    'bot-live-001.json',
    'bot-synth-001.json',
    'bot-synth-002.json',
    'bot-synth-pilot-w1-001.json',
    'bot-synth-pilot-w1-002.json',
    'bot-synth-pilot-w2-001.json',
  ]

  it('verifies that public/metadata directory exists and contains all required files', () => {
    expect(fs.existsSync(PUBLIC_METADATA_DIR), 'public/metadata directory must exist').toBe(true)
    const publicFiles = fs.readdirSync(PUBLIC_METADATA_DIR)
    for (const file of expectedFiles) {
      expect(publicFiles, `public/metadata missing ${file}`).toContain(file)
    }
  })

  it('verifies that root metadata directory exists and mirrors public/metadata byte-for-byte', () => {
    expect(fs.existsSync(ROOT_METADATA_DIR), 'root metadata directory must exist').toBe(true)
    const rootFiles = fs.readdirSync(ROOT_METADATA_DIR)
    for (const file of expectedFiles) {
      expect(rootFiles, `metadata/ missing ${file}`).toContain(file)

      const publicPath = path.join(PUBLIC_METADATA_DIR, file)
      const rootPath = path.join(ROOT_METADATA_DIR, file)

      const publicContent = fs.readFileSync(publicPath, 'utf8')
      const rootContent = fs.readFileSync(rootPath, 'utf8')

      expect(rootContent, `${file} in metadata/ must match public/metadata/`).toBe(publicContent)
    }
  })

  it('verifies that all files in public/metadata and metadata are valid JSON', () => {
    for (const dir of [PUBLIC_METADATA_DIR, ROOT_METADATA_DIR]) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8')
        expect(() => JSON.parse(content), `${file} in ${dir} must parse as valid JSON`).not.toThrow()
      }
    }
  })

  it('verifies that each file conforms to datumx-sensor-grid-v1 schema', () => {
    for (const file of expectedFiles) {
      const filePath = path.join(PUBLIC_METADATA_DIR, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      assertConformsToSensorGridSchema(data, file)
    }
  })

  it('verifies bot-synth-002.json network block reflects BOT Chain Mainnet (Chain ID 677)', () => {
    const filePath = path.join(PUBLIC_METADATA_DIR, 'bot-synth-002.json')
    const data: SensorGridMetadata = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    expect(data.network.name).toBe('BOT Chain Mainnet')
    expect(data.network.chainId).toBe(677)
    expect(data.network.registryContract.toLowerCase()).toBe('0xee555da23f972c5b09ead7f9d4b215e640b9e9b7')
  })

  it('verifies bot-synth-002.json content hash strictly matches canonical RFC-8785 SHA-256 of its payload', async () => {
    const filePath = path.join(PUBLIC_METADATA_DIR, 'bot-synth-002.json')
    const data: SensorGridMetadata = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    const canonicalJson = canonicalJsonStringify(BENCHMARK_002_PAYLOAD)
    const expectedHash = await computeSha256Hex(canonicalJson)

    expect(data.contentDigest.hash).toBe(expectedHash)
    expect(data.contentDigest.hash).toBe('0x8446f6c547e76332a84b56e14a14d31b08c848dfa1e021e64a03bfce4a6b484e')
  })

  it('verifies bot-synth-001.json content hash strictly matches canonical RFC-8785 SHA-256 of its payload', async () => {
    const filePath = path.join(PUBLIC_METADATA_DIR, 'bot-synth-001.json')
    const data: SensorGridMetadata = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    const canonicalJson = canonicalJsonStringify(BENCHMARK_001_PAYLOAD)
    const expectedHash = await computeSha256Hex(canonicalJson)

    expect(data.contentDigest.hash).toBe(expectedHash)
    expect(data.contentDigest.hash).toBe('0x3cc7aa467119f5b57d3245de304e39f662ac9ba5fd87593df4b837678f2353f3')
  })

  it('verifies all partner presets map to valid metadata files with matching canonical RFC-8785 hashes', async () => {
    for (const preset of KPI6_PARTNER_SYNTHETIC_PRESETS) {
      const url = new URL(preset.metadataURI)
      const fileName = path.basename(url.pathname)

      const publicPath = path.join(PUBLIC_METADATA_DIR, fileName)
      expect(fs.existsSync(publicPath), `Preset file ${fileName} must exist in public/metadata/`).toBe(true)

      const meta: SensorGridMetadata = JSON.parse(fs.readFileSync(publicPath, 'utf8'))

      // Validate datasetId and publisher match preset
      expect(meta.datasetId).toBe(preset.datasetId)
      expect(meta.publisher.toLowerCase()).toBe(preset.assignedWalletAddress.toLowerCase())

      // Validate network target is BOT Chain Mainnet
      expect(meta.network.chainId).toBe(677)
      expect(meta.network.name).toBe('BOT Chain Mainnet')

      // Validate cryptographic content digest
      const canonical = canonicalJsonStringify(preset.payload)
      const computedHash = await computeSha256Hex(canonical)

      expect(meta.contentDigest.hash.toLowerCase()).toBe(computedHash.toLowerCase())
    }
  })

  it('verifies deployments/botchain-mainnet.json records verified status and explorer URL', () => {
    const manifestPath = path.resolve(ROOT_DIR, 'deployments/botchain-mainnet.json')
    expect(fs.existsSync(manifestPath), 'botchain-mainnet.json must exist').toBe(true)

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    expect(manifest.network).toBe('botchain-mainnet')
    expect(manifest.chainId).toBe(677)
    expect(manifest.verified).toBe(true)
    expect(manifest.verificationStatus).toBe('Pass - Verified')
    expect(manifest.verificationUrl).toContain('scan.botchain.ai')

    const contractRecord = manifest.contracts.BotChainDatasetRegistry
    expect(contractRecord).toBeDefined()
    expect(contractRecord.address.toLowerCase()).toBe('0xee555da23f972c5b09ead7f9d4b215e640b9e9b7')
    expect(contractRecord.verified).toBe(true)
    expect(contractRecord.verificationStatus).toBe('Pass - Verified')
    expect(contractRecord.verificationUrl).toContain('scan.botchain.ai')
  })

  it('verifies reproducible Blockscout verification script exists and references correct contract parameters', () => {
    const scriptPath = path.resolve(ROOT_DIR, 'script/verify-botchain-blockscout.ps1')
    expect(fs.existsSync(scriptPath), 'verify-botchain-blockscout.ps1 must exist').toBe(true)

    const content = fs.readFileSync(scriptPath, 'utf8')
    expect(content).toContain('0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7')
    expect(content).toContain('BotChainDatasetRegistry')
    expect(content).toContain('blockscout')
    expect(content).toContain('https://scan.botchain.ai/api')
    expect(content).toContain('cancun')
    expect(content).toContain('--via-ir')
  })
})
