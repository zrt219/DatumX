/**
 * Canonical JSON serializer and SHA-256 computation utility.
 * Normalizes object key ordering recursively to guarantee deterministic content hashing.
 */

export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJsonStringify(item)).join(',') + ']'
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort()
  const keyValues = sortedKeys.map((key) => {
    const val = (obj as Record<string, unknown>)[key]
    return JSON.stringify(key) + ':' + canonicalJsonStringify(val)
  })

  return '{' + keyValues.join(',') + '}'
}

export async function computeSha256Hex(content: string): Promise<`0x${string}`> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `0x${hashHex}`
}
