/**
 * Quote Check — a real contractor's read of a homeowner's quote, for $79.
 *
 * Flow: the homeowner uploads the quote (photo or PDF) with a ZIP and a line
 * about the job. We read it straight away and store the full review; the page
 * shows a locked preview (verdict + how many flags) so they know it is real,
 * Stripe takes $79, and the result page unlocks the full review and emails it.
 *
 * Nothing here needs a migration. Everything lives in one private Supabase
 * Storage bucket (`quotecheck`): <id>/quote.<ext> and <id>/review.json.
 *
 * Env: ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *      RESEND_API_KEY (the review email). All already in Vercel.
 */
import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';
import { randomBytes } from 'node:crypto';
import { admin, SITE_URL } from './annual.js';

export const BUCKET = 'quotecheck';
export const PRICE_CENTS = 7900;
export const MODEL = 'claude-opus-5';
export const PAGE = `${SITE_URL}/quote-check`;

export const newId = () => randomBytes(12).toString('hex');

let bucketReady = false;
export async function ensureBucket() {
  if (bucketReady) return;
  const { error } = await admin().storage.createBucket(BUCKET, { public: false, fileSizeLimit: '8MB' });
  // "already exists" is the normal case after the first upload ever.
  if (error && !/exist|duplicate/i.test(error.message || '')) throw new Error('bucket: ' + error.message);
  bucketReady = true;
}

export async function putFile(path, body, contentType) {
  await ensureBucket();
  const { error } = await admin().storage.from(BUCKET).upload(path, body, { contentType, upsert: true });
  if (error) throw new Error('upload: ' + error.message);
}

export async function getJson(path) {
  const { data, error } = await admin().storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try { return JSON.parse(await data.text()); } catch { return null; }
}

export const putJson = (path, obj) => putFile(path, Buffer.from(JSON.stringify(obj)), 'application/json');

export async function loadReview(id) {
  if (!/^[a-f0-9]{24}$/.test(String(id || ''))) return null;
  return getJson(`${id}/review.json`);
}

export const saveReview = (id, review) => putJson(`${id}/review.json`, review);

/* ---------- the review itself ---------- */

const OUT_SCHEMA = {
  type: 'object',
  properties: {
    readable: { type: 'boolean', description: 'false if the upload is not a contractor quote or cannot be read' },
    unreadableReason: { type: 'string' },
    trade: { type: 'string', description: 'e.g. Roofing, HVAC, Kitchen remodel' },
    contractorName: { type: 'string' },
    jobSummary: { type: 'string', description: 'one plain sentence of what is being quoted' },
    totalQuoted: { type: 'number', description: 'the quote total in dollars, 0 if none printed' },
    verdict: { type: 'string', enum: ['fair', 'high', 'very_high', 'low', 'unclear'] },
    headline: { type: 'string', description: 'one blunt sentence, the whole verdict in one line' },
    fairRange: {
      type: 'object',
      properties: {
        low: { type: 'number' }, high: { type: 'number' },
        basis: { type: 'string', description: 'how the range was built, in one or two sentences' },
      },
      required: ['low', 'high', 'basis'], additionalProperties: false,
    },
    lines: {
      type: 'array',
      description: 'every line or section of the quote, in order',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string' },
          quoted: { type: 'string', description: 'the price as printed, or "not itemized"' },
          status: { type: 'string', enum: ['fair', 'watch', 'high', 'missing_detail'] },
          note: { type: 'string', description: 'one or two sentences a contractor would say about this line' },
        },
        required: ['item', 'quoted', 'status', 'note'], additionalProperties: false,
      },
    },
    missing: { type: 'array', items: { type: 'string' }, description: 'things a proper quote for this job should include and this one does not' },
    redFlags: { type: 'array', items: { type: 'string' }, description: 'contract terms, payment schedule, vague scope, anything that should worry them' },
    questions: { type: 'array', items: { type: 'string' }, description: 'exact questions to ask the contractor, in the homeowner\'s voice' },
    sayThis: { type: 'string', description: 'a short script, 2-4 sentences, the homeowner can say or text to the contractor to negotiate or clarify' },
    bottomLine: { type: 'string', description: 'sign it, negotiate it, or walk, and why, in 2-3 sentences' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['readable', 'unreadableReason', 'trade', 'contractorName', 'jobSummary', 'totalQuoted', 'verdict', 'headline', 'fairRange', 'lines', 'missing', 'redFlags', 'questions', 'sayThis', 'bottomLine', 'confidence'],
  additionalProperties: false,
};

const SYSTEM = `You are Quote Check: a licensed general contractor with over twenty years in residential construction in the United States, reading a homeowner's quote before they sign it. You have priced thousands of jobs and seen every way a quote gets padded, and every way a cheap quote hides a problem.

The homeowner has paid for a straight answer. Write the way an honest contractor talks to a friend at the kitchen table: plain, specific, no hedging, no lecture. Short sentences. Dollar figures wherever you can put one.

What you do:
1. Read every line of the quote. If the quote is a lump sum, say so and judge the total against the scope.
2. Judge each line against what this work normally costs in the homeowner's area right now (use the ZIP for regional labor and material rates; say what region you assumed). "fair" = within the normal range. "watch" = on the high side or vague. "high" = clearly padded. "missing_detail" = you cannot judge it because the quote does not say enough.
3. Build a fair range for the whole job from the scope as written, and say how you got there.
4. List what a proper quote for this job should include and this one does not (permits, disposal, materials spec, warranty, start and finish dates, payment schedule, change-order terms, licence and insurance).
5. Red flags: more than a third down, cash discounts, no licence number, "materials TBD", pressure to sign today, no written warranty.
6. Give them the exact questions to ask and a short script they can say or text to the contractor.
7. Bottom line: sign, negotiate, get another bid, or walk.

Rules:
- Never invent a number that is not on the quote. When the quote does not itemize, say "not itemized" and judge the total.
- Ranges, not false precision. A range is honest; a single number is a guess dressed up.
- A low quote is not good news by default. Say what usually gets cut to get there.
- Do not call the contractor a crook. A high number is a high number; say it and move on.
- If the upload is not a construction or home-services quote, or is unreadable, set readable=false and say why in one sentence.
- Write for a nervous homeowner, not a contractor. Explain a trade word the first time you use it.
- Sentence case. No exclamation marks.`;

/**
 * Run the review. `file` is { base64, mediaType } — image/jpeg, image/png,
 * image/webp or application/pdf. Returns the parsed review object.
 */
export async function reviewQuote({ file, zip, about, homeownerNotes }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const block = file.mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.base64 } }
    : { type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.base64 } };

  const context = [
    zip ? `Homeowner ZIP code: ${zip}` : 'Homeowner ZIP code: not given (assume US national average and say so)',
    about ? `The job, in the homeowner's words: ${about}` : '',
    homeownerNotes ? `What worries them: ${homeownerNotes}` : '',
    `Today's date: ${new Date().toISOString().slice(0, 10)}`,
  ].filter(Boolean).join('\n');

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 6000,
    system: SYSTEM,
    output_config: { effort: 'high', format: jsonSchemaOutputFormat(OUT_SCHEMA) },
    messages: [{ role: 'user', content: [block, { type: 'text', text: `${context}\n\nRead this quote and give me the review.` }] }],
  });
  const out = response.parsed_output;
  if (!out) throw new Error('empty review');
  return out;
}

/** What the page shows before payment: enough to prove it is real, not enough to act on. */
export function teaserOf(review) {
  const r = review.result;
  if (!r || !r.readable) return { readable: false, reason: r?.unreadableReason || 'Could not read the quote.' };
  const flags = r.lines.filter(l => l.status === 'high' || l.status === 'watch').length;
  return {
    readable: true,
    trade: r.trade,
    jobSummary: r.jobSummary,
    totalQuoted: r.totalQuoted,
    verdict: r.verdict,
    counts: { lines: r.lines.length, flags, missing: r.missing.length, redFlags: r.redFlags.length, questions: r.questions.length },
  };
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = n => (Number(n) > 0 ? '$' + Math.round(Number(n)).toLocaleString('en-US') : '');
export const VERDICT_WORDS = {
  fair: 'This quote is fair', high: 'This quote is high', very_high: 'This quote is well above the going rate',
  low: 'This quote is low, and that is worth a look', unclear: 'This quote leaves too much unsaid',
};

/** The review as an email, plain HTML, one column. */
export function reviewEmail(id, review) {
  const r = review.result;
  const url = `${PAGE}/result?id=${id}`;
  const li = arr => arr.map(x => `<li style="margin:0 0 8px">${esc(x)}</li>`).join('');
  const lines = r.lines.map(l => `<tr>
    <td style="padding:8px 0;border-top:1px solid #e6e9ef;font-size:15px;color:#0b1220">${esc(l.item)}<div style="font-size:13px;color:#5b6472;margin-top:2px">${esc(l.note)}</div></td>
    <td style="padding:8px 0 8px 12px;border-top:1px solid #e6e9ef;font-size:14px;color:#0b1220;text-align:right;white-space:nowrap;vertical-align:top">${esc(l.quoted)}<div style="font-size:12px;font-weight:600;color:${l.status === 'fair' ? '#16a34a' : l.status === 'high' ? '#dc2626' : '#d97706'}">${esc(l.status.replace('_', ' '))}</div></td></tr>`).join('');
  const h = (t) => `<h2 style="font-size:17px;margin:26px 0 8px;color:#0b1220">${t}</h2>`;
  const p = (t) => `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#0b1220">${t}</p>`;
  const html = `<div style="font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:28px 20px;color:#0b1220">
  <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#2563eb">Quote Check</p>
  <h1 style="font-size:26px;line-height:1.15;margin:0 0 6px;letter-spacing:-.02em">${esc(VERDICT_WORDS[r.verdict] || r.headline)}</h1>
  ${p(esc(r.headline))}
  ${p(`<b>${esc(r.trade)}</b> · ${esc(r.jobSummary)}${r.totalQuoted ? ` · quoted <b>${money(r.totalQuoted)}</b>` : ''}`)}
  ${h('What this job should cost')}
  ${p(`<b>${money(r.fairRange.low)} to ${money(r.fairRange.high)}</b>. ${esc(r.fairRange.basis)}`)}
  ${h('Line by line')}
  <table style="width:100%;border-collapse:collapse">${lines}</table>
  ${r.missing.length ? h('What is missing from this quote') + `<ul style="padding-left:20px;font-size:15px;line-height:1.5">${li(r.missing)}</ul>` : ''}
  ${r.redFlags.length ? h('Red flags') + `<ul style="padding-left:20px;font-size:15px;line-height:1.5">${li(r.redFlags)}</ul>` : ''}
  ${h('Ask the contractor')}
  <ul style="padding-left:20px;font-size:15px;line-height:1.5">${li(r.questions)}</ul>
  ${h('Say this')}
  <blockquote style="margin:0;padding:12px 16px;background:#f5f7fb;border-radius:12px;font-size:15px;line-height:1.55">${esc(r.sayThis)}</blockquote>
  ${h('Bottom line')}
  ${p(esc(r.bottomLine))}
  <p style="margin:26px 0"><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px">Open your review</a></p>
  <p style="font-size:13px;line-height:1.5;color:#5b6472">This review is a contractor's professional read of the document you sent, based on typical costs for your area. It is not an inspection of the property, and prices vary with access, materials and the contractor's workload. Reply to this email if something in the quote was misread.</p>
</div>`;
  const text = [
    'Quote Check', VERDICT_WORDS[r.verdict] || '', r.headline, '',
    `${r.trade} - ${r.jobSummary}${r.totalQuoted ? ` - quoted ${money(r.totalQuoted)}` : ''}`, '',
    `What this job should cost: ${money(r.fairRange.low)} to ${money(r.fairRange.high)}. ${r.fairRange.basis}`, '',
    'Line by line:', ...r.lines.map(l => `- ${l.item} (${l.quoted}) [${l.status}]: ${l.note}`), '',
    ...(r.missing.length ? ['Missing from this quote:', ...r.missing.map(x => `- ${x}`), ''] : []),
    ...(r.redFlags.length ? ['Red flags:', ...r.redFlags.map(x => `- ${x}`), ''] : []),
    'Ask the contractor:', ...r.questions.map(x => `- ${x}`), '',
    'Say this:', r.sayThis, '', 'Bottom line:', r.bottomLine, '', `Open your review: ${url}`,
  ].join('\n');
  return { subject: `Your Quote Check: ${VERDICT_WORDS[r.verdict] ? VERDICT_WORDS[r.verdict].toLowerCase() : r.headline}`, html, text };
}
