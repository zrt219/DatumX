import { useEffect, useMemo, useState } from 'react'
import type { DatasetRecord, DatasetStage, LineageRailNode } from '../../types'
import { Panel } from '../shared/Panel'

const railStages: DatasetStage[] = [
  'Raw Scan Batch',
  'Extracted Gamma Traces',
  'Interpreted Mineralized Intervals',
  'Composite Summary',
  'Targeting Package',
]

const stageLabels: Record<DatasetStage, string> = {
  'Raw Scan Batch': 'Source',
  'Extracted Gamma Traces': 'Extraction',
  'Interpreted Mineralized Intervals': 'Interpretation',
  'Composite Summary': 'Composite',
  'Targeting Package': 'Targeting',
}

const defaultTitles: Record<DatasetStage, string> = {
  'Raw Scan Batch': 'Raw Source Package',
  'Extracted Gamma Traces': 'Digitized Gamma Traces',
  'Interpreted Mineralized Intervals': 'Mineralized Intervals',
  'Composite Summary': 'Composite Summary',
  'Targeting Package': 'Targeting Package',
}

const defaultNotes: Record<DatasetStage, string> = {
  'Raw Scan Batch': 'Historical source intake locked for downstream trace extraction and audit reference.',
  'Extracted Gamma Traces': 'Digitized trace package normalized from legacy scans and prepared for interval review.',
  'Interpreted Mineralized Intervals': 'Interpreted interval release advancing mineralized continuity into controlled review.',
  'Composite Summary': 'Composite package consolidating reviewed intervals into release-grade summary surfaces.',
  'Targeting Package': 'Targeting release prepared for decision support, governance sign-off, and field deployment.',
}

function parseUtcTimestamp(value?: string) {
  if (!value) return null
  const normalized = value.replace(' UTC', 'Z').replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatIntervalHours(from?: string, to?: string) {
  const fromDate = parseUtcTimestamp(from)
  const toDate = parseUtcTimestamp(to)
  if (!fromDate || !toDate) return 'Interval pending'

  const diffMs = Math.max(toDate.getTime() - fromDate.getTime(), 0)
  const totalMinutes = Math.round(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

function certaintyLabel(statusLabel: string, placeholder: boolean) {
  if (placeholder) return 'Awaiting release gate'
  if (statusLabel === 'Finalized') return 'Release locked'
  if (statusLabel === 'Approved') return 'Confidence locked'
  if (statusLabel === 'In Review') return 'Confidence provisional'
  if (statusLabel === 'Submitted') return 'Awaiting validator threshold'
  return 'Confidence monitored'
}

function statusTone(statusLabel: string, placeholder: boolean) {
  if (placeholder) return 'bg-white/[0.045] text-slate-400'
  if (statusLabel === 'Finalized') return 'bg-uranium/16 text-green-100'
  if (statusLabel === 'Approved') return 'bg-uranium/10 text-green-200'
  if (statusLabel === 'In Review') return 'bg-steel/12 text-blue-200'
  if (statusLabel === 'Submitted') return 'bg-amber/12 text-amber-200'
  if (statusLabel === 'Rejected' || statusLabel === 'Challenged') return 'bg-critical/12 text-red-200'
  return 'bg-white/[0.045] text-slate-300'
}

function formatTitle(dataset: DatasetRecord | undefined, slotStage: DatasetStage, currentDatasetId: string) {
  if (!dataset) return defaultTitles[slotStage]
  if (slotStage === 'Targeting Package' && dataset.id === currentDatasetId) return `Targeting Package v${dataset.version}`
  return defaultTitles[slotStage]
}

function releaseStateLabel(dataset: DatasetRecord) {
  if (dataset.status === 'Finalized') return dataset.chainAnchored ? 'Finalized and anchored' : 'Finalized, anchor pending'
  if (dataset.status === 'Approved') return dataset.chainAnchored ? 'Approved and anchored' : 'Approved, anchor pending'
  if (dataset.status === 'In Review') return 'Review quorum open'
  if (dataset.status === 'Submitted') return dataset.chainAnchored ? 'Submitted and anchored' : 'Submitted, anchor pending'
  if (dataset.status === 'Superseded') return 'Superseded release'
  return dataset.chainAnchored ? 'Anchored release' : 'Pending chain state'
}

function currentStateLabel(node: LineageRailNode, currentDatasetId: string) {
  if (node.id === currentDatasetId) return 'Current stage'
  if (node.placeholder) return 'Pending stage'
  return 'Prior stage'
}

function blockerStateLabel(node: LineageRailNode) {
  if (node.placeholder) return node.statusLabel
  if (node.statusLabel === 'Finalized') return 'Release locked'
  if (node.statusLabel === 'In Review') return 'Review window open'
  if (node.statusLabel === 'Submitted') return 'Awaiting validator threshold'
  if (node.statusLabel === 'Approved') return 'Release gate cleared'
  return 'Monitoring state'
}

function lineageIntegrityLabel(node: LineageRailNode, previousNode?: LineageRailNode) {
  if (node.placeholder) return 'Partial'
  if (!node.dataset) return 'Partial'
  if (!node.dataset.parentId) return 'Verified'
  return previousNode?.dataset?.id === node.dataset.parentId ? 'Verified' : 'Partial'
}

function nextStageLabel(nodes: LineageRailNode[], index: number) {
  const nextNode = nodes[index + 1]
  return nextNode ? defaultTitles[nextNode.slotStage] : 'Release complete'
}

function buildRailNodes(nodes: DatasetRecord[], currentDatasetId: string): LineageRailNode[] {
  const stageMap = new Map(nodes.map((dataset) => [dataset.stage, dataset]))
  const currentDataset = nodes.find((dataset) => dataset.id === currentDatasetId)
  const currentStageIndex = Math.max(railStages.indexOf(currentDataset?.stage ?? railStages[0]), 0)

  return railStages.map((slotStage, index) => {
    const dataset = stageMap.get(slotStage)
    const prevDataset = [...stageMap.entries()].find(([, candidate]) => candidate?.id === dataset?.parentId)?.[1]
    const precedingStage = railStages[index - 1]
    const precedingDataset = precedingStage ? stageMap.get(precedingStage) : undefined

    if (!dataset) {
      const pendingState =
        slotStage === 'Targeting Package' && precedingDataset?.status === 'In Review'
          ? 'Awaiting composite validation'
          : index > currentStageIndex
            ? 'Not Released'
            : 'Unavailable'

      return {
        id: `placeholder-${slotStage}`,
        slotStage,
        stageLabel: stageLabels[slotStage],
        shortTitle: defaultTitles[slotStage],
        fullTitle:
          pendingState === 'Awaiting composite validation'
            ? `${defaultTitles[slotStage]} Awaiting Composite Validation`
            : pendingState === 'Not Released'
              ? `${defaultTitles[slotStage]} Pending Release`
              : `${defaultTitles[slotStage]} Unavailable`,
        versionLabel: 'Pending stage',
        statusLabel: pendingState,
        placeholder: true,
        activePath: false,
        confidenceLabel: '--',
        validatorLabel: '--',
        datasetIdLabel: 'No dataset issued',
        timestampLabel: 'Awaiting submission',
        releaseState: pendingState,
        relationSummary: index > 0 ? `Next after ${defaultTitles[railStages[index - 1]]}.` : 'Initial intake stage.',
        operationalNote:
          pendingState === 'Awaiting composite validation'
            ? `${defaultTitles[slotStage]} is blocked until the composite release clears validation.`
            : pendingState === 'Not Released'
              ? `${defaultTitles[slotStage]} has not been promoted for this project yet.`
              : `${defaultTitles[slotStage]} is not available in the current project fixture.`,
      }
    }

    return {
      id: dataset.id,
      slotStage,
      stageLabel: stageLabels[slotStage],
      shortTitle: formatTitle(dataset, slotStage, currentDatasetId),
      fullTitle: dataset.lineageLabel,
      versionLabel: `Version ${dataset.version}`,
      statusLabel: dataset.status,
      placeholder: false,
      activePath: index <= currentStageIndex,
      confidenceLabel: dataset.confidence.toFixed(1),
      validatorLabel: `${dataset.validatorCount}`,
      datasetIdLabel: dataset.id,
      timestampLabel: dataset.approvedAt ?? dataset.submittedAt,
      releaseState: releaseStateLabel(dataset),
      relationSummary: dataset.parentId
        ? `Derived from ${prevDataset?.lineageLabel ?? dataset.parentId}.`
        : 'Root provenance package.',
      operationalNote: dataset.issues[0]?.summary ?? defaultNotes[slotStage],
      dataset,
    }
  })
}

function AnchorDot({
  node,
  current,
}: {
  node: LineageRailNode
  current: boolean
}) {
  const dotTone = node.placeholder
    ? 'bg-white/[0.16]'
    : node.statusLabel === 'Rejected' || node.statusLabel === 'Challenged'
      ? 'bg-critical/70'
      : node.activePath
        ? 'bg-uranium/80'
        : 'bg-white/[0.28]'

  const haloTone = node.placeholder
    ? 'shadow-none'
    : node.statusLabel === 'Rejected' || node.statusLabel === 'Challenged'
      ? 'shadow-[0_0_0_4px_rgba(176,89,89,0.12)]'
      : current
        ? 'shadow-[0_0_0_6px_rgba(154,193,147,0.16)] lineage-current-pulse'
        : node.activePath
          ? 'shadow-[0_0_0_4px_rgba(154,193,147,0.11)]'
          : 'shadow-none'

  return <span className={`relative z-10 block h-[10px] w-[10px] rounded-full ${dotTone} ${haloTone}`} />
}

function StageNode({
  node,
  selected,
  previewed,
  current,
  onEnter,
  onLeave,
  onSelect,
}: {
  node: LineageRailNode
  selected: boolean
  previewed: boolean
  current: boolean
  onEnter: () => void
  onLeave: () => void
  onSelect: () => void
}) {
  const metricsRow = node.placeholder ? (
    <div className="grid grid-cols-2 gap-4 pt-3 sm:gap-6 sm:pt-2">
      <div>
        <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/72">Release gate</p>
        <p className="mt-1.5 font-display text-[0.9rem] leading-none tracking-[-0.03em] text-slate-300">Pending</p>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/72">Metrics</p>
        <p className="mt-1.5 font-display text-[0.9rem] leading-none tracking-[-0.03em] text-slate-300">Awaiting</p>
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-4 pt-3 sm:gap-6 sm:pt-2">
      <div>
        <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/72">Confidence</p>
        <p className="mt-1.5 font-display text-[0.98rem] leading-none tracking-[-0.03em] text-white">{node.confidenceLabel}</p>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/72">Validators</p>
        <p className="mt-1.5 font-display text-[0.98rem] leading-none tracking-[-0.03em] text-white">{node.validatorLabel}</p>
      </div>
    </div>
  )

  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${node.shortTitle} ${node.versionLabel}`}
      className={`lineage-node group relative block min-h-[176px] w-full rounded-[12px] px-4 py-4 text-left transition duration-150 ease-out sm:min-h-[148px] sm:px-5 sm:py-4 ${
        selected
          ? current
            ? 'bg-[#17212a] text-white'
            : 'bg-[#151e27] text-white'
          : previewed
            ? 'bg-[#141d26] text-white'
            : node.activePath
              ? 'bg-[#121b23]/94 text-slate-100'
              : 'bg-[#101820]/92 text-slate-100'
      }`}
    >
      <div className="grid h-full grid-rows-[auto_auto_auto] gap-4 sm:gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[9px] uppercase tracking-[0.3em] text-chrome/80">{node.stageLabel}</p>
          <span
            className={`inline-flex shrink-0 rounded-[9px] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.22em] ${
              statusTone(node.statusLabel, node.placeholder)
            }`}
          >
            {node.statusLabel}
          </span>
        </div>

        <div>
          <h4 className="max-w-[22ch] font-display text-[0.95rem] font-semibold leading-5 tracking-[-0.03em] text-white sm:text-[0.98rem]">
            {node.shortTitle}
          </h4>
          <p className="mt-1 text-[0.78rem] leading-5 text-slate-400 sm:text-[0.8rem]">{node.versionLabel}</p>
        </div>

        {metricsRow}
      </div>
    </button>
  )
}

export function LineageGraph({ nodes, currentDatasetId }: { nodes: DatasetRecord[]; currentDatasetId: string }) {
  const railNodes = useMemo(() => buildRailNodes(nodes, currentDatasetId), [nodes, currentDatasetId])
  const [selectedNodeId, setSelectedNodeId] = useState(currentDatasetId)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedNodeId(currentDatasetId)
  }, [currentDatasetId])

  const displayedNode = railNodes.find((node) => node.id === (hoveredNodeId ?? selectedNodeId)) ?? railNodes[0]
  const displayedIndex = railNodes.findIndex((node) => node.id === displayedNode.id)
  const previousDisplayedNode = displayedIndex > 0 ? railNodes[displayedIndex - 1] : undefined
  const confidenceDelta =
    displayedNode.dataset && previousDisplayedNode?.dataset
      ? `${displayedNode.dataset.confidence >= previousDisplayedNode.dataset.confidence ? '+' : ''}${(
          displayedNode.dataset.confidence - previousDisplayedNode.dataset.confidence
        ).toFixed(1)}`
      : 'Pending'
  const transitionInterval =
    displayedNode.dataset && previousDisplayedNode?.dataset
      ? formatIntervalHours(previousDisplayedNode.dataset.submittedAt, displayedNode.dataset.submittedAt)
      : 'Pending'
  const approvalTimestamp = displayedNode.dataset?.approvedAt ?? 'Awaiting approval'
  const integrityState = lineageIntegrityLabel(displayedNode, previousDisplayedNode)
  const currentState = currentStateLabel(displayedNode, currentDatasetId)
  const blockerState = blockerStateLabel(displayedNode)
  const nextStage = nextStageLabel(railNodes, displayedIndex)
  const liveStageCount = railNodes.filter((node) => !node.placeholder).length
  const headerNote =
    liveStageCount <= 1
      ? 'Only Stage 1 is currently live onchain. Subsequent stages will appear as datasets are submitted.'
      : `${liveStageCount} lineage stages are currently live onchain for the active project.`

  return (
    <Panel className="self-start bg-[#0f151d]/82 p-0">
      <section className="flex min-h-[640px] flex-col">
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-chrome/85">Approved provenance path</p>
            <h3 className="mt-1.5 font-display text-[1.08rem] font-semibold tracking-[-0.03em] text-white">
              Dataset Lineage Graph
            </h3>
            <p className="mt-2 max-w-[44ch] text-xs leading-5 text-slate-400">{headerNote}</p>
          </div>
          <div className="flex items-center gap-4 pt-1 text-[10px] uppercase tracking-[0.22em] text-chrome/75">
            <span className="flex items-center gap-1.5">
              <span className="h-[8px] w-[8px] rounded-full bg-uranium/75" />
              Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-[8px] w-[8px] rounded-full bg-white/[0.22]" />
              Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-[8px] w-[8px] rounded-full bg-uranium/85 shadow-[0_0_0_4px_rgba(154,193,147,0.12)]" />
              Current
            </span>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-5 px-5 pb-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(320px,1fr)]">
          <div className="relative rounded-[18px] bg-white/[0.02] px-4 py-5 sm:px-5">
            <div className="pointer-events-none absolute bottom-12 left-[36px] top-8 w-[1.5px] rounded-full bg-white/[0.07]" />
            <div className="pointer-events-none absolute bottom-[23%] left-[36px] top-8 w-[1.5px] rounded-full bg-uranium/[0.28]" />
            <div className="lineage-spine-pulse pointer-events-none absolute bottom-[23%] left-[36px] top-8 w-[1.5px] rounded-full bg-uranium/[0.08]" />

            <div className="relative flex flex-col gap-5 sm:gap-6">
              {railNodes.map((node) => {
                const current = node.id === currentDatasetId
                return (
                  <div key={node.id} className="grid grid-cols-[24px_minmax(0,1fr)] items-stretch gap-3 sm:grid-cols-[28px_minmax(0,1fr)] sm:gap-4">
                    <div className="relative flex justify-center pt-[42px]">
                      <AnchorDot node={node} current={current} />
                    </div>
                    <StageNode
                      node={node}
                      selected={selectedNodeId === node.id}
                      previewed={hoveredNodeId === node.id}
                      current={current}
                      onEnter={() => setHoveredNodeId(node.id)}
                      onLeave={() => setHoveredNodeId(null)}
                      onSelect={() => setSelectedNodeId(node.id)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <aside className="flex min-h-[520px] flex-col rounded-[18px] bg-white/[0.02] px-5 py-5">
            <div key={displayedNode.id} className="lineage-detail-enter flex h-full flex-col gap-6">
              <section>
                <p className="text-[10px] uppercase tracking-[0.26em] text-chrome/78">Identity and release</p>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-display text-[1.02rem] font-semibold tracking-[-0.03em] text-white">
                      {displayedNode.fullTitle}
                    </h4>
                    <p className="mt-1 text-sm text-slate-400">{displayedNode.datasetIdLabel}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-[9px] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.22em] ${
                      statusTone(displayedNode.statusLabel, displayedNode.placeholder)
                    }`}
                  >
                    {displayedNode.statusLabel}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Stage</p>
                    <p className="mt-1 text-sm text-slate-200">{displayedNode.stageLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Version</p>
                    <p className="mt-1 text-sm text-slate-200">{displayedNode.versionLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Release state</p>
                    <p className="mt-1 text-sm text-slate-200">{displayedNode.releaseState}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Approval state</p>
                    <p className="mt-1 text-sm text-slate-200">{currentState}</p>
                  </div>
                </div>
              </section>

              <section className="border-t border-white/[0.05] pt-5">
                <p className="text-[10px] uppercase tracking-[0.26em] text-chrome/78">Validation and metrics</p>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Confidence</p>
                    <p className="mt-1 font-display text-[1.18rem] tracking-[-0.03em] text-white">{displayedNode.confidenceLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Validators</p>
                    <p className="mt-1 font-display text-[1.18rem] tracking-[-0.03em] text-white">{displayedNode.validatorLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Submitted</p>
                    <p className="mt-1 text-sm text-slate-300">{displayedNode.timestampLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Approved</p>
                    <p className="mt-1 text-sm text-slate-300">{approvalTimestamp}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Confidence delta</p>
                    <p className="mt-1 text-sm text-slate-300">{confidenceDelta}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Transition interval</p>
                    <p className="mt-1 text-sm text-slate-300">{transitionInterval}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Certainty</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {certaintyLabel(displayedNode.statusLabel, displayedNode.placeholder)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Lineage integrity</p>
                    <p className="mt-1 text-sm text-slate-300">{integrityState}</p>
                  </div>
                </div>
              </section>

              <section className="mt-auto border-t border-white/[0.05] pt-5">
                <p className="text-[10px] uppercase tracking-[0.26em] text-chrome/78">Operational context</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Parent relation</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{displayedNode.relationSummary}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Operational note</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{displayedNode.operationalNote}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Blocker state</p>
                      <p className="mt-1 text-sm text-slate-300">{blockerState}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-chrome/72">Next stage</p>
                      <p className="mt-1 text-sm text-slate-300">{nextStage}</p>
                    </div>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-chrome/70">View dataset details</p>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </section>
    </Panel>
  )
}
