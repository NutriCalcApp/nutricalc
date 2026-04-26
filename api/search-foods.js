export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { type, code, q, lang } = req.query;

  // ── BARCODE LOOKUP ──────────────────────────────────────────────
  if (type === "barcode") {
    if (!code) { res.status(400).json({ error: "Missing code" }); return; }
    try {
      const fields = "product_name,product_name_it,product_name_en,brands,nutriments,nutriscore_grade,nutrition_grade_fr,code";
      const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json?fields=${fields}`;
      const r = await fetch(url, {
        headers: { "User-Agent": "NutriCalc/1.0 (contact@nutricalc.app)" }
      });
      const d = await r.json();
      res.status(200).json(d);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  // ── TEXT SEARCH ─────────────────────────────────────────────────
  if (type === "text") {
    if (!q || q.trim().length < 2) { res.status(400).json({ results: [] }); return; }

    const locale = lang === "en" ? "world" : "it";
    const fields = "product_name,product_name_it,product_name_en,brands,nutriments,nutriscore_grade,nutrition_grade_fr,code";

    // Prova prima con locale italiano, poi world come fallback
    const urls = [
      `https://${locale}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15&fields=${fields}`,
      locale !== "world"
        ? `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15&fields=${fields}`
        : null,
    ].filter(Boolean);

    let products = [];
    for (const url of urls) {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": "NutriCalc/1.0 (contact@nutricalc.app)" },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) continue;
        const d = await r.json();
        if (d.products && d.products.length > 0) {
          products = d.products;
          break;
        }
      } catch { continue; }
    }

    res.status(200).json({ products });
    return;
  }

  res.status(400).json({ error: "Unknown type" });
}
