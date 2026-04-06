import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { datasets as demoDatasets, projectStories as demoProjectStories, projects as demoProjects, validatorsList as demoValidatorsList } from '../data/demoData'
import { hasLiveProtocolConfig, liveCompatibilityNotice } from '../lib/contracts'
import { loadLiveProtocolState, type LiveProtocolState } from '../lib/liveProtocol'
import { getExplorerTxUrl } from '../lib/network'
import { DEPLOYMENT_MANIFEST } from '../lib/web3Config'
import type { DatasetRecord, DatasetStatus, LiveProtocolMode, NavKey, ProjectRecord, ProjectSlug, ProjectStory, TimelineEvent, ValidatorRecord, WorkflowPosture } from '../types'

function compareDatasetsDescending(a: DatasetRecord, b: DatasetRecord) {
  return b.onChainId - a.onChainId
}

function getFallbackCurrentDataset(projectDatasets: DatasetRecord[]) {
  const approved = [...projectDatasets]
    .filter((dataset) => dataset.status === 'Approved' || dataset.status === 'Finalized')
    .sort(compareDatasetsDescending)
  if (approved.length > 0) return approved[0]

  const inReview = [...projectDatasets]
    .filter((dataset) => dataset.status === 'In Review' || dataset.status === 'Submitted' || dataset.status === 'Challenged')
    .sort(compareDatasetsDescending)
  if (inReview.length > 0) return inReview[0]

  return [...projectDatasets].sort(compareDatasetsDescending)[0]
}

function getProjectStage(projectDatasets: DatasetRecord[]) {
  return getFallbackCurrentDataset(projectDatasets)?.stage ?? 'Registered'
}

function createPlaceholderDataset(project: ProjectRecord): DatasetRecord {
  return {
    id: `${project.slug.toUpperCase()}-PENDING`,
    onChainId: 0,
    projectSlug: project.slug,
    projectName: project.name,
    version: 0,
    stage: 'Raw Scan Batch',
    status: 'Submitted',
    confidence: 0,
    validatorCount: 0,
    approvals: 0,
    rejections: 0,
    holeCount: 0,
    schemaVersion: '0',
    submitter: 'Protocol pending',
    uri: 'ipfs://pending',
    sourceHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    transformedHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    chainAnchored: false,
    submittedAt: 'Awaiting first submission',
    supersessionRisk: 'Unissued',
    freshnessHours: 0,
    issues: [],
    reviews: [],
    lineageLabel: 'Pending initial dataset',
  }
}

function buildWorkflowPosture(currentDataset: DatasetRecord, hasLiveDatasets: boolean, fallback: WorkflowPosture): WorkflowPosture {
  if (!hasLiveDatasets) {
    return {
      ...fallback,
      stageLabel: 'Registered',
      heroSummary: 'Protocol registration is live on XRPL EVM Testnet. The first dataset release is still pending.',
      trustLabel: 'Ready for first submission',
      chainStatus: 'Live on XRPL EVM Testnet',
      readinessLabel: 'Submission path active',
    }
  }

  const trustLabel =
    currentDataset.status === 'Approved' || currentDataset.status === 'Finalized'
      ? currentDataset.status === 'Finalized'
        ? 'Finalized release'
        : 'Approved release'
      : currentDataset.status === 'In Review'
        ? 'Review quorum open'
        : 'Submission received'

  return {
    ...fallback,
    stageLabel: currentDataset.stage,
    heroSummary: `Live protocol state for ${currentDataset.projectName} anchored on XRPL EVM Testnet.`,
    trustLabel,
    chainStatus: currentDataset.chainAnchored ? 'Anchored on XRPL EVM' : 'Anchor pending',
    readinessLabel: currentDataset.status === 'Approved' || currentDataset.status === 'Finalized' ? 'Release path active' : 'Validation path active',
  }
}

function buildLineageDatasets(projectDatasets: DatasetRecord[], currentDataset: DatasetRecord) {
  if (projectDatasets.length === 0 || currentDataset.onChainId === 0) return [currentDataset]

  const byId = new Map(projectDatasets.map((dataset) => [dataset.id, dataset]))
  const lineage: DatasetRecord[] = []
  let cursor: DatasetRecord | undefined = currentDataset

  while (cursor) {
    lineage.unshift(cursor)
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }

  return lineage.length > 0 ? lineage : [currentDataset]
}

function buildProjectValidators(projectSlug: ProjectSlug, liveState: LiveProtocolState | null, fallbackStory: ProjectStory) {
  const liveValidators = liveState?.validatorsByProjectSlug[projectSlug]
  if (liveValidators && liveValidators.length > 0) return liveValidators

  return fallbackStory.activeValidatorIds
    .map((validatorId) => demoValidatorsList.find((validator) => validator.id === validatorId))
    .filter((validator): validator is ValidatorRecord => Boolean(validator))
}

function buildProjects(liveState: LiveProtocolState | null) {
  if (!liveState || liveState.projects.length === 0) return demoProjects

  return liveState.projects.map((project) => {
    const fallback = demoProjects.find((candidate) => candidate.slug === project.slug)
    return fallback
      ? {
          ...fallback,
          ...project,
          stage: project.stage || getProjectStage(liveState.datasetsByProjectSlug[project.slug] ?? []),
        }
      : project
  })
}

function parseTimelineTimestamp(value: string) {
  const normalized = value.replace(' UTC', 'Z').replace(' ', 'T')
  const parsed = Date.parse(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getDatasetTransactionRecord(datasetId: number) {
  const exercise = DEPLOYMENT_MANIFEST.exercise
  const smokeTest = DEPLOYMENT_MANIFEST.smokeTest

  if (datasetId === 1) {
    return {
      submitTx: exercise.root.submitTx,
      reviewTxs: exercise.root.reviewTxs,
      finalizeTx: exercise.root.finalizeTx,
    }
  }

  if (datasetId === 2) {
    return {
      submitTx: exercise.child.submitTx,
      reviewTxs: exercise.child.reviewTxs,
      finalizeTx: exercise.child.finalizeTx,
    }
  }

  if (datasetId === smokeTest.root.datasetId) {
    return {
      submitTx: smokeTest.root.submitTx,
      reviewTxs: [smokeTest.root.reviewTx],
      finalizeTx: smokeTest.root.finalizeTx,
    }
  }

  if (datasetId === smokeTest.child.datasetId) {
    return {
      submitTx: smokeTest.child.submitTx,
      reviewTxs: [smokeTest.child.reviewTx],
      finalizeTx: smokeTest.child.finalizeTx,
    }
  }

  return {
    reviewTxs: [] as string[],
  }
}

function buildLiveTimeline(projectDatasets: DatasetRecord[]): TimelineEvent[] {
  const events: TimelineEvent[] = []

  for (const dataset of projectDatasets) {
    const transactionRecord = getDatasetTransactionRecord(dataset.onChainId)
    events.push({
      id: `${dataset.id}-submitted`,
      type: 'Dataset submitted',
      actor: dataset.submitter,
      datasetRef: dataset.id,
      description: `${dataset.stage} submitted with schema v${dataset.schemaVersion} and ${dataset.holeCount} records.`,
      timestamp: dataset.submittedAt,
      txHash: transactionRecord.submitTx,
    })

    if (dataset.status === 'In Review' || dataset.status === 'Approved' || dataset.status === 'Finalized' || dataset.status === 'Rejected') {
      events.push({
        id: `${dataset.id}-review-opened`,
        type: 'Review opened',
        actor: 'Validation module',
        datasetRef: dataset.id,
        description: `${dataset.validatorCount || 0} validator review record${dataset.validatorCount === 1 ? '' : 's'} currently attached to this release.`,
        timestamp: dataset.submittedAt,
      })
    }

    const orderedReviews = [...dataset.reviews].sort((left, right) => parseTimelineTimestamp(left.submittedAt) - parseTimelineTimestamp(right.submittedAt))

    for (const [index, review] of orderedReviews.entries()) {
      events.push({
        id: `${dataset.id}-${review.validatorId}-${review.submittedAt}`,
        type: review.approved ? 'Review approved' : 'Review challenged',
        actor: review.validatorName,
        datasetRef: dataset.id,
        description: `${review.approved ? 'Approved' : 'Raised a challenge on'} ${dataset.stage.toLowerCase()} at confidence ${review.confidence.toFixed(1)}.`,
        timestamp: review.submittedAt,
        txHash: transactionRecord.reviewTxs[index],
      })
    }

    if ((dataset.status === 'Approved' || dataset.status === 'Finalized' || dataset.status === 'Rejected') && dataset.approvedAt) {
      events.push({
        id: `${dataset.id}-${dataset.status.toLowerCase()}`,
        type: dataset.status === 'Rejected' ? 'Dataset rejected' : dataset.status === 'Finalized' ? 'Dataset finalized' : 'Dataset approved',
        actor: dataset.status === 'Finalized' ? 'Release finalizer' : 'Validation quorum',
        datasetRef: dataset.id,
        description: `${dataset.approvals} approval${dataset.approvals === 1 ? '' : 's'}, ${dataset.rejections} rejection${dataset.rejections === 1 ? '' : 's'}, aggregate confidence ${dataset.confidence.toFixed(1)}.`,
        timestamp: dataset.approvedAt,
        txHash: dataset.status === 'Finalized' ? transactionRecord.finalizeTx : undefined,
      })
    }
  }

  return events.sort((left, right) => parseTimelineTimestamp(left.timestamp) - parseTimelineTimestamp(right.timestamp))
}

export function useDrillProof() {
  const browserLiveProtocolConfigured = hasLiveProtocolConfig() && import.meta.env.MODE !== 'test'
  const [activeNav, setActiveNav] = useState<NavKey>('overview')
  const [projectSlug, setProjectSlug] = useState<ProjectSlug>('shirley-central')
  const [selectedDatasetId, setSelectedDatasetId] = useState(demoProjectStories['shirley-central'].currentDatasetId)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | DatasetStatus>('All')
  const [typeFilter, setTypeFilter] = useState<'All' | DatasetRecord['stage']>('All')
  const [liveState, setLiveState] = useState<LiveProtocolState | null | undefined>(browserLiveProtocolConfigured ? undefined : null)
  const deferredSearch = useDeferredValue(search)

  const refreshLiveState = async () => {
    if (!browserLiveProtocolConfigured) {
      setLiveState(null)
      return null
    }

    try {
      const state = await loadLiveProtocolState()
      setLiveState(state)
      return state
    } catch {
      setLiveState(null)
      return null
    }
  }

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const state = await loadLiveProtocolState()
        if (!cancelled) {
          setLiveState(state)
        }
      } catch {
        if (!cancelled) {
          setLiveState(null)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const projects = useMemo(() => buildProjects(liveState ?? null), [liveState])
  const activeProject = useMemo(() => projects.find((project) => project.slug === projectSlug) ?? projects[0], [projectSlug, projects])
  const fallbackStory = useMemo(() => demoProjectStories[projectSlug], [projectSlug])

  const projectDatasets = useMemo(() => {
    if (browserLiveProtocolConfigured && liveState === undefined) return []

    const liveDatasets = liveState?.datasetsByProjectSlug[projectSlug]
    if (liveDatasets && liveDatasets.length > 0) return liveDatasets
    if (liveState && liveDatasets && liveDatasets.length === 0) return []
    return demoDatasets.filter((dataset) => dataset.projectSlug === projectSlug)
  }, [browserLiveProtocolConfigured, liveState, projectSlug])

  const liveCurrentDatasetId = liveState?.currentDatasetIds[projectSlug]

  const currentDataset = useMemo(() => {
    if (projectDatasets.length === 0) return createPlaceholderDataset(activeProject)

    return (
      projectDatasets.find((dataset) => dataset.id === (liveCurrentDatasetId ?? fallbackStory.currentDatasetId)) ??
      getFallbackCurrentDataset(projectDatasets) ??
      projectDatasets[0]
    )
  }, [activeProject, fallbackStory.currentDatasetId, liveCurrentDatasetId, projectDatasets])

  const selectedDataset = useMemo(() => {
    if (projectDatasets.length === 0) return currentDataset
    return projectDatasets.find((dataset) => dataset.id === selectedDatasetId) ?? currentDataset
  }, [currentDataset, projectDatasets, selectedDatasetId])

  const lineageDatasets = useMemo(() => {
    const liveLineage = buildLineageDatasets(projectDatasets, currentDataset)
    if (liveState && projectDatasets.length > 0) return liveLineage

    const authoredLineage = fallbackStory.lineageDatasetIds
      .map((datasetId) => projectDatasets.find((dataset) => dataset.id === datasetId))
      .filter(Boolean) as DatasetRecord[]

    return authoredLineage.length > 0 ? authoredLineage : liveLineage
  }, [currentDataset, fallbackStory.lineageDatasetIds, liveState, projectDatasets])

  const filteredDatasets = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()
    return projectDatasets.filter((dataset) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [dataset.id, dataset.stage, dataset.uri, dataset.submitter, dataset.schemaVersion, dataset.transformedHash]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      const matchesStatus = statusFilter === 'All' || dataset.status === statusFilter
      const matchesType = typeFilter === 'All' || dataset.stage === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [deferredSearch, projectDatasets, statusFilter, typeFilter])

  const projectValidators = useMemo(() => buildProjectValidators(projectSlug, liveState ?? null, fallbackStory), [fallbackStory, liveState, projectSlug])

  const activeProjectStory = useMemo(() => {
    const hasLiveDatasets = Boolean(liveState && liveState.datasetsByProjectSlug[projectSlug]?.length)
    const currentDatasetId = hasLiveDatasets ? currentDataset.id : fallbackStory.currentDatasetId
    const lineageDatasetIds = hasLiveDatasets ? lineageDatasets.map((dataset) => dataset.id) : fallbackStory.lineageDatasetIds
    const timeline = hasLiveDatasets ? buildLiveTimeline(projectDatasets) : fallbackStory.timeline

    return {
      ...fallbackStory,
      currentDatasetId,
      lineageDatasetIds,
      activeValidatorIds: projectValidators.map((validator) => validator.id),
      workflowPosture: buildWorkflowPosture(currentDataset, hasLiveDatasets, fallbackStory.workflowPosture),
      timeline,
    }
  }, [currentDataset, fallbackStory, lineageDatasets, liveState, projectDatasets, projectSlug, projectValidators])

  const changeProject = (nextProjectSlug: ProjectSlug) => {
    const nextLiveCurrentDatasetId = liveState?.currentDatasetIds[nextProjectSlug]
    const nextFallbackCurrentDatasetId = demoProjectStories[nextProjectSlug].currentDatasetId

    setProjectSlug(nextProjectSlug)
    setSelectedDatasetId(nextLiveCurrentDatasetId ?? nextFallbackCurrentDatasetId)
    setSearch('')
    setStatusFilter('All')
    setTypeFilter('All')
  }

  const kpis = useMemo(
    () => [
      { label: 'Total Datasets', value: String(projectDatasets.length) },
      { label: 'Approved Versions', value: String(projectDatasets.filter((dataset) => dataset.status === 'Approved' || dataset.status === 'Finalized').length) },
      {
        label: 'Pending Reviews',
        value: String(projectDatasets.filter((dataset) => dataset.status === 'In Review' || dataset.status === 'Submitted' || dataset.status === 'Challenged').length),
      },
      {
        label: 'Active Validators',
        value: String(projectValidators.length || currentDataset.validatorCount),
      },
      { label: 'Mean Confidence', value: `${currentDataset.confidence.toFixed(1)}` },
      {
        label: 'Open Issues',
        value: String(
          new Set(projectDatasets.flatMap((dataset) => dataset.issues.filter((issue) => issue.state !== 'Resolved').map((issue) => issue.id))).size,
        ),
      },
    ],
    [currentDataset, projectDatasets, projectValidators.length],
  )

  const protocolMode: LiveProtocolMode = browserLiveProtocolConfigured
    ? liveState === undefined
      ? 'live-loading'
      : liveState
        ? 'live-ready'
        : 'live-unavailable'
    : 'mock'

  const thresholds = liveState?.thresholds ?? {
    minValidatorCount: 3,
    minApprovalRatioBps: 6667,
    minConfidenceBps: 7000,
  }

  return {
    activeNav,
    setActiveNav,
    projectSlug,
    setProjectSlug: changeProject,
    activeProject,
    activeProjectStory,
    projects,
    validatorsList: projectValidators,
    currentDataset,
    selectedDataset,
    lineageDatasets,
    selectedDatasetId,
    setSelectedDatasetId,
    filteredDatasets,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    kpis,
    protocolMode,
    thresholds,
    refreshLiveState,
    timeline: activeProjectStory.timeline,
    targetingComparison: activeProjectStory.comparison,
    getExplorerTxUrl,
    liveCompatibilityNotice,
  }
}
