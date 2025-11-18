const ALLOWED_HOSTS = [
  /\.trello\.com$/i,
  /\.trello\.net$/i,
  /\.amazonaws\.com$/i
];

const MAX_BYTES = 40 * 1024 * 1024; // 40 MB

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url query param' });
    return;
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    res.status(400).json({ error: 'Invalid url' });
    return;
  }

  if (parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'Only https targets are supported' });
    return;
  }

  const isAllowedHost = ALLOWED_HOSTS.some((regex) => regex.test(parsed.hostname));
  if (!isAllowedHost) {
    res.status(403).json({ error: 'Blocked host' });
    return;
  }

  const trelloKey = process.env.TRELLO_API_KEY;
  const trelloToken = process.env.TRELLO_TOKEN;
  if (trelloKey && trelloToken && /trello\.(com|net)$/i.test(parsed.hostname)) {
    parsed.searchParams.set('key', trelloKey);
    parsed.searchParams.set('token', trelloToken);
  }

  try {
    const upstream = await fetch(parsed, {
      headers: {
        'User-Agent': 'Trello-Excel-Viewer-Power-Up/1.0'
      }
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: 'Upstream request failed',
        statusText: upstream.statusText
      });
      return;
    }

    const lengthHeader = upstream.headers.get('content-length');
    if (lengthHeader && Number(lengthHeader) > MAX_BYTES) {
      res.status(413).json({ error: 'Attachment too large (max 40MB)' });
      return;
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength > MAX_BYTES) {
      res.status(413).json({ error: 'Attachment too large (max 40MB)' });
      return;
    }

    res.setHeader('Cache-Control', 'private, max-age=60');
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);

    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', detail: err.message });
  }
}
