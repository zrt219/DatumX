import { hexToString, type Address, type Hex } from 'viem'
import type { DatasetRecord, DatasetStage, DatasetStatus, ProjectRecord, ProjectSlug, ReviewRecord, ValidatorRecord } from '../types'
import { drillProofContracts, hasLiveProtocolConfig } from './contracts'
import { publicClient } from './web3'
import { DEPLOYED_CONTRACTS } from './web3Config'

type LiveProjectMetadata = {
  name: string
  basin: string
  commodity: string
  depositType: string
  jurisdiction: string
  active: boolean
  adapter: Address
}

type LiveDatasetStruct = {
  datasetId: bigint
  projectKey: Hex
  datasetType: number
  status: number
  contentHash: Hex
  parentDatasetHash: Hex
  uri: string
  schemaVersion: number
  recordCount: number
  aggregateConfidenceBps: number
  approvalCount: number
  rejectionCount: number
  submitter: Address
  createdAt: bigint
  updatedAt: bigint
  finalizedAt: bigint
}

type LiveReviewStruct = {
  exists: boolean
  approved: boolean
  confidenceBps: number
  reviewUri: string
  reviewer: Address
  createdAt: bigint
}

export interface LiveProtocolThresholds {
  minValidatorCount: number
  minApprovalRatioBps: number
  minConfidenceBps: number
}

export interface LiveProtocolState {
  projects: ProjectRecord[]
  datasets: DatasetRecord[]
  datasetsByProjectSlug: Record<ProjectSlug, DatasetRecord[]>
  currentDatasetIds: Partial<Record<ProjectSlug, string>>
  validatorsByProjectSlug: Partial<Record<ProjectSlug, ValidatorRecord[]>>
  thresholds: LiveProtocolThresholds
}

const PROJECT_KEY_TO_SLUG: Record<string, ProjectSlug> = {
  SHIRLEY_CENTRAL: 'shirley-central',
  SHIRLEY_EAST: 'shirley-east',
  DUCK_CREEK: 'duck-creek',
}

const PROJECT_KEY_TO_REGION: Record<string, string> = {
  SHIRLEY_CENTRAL: 'Wyoming',
  SHIRLEY_EAST: 'Wyoming',
  DUCK_CREEK: 'South Dakota',
}

const PROJECT_KEY_TO_OPERATOR: Record<string, string> = {
  SHIRLEY_CENTRAL: 'DatumX Protocol Ops',
  SHIRLEY_EAST: 'DatumX Protocol Ops',
  DUCK_CREEK: 'DatumX Protocol Ops',
}

const DATASET_STAGE_LABELS: DatasetStage[] = [
  'Raw Scan Batch',
  'Extracted Gamma Traces',
  'Interpreted Mineralized Intervals',
  'Composite Summary',
  'Targeting Package',
]

const DEFAULT_LINEAGE_LABELS: Record<DatasetStage, string> = {
  'Raw Scan Batch': 'Raw source package',
  'Extracted Gamma Traces': 'Digitized gamma traces',
  'Interpreted Mineralized Intervals': 'Mineralized intervals',
  'Composite Summary': 'Composite summary',
  'Targeting Package': 'Targeting package',
}

const REVIEWER_REGIONS = ['Denver', 'Calgary', 'Reno', 'Houston', 'Toronto', 'Perth']
const ZERO_BYTES32 = `0x${'0'.repeat(64)}` as const
const UNKNOWN_ONCHAIN_VALUE = 'Not exposed onchain'

function bytes32ToString(value: Hex) {
  return hexToString(value, { size: 32 }).replaceAll('\u0000', '')
}

function shortAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function stageFromDatasetType(datasetType: number): DatasetStage {
  return DATASET_STAGE_LABELS[datasetType] ?? 'Targeting Package'
}

function statusFromDatasetStatus(status: number): DatasetStatus {
  if (status === 0) return 'Submitted'
  if (status === 1) return 'In Review'
  if (status === 2) return 'Approved'
  if (status === 3) return 'Rejected'
  return 'Finalized'
}

function formatUtcTimestamp(epochSeconds: bigint) {
  if (epochSeconds === 0n) return undefined
  const date = new Date(Number(epochSeconds) * 1000)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`
}

function freshnessHoursFromTimestamp(epochSeconds: bigint) {
  if (epochSeconds === 0n) return 0
  return Math.max(0, Math.floor((Date.now() - Number(epochSeconds) * 1000) / 3_600_000))
}

function supersessionRiskFromStatus(status: DatasetStatus, freshnessHours: number) {
  if (status === 'Rejected') return 'High'
  if (status === 'In Review') return 'Provisional'
  if (status === 'Finalized') return 'Locked'
  if (freshnessHours <= 24) return 'Contained'
  if (freshnessHours <= 96) return 'Low'
  return 'Moderate'
}

function projectAdapterName(adapter: Address) {
  const normalized = adapter.toLowerCase()
  if (normalized === DEPLOYED_CONTRACTS.shirleyCentralAdapter.toLowerCase()) return 'ShirleyCentralAdapter'
  if (normalized === DEPLOYED_CONTRACTS.shirleyEastAdapter.toLowerCase()) return 'ShirleyEastAdapter'
  if (normalized === DEPLOYED_CONTRACTS.duckCreekAdapter.toLowerCase()) return 'DuckCreekAdapter'
  return shortAddress(adapter)
}

function compareDatasetsDescending(a: DatasetRecord, b: DatasetRecord) {
  return b.onChainId - a.onChainId
}

function selectCurrentDataset(projectDatasets: DatasetRecord[]) {
  const finalizedOrApproved = [...projectDatasets]
    .filter((dataset) => dataset.status === 'Finalized' || dataset.status === 'Approved')
    .sort(compareDatasetsDescending)

  if (finalizedOrApproved.length > 0) return finalizedOrApproved[0]

  const activeReview = [...projectDatasets]
    .filter((dataset) => dataset.status === 'In Review' || dataset.status === 'Submitted')
    .sort(compareDatasetsDescending)

  if (activeReview.length > 0) return activeReview[0]

  return [...projectDatasets].sort(compareDatasetsDescending)[0]
}

function buildProjectRecord(projectKey: string, metadata: LiveProjectMetadata, projectDatasets: DatasetRecord[]): ProjectRecord {
  const slug = PROJECT_KEY_TO_SLUG[projectKey]
  const currentDataset = selectCurrentDataset(projectDatasets)
  const approvedCount = projectDatasets.filter((dataset) => dataset.status === 'Approved' || dataset.status === 'Finalized').length
  const finalizedCount = projectDatasets.filter((dataset) => dataset.status === 'Finalized').length

  return {
    key: projectKey,
    slug,
    name: metadata.name,
    operator: PROJECT_KEY_TO_OPERATOR[projectKey] ?? 'DatumX Protocol Ops',
    region: PROJECT_KEY_TO_REGION[projectKey] ?? metadata.jurisdiction,
    basin: metadata.basin,
    commodity: metadata.commodity,
    depositType: metadata.depositType,
    jurisdiction: metadata.jurisdiction,
    adapter: projectAdapterName(metadata.adapter),
    adapterStatus: metadata.active ? 'Ready' : 'Monitoring',
    datasetCount: projectDatasets.length,
    approvedCount,
    finalizedCount,
    stage: currentDataset?.stage ?? 'Registered',
  }
}

function buildValidatorRecords(projectDatasets: DatasetRecord[]): ValidatorRecord[] {
  const reviewMap = new Map<string, { reviews: number; approvals: number }>()

  for (const dataset of projectDatasets) {
    for (const review of dataset.reviews) {
      const current = reviewMap.get(review.validatorId) ?? { reviews: 0, approvals: 0 }
      current.reviews += 1
      current.approvals += review.approved ? 1 : 0
      reviewMap.set(review.validatorId, current)
    }
  }

  return [...reviewMap.entries()]
    .map(([address, stats], index) => ({
      id: address,
      name: `Validator ${shortAddress(address as Address)}`,
      role: 'Protocol validator',
      stake: `${stats.reviews} review${stats.reviews === 1 ? '' : 's'} on record`,
      region: REVIEWER_REGIONS[index % REVIEWER_REGIONS.length],
      approvalRate: Math.round((stats.approvals / stats.reviews) * 100),
    }))
    .sort((left, right) => right.approvalRate - left.approvalRate)
}

async function readProjectMetadata(projectKeyHex: Hex) {
  return (await publicClient.readContract({
    address: drillProofContracts.projectRegistry.address!,
    abi: drillProofContracts.projectRegistry.abi,
    functionName: 'getProject',
    args: [projectKeyHex],
  })) as LiveProjectMetadata
}

async function readDataset(datasetId: bigint) {
  return (await publicClient.readContract({
    address: drillProofContracts.datasetRegistry.address!,
    abi: drillProofContracts.datasetRegistry.abi,
    functionName: 'getDataset',
    args: [datasetId],
  })) as LiveDatasetStruct
}

async function readReviewers(datasetId: bigint) {
  return (await publicClient.readContract({
    address: drillProofContracts.validationModule.address!,
    abi: drillProofContracts.validationModule.abi,
    functionName: 'getReviewers',
    args: [datasetId],
  })) as Address[]
}

async function readReview(datasetId: bigint, reviewer: Address) {
  return (await publicClient.readContract({
    address: drillProofContracts.validationModule.address!,
    abi: drillProofContracts.validationModule.abi,
    functionName: 'getReview',
    args: [datasetId, reviewer],
  })) as LiveReviewStruct
}

async function readParentDatasetId(datasetId: bigint) {
  return (await publicClient.readContract({
    address: drillProofContracts.datasetRegistry.address!,
    abi: drillProofContracts.datasetRegistry.abi,
    functionName: 'getParentDatasetId',
    args: [datasetId],
  })) as bigint
}

function reviewerToRecord(review: LiveReviewStruct): ReviewRecord {
  return {
    validatorId: review.reviewer,
    validatorName: `Validator ${shortAddress(review.reviewer)}`,
    approved: review.approved,
    confidence: review.confidenceBps / 100,
    reviewUri: review.reviewUri,
    submittedAt: formatUtcTimestamp(review.createdAt) ?? 'Pending timestamp',
    stake: 'Live validator',
  }
}

export async function loadLiveProtocolState(): Promise<LiveProtocolState | null> {
  if (!hasLiveProtocolConfig()) return null

  const [projectKeysHex, thresholdsTuple] = await Promise.all([
    publicClient.readContract({
      address: drillProofContracts.projectRegistry.address!,
      abi: drillProofContracts.projectRegistry.abi,
      functionName: 'getProjectKeys',
    }) as Promise<Hex[]>,
    publicClient.readContract({
      address: drillProofContracts.validationModule.address!,
      abi: drillProofContracts.validationModule.abi,
      functionName: 'getThresholds',
    }) as Promise<{ minValidatorCount: number; minApprovalRatioBps: number; minConfidenceBps: number }>,
  ])

  const datasetsByProjectSlug = {
    'shirley-central': [],
    'shirley-east': [],
    'duck-creek': [],
  } as Record<ProjectSlug, DatasetRecord[]>

  const currentDatasetIds: Partial<Record<ProjectSlug, string>> = {}
  const validatorsByProjectSlug: Partial<Record<ProjectSlug, ValidatorRecord[]>> = {}
  const projects: ProjectRecord[] = []
  const allDatasets: DatasetRecord[] = []

  for (const projectKeyHex of projectKeysHex) {
    const projectKey = bytes32ToString(projectKeyHex)
    const slug = PROJECT_KEY_TO_SLUG[projectKey]
    if (!slug) continue

    const [metadata, datasetIds] = await Promise.all([
      readProjectMetadata(projectKeyHex),
      publicClient.readContract({
        address: drillProofContracts.datasetRegistry.address!,
        abi: drillProofContracts.datasetRegistry.abi,
        functionName: 'getProjectDatasetIds',
        args: [projectKeyHex],
      }) as Promise<bigint[]>,
    ])

    const rawDatasets = await Promise.all(
      datasetIds.map(async (datasetId) => {
        const [dataset, parentDatasetId, reviewers] = await Promise.all([
          readDataset(datasetId),
          readParentDatasetId(datasetId),
          readReviewers(datasetId),
        ])

        const reviewStructs = await Promise.all(reviewers.map((reviewer) => readReview(datasetId, reviewer)))
        return { dataset, parentDatasetId, reviews: reviewStructs.filter((review) => review.exists) }
      }),
    )

    const mappedDatasets = rawDatasets
      .map(({ dataset, parentDatasetId, reviews }) => {
        const onChainId = Number(dataset.datasetId)
        const stage = stageFromDatasetType(dataset.datasetType)
        const status = statusFromDatasetStatus(dataset.status)
        const submittedAt = formatUtcTimestamp(dataset.createdAt) ?? 'Pending timestamp'
        const approvedAt = formatUtcTimestamp(dataset.finalizedAt || dataset.updatedAt)
        const freshnessHours = freshnessHoursFromTimestamp(dataset.createdAt)

        return {
          id: `DS-${String(onChainId).padStart(3, '0')}`,
          onChainId,
          projectSlug: slug,
          projectName: metadata.name,
          version: 1,
          stage,
          status,
          confidence: dataset.aggregateConfidenceBps > 0 ? dataset.aggregateConfidenceBps / 100 : 0,
          validatorCount: reviews.length,
          approvals: dataset.approvalCount,
          rejections: dataset.rejectionCount,
          holeCount: dataset.recordCount,
          schemaVersion: String(dataset.schemaVersion),
          submitter: shortAddress(dataset.submitter),
          uri: dataset.uri,
          parentId: parentDatasetId > 0n ? `DS-${String(Number(parentDatasetId)).padStart(3, '0')}` : undefined,
          parentHash: dataset.parentDatasetHash !== ZERO_BYTES32 ? dataset.parentDatasetHash : undefined,
          sourceHash: UNKNOWN_ONCHAIN_VALUE,
          transformedHash: dataset.contentHash,
          chainAnchored: true,
          submittedAt,
          approvedAt: status === 'Approved' || status === 'Finalized' ? approvedAt : undefined,
          supersessionRisk: supersessionRiskFromStatus(status, freshnessHours),
          freshnessHours,
          issues: [],
          reviews: reviews.map(reviewerToRecord).sort((left, right) => (left.submittedAt > right.submittedAt ? 1 : -1)),
          lineageLabel: DEFAULT_LINEAGE_LABELS[stage],
        } satisfies DatasetRecord
      })
      .sort((left, right) => left.onChainId - right.onChainId)
      .map((dataset, _, projectDatasets) => {
        const version = projectDatasets.filter((candidate) => candidate.stage === dataset.stage && candidate.onChainId <= dataset.onChainId).length
        return {
          ...dataset,
          version,
          lineageLabel:
            dataset.stage === 'Targeting Package' ? `Targeting package v${version}` : DEFAULT_LINEAGE_LABELS[dataset.stage],
        }
      })

    datasetsByProjectSlug[slug] = mappedDatasets
    allDatasets.push(...mappedDatasets)

    const currentDataset = selectCurrentDataset(mappedDatasets)
    if (currentDataset) {
      currentDatasetIds[slug] = currentDataset.id
    }

    validatorsByProjectSlug[slug] = buildValidatorRecords(mappedDatasets)
    projects.push(buildProjectRecord(projectKey, metadata, mappedDatasets))
  }

  return {
    projects,
    datasets: allDatasets,
    datasetsByProjectSlug,
    currentDatasetIds,
    validatorsByProjectSlug,
    thresholds: {
      minValidatorCount: thresholdsTuple.minValidatorCount,
      minApprovalRatioBps: thresholdsTuple.minApprovalRatioBps,
      minConfidenceBps: thresholdsTuple.minConfidenceBps,
    },
  }
}
