import { act, renderHook } from '@testing-library/react'
import { useDrillProof } from '../hooks/useDrillProof'

describe('useDrillProof', () => {
  it('loads Shirley Central by default', () => {
    const { result } = renderHook(() => useDrillProof())

    expect(result.current.activeProject.name).toBe('Shirley Central')
    expect(result.current.currentDataset.id).toBe('DS-021')
    expect(result.current.protocolMode).toBe('mock')
  })

  it('filters datasets by project, search, and status', () => {
    const { result } = renderHook(() => useDrillProof())

    act(() => {
      result.current.setProjectSlug('shirley-east')
      result.current.setSearch('DS-102')
      result.current.setStatusFilter('In Review')
    })

    expect(result.current.filteredDatasets).toHaveLength(1)
    expect(result.current.filteredDatasets[0].id).toBe('DS-102')
  })
})
