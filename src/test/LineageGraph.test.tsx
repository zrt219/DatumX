import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LineageGraph } from '../components/dashboard/LineageGraph'
import { datasets, projectStories } from '../data/demoData'

describe('LineageGraph', () => {
  it('renders a five-stage vertical pipeline and updates the intelligence panel for Shirley East', async () => {
    const story = projectStories['shirley-east']
    const nodes = datasets.filter((dataset) => story.lineageDatasetIds.includes(dataset.id))

    render(<LineageGraph nodes={nodes} currentDatasetId={story.currentDatasetId} />)

    expect(screen.getByText('Dataset Lineage Graph')).toBeInTheDocument()
    expect(screen.getByText(/Only Stage 1 is currently live onchain|lineage stages are currently live onchain/i)).toBeInTheDocument()
    expect(screen.getByText('Identity and release')).toBeInTheDocument()
    expect(screen.getByText('Validation and metrics')).toBeInTheDocument()
    expect(screen.getByText('Operational context')).toBeInTheDocument()
    expect(screen.getByText('Awaiting composite validation')).toBeInTheDocument()
    expect(screen.getByText('Composite refresh v2')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.hover(screen.getByRole('button', { name: /targeting package pending stage/i }))

    expect(screen.getByText('Targeting Package Awaiting Composite Validation')).toBeInTheDocument()
    expect(screen.getByText('Awaiting submission')).toBeInTheDocument()
    expect(screen.getAllByText('Pending stage').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Awaiting').length).toBeGreaterThan(0)
  })
})
