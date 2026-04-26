export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
    maxDuration: 60,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { imageBase64, imageType } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'No image data' });

  const mimeType = imageType || 'image/jpeg';
  const lang = req.body.lang || 'it';
  console.log('analyze-photo: mimeType=', mimeType, 'lang=', lang, 'base64 length=', imageBase64.length);

  const prompt = lang === 'en'
    ? `You are a digital nutritionist. Analyze this meal photo and identify all visible foods.

CRITICAL RULE FOR NUTRITIONAL VALUES:
"cal", "p", "c", "f" must be for the quantity specified in "quantity", NOT per 100g.
Correct example: chicken breast 150g → quantity:150, cal:248, p:47, c:0, f:5
Correct example: cooked pasta 200g → quantity:200, cal:260, p:9, c:52, f:1

Estimate quantities in grams based on visible sizes. Include condiments, sauces and oils if visible.
Use English food names.

Reply ONLY with valid JSON, no backticks, no extra text:
{"items":[{"name":"food","quantity":100,"cal":150,"p":20,"c":5,"f":3,"emoji":"🍗","unit":"g"}]}

Use appropriate emojis. For liquids use "ml" as unit.`
    : `Sei un nutrizionista digitale. Analizza questa foto di un pasto e identifica tutti gli alimenti visibili.

REGOLA CRITICA PER I VALORI NUTRIZIONALI:
"cal", "p", "c", "f" devono essere per la quantità specificata in "quantity", NON per 100g.
Esempio corretto: petto di pollo 150g → quantity:150, cal:248, p:47, c:0, f:5
Esempio corretto: pasta 200g cotta → quantity:200, cal:260, p:9, c:52, f:1

Stima le quantità in grammi basandoti sulle dimensioni visibili. Includi condimenti, salse e oli se visibili.

Rispondi SOLO con JSON valido, senza backtick e senza testo aggiuntivo:
{"items":[{"name":"alimento","quantity":100,"cal":150,"p":20,"c":5,"f":3,"emoji":"🍗","unit":"g"}]}

Usa emoji appropriate. Per liquidi usa "ml" come unit.`;

  try {
    const anthropicRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: prompt },
            ],
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Gemini error status:', anthropicRes.status, 'body:', errText);
      return res.status(anthropicRes.status).json({ error: 'Gemini error: ' + errText.slice(0, 300) });
    }

    const data = await anthropicRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Gemini photo response preview:', text.slice(0, 300));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'No JSON in response', preview: text.slice(0, 200) });

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(422).json({ error: 'JSON parse failed: ' + e.message });
    }

    if (!parsed.items || !Array.isArray(parsed.items) || !parsed.items.length) {
      return res.status(422).json({ error: 'No items recognized in photo' });
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error('Handler error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
