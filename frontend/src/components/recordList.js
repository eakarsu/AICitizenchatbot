// API collections may be returned directly or inside a paginated envelope.
export function recordList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object' || payload.success === false) return [];
  const candidates = [payload.data, payload.items, payload.records, key && payload[key]];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      for (const nested of [candidate.items, candidate.records, key && candidate[key], candidate.data]) {
        if (Array.isArray(nested)) return nested;
      }
    }
  }
  return [];
}
