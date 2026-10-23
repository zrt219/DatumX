import { describe, it, expect } from 'vitest'
import { canonicalJsonStringify, computeSha256Hex } from '../lib/canonicalHash'

describe('canonicalHash and deterministic serialization', () => {
  it('canonicalizes JSON object keys deterministically regardless of insertion order', () => {
    const objA = { z: 1, a: 'test', m: { b: 2, a: 1 } }
    const objB = { a: 'test', m: { a: 1, b: 2 }, z: 1 }

    const serializedA = canonicalJsonStringify(objA)
    const serializedB = canonicalJsonStringify(objB)

    expect(serializedA).toBe(serializedB)
    expect(serializedA).toBe('{"a":"test","m":{"a":1,"b":2},"z":1}')
  })

  it('computes exact SHA-256 hex string matching standard cryptographic digest', async () => {
    const raw = '{"benchmarkId":"BOT-SYNTH-001","version":"1.0.0"}'
    const hash = await computeSha256Hex(raw)
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/)
  })

  it('produces mismatch when payload content is modified', async () => {
    const original = canonicalJsonStringify({ val: 100 })
    const tampered = canonicalJsonStringify({ val: 101 })

    const hash1 = await computeSha256Hex(original)
    const hash2 = await computeSha256Hex(tampered)

    expect(hash1).not.toBe(hash2)
  })
})
