import { render, screen } from '@testing-library/react'
import App from '../App'
import { datumTagline } from '../content/settingsContent'

describe('App', () => {
  it('renders the resource integrity console shell', async () => {
    render(<App />)

    expect(screen.getAllByRole('img', { name: 'DatumX' }).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Resource Integrity Console')).length).toBeGreaterThan(0)
    expect(await screen.findByText(datumTagline)).toBeInTheDocument()
    expect(await screen.findByText(/Audit, validate, and approve AI-transformed exploration datasets/i)).toBeInTheDocument()
    expect(await screen.findByText('Dataset Lineage Graph')).toBeInTheDocument()
  })
})
