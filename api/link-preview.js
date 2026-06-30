const SUPABASE_URL = 'https://djrsmuafbbzxpbdibolq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcnNtdWFmYmJ6eHBiZGlib2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODE1OTIsImV4cCI6MjA5MDU1NzU5Mn0.vIKq1NjFXX3w7Jj09AEU8F4KLxG9O6TA-bsDl7vFKlw';

const DEFAULT_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/69192c98db8a9927f5f026a9_1764553503127_f571a4a3.webp';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = async (req, res) => {
  const { type, token } = req.query;
  const isInvoice = type === 'invoice';
  const viewPath = isInvoice ? `/view-invoice/${token}` : `/view-estimate/${token}`;
  const destination = `https://levelworks.org${viewPath}`;

  let title = isInvoice ? 'Invoice' : 'Estimate';
  let image = DEFAULT_IMAGE;

  if (token) {
    try {
      const view = isInvoice ? 'public_invoice_branding' : 'public_estimate_branding';
      const url = `${SUPABASE_URL}/rest/v1/${view}?view_token=eq.${encodeURIComponent(token)}&select=company_name,profile_photo_url`;
      const r = await fetch(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (r.ok) {
        const rows = await r.json();
        const row = rows && rows[0];
        if (row?.company_name) {
          title = `${isInvoice ? 'Invoice' : 'Estimate'} from ${row.company_name}`;
        }
        if (row?.profile_photo_url) {
          image = row.profile_photo_url;
        }
      }
    } catch {
      // fall back to defaults below
    }
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(destination)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(destination)}" />
<link rel="canonical" href="${escapeHtml(destination)}" />
</head>
<body>
<p>Redirecting to your <a href="${escapeHtml(destination)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(html);
};
