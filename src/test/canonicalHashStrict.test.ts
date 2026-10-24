import { describe, expect, it } from 'vitest'
import { canonicalJsonStringify } from '../lib/canonicalHash'

describe('canonical JSON strictness', () => {
  it('rejects undefined instead of committing invalid JSON', () => {
    expect(() => canonicalJsonStringify({ invalid: undefined })).toThrow()
    expect(() => canonicalJsonStringify([undefined])).toThrow()
  })

  it('rejects non-finite numeric values rather than silently turning them into null', () => {
    expect(() => canonicalJsonStringify({ reading: Infinity })).toThrow()
    expect(() => canonicalJsonStringify({ reading: NaN })).toThrow()
  })

  it('rejects lone UTF-16 surrogates (RFC 8785)', () => {
    expect(() => canonicalJsonStringify({ label: '\uD800' })).toThrow()
    expect(() => canonicalJsonStringify({ '\uDC00': 'invalid key' })).toThrow()
  })

  it('retains normalized numbers, nested sorting, and valid astral Unicode', () => {
    expect(canonicalJsonStringify({ z: -0, a: 1e-7, nested: { y: 2, x: 1 } }))
      .toBe('{"a":1e-7,"nested":{"x":1,"y":2},"z":0}')
    expect(canonicalJsonStringify({ emoji: '🛰️' })).toBe('{"emoji":"🛰️"}')
  })
})
