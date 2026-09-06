/**
 * Translate the text a contractor typed on an estimate or invoice.
 *
 * The interface itself is translated from static dictionaries (src/i18n) —
 * free, instant, offline. This endpoint exists only for the part that cannot
 * be known ahead of time: the line items and notes the contractor writes
 * himself. He types in Spanish, taps translate, and gets the professional
 * English his client will read (or the reverse).
 *
 * Requires ANTHROPIC_API_KEY in the Vercel environment. Without it the route
 * answers 503 with a plain reason instead of pretending to work — the same
 * lesson as the Resend key.
 */
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const MODEL = 'claude-opus-5';

// No server-side refusal fallback here on purpose: translating construction
// line items never trips a safety classifier, and an extra beta parameter is
// one more thing that can 400 in a contractor's hand on a job site.

const Body = z.object({
  direction: z.enum(['es-en', 'en-es']),
  projectName: z.string().max(200).optional(),
  items: z.array(z.object({
    id: z.string().max(120),
    text: z.string().max(4000),
  })).min(1).max(60),
});

const Out = z.object({
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })),
});

const GUIDE = {
  'es-en': {
    from: 'Spanish',
    to: 'English',
    extra:
      'The reader is an English-speaking homeowner or property manager in the United States. ' +
      'Use the words a licensed American contractor would write on a professional estimate ' +
      '(for example: drywall, baseboard, primer, two coats, prep, punch list, crown moulding).',
  },
  'en-es': {
    from: 'English',
    to: 'Spanish',
    extra:
      'The reader is a Spanish-speaking client or crew in the United States. Use neutral Latin ' +
      'American Spanish that a worker from Mexico, Central America or the Caribbean would all ' +
      'read comfortably. Prefer widely understood trade terms over any one country\'s slang.',
  },
};

const SYSTEM = (g) =>
  `You translate construction estimate and invoice line items from ${g.from} into ${g.to}.

${g.extra}

Rules:
- Translate the meaning, not word by word. The result must read like a tradesperson wrote it, not like software translated it.
- Keep it the same length or shorter. These are line items on a document, not paragraphs.
- Never add work, materials, warranties, timelines or conditions that are not in the original. Never remove any either.
- Leave numbers, measurements, dimensions and units exactly as they are. Convert nothing.
- Leave proper nouns alone: brand and product names (Sherwin-Williams, Duration, Hardie), company names, street names, people's names.
- If a line is already in ${g.to}, return it unchanged apart from fixing obvious spelling.
- Do not add quotes, labels, bullet points or commentary. Return only the translated text for each item.
- Return every item you were given, with its id unchanged.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'not_configured',
      message: 'Translation is not switched on yet. Add ANTHROPIC_API_KEY in Vercel and redeploy.',
    });
    return;
  }

  let body;
  try {
    body = Body.parse(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
  } catch (e) {
    res.status(400).json({ error: 'bad_request', message: 'Nothing to translate.' });
    return;
  }

  const guide = GUIDE[body.direction];
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM(guide),
      // Translation is a transformation, not a reasoning problem: medium keeps
      // it quick for someone standing in a driveway. Raise it if quality slips.
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(Out, 'translated_items'),
      },
      messages: [{
        role: 'user',
        content:
          (body.projectName ? `Project: ${body.projectName}\n\n` : '') +
          `Translate these ${body.items.length} item(s):\n\n` +
          JSON.stringify(body.items, null, 2),
      }],
    });

    const parsed = response.parsed_output;
    if (!parsed?.items?.length) {
      res.status(502).json({ error: 'no_result', message: 'Translation came back empty. Try again.' });
      return;
    }

    // Only hand back ids we were actually given, so a hallucinated id can
    // never overwrite a line item that was not part of the request.
    const asked = new Set(body.items.map((i) => i.id));
    res.status(200).json({ items: parsed.items.filter((i) => asked.has(i.id)) });
  } catch (err) {
    const status = err?.status;
    if (status === 401 || status === 403) {
      res.status(503).json({ error: 'bad_key', message: 'The translation key was rejected. Check ANTHROPIC_API_KEY in Vercel.' });
      return;
    }
    if (status === 429) {
      res.status(429).json({ error: 'rate_limited', message: 'Too many translations at once. Wait a moment and try again.' });
      return;
    }
    console.error('[translate]', err?.message || err);
    res.status(502).json({ error: 'failed', message: 'Could not translate right now. Try again.' });
  }
}
