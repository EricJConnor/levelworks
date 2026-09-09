import { createClient } from '@supabase/supabase-js';
const a = createClient('https://djrsmuafbbzxpbdibolq.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await a.auth.admin.listUsers({ perPage: 200 });
const u = data.users.filter(u => u.email.startsWith('lw49.test.')).sort((x,y)=>x.created_at<y.created_at?1:-1)[0];
console.log(JSON.stringify({ email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, meta: u.user_metadata, app: u.app_metadata }, null, 1));
