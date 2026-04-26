// api/search-foods.js
// - Ricerca testuale: API Ninjas (nessun blocco IP, gratuita)
// - Barcode: Open Food Facts API v0

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

  try {
    // RICERCA TESTUALE: API Ninjas
    if (type === 'search' && query) {
      const apiKey = process.env.API_NINJAS_KEY;
      if (!apiKey) return res.status(500).json({ error: 'API_NINJAS_KEY not configured' });

      const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;
      const r = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
      if (!r.ok) throw new Error('API Ninjas HTTP ' + r.status);
      const items = await r.json();
      return res.status(200).json({ items });
    }

    // BARCODE: Open Food Facts
    if (type === 'barcode' && code) {
      const fields = 'product_name,product_name_it,nutriments,brands,code,nutriscore_grade,nutrition_grade_fr';
      const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json?fields=${fields}`;
      const r = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'NutriCalc/1.0' },
      });
      const d = await r.json();
      return res.status(200).json(d);
    }

    return res.status(400).json({ error: 'Missing type or query/code' });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
