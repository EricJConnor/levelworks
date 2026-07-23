// Confirms the Meta access token works by fetching the ad account's name and status.
// Run with: node --env-file=meta-ads/.env meta-ads/verify-connection.mjs

const token = process.env.META_ACCESS_TOKEN;
const adAccountId = process.env.META_AD_ACCOUNT_ID;

if (!token) {
  console.error('Missing META_ACCESS_TOKEN. Set it in meta-ads/.env (see .env.example).');
  process.exit(1);
}
if (!adAccountId) {
  console.error('Missing META_AD_ACCOUNT_ID. Set it in meta-ads/.env (see .env.example).');
  process.exit(1);
}

const url = `https://graph.facebook.com/v21.0/${adAccountId}?fields=name,account_status,currency,timezone_name&access_token=${token}`;

const res = await fetch(url);
const data = await res.json();

if (data.error) {
  console.error('Meta API error:', data.error.message);
  process.exit(1);
}

const statusLabels = { 1: 'ACTIVE', 2: 'DISABLED', 3: 'UNSETTLED', 7: 'PENDING_RISK_REVIEW', 9: 'IN_GRACE_PERIOD', 100: 'PENDING_CLOSURE', 101: 'CLOSED', 201: 'ANY_ACTIVE', 202: 'ANY_CLOSED' };

console.log('Connected successfully.');
console.log('Ad account name:', data.name);
console.log('Status:', statusLabels[data.account_status] || data.account_status);
console.log('Currency:', data.currency);
console.log('Timezone:', data.timezone_name);
