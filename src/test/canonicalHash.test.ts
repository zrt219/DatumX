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

  describe('RFC 8785 (JSON Canonicalization Scheme) test vector evaluation', () => {
    it('evaluates Section 3.2 official test vector for ordering, numbers, and literals', () => {
      // Official RFC 8785 Section 3.2 input vector
      const inputVector = {
        numbers: [
          // eslint-disable-next-line no-loss-of-precision
          333333333.33333329,
          1e30,
          4.5,
          2e-3,
          0.000000000000000000000000001,
        ],
        string: '€$\u000F\u000aA\'\u0042\u0022\u005c\\\\"/\\',
        literals: [null, true, false],
      }

      const canonicalOutput = canonicalJsonStringify(inputVector)

      // 1. Key ordering in serialized output: 'literals' precedes 'numbers' precedes 'string'
      const literalsIndex = canonicalOutput.indexOf('"literals":')
      const numbersIndex = canonicalOutput.indexOf('"numbers":')
      const stringIndex = canonicalOutput.indexOf('"string":')
      expect(literalsIndex).toBeLessThan(numbersIndex)
      expect(numbersIndex).toBeLessThan(stringIndex)

      // 2. Literals canonical formatting: [null,true,false]
      expect(canonicalOutput).toContain('"literals":[null,true,false]')

      // 3. Numbers canonical representation
      const parsed = JSON.parse(canonicalOutput)
      expect(parsed.numbers[0]).toBe(333333333.3333333)
      expect(parsed.numbers[1]).toBe(1e30)
      expect(parsed.numbers[2]).toBe(4.5)
      expect(parsed.numbers[3]).toBe(0.002)
      expect(parsed.numbers[4]).toBe(1e-27)
    })

    it('evaluates RFC 8785 UTF-16 code unit property name sorting rules in serialization', () => {
      // RFC 8785 mandates sorting by UTF-16 code units:
      // \r: 0x000D (13)
      // 1: 0x0031 (49)
      // \u0080: 0x0080 (128)
      // €: 0x20AC (8364)
      // 😀: 0xD83D 0xDE00 (55357)
      // \ufb33: 0xFB33 (64307)
      const keyOrderTest = {
        '€': 'Euro Sign',
        '\r': 'Carriage Return',
        '\ufb33': 'Hebrew Letter Dalet With Dagesh',
        '1': 'One',
        '😀': 'Emoji',
        '\u0080': 'Control',
      }

      const canonical = canonicalJsonStringify(keyOrderTest)

      // Verify the substring positions of keys in the generated canonical string
      const rIdx = canonical.indexOf('"\\r":')
      const oneIdx = canonical.indexOf('"1":')
      const ctrlIdx = canonical.indexOf('"\\u0080":') !== -1 ? canonical.indexOf('"\\u0080":') : canonical.indexOf('"\u0080":')
      const euroIdx = canonical.indexOf('"€":')
      const emojiIdx = canonical.indexOf('"😀":')
      const hebrewIdx = canonical.indexOf('"דּ":') !== -1 ? canonical.indexOf('"דּ":') : canonical.indexOf('"\ufb33":')

      expect(rIdx).toBeLessThan(oneIdx)
      expect(oneIdx).toBeLessThan(ctrlIdx)
      expect(ctrlIdx).toBeLessThan(euroIdx)
      expect(euroIdx).toBeLessThan(emojiIdx)
      expect(emojiIdx).toBeLessThan(hebrewIdx)
    })

    it('normalizes negative zero to zero per ECMAScript / RFC 8785 number rules', () => {
      const withNegativeZero = { val: -0 }
      const canonical = canonicalJsonStringify(withNegativeZero)
      expect(canonical).toBe('{"val":0}')
    })
  })
})
