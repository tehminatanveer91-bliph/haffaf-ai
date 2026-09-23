const requests = new Map<
  string,
  { count: number; resetAt: number }
>();

export function checkRateLimit(
  key: string,
  limit = 20
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = requests.get(key);

  if (!existing || now > existing.resetAt) {
    requests.set(key, {
      count: 1,
      resetAt: now + 60_000,
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
  };
}
