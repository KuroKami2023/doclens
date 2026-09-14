// GET /api/health — unauthenticated liveness check (no secrets leaked).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed. Use GET.' }));
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      service: 'doclens-ai',
      time: new Date().toISOString(),
      nvidiaConfigured: Boolean(process.env.NVIDIA_API_KEY),
      model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    })
  );
}
