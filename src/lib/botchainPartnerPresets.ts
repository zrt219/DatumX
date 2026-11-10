export interface PartnerSyntheticDatasetPreset {
  key: 'w1-tx1' | 'w1-tx2' | 'w2-tx1'
  buttonLabel: string
  assignedWalletLabel: string
  assignedWalletAddress: `0x${string}`
  datasetId: string
  version: string
  metadataURI: string
  payload: {
    syntheticFixture: true
    fixtureNotice: string
    datasetCode: string
    assignedSigner: `0x${string}`
    readings: Array<{
      sensorSlot: string
      readingValue: number
      unit: string
      classification: 'nominal' | 'elevated'
    }>
    sequenceNumber: number
  }
}

export const KPI6_PARTNER_SYNTHETIC_PRESETS: readonly PartnerSyntheticDatasetPreset[] = [
  {
    key: 'w1-tx1',
    buttonLabel: 'W1 Tx 1',
    assignedWalletLabel: 'Leon Wallet 1',
    assignedWalletAddress: '0xF226C920957BD4B648EaF1A8d1f859057Ec605a4',
    datasetId: 'BOT-SYNTH-PILOT-W1-001',
    version: '1.0.0',
    metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json',
    payload: {
      syntheticFixture: true,
      fixtureNotice: 'Synthetic KPI 6 partner review test fixture; not authentic field or satellite telemetry.',
      datasetCode: 'BOT-SYNTH-PILOT-W1-001',
      assignedSigner: '0xF226C920957BD4B648EaF1A8d1f859057Ec605a4',
      readings: [
        { sensorSlot: 'sim-slot-A1', readingValue: 112.4, unit: 'cps', classification: 'nominal' },
        { sensorSlot: 'sim-slot-A2', readingValue: 184.9, unit: 'cps', classification: 'nominal' },
        { sensorSlot: 'sim-slot-A3', readingValue: 298.1, unit: 'cps', classification: 'elevated' },
      ],
      sequenceNumber: 101,
    },
  },
  {
    key: 'w1-tx2',
    buttonLabel: 'W1 Tx 2',
    assignedWalletLabel: 'Leon Wallet 1',
    assignedWalletAddress: '0xF226C920957BD4B648EaF1A8d1f859057Ec605a4',
    datasetId: 'BOT-SYNTH-PILOT-W1-002',
    version: '1.0.0',
    metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-pilot-w1-002.json',
    payload: {
      syntheticFixture: true,
      fixtureNotice: 'Synthetic KPI 6 partner review test fixture; not authentic field or satellite telemetry.',
      datasetCode: 'BOT-SYNTH-PILOT-W1-002',
      assignedSigner: '0xF226C920957BD4B648EaF1A8d1f859057Ec605a4',
      readings: [
        { sensorSlot: 'sim-slot-B1', readingValue: 129.6, unit: 'cps', classification: 'nominal' },
        { sensorSlot: 'sim-slot-B2', readingValue: 204.2, unit: 'cps', classification: 'nominal' },
        { sensorSlot: 'sim-slot-B3', readingValue: 332.7, unit: 'cps', classification: 'elevated' },
      ],
      sequenceNumber: 102,
    },
  },
  {
    key: 'w2-tx1',
    buttonLabel: 'W2 Tx 1',
    assignedWalletLabel: 'Leon Wallet 2',
    assignedWalletAddress: '0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2',
    datasetId: 'BOT-SYNTH-PILOT-W2-001',
    version: '1.0.0',
    metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-pilot-w2-001.json',
    payload: {
      syntheticFixture: true,
      fixtureNotice: 'Synthetic KPI 6 partner review test fixture; not authentic field or satellite telemetry.',
      datasetCode: 'BOT-SYNTH-PILOT-W2-001',
      assignedSigner: '0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2',
      readings: [
        { sensorSlot: 'sim-slot-C1', readingValue: 141.3, unit: 'cps', classification: 'nominal' },
        { sensorSlot: 'sim-slot-C2', readingValue: 219.8, unit: 'cps', classification: 'nominal' },
        { sensorSlot: 'sim-slot-C3', readingValue: 361.5, unit: 'cps', classification: 'elevated' },
      ],
      sequenceNumber: 201,
    },
  },
] as const
