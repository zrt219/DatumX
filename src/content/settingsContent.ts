export interface SettingsReferenceLink {
  label: string
  href: string
}

export interface SettingsInlineText {
  text: string
  highlight?: boolean
}

export interface SettingsSignalBlock {
  label: string
  items: string[]
}

export interface SettingsSection {
  id: string
  eyebrow: string
  title: string
  lead?: string
  paragraphs: SettingsInlineText[][]
  signalBlock?: SettingsSignalBlock
  references: SettingsReferenceLink[]
}

export interface SettingsThesisPanel {
  eyebrow: string
  title: string
  definitionLead: string
  definitionBody: SettingsInlineText[]
  thesisTitle: string
  thesisBody: SettingsInlineText[]
  relevanceTitle: string
  relevanceBody: SettingsInlineText[]
  runtimeTitle: string
  runtimeBody: string[]
  sourcesTitle: string
  sources: SettingsReferenceLink[]
}

export const datumTagline = 'A datum is a single fact used as a basis for reasoning.'

export const settingsPageIntro = {
  eyebrow: 'Research and Positioning',
  title: 'DatumX as a scientific integrity dossier',
  lead:
    'This page is designed as a premium reference surface: part project rationale, part research framing, and part technical positioning document for anyone evaluating why DatumX matters.',
}

export const settingsThesisPanel: SettingsThesisPanel = {
  eyebrow: 'Editorial Thesis',
  title: 'Why DatumX exists',
  definitionLead: 'Definition',
  definitionBody: [
    { text: 'A ' },
    { text: 'datum', highlight: true },
    { text: ' is a single fact, observation, or reference point used as a basis for reasoning, measurement, or calculation.' },
  ],
  thesisTitle: 'Protocol thesis',
  thesisBody: [
    { text: 'DatumX treats each release package as a governed analytical unit whose ' },
    { text: 'provenance', highlight: true },
    { text: ', review history, and ' },
    { text: 'finalization', highlight: true },
    { text: ' state should be inspectable instead of implied by workflow habit.' },
  ],
  relevanceTitle: 'Why this matters',
  relevanceBody: [
    { text: 'The project connects ' },
    { text: 'AI-assisted interpretation', highlight: true },
    { text: ' with onchain release discipline so that staged exploration outputs can be trusted as they move through ' },
    { text: 'lineage', highlight: true },
    { text: ', validation, and decision making.' },
  ],
  runtimeTitle: 'Runtime posture',
  runtimeBody: [
    'XRPL EVM testnet routing is live through MetaMask.',
    'Protocol reads and writes are centralized through the deployed contract manifest.',
    'The product shell stays dark, restrained, and institutional while this page functions as a research-facing dossier.',
  ],
  sourcesTitle: 'Core references',
  sources: [
    { label: 'Merriam-Webster: datum', href: 'https://www.merriam-webster.com/dictionary/datum' },
    { label: 'Britannica: datum', href: 'https://www.britannica.com/science/datum' },
    { label: 'Noble Plains projects overview', href: 'https://nobleplains.com/projects' },
    { label: 'Scientific Reports: mineral prospectivity prediction', href: 'https://www.nature.com/articles/s41598-024-73357-0' },
  ],
}

export const settingsSections: SettingsSection[] = [
  {
    id: 'datum-definition',
    eyebrow: 'What Is a Datum',
    title: 'Datum as a scientific unit of record',
    lead: 'The name of the project is a technical statement, not just branding.',
    paragraphs: [
      [
        { text: 'A ' },
        { text: 'datum', highlight: true },
        { text: ' is not just a vague synonym for data. In scientific and analytical use, it is a single recorded fact, observation, or reference point that can support measurement, inference, or calculation.' },
      ],
      [
        { text: 'That definition maps directly to DatumX. Each dataset is treated as a traceable release unit whose ' },
        { text: 'provenance', highlight: true },
        { text: ', validator review state, and ' },
        { text: 'finalization', highlight: true },
        { text: ' history can be inspected rather than assumed.' },
      ],
      [
        { text: 'The name matters because the protocol is built around making each submitted package defensible as a basis for later reasoning, not merely storable as a file upload.' },
      ],
    ],
    signalBlock: {
      label: 'Key framing',
      items: [
        'Datum: one fact or reference point',
        'Dataset: a structured collection of those facts',
        'DatumX: the trust layer that records how those facts were transformed, reviewed, and released',
      ],
    },
    references: [
      { label: 'Merriam-Webster: datum', href: 'https://www.merriam-webster.com/dictionary/datum' },
      { label: 'Britannica: datum in surveying', href: 'https://www.britannica.com/science/datum' },
    ],
  },
  {
    id: 'noble-plains',
    eyebrow: 'Why Noble Plains Uranium Is Relevant',
    title: 'A real-world exploration context for the problem',
    lead: 'The relevance is operational, not cosmetic.',
    paragraphs: [
      [
        { text: 'Noble Plains Uranium is relevant because it reflects the operating environment DatumX is meant to make legible: ' },
        { text: 'brownfield uranium projects', highlight: true },
        { text: ', historical drill records, staged interpretation, and a need to turn scattered geological evidence into defensible development decisions.' },
      ],
      [
        { text: 'Their public materials describe a Wyoming ISR uranium portfolio built on historical drilling, existing infrastructure, and phased advancement from legacy information toward drill targeting and resource definition. That is exactly the kind of workflow where ' },
        { text: 'scientific integrity', highlight: true },
        { text: ' and version trust start to matter.' },
      ],
      [
        { text: 'This is inspiration and domain grounding, not a claim of partnership. The point is that exploration programs are already data-rich, interpretation-heavy, and time-sensitive enough to benefit from stronger validation and lineage controls.' },
      ],
    ],
    signalBlock: {
      label: 'Operational parallels',
      items: [
        'Historic drill databases create high-value but high-friction inputs',
        'Brownfield uranium projects reward disciplined interpretation, not just raw document accumulation',
        'A staged review system fits naturally with ISR-style project advancement and technical de-risking',
      ],
    },
    references: [
      { label: 'Noble Plains projects overview', href: 'https://nobleplains.com/projects' },
      { label: 'Noble Plains Shirley Central news release', href: 'https://nobleplains.com/news-releases/noble-plains-uranium-secures-strategic-ground-in-heart-of-shirley-basin-uranium-district' },
      { label: 'Noble Plains Shirley Central data digitization release', href: 'https://nobleplains.com/news-releases/noble-plains-uranium-engages-geomorphic-ai-to-digitize-historic-shirley-central-drill-data-advancing-toward-resource-definition' },
    ],
  },
  {
    id: 'ai-datumx',
    eyebrow: 'AI + DatumX',
    title: 'Why AI and blockchain belong in the same workflow',
    lead: 'The stack is split by responsibility, not hype.',
    paragraphs: [
      [
        { text: 'The AI layer in DatumX is not framed as an oracle that replaces geoscientific judgment. It is framed as an acceleration layer for extraction, structuring, comparison, pattern recognition, and prioritization across large geological record sets.' },
      ],
      [
        { text: 'The blockchain layer solves a different problem: it makes the transformation path reviewable. When a package moves from raw scans to extracted traces, interpreted intervals, composite summaries, and targeting outputs, each step can be anchored with state transitions, validator input, and final release status.' },
      ],
      [
        { text: 'Together, the stack turns AI from a black-box convenience into a governed analytical pipeline. That is the core idea behind DatumX: machine assistance on the front end, explicit trust guarantees on the release path.' },
      ],
    ],
    signalBlock: {
      label: 'System split',
      items: [
        'AI helps compress document-heavy interpretation work',
        'Validators supply human review and disagreement handling',
        'Onchain lineage preserves release history instead of relying on informal process memory',
      ],
    },
    references: [
      { label: 'USGS on AI support for critical mineral assessments', href: 'https://www.usgs.gov/news/featured-story/collaborative-workshop-spotlights-machine-learning-accelerate-usgs-critical' },
      { label: 'Scientific Reports: mineral prospectivity prediction with CNN and ensemble learning', href: 'https://www.nature.com/articles/s41598-024-73357-0' },
      { label: 'USGS training data release for AI critical mineral assessment', href: 'https://www.usgs.gov/data/training-and-validation-data-ai-critical-mineral-assessment-competition' },
    ],
  },
  {
    id: 'scientific-value',
    eyebrow: 'Why This Matters Scientifically',
    title: 'Scientific rigor as workflow design',
    lead: 'This is really a workflow argument about accountable interpretation.',
    paragraphs: [
      [
        { text: 'DatumX matters scientifically because it treats interpretation as a chain of accountable transformations rather than a single opaque result. That is useful anywhere outputs can drift away from the evidence that produced them.' },
      ],
      [
        { text: 'The staged ' },
        { text: 'lineage', highlight: true },
        { text: ' model mirrors how technical work actually matures: raw source, extracted traces, interpreted intervals, composite summaries, and targeting packages. Each stage narrows ambiguity, but each stage also introduces judgment.' },
      ],
      [
        { text: 'For research and technical teams, that means better reproducibility, stronger provenance, clearer validation boundaries, and fewer undocumented jumps between source evidence and decision-ready outputs.' },
      ],
    ],
    signalBlock: {
      label: 'Scientific payoff',
      items: [
        'Reproducibility improves when transformation steps are explicit',
        'Provenance improves when parent-child lineage is anchored and queryable',
        'Release discipline improves when validator quorum and finalization are part of the protocol rather than informal process',
      ],
    },
    references: [
      { label: 'USGS: machine learning for natural resource assessment', href: 'https://www.usgs.gov/publications/machine-learning-natural-resource-assessment-application-blind-geothermal-systems' },
      { label: 'MDPI: machine learning applications in mineral resource estimation', href: 'https://www.mdpi.com/1996-1073/14/14/4079' },
    ],
  },
  {
    id: 'interview-framing',
    eyebrow: 'Interview / Employer Framing',
    title: 'Why this project is strong evidence of blockchain engineering depth',
    lead: 'The strongest employer story is that this is a real system, not a concept deck.',
    paragraphs: [
      [
        { text: 'For interview purposes, DatumX is compelling because it is not a toy token project. It is a live protocol and product system that had to reconcile contract design, state modeling, chain-specific execution behavior, frontend truthfulness, and domain-specific workflow integrity.' },
      ],
      [
        { text: 'The strongest story is that the protocol was deployed on ' },
        { text: 'XRPL EVM', highlight: true },
        { text: ' testnet, exercised with real ' },
        { text: 'validator quorum', highlight: true },
        { text: ', and then iterated when a chain-specific runtime issue appeared in the adapter normalization path. The fix was architectural, not cosmetic.' },
      ],
      [
        { text: 'That makes this project a credible example of systems thinking: protocol design under real constraints, data lineage modeling, wallet and transaction UX, deployment discipline, and a strong bias toward making the interface tell the truth about live state.' },
      ],
    ],
    signalBlock: {
      label: 'Employer signal',
      items: [
        'Shows protocol engineering beyond standard DeFi patterns',
        'Demonstrates live deployment, debugging, and redeployment discipline',
        'Connects product design, data systems, and blockchain trust guarantees in one build',
      ],
    },
    references: [
      { label: 'XRPL EVM docs: network configuration', href: 'https://docs.xrplevm.org/pages/operators/resources/networks' },
      { label: 'XRPL EVM docs: MetaMask connection', href: 'https://docs.xrplevm.org/pages/users/getting-started/connect-to-the-xrpl-evm' },
    ],
  },
]
