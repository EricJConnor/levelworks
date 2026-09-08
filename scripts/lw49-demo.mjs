// Creates (or refreshes) the demo account used for the /annual screenshots and
// the ad stills: one client on recurring billing, one signed estimate, one paid
// invoice. Real-looking job, no "Test Test".
//
//   SUPABASE_SERVICE_ROLE_KEY=… node scripts/lw49-demo.mjs         → creates, prints login
//   SUPABASE_SERVICE_ROLE_KEY=… node scripts/lw49-demo.mjs delete  → removes it all
import { createClient } from '@supabase/supabase-js';

const URL = 'https://djrsmuafbbzxpbdibolq.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(1); }
const a = createClient(URL, KEY, { auth: { persistSession: false } });

const EMAIL = 'demo.lw49@levelworks.org';
const PASSWORD = process.env.DEMO_PASSWORD || 'Level-Demo-2026';

async function findUser() {
  const { data } = await a.auth.admin.listUsers({ perPage: 200 });
  return data?.users?.find(u => u.email === EMAIL) || null;
}

if (process.argv[2] === 'delete') {
  const u = await findUser();
  if (u) { await a.auth.admin.deleteUser(u.id); console.log('deleted', u.id); } else console.log('no demo user');
  process.exit(0);
}

let user = await findUser();
if (!user) {
  const { data, error } = await a.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { full_name: 'Eric Connor' } });
  if (error) throw error;
  user = data.user;
}
const uid = user.id;

// profile
await a.from('profiles').upsert({
  user_id: uid, full_name: 'Eric Connor', company_name: 'Connor Home Improvement',
  phone_number: '(215) 555-0142', business_address: '412 Greenwood Ave, Wyncote, PA 19095',
  business_email: 'eric@connorhome.com',
}, { onConflict: 'user_id' });

// clean previous demo rows
for (const t of ['estimates', 'invoices', 'clients']) await a.from(t).delete().eq('user_id', uid);

// client on recurring billing (a maintenance contract)
const { data: c1 } = await a.from('clients').insert({
  user_id: uid, name: 'Johnson HVAC', email: 'office@johnsonhvac.com', phone: '(215) 555-0188',
  address: '88 Bethlehem Pike, Glenside, PA', billing_enabled: true, billing_amount: 180,
  billing_interval: 'month', billing_interval_count: 1, billing_status: 'current',
  billing_started_at: '2026-06-01T13:00:00Z', total_jobs: 3, total_value: 540,
}).select().single();
await a.from('clients').insert([
  { user_id: uid, name: 'Mike Rivera', email: 'mike.rivera@gmail.com', phone: '(267) 555-0131', address: '19 Maple St, Jenkintown, PA', total_jobs: 1, total_value: 5500 },
  { user_id: uid, name: 'Sarah Klein', email: 'sarah.klein@outlook.com', phone: '(215) 555-0177', address: '301 Church Rd, Elkins Park, PA', total_jobs: 1, total_value: 2400 },
]);

// signed estimate: the bathroom from the ad
const est = {
  user_id: uid, client_name: 'Mike Rivera', client_email: 'mike.rivera@gmail.com', client_phone: '(267) 555-0131',
  project_name: 'Bathroom remodel',
  line_items: [
    { id: 'i1', description: 'Demo existing tile and vanity', quantity: 1, rate: 450, total: 450, section: 'Bathroom' },
    { id: 'i2', description: 'Tile, floor and shower walls (12x24 porcelain, supplied)', quantity: 1, rate: 2800, total: 2800, section: 'Bathroom' },
    { id: 'i3', description: 'Vanity and faucet install', quantity: 1, rate: 350, total: 350, section: 'Bathroom' },
    { id: 'i4', description: 'Labor', quantity: 1, rate: 1900, total: 1900, section: 'Bathroom' },
  ],
  tax_rate: 0, deposit: 1650, total: 5500, status: 'approved',
  sent_at: '2026-09-06T01:47:00Z', read_at: '2026-09-06T01:52:00Z', signed_at: '2026-09-06T01:58:00Z',
  signed_by_name: 'Mike Rivera', signed_by_email: 'mike.rivera@gmail.com',
};
const { data: e1, error: ee } = await a.from('estimates').insert(est).select().single();
if (ee) throw ee;

// paid invoice: the roof
const { error: ie } = await a.from('invoices').insert({
  user_id: uid, invoice_number: '1042', client_name: 'Sarah Klein', client_email: 'sarah.klein@outlook.com', client_phone: '(215) 555-0177',
  project_name: 'Roof repair',
  line_items: [
    { id: 'i1', description: 'Replace damaged shingles (2 squares, matched)', quantity: 1, rate: 1450, total: 1450 },
    { id: 'i2', description: 'Flashing and seal at chimney', quantity: 1, rate: 650, total: 650 },
    { id: 'i3', description: 'Haul away', quantity: 1, rate: 300, total: 300 },
  ],
  tax_rate: 0, total: 2400, amount_paid: 2400, status: 'paid',
  payment_history: [{ amount: 2400, method: 'card', date: '2026-09-08T18:12:00Z', note: 'Card ending 4242' }],
  issue_date: '2026-09-08T14:00:00Z', due_date: '2026-09-15T14:00:00Z', sent_at: '2026-09-08T14:05:00Z',
});
if (ie) throw ie;

console.log(JSON.stringify({ email: EMAIL, password: PASSWORD, user_id: uid, estimate_id: e1.id, client_id: c1?.id }, null, 2));
