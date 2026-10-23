/**
 * Reject non-JSON input and invalid Unicode before hashing any dataset.
 * Stable key sorting follows UTF-16 code unit order.
 */
function assertJsonValue(value: unknown, ancestors: Set<object> = new Set()): void {
  if (value === null || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite JSON number is not canonical.')
    return
  }
  if (typeof value === 'string') {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      if (code >= 0xd800 && code <= 0xdbff) {
        const low = value.charCodeAt(i + 1)
        if (!(low >= 0xdc00 && low <= 0xdfff)) throw new Error('Invalid lone UTF-16 surrogate.')
        i++
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        throw new Error('Invalid lone UTF-16 surrogate.')
      }
    }
    return
  }
  if (typeof value !== 'object' || value === undefined) throw new Error('Only JSON values can be hashed.')
  if (ancestors.has(value)) throw new Error('Circular JSON input is not canonical.')
  ancestors.add(value)
  if (Array.isArray(value)) {
    for (const item of value) assertJsonValue(item, ancestors)
  } else {
    for (const [key, item] of Object.entries(value)) {
      assertJsonValue(key, ancestors)
      assertJsonValue(item, ancestors)
    }
  }
  ancestors.delete(value)
}

function encodeJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(encodeJson).join(',') + ']'
  const object = value as Record<string, unknown>
  return '{' + Object.keys(object).sort().map(key => JSON.stringify(key) + ':' + encodeJson(object[key])).join(',') + '}'
}

export function canonicalJsonStringify(obj: unknown): string {
  assertJsonValue(obj)
  return encodeJson(obj)
}

export async function computeSha256Hex(content: string): Promise<`0x${string}`> {
  const data = new TextEncoder().encode(content)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return `0x${Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')}`
}
