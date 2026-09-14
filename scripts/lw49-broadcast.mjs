// Dry run of the Sep 14 member note from the command line (needs SUPABASE_SERVICE_ROLE_KEY).
// Sending happens through POST /api/annual-broadcast on Vercel, where the Resend key lives.
import { recipients } from '../api/_lib/broadcast.js';
const list = await recipients();
console.log(`${list.length} recipients: ${list.filter(r => r.lang === 'es').length} Spanish, ${list.filter(r => r.lang === 'en').length} English`);
console.log(list.map(r => `${r.lang} ${r.email.slice(0, 3)}***`).join(', '));
