// In-memory sliding-window rate limiter for Vercel serverless functions.
// NOTE: On serverless, each isolate has its own memory, so this is a
// best-effort per-instance guard, not a global counter. It still blocks
// burst abuse and is documented as such in SECURITY.md.
// For strict global limits, put a Supabase/Upstash counter here instead —
/// but this app uses zero paid services, so local limiting is the default.

const buckets = new Map(); // key -> array of epoch-ms timestamps

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) return real.trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {{ windowMs?: number, max?: number, keyPrefix?: string }} [opts]
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec: number }}
 */
export function checkRateLimit(req, opts = {}) {
  const windowMs = opts.windowMs ?? 60_000; // 1 minute
  const max = opts.max ?? 20; // 20 analyze calls / min / IP
  const ip = getClientIp(req);
  const key = `${opts.keyPrefix ?? 'rl'}:${ip}`;
  const now = Date.now();

  const prev = buckets.get(key) || [];
  const fresh = prev.filter((t) => now - t < windowMs);
  if (fresh.length >= max) {
    const oldest = fresh[0];
    const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
    buckets.set(key, fresh);
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return { allowed: true, remaining: max - fresh.length, retryAfterSec: 0 };
}
