type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();
let lastSweepAt = 0;

export function simpleRateLimit(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
}) {
  return (req: any, res: any, next: any) => {
    const now = Date.now();

    // Evita que IPs antiguas queden acumuladas para siempre en memoria.
    if (now - lastSweepAt >= Math.min(options.windowMs, 60_000)) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
      lastSweepAt = now;
    }

    const key = `${options.keyPrefix}:${req.ip}`;
    const entry = buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    entry.count += 1;
    if (entry.count > options.max) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }

    next();
  };
}
