const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit = Number(process.env.RATE_LIMIT_PER_MINUTE || 20)
) {
  const now = Date.now();
  const existing = requests.get(key);

  if (!existing || now > existing.resetAt) {
    requests.set(key, {
      count: 1,
      resetAt: now + 60_000,
    });

    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
    }
