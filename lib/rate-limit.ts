type Bucket = { tokens: number; last: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const b = buckets.get(key) || { tokens: max, last: now }
  const elapsed = now - b.last
  if (elapsed > windowMs) {
    b.tokens = max
    b.last = now
  }
  if (b.tokens <= 0) {
    buckets.set(key, b)
    return { allowed: false, remaining: 0, resetMs: windowMs - (now - b.last) }
  }
  b.tokens -= 1
  buckets.set(key, b)
  return { allowed: true, remaining: b.tokens, resetMs: windowMs - (now - b.last) }
}
