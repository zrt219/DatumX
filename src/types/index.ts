export type NavKey = 'overview' | 'datasets' | 'validation' | 'validators' | 'audit' | 'governance' | 'settings'

export type ProjectSlug = 'shirley-central' | 'shirley-east' | 'duck-creek'

export type DatasetStage =
  | 'Raw Scan Batch'
  | 'Extracted Gamma Traces'
  | 'Interpreted Mineralized Intervals'
  | 'Composite Summary'
  | 'Targeting Package'

export type DatasetStatus = 'Draft' | 'Submitted' | 'In Review' | 'Approved' | 'Finalized' | 'Rejected' | 'Challenged' | 'Superseded'

export interface ProjectRecord {
  key: string
  slug: ProjectSlug
  name: string
  operator: string
  region: string
  basin: string
  commodity: string
  depositType: string
  jurisdiction: string
  adapter: string
  adapterStatus: 'Ready' | 'Monitoring'
  datasetCount: number
  approvedCount: number
  finalizedCount: number
  stage: string
}

export interface ValidatorRecord {
  id: string
  name: string
  role: string
  stake: string
  region: string
  approvalRate: number
}

export interface ReviewRecord {
  validatorId: string
  validatorName: string
  approved: boolean
  confidence: number
  reviewUri: string
  submittedAt: string
  stake: string
}

export interface IssueRecord {
  id: string
  title: string
  severity: 'Low' | 'Moderate' | 'High'
  owner: string
  state: 'Open' | 'Watching' | 'Resolved'
  summary: string
}

export interface TimelineEvent {
  id: string
  type: string
  actor: string
  datasetRef: string
  description: string
  timestamp: string
  txHash?: string
}

export interface DatasetRecord {
  id: string
  onChainId: number
  projectSlug: ProjectSlug
  projectName: string
  version: number
  stage: DatasetStage
  status: DatasetStatus
  confidence: number
  validatorCount: number
  approvals: number
  rejections: number
  holeCount: number
  schemaVersion: string
  submitter: string
  uri: string
  parentId?: string
  parentHash?: string
  sourceHash: string
  transformedHash: string
  chainAnchored: boolean
  submittedAt: string
  approvedAt?: string
  supersessionRisk: string
  freshnessHours: number
  issues: IssueRecord[]
  reviews: ReviewRecord[]
  lineageLabel: string
}

export interface LineageRailNode {
  id: string
  slotStage: DatasetStage
  stageLabel: string
  shortTitle: string
  fullTitle: string
  versionLabel: string
  statusLabel: string
  placeholder: boolean
  activePath: boolean
  confidenceLabel: string
  validatorLabel: string
  datasetIdLabel: string
  timestampLabel: string
  releaseState: string
  relationSummary: string
  operationalNote: string
  dataset?: DatasetRecord
}

export interface ComparisonMetric {
  label: string
  from: string
  to: string
  delta: string
  direction: 'up' | 'down' | 'flat'
}

export interface ProjectComparison {
  title: string
  fromLabel: string
  toLabel: string
  summaryFrom: string
  summaryTo: string
  metrics: ComparisonMetric[]
}

export interface WorkflowPosture {
  stageLabel: string
  heroSummary: string
  trustLabel: string
  chainStatus: string
  readinessLabel: string
}

export interface ProjectStory {
  currentDatasetId: string
  lineageDatasetIds: string[]
  activeValidatorIds: string[]
  workflowPosture: WorkflowPosture
  comparison: ProjectComparison
  timeline: TimelineEvent[]
}

export interface WalletState {
  account?: `0x${string}`
  chainId?: number
  chainName?: string
  isConnected: boolean
  isCorrectNetwork: boolean
  isMetaMaskAvailable: boolean
  isBusy: boolean
  error?: string
}

export type LiveProtocolMode = 'mock' | 'live-loading' | 'live-ready' | 'live-unavailable'

export type TxStatus = 'idle' | 'pending' | 'success' | 'error'

export interface TransactionState {
  status: TxStatus
  message?: string
  txHash?: `0x${string}`
}

export interface DatasetSubmissionDraft {
  projectKey: string
  datasetType: DatasetStage
  uri: string
  sourceHash: `0x${string}`
  transformHash: `0x${string}`
  parentDatasetHash?: `0x${string}`
  schemaVersion: number
  recordCount: number
  claimedConfidenceBps: number
  submissionId: string
}

export interface ReviewSubmissionDraft {
  datasetId: number
  approved: boolean
  confidenceBps: number
  reviewUri: string
}
