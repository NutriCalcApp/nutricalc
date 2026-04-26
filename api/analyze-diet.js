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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { base64, mealNames } = req.body || {};
  if (!base64) return res.status(400).json({ error: 'No PDF data in request' });

  console.log('PDF received, base64 length:', base64.length);

  const slotsRaw = mealNames || 'Colazione, Pranzo, Cena';
  const slots = slotsRaw.split(',').map(s => s.trim());

  const slotColazione   = slots.find(s => s.toLowerCase().includes('colazione'))   || 'Colazione';
  const slotSpMattina   = slots.find(s => s.toLowerCase().includes('mattina'))     || null;
  const slotPranzo      = slots.find(s => s.toLowerCase().includes('pranzo'))      || 'Pranzo';
  const slotSpPomeriggio= slots.find(s => s.toLowerCase().includes('pomeriggio'))  || slots.find(s => s.toLowerCase().includes('spuntino')) || null;
  const slotSpuntino    = slots.find(s => s.toLowerCase().includes('spuntino') && !s.toLowerCase().includes('mattina') && !s.toLowerCase().includes('pomeriggio')) || null;
  const slotCena        = slots.find(s => s.toLowerCase().includes('cena'))        || 'Cena';

  const mappingLines = [
    `- colazione / breakfast / prima colazione / mattina → "${slotColazione}"`,
    slotSpMattina ? `- spuntino mattina / merenda mattina / mid-morning / 2a colazione → "${slotSpMattina}"` : null,
    `- pranzo / lunch / mezzogiorno → "${slotPranzo}"`,
    (slotSpPomeriggio || slotSpuntino) ? `- spuntino / spuntino pomeriggio / merenda / snack / pomeridiano / metà pomeriggio → "${slotSpPomeriggio || slotSpuntino}"` : null,
    `- cena / dinner / pasto serale → "${slotCena}"`,
  ].filter(Boolean).join('\n');

  const prompt = `Sei un nutrizionista digitale. Analizza questo PDF di dieta.

SLOT PASTO DISPONIBILI NELL'APP: [${slots.join(', ')}]

REGOLA CRITICA: usa ESATTAMENTE i nomi degli slot come chiavi JSON. Mappatura:
${mappingLines}

REGOLA OBBLIGATORIA: ogni giorno deve contenere TUTTI gli slot: [${slots.join(', ')}].
Se un pasto non è presente nel PDF, inserisci un array vuoto [] per quello slot.
Non omettere MAI nessuno slot dalla risposta.

RILEVA SE IL PDF CONTIENE PIÙ GIORNI:
- Se vedi giorni diversi (Lunedì/Martedì, Giorno 1/2, settimana...) → tipo "multi"
- Se è un solo giorno o non è chiaro → tipo "single"

REGOLA VALORI NUTRIZIONALI:
"cal", "p", "c", "f" devono essere per la quantità specificata in "quantity", NON per 100g.
Esempio: petto di pollo 150g → quantity:150, cal:248, p:47, c:0, f:5

Rispondi SOLO con JSON valido. NIENTE backtick, NIENTE markdown, NIENTE testo prima o dopo. Solo il JSON grezzo.

Formato SINGLE:
{"type":"single","summary":"desc breve","days":[{"label":"Giorno 1","meals":{"NomeSlotEsatto":[{"name":"alimento","quantity":100,"cal":150,"p":20,"c":5,"f":3,"emoji":"🍗","unit":"g"}]}}]}

Formato MULTI:
{"type":"multi","summary":"desc breve","days":[{"label":"Lunedì","meals":{...}},{"label":"Martedì","meals":{...}}]}

Stima i valori nutrizionali se non indicati nel PDF. Usa emoji appropriate.`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    console.log('Anthropic status:', anthropicRes.status);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic error status:', anthropicRes.status, 'body:', errText);
      return res.status(anthropicRes.status).json({ error: 'Anthropic error: ' + errText.slice(0, 300) });
    }

    const data = await anthropicRes.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    console.log('stop_reason:', data.stop_reason, '| response length:', text.length);
    console.log('Claude raw response start:', text.slice(0, 300));
    if (data.stop_reason === 'max_tokens') {
      console.error('TRUNCATED - increase max_tokens. Response length:', text.length);
    }

    // Strip markdown code blocks if present
    let cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Extract first complete JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: 'No JSON in Claude response', raw: text.slice(0, 300) });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse failed. Raw text:', text.slice(0, 800));
      return res.status(422).json({ error: 'JSON parse failed: ' + e.message, raw: text.slice(0, 300) });
    }

    // Compatibilità con vecchio formato {meals:{}}
    if (!parsed.days && parsed.meals && typeof parsed.meals === 'object') {
      parsed = {
        type: 'single',
        summary: parsed.summary || '',
        days: [{ label: 'Giorno 1', meals: parsed.meals }],
      };
    }

    if (!parsed.days || !parsed.days.length) {
      return res.status(422).json({ error: 'Missing days in response' });
    }

    // POST-NORMALIZZAZIONE: forza la presenza di tutti gli slot attesi in ogni giorno.
    // Claude spesso omette spuntini anche con istruzioni esplicite.
    // 1. Raccoglie tutti i nomi slot unici presenti nella risposta
    // 2. Per ogni slot atteso mancante, prova match fuzzy (es. "Spuntino" vs "Spuntino pomeriggio")
    // 3. Se non trova match, inserisce array vuoto
    parsed.days = parsed.days.map(day => {
      const meals = { ...(day.meals || {}) };
      slots.forEach(expectedSlot => {
        if (meals[expectedSlot] !== undefined) return;
        // match fuzzy case-insensitive
        const fuzzyKey = Object.keys(meals).find(k => {
          const kl = k.toLowerCase().trim();
          const el = expectedSlot.toLowerCase().trim();
          return kl === el || kl.includes(el) || el.includes(kl);
        });
        if (fuzzyKey && fuzzyKey !== expectedSlot) {
          meals[expectedSlot] = meals[fuzzyKey];
          delete meals[fuzzyKey];
        } else if (!fuzzyKey) {
          meals[expectedSlot] = [];
        }
      });
      return { ...day, meals };
    });

    console.log('Success, type:', parsed.type, 'days:', parsed.days.length, 'slots per day:', Object.keys(parsed.days[0]?.meals || {}).join(', '));
    return res.status(200).json(parsed);

  } catch (e) {
    console.error('Handler error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
