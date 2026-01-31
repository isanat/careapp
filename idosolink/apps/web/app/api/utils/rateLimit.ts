const hits = new Map<string, { count: number; last: number }>();

export const rateLimit = (key: string, limit = 10, windowMs = 60_000) => {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.last > windowMs) {
    hits.set(key, { count: 1, last: now });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count += 1;
  entry.last = now;
  hits.set(key, entry);
  return false;
};
