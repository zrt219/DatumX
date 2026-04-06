import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  settingsPageIntro,
  settingsSections,
  settingsThesisPanel,
  type SettingsInlineText,
  type SettingsReferenceLink,
} from '../../content/settingsContent'

const HERO_TITLE = 'text-[56px] leading-[0.95] font-semibold tracking-[-0.04em]'
const SECTION_TITLE = 'text-[34px] leading-[1.02] font-semibold tracking-[-0.03em]'
const FEATURE_SECTION_TITLE = 'text-[40px] leading-[0.98] font-semibold tracking-[-0.04em]'
const SUBHEADING = 'text-[18px] leading-[1.55] text-white/70'
const BODY = 'text-[16px] leading-[1.75] text-white/78'
const EYEBROW = 'text-[10px] uppercase tracking-[0.22em] text-white/38 font-medium'
const THESIS = 'text-[22px] leading-[1.3] font-medium tracking-[-0.01em]'

function InlineRichText({ parts }: { parts: SettingsInlineText[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <span
            key={`${part.text}-${index}`}
            className="rounded-[6px] bg-[#c3ae75]/[0.14] px-1.5 py-[1px] font-semibold text-[#f2e6be]"
          >
            {part.text}
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  )
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className={EYEBROW}>{children}</p>
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/64">
      {children}
    </span>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-4 py-1">
      <div className="relative h-px flex-1 overflow-hidden rounded-full bg-white/8">
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#d7bf82]/0 via-[#d7bf82]/55 to-[#d7bf82]/0" />
        <div className="absolute inset-y-0 left-[12%] w-24 bg-[#c9f4a0]/35 blur-sm" />
      </div>
      <div className="rounded-full border border-[#d7bf82]/28 bg-[linear-gradient(180deg,rgba(28,32,39,0.96),rgba(14,18,24,0.98))] px-5 py-2.5 shadow-[0_0_18px_rgba(201,244,160,0.07),0_6px_14px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(122,107,69,0.28)]">
        <span className="bg-gradient-to-b from-[#f3e7bf] via-[#cdb77e] to-[#8a7b56] bg-clip-text text-[24px] uppercase tracking-[0.1em] text-transparent">
          {label}
        </span>
      </div>
      <div className="relative h-px flex-1 overflow-hidden rounded-full bg-white/8">
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#d7bf82]/0 via-[#d7bf82]/55 to-[#d7bf82]/0" />
        <div className="absolute inset-y-0 right-[12%] w-24 bg-[#c9f4a0]/35 blur-sm" />
      </div>
    </div>
  )
}

function ThesisBlock({
  eyebrow,
  children,
  subdued = false,
  emphasize = false,
}: {
  eyebrow: string
  children: ReactNode
  subdued?: boolean
  emphasize?: boolean
}) {
  return (
    <div
      className={[
        'rounded-[22px] border px-8 py-8',
        subdued
          ? 'border-white/8 bg-[#12181f]'
          : emphasize
            ? 'border-[#d3bb7a]/24 bg-[#141a22] shadow-[0_-1px_0_rgba(234,215,161,0.52),0_-10px_30px_rgba(211,187,122,0.10),inset_0_1px_0_rgba(255,245,214,0.06),inset_4px_0_0_rgba(197,176,118,0.72)]'
            : 'border-[#c5b076]/18 bg-[#141a22] shadow-[inset_4px_0_0_rgba(197,176,118,0.72)]',
      ].join(' ')}
    >
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function DefinitionPanel({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body?: ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#12181f] px-7 py-7">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h3 className={`mt-4 font-display ${THESIS} text-white`}>{title}</h3>
      {body ? <div className={`mt-3 ${BODY}`}>{body}</div> : null}
    </div>
  )
}

function NetworkStage({
  eyebrow,
  title,
  body,
  align,
  stageIndex,
}: {
  eyebrow: string
  title: string
  body: string
  align: 'left' | 'right'
  stageIndex: number
}) {
  const isLeft = align === 'left'
  const nodeAccent =
    stageIndex === 0
      ? {
          halo: 'bg-[radial-gradient(circle,rgba(201,244,160,0.24)_0%,rgba(127,184,255,0.10)_34%,rgba(15,20,25,0)_72%)]',
          node: 'border-[#d9efb2]/48 shadow-[0_0_0_8px_rgba(201,244,160,0.06),0_0_24px_rgba(201,244,160,0.22),inset_0_2px_4px_rgba(255,255,255,0.12)]',
          line: isLeft
            ? 'right-1/2 from-[#d7bf82]/0 via-[#c9f4a0]/30 to-[#d9efb2]/52'
            : 'left-1/2 from-[#d9efb2]/52 via-[#c9f4a0]/30 to-[#c9f4a0]/0',
        }
      : stageIndex === 1
        ? {
            halo: 'bg-[radial-gradient(circle,rgba(243,231,191,0.22)_0%,rgba(215,191,130,0.12)_30%,rgba(15,20,25,0)_72%)]',
            node: 'border-[#f0ddb0]/46 shadow-[0_0_0_8px_rgba(215,191,130,0.06),0_0_24px_rgba(215,191,130,0.18),inset_0_2px_4px_rgba(255,255,255,0.12)]',
            line: isLeft
              ? 'right-1/2 from-[#d7bf82]/0 via-[#f0ddb0]/28 to-[#f0ddb0]/48'
              : 'left-1/2 from-[#f0ddb0]/48 via-[#d7bf82]/28 to-[#d7bf82]/0',
          }
        : {
            halo: 'bg-[radial-gradient(circle,rgba(127,184,255,0.18)_0%,rgba(201,244,160,0.08)_34%,rgba(15,20,25,0)_72%)]',
            node: 'border-[#a7d2ff]/42 shadow-[0_0_0_8px_rgba(127,184,255,0.05),0_0_24px_rgba(127,184,255,0.18),inset_0_2px_4px_rgba(255,255,255,0.10)]',
            line: isLeft
              ? 'right-1/2 from-[#d7bf82]/0 via-[#7fb8ff]/24 to-[#a7d2ff]/44'
              : 'left-1/2 from-[#a7d2ff]/44 via-[#7fb8ff]/24 to-[#c9f4a0]/0',
          }

  return (
    <div
      className={[
        'relative grid gap-6 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:items-center',
        isLeft ? '' : '',
      ].join(' ')}
    >
      <div className={isLeft ? 'order-1' : 'order-3'}>
        <div className="relative rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#131a21_0%,#0f1419_100%)] px-7 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div
            className={[
              'pointer-events-none absolute top-1/2 hidden -translate-y-1/2 md:block',
              isLeft ? 'right-[-31px]' : 'left-[-31px]',
            ].join(' ')}
          >
            <div
              className={[
                'relative h-px w-8 bg-gradient-to-r',
                isLeft
                  ? 'from-[#d9efb2]/60 via-[#c9f4a0]/32 to-[#c9f4a0]/0'
                  : 'from-[#c9f4a0]/0 via-[#c9f4a0]/32 to-[#d9efb2]/60',
              ].join(' ')}
            >
              <div
                className={[
                  'absolute top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border border-white/20 bg-[#11171d] shadow-[0_0_14px_rgba(201,244,160,0.16)]',
                  isLeft ? 'right-0' : 'left-0',
                ].join(' ')}
              />
            </div>
          </div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h3 className="mt-4 max-w-[12ch] font-display text-[34px] leading-[0.96] tracking-[-0.045em] text-white">
            {title}
          </h3>
          <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/38">
            <span className="h-[7px] w-[7px] rounded-full bg-[#c9f4a0] shadow-[0_0_12px_rgba(201,244,160,0.52)] animate-pulse" />
            <span>Transformation route</span>
          </div>
        </div>
      </div>

      <div className="order-2 hidden h-full items-center justify-center md:flex">
        <div className="relative flex h-full min-h-[170px] w-full items-center justify-center">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#d7bf82]/0 via-[#d7bf82]/38 via-[55%] to-[#c9f4a0]/0" />
          <div className="absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#c9f4a0]/0 via-[#c9f4a0]/22 to-[#d7bf82]/0" />
          <div className={`absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md ${nodeAccent.halo}`} />
          <div className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#171d23] animate-pulse ${nodeAccent.node}`} />
          <div
            className={[
              'absolute top-1/2 h-px w-[calc(50%-12px)] -translate-y-1/2 bg-gradient-to-r',
              nodeAccent.line,
            ].join(' ')}
          />
        </div>
      </div>

      <div className={isLeft ? 'order-3' : 'order-1'}>
        <div className="relative rounded-[20px] border border-white/9 bg-white/[0.02] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div
            className={[
              'pointer-events-none absolute top-1/2 hidden -translate-y-1/2 md:block',
              isLeft ? 'left-[-31px]' : 'right-[-31px]',
            ].join(' ')}
          >
            <div
              className={[
                'relative h-px w-8 bg-gradient-to-r',
                isLeft
                  ? 'from-[#f0ddb0]/60 via-[#d7bf82]/28 to-[#d7bf82]/0'
                  : 'from-[#d7bf82]/0 via-[#d7bf82]/28 to-[#f0ddb0]/60',
              ].join(' ')}
            >
              <div
                className={[
                  'absolute top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border border-white/20 bg-[#12181d] shadow-[0_0_14px_rgba(215,191,130,0.14)]',
                  isLeft ? 'left-0' : 'right-0',
                ].join(' ')}
              />
            </div>
          </div>
          <p className={BODY}>{body}</p>
        </div>
      </div>
    </div>
  )
}

function OperationalNetwork({
  rows,
}: {
  rows: Array<{ eyebrow: string; title: string; body: string }>
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#0f151b_0%,#0b1015_100%)] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 hidden h-[calc(100%-8rem)] w-px -translate-x-1/2 bg-gradient-to-b from-[#d7bf82]/0 via-[#d7bf82]/34 via-[45%] to-[#c9f4a0]/0 md:block" />
        <div className="absolute left-1/2 top-16 hidden h-[calc(100%-8rem)] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-[#f0ddb0]/18 via-[40%] to-transparent blur-sm md:block" />
        <div className="absolute left-1/2 top-1/2 hidden h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9f4a0]/6 blur-3xl md:block animate-pulse" />
        <div className="absolute left-1/2 bottom-8 hidden h-24 w-24 -translate-x-1/2 rounded-full bg-[#7fb8ff]/6 blur-3xl md:block animate-pulse" />
      </div>

      <div className="relative space-y-8 md:space-y-10">
        {rows.map((row, index) => (
          <NetworkStage
            key={row.title}
            eyebrow={row.eyebrow}
            title={row.title}
            body={row.body}
            align={index % 2 === 0 ? 'left' : 'right'}
            stageIndex={index}
          />
        ))}
      </div>
    </div>
  )
}

function ArgumentPanel({
  eyebrow,
  children,
  emphasize = false,
}: {
  eyebrow: string
  children: ReactNode
  emphasize?: boolean
}) {
  return (
    <div
      className={[
        'rounded-[22px] border bg-[#141a22] px-8 py-8',
        emphasize
          ? 'border-[#d3bb7a]/24 shadow-[0_-1px_0_rgba(234,215,161,0.52),0_-10px_30px_rgba(211,187,122,0.10),inset_0_1px_0_rgba(255,245,214,0.06),inset_4px_0_0_rgba(197,176,118,0.72)]'
          : 'border-[#c5b076]/18 shadow-[inset_4px_0_0_rgba(197,176,118,0.72)]',
      ].join(' ')}
    >
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function EvidencePanel({
  eyebrow,
  items,
}: {
  eyebrow: string
  items: string[]
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#11171d] px-6 py-6">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <div className="mt-4 space-y-0">
        {items.map((item, index) => (
          <div key={item} className={`${index !== 0 ? 'border-t border-white/8 pt-4' : ''}`}>
            <p className={BODY}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourceCard({ reference }: { reference: SettingsReferenceLink }) {
  return (
    <a
      href={reference.href}
      target="_blank"
      rel="noreferrer"
      className="group rounded-[16px] border border-white/10 bg-[#11171d] px-5 py-5 transition hover:border-[#c5b076]/24 hover:bg-[#151c24]"
    >
      <div className="flex items-start gap-3">
        <ExternalLink size={14} className="mt-[4px] shrink-0 text-white/34 transition group-hover:text-[#d8c388]" />
        <div className="space-y-1">
          <p className="text-[16px] leading-7 text-white/86">{reference.label}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">Research source</p>
        </div>
      </div>
    </a>
  )
}

function ResearchHero({ compatibilityNotice }: { compatibilityNotice: string }) {
  const chips = ['Scientific integrity', 'XRPL EVM', 'AI-assisted interpretation', 'Positioning dossier']

  return (
    <section className="space-y-6 rounded-[24px] border border-white/10 bg-[#0f141a] px-8 py-8 md:px-10 md:py-10">
      <SectionDivider label="Research Dossier" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-6">
          <SectionEyebrow>{settingsPageIntro.eyebrow}</SectionEyebrow>
          <div className="max-w-[880px] space-y-6">
            <h1 className={`font-display ${HERO_TITLE} text-white`}>{settingsPageIntro.title}</h1>
            <p className={SUBHEADING}>{settingsPageIntro.lead}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {chips.map((chip) => (
              <MetaChip key={chip}>{chip}</MetaChip>
            ))}
          </div>

          <ArgumentPanel eyebrow="Dominant thesis" emphasize>
            <p className={`max-w-[38ch] font-display ${THESIS} text-white`}>
              DatumX treats each release package as a governed analytical unit whose provenance, review history, and finalization state should remain inspectable instead of implied by workflow habit.
            </p>
          </ArgumentPanel>
        </div>

        <div className="space-y-4">
          <DefinitionPanel
            eyebrow={settingsThesisPanel.definitionLead}
            title="A datum is a single fact used as a basis for reasoning."
            body={<InlineRichText parts={settingsThesisPanel.definitionBody} />}
          />

          <ThesisBlock eyebrow={settingsThesisPanel.runtimeTitle} subdued>
            <div className="space-y-3">
              {settingsThesisPanel.runtimeBody.map((item) => (
                <p key={item} className={BODY}>
                  {item}
                </p>
              ))}
              <div className="rounded-[16px] border border-[#c5b076]/18 bg-[#17140f] px-4 py-4">
                <p className={BODY}>{compatibilityNotice}</p>
              </div>
            </div>
          </ThesisBlock>
        </div>
      </div>
    </section>
  )
}

function CoreDefinitionSection() {
  const section = settingsSections[0]
  const cards = section.signalBlock?.items ?? []

  return (
    <section className="space-y-6">
      <SectionDivider label="Foundation" />
      <SectionHeader
        eyebrow="Core Definition"
        title={section.title}
        subtitle={section.lead ?? 'The name of the project is a technical statement, not just branding.'}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="max-w-[880px] space-y-6">
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className={BODY}>
              <InlineRichText parts={paragraph} />
            </p>
          ))}
        </div>

        <div className="space-y-4">
          {cards.map((card, index) => (
            <DefinitionPanel key={card} eyebrow={`Definition ${index + 1}`} title={card} />
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyItMattersSection() {
  const section = settingsSections[3]

  return (
    <section className="space-y-6">
      <SectionDivider label="Why It Matters" />
      <SectionHeader
        eyebrow="Why It Matters"
        title={section.title}
        subtitle={section.lead ?? 'This is really a workflow argument about accountable interpretation.'}
        titleClass={FEATURE_SECTION_TITLE}
      />

      <ArgumentPanel eyebrow="Highlighted argument" emphasize>
        <p className={`max-w-[42ch] font-display ${THESIS} text-white`}>
          Reproducibility, provenance, and release discipline improve when scientific interpretation is modeled as a chain of accountable transformations instead of a single opaque result.
        </p>
      </ArgumentPanel>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="max-w-[880px] space-y-6">
          {section.paragraphs.slice(0, 2).map((paragraph, index) => (
            <p key={index} className={BODY}>
              <InlineRichText parts={paragraph} />
            </p>
          ))}
        </div>
        <div className="max-w-[880px] space-y-6">
          {section.paragraphs.slice(2).map((paragraph, index) => (
            <p key={index} className={BODY}>
              <InlineRichText parts={paragraph} />
            </p>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {section.references.map((reference) => (
          <SourceCard key={reference.href} reference={reference} />
        ))}
      </div>
    </section>
  )
}

function OperationalRelevanceSection() {
  const section = settingsSections[1]
  const rows = [
    {
      eyebrow: 'Operational parallel 01',
      title: section.signalBlock?.items[0] ?? 'Historic drill databases create high-value but high-friction inputs',
      body: 'Historic drill archives create valuable but difficult inputs that require disciplined transformation before they can support defensible development decisions.',
    },
    {
      eyebrow: 'Operational parallel 02',
      title: section.signalBlock?.items[1] ?? 'Brownfield uranium projects reward disciplined interpretation',
      body: 'Brownfield programs benefit from release discipline because the decision path is cumulative, interpretation-heavy, and exposed to version drift.',
    },
    {
      eyebrow: 'Operational parallel 03',
      title: section.signalBlock?.items[2] ?? 'A staged review system fits naturally with ISR-style advancement',
      body: 'A staged review system mirrors how technical programs mature in the field: from records, to interpretation, to progressively more consequential releases.',
    },
  ]

  return (
    <section className="space-y-6">
      <SectionDivider label="Operational Relevance" />
      <SectionHeader
        eyebrow="Operational Relevance"
        title={section.title}
        subtitle={section.lead ?? 'The relevance is operational, not cosmetic.'}
      />

      <div className="max-w-[880px] space-y-6">
        {section.paragraphs.map((paragraph, index) => (
          <p key={index} className={BODY}>
            <InlineRichText parts={paragraph} />
          </p>
        ))}
      </div>

      <OperationalNetwork rows={rows} />
    </section>
  )
}

function AiDatumxSection() {
  const section = settingsSections[2]

  return (
    <section className="space-y-6">
      <SectionDivider label="AI + DatumX" />
      <SectionHeader
        eyebrow="AI + DatumX"
        title={section.title}
        subtitle={section.lead ?? 'The stack is split by responsibility, not hype.'}
        titleClass={FEATURE_SECTION_TITLE}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <ThesisBlock eyebrow="AI + blockchain thesis" emphasize>
            <p className={`max-w-[42ch] font-display ${THESIS} text-white`}>
              The stack is split by responsibility: AI compresses interpretation work, while blockchain preserves the release path, validator input, and final analytical state.
            </p>
          </ThesisBlock>

          <div className="max-w-[880px] space-y-6">
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className={BODY}>
                <InlineRichText parts={paragraph} />
              </p>
            ))}
          </div>
        </div>

        <EvidencePanel eyebrow={section.signalBlock?.label ?? 'Reasoning panel'} items={section.signalBlock?.items ?? []} />
      </div>
    </section>
  )
}

function ReferencesSection() {
  const references = [
    ...settingsThesisPanel.sources,
    ...settingsSections[1].references,
    ...settingsSections[2].references,
    ...settingsSections[3].references,
    ...settingsSections[4].references,
  ]
  const unique = Array.from(new Map(references.map((reference) => [reference.href, reference])).values())

  return (
    <section className="rounded-[24px] border border-white/8 bg-[#0f1417] px-7 py-7 md:px-8 md:py-8">
      <div className="space-y-6">
      <SectionDivider label="Reference Ledger" />
      <SectionHeader
        eyebrow="Source / References"
        title="Supporting evidence and external references"
        subtitle="These sources anchor the page's framing in technical definitions, public uranium project materials, and research on AI-assisted geoscientific analysis."
      />

      <ReferenceGrid references={unique} />
      </div>
    </section>
  )
}

function ReferenceGrid({ references }: { references: SettingsReferenceLink[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {references.map((reference) => (
        <SourceCard key={reference.href} reference={reference} />
      ))}
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  titleClass,
}: {
  eyebrow: string
  title: string
  subtitle: string
  titleClass?: string
}) {
  return (
    <div className="max-w-[880px] space-y-5">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className={`max-w-[18ch] font-display ${titleClass ?? SECTION_TITLE} text-white`}>{title}</h2>
      <p className={SUBHEADING}>{subtitle}</p>
    </div>
  )
}

export function SettingsPage({ compatibilityNotice }: { compatibilityNotice: string }) {
  return (
    <div className="relative isolate mx-auto max-w-[1160px] overflow-hidden rounded-[32px] px-3 py-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#d7bf82]/10 blur-3xl animate-pulse" />
        <div className="absolute right-[-8%] top-[18%] h-80 w-80 rounded-full bg-[#c9f4a0]/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-24 left-[18%] h-96 w-96 rounded-full bg-[#7fb8ff]/6 blur-3xl animate-pulse" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f0ddb0]/30 to-transparent shadow-[0_0_24px_rgba(240,221,176,0.24)]" />
        <div className="absolute inset-y-10 left-0 w-px bg-gradient-to-b from-transparent via-[#c9f4a0]/16 to-transparent shadow-[0_0_18px_rgba(201,244,160,0.18)]" />
        <div className="absolute inset-y-16 right-0 w-px bg-gradient-to-b from-transparent via-[#d7bf82]/18 to-transparent shadow-[0_0_18px_rgba(215,191,130,0.18)]" />
      </div>

      <div className="space-y-16">
        <ResearchHero compatibilityNotice={compatibilityNotice} />
        <CoreDefinitionSection />
        <WhyItMattersSection />
        <OperationalRelevanceSection />
        <AiDatumxSection />
        <ReferencesSection />
      </div>
    </div>
  )
}

