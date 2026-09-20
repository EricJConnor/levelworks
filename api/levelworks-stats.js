/**
 * GET /api/levelworks-stats — public, counts only, no names or addresses.
 *
 * The question no dashboard could answer before this: of the people who sign
 * up, how many actually build an estimate, send one, invoice for it and get
 * paid? Without that number an ad campaign cannot be judged, because a cheap
 * sign-up that never opens the builder is worth nothing.
 *
 * Deliberately public and read-only, like /api/audience-status and
 * /api/quotecheck-stats: Eric opens a URL, no secret to copy.
 *
 * Counts only. No email address, name or row content is ever returned.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY, which Vercel already holds.
 */
import { json, missingEnv, admin, ANNUAL_CAP } from './_lib/annual.js';

const DAY = 86400e3;

/** Every real contractor account: no @levelworks.org demo rows, no observers. */
async function members() {
  const a = admin();
  const out = [];
  for (let page = 1; page < 50; page++) {
    const { data, error } = await a.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error('listUsers: ' + error.message);
    const users = data?.users || [];
    for (const u of users) {
      const email = (u.email || '').toLowerCase();
      if (!email || email.endsWith('@levelworks.org')) continue;
      if ((u.app_metadata || {}).observer) continue;
      out.push({
        id: u.id,
        created: u.created_at ? new Date(u.created_at).getTime() : 0,
        signedIn: !!u.last_sign_in_at,
      });
    }
    if (users.length < 200) break;
  }
  return out;
}

/** user_id -> counts, for one table. Pages so a large table cannot truncate. */
async function byUser(table, columns) {
  const a = admin();
  const rows = [];
  const size = 1000;
  for (let from = 0; from < 50000; from += size) {
    const { data, error } = await a
      .from(table)
      .select(columns)
      .range(from, from + size - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if ((data || []).length < size) break;
  }
  return rows;
}

export default async function handler(req, res) {
  if (missingEnv('SUPABASE_SERVICE_ROLE_KEY').length) {
    return json(res, 503, { error: 'not_configured', need: 'SUPABASE_SERVICE_ROLE_KEY' });
  }

  let people, estimates, invoices, profiles;
  try {
    [people, estimates, invoices, profiles] = await Promise.all([
      members(),
      byUser('estimates', 'user_id,status,sent_at,total,created_at'),
      byUser('invoices', 'user_id,status,sent_at,amount_paid,total,created_at'),
      byUser('profiles', 'id,stripe_account_id,lang'),
    ]);
  } catch (e) {
    return json(res, 200, { error: String(e.message || e) });
  }

  const mine = new Set(people.map(p => p.id));
  const keep = r => r && mine.has(r.user_id);
  const est = estimates.filter(keep);
  const inv = invoices.filter(keep);

  // One row per person, so "built an estimate" counts people, not documents.
  const set = (rows, test) => new Set(rows.filter(test).map(r => r.user_id));
  const built = set(est, () => true);
  const sent = set(est, r => r.sent_at || r.status === 'sent' || r.status === 'approved');
  const invoiced = set(inv, () => true);
  const paid = set(inv, r => r.status === 'paid' || r.status === 'partially_paid' || Number(r.amount_paid) > 0);
  const connected = new Set(
    profiles.filter(p => p.stripe_account_id && mine.has(p.id)).map(p => p.id)
  );

  const funnel = group => {
    const ids = new Set(group.map(p => p.id));
    const n = k => [...k].filter(id => ids.has(id)).length;
    return {
      people: group.length,
      signedIn: group.filter(p => p.signedIn).length,
      builtEstimate: n(built),
      sentEstimate: n(sent),
      madeInvoice: n(invoiced),
      gotPaid: n(paid),
      stripeConnected: n(connected),
    };
  };

  const now = Date.now();
  const since = d => people.filter(p => p.created > now - d * DAY);
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const all = funnel(people);

  const paidRows = inv.filter(r => Number(r.amount_paid) > 0);
  const money = Math.round(paidRows.reduce((s, r) => s + Number(r.amount_paid || 0), 0));

  return json(res, 200, {
    asOf: new Date().toISOString(),
    members: people.length,
    // The headline: what share of sign-ups ever do the core job.
    activation: {
      signedInPct: pct(all.signedIn, all.people),
      builtEstimatePct: pct(all.builtEstimate, all.people),
      sentEstimatePct: pct(all.sentEstimate, all.people),
      gotPaidPct: pct(all.gotPaid, all.people),
    },
    allTime: all,
    last7d: funnel(since(7)),
    last30d: funnel(since(30)),
    documents: {
      estimates: est.length,
      estimatesSent: est.filter(r => r.sent_at || r.status === 'sent' || r.status === 'approved').length,
      invoices: inv.length,
      invoicesPaid: inv.filter(r => r.status === 'paid').length,
      paidThroughApp: money,
    },
    annual49: { cap: ANNUAL_CAP },
  });
}
