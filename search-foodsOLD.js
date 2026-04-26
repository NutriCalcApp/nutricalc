// api/search-foods.js - proxy Vercel che chiama il Cloudflare Worker
// Il Worker gestisce le credenziali OFF e ha IP non bloccati da OFF

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
    maxDuration: 30,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, query, code } = req.method === 'POST' ? req.body : req.query;

  // URL del Cloudflare Worker - salvato come variabile d'ambiente su Vercel
  const workerUrl = process.env.CF_WORKER_URL;

  if (!workerUrl) {
    return res.status(500).json({ error: 'CF_WORKER_URL not configured' });
  }

  try {
    let url;
    if (type === 'search' && query) {
      url = `${workerUrl}?type=search&query=${encodeURIComponent(query)}`;
    } else if (type === 'barcode' && code) {
      url = `${workerUrl}?type=barcode&code=${encodeURIComponent(code)}`;
    } else {
      return res.status(400).json({ error: 'Missing type or query/code' });
    }

    const r = await fetch(url);
    const d = await r.json();
    return res.status(200).json(d);

  } catch (e) {
    console.error('search-foods error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
