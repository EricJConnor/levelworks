# Resend Email Setup - Level Works

## ✅ Current Status

| Item | Status |
|------|--------|
| Resend API Key | ✅ Configured (`RESEND_API_KEY` secret) |
| Domain Verified | ✅ `levelworks.org` |
| Sender Email | `noreply@levelworks.org` |

## Edge Functions Using Resend

All email edge functions have been updated to use Resend:

1. **send-email** - Core email function with templates
2. **send-estimate** - Sends estimate emails to clients
3. **send-invoice** - Sends invoice emails with payment links
4. **notify-signature** - Notifies contractor when estimate is signed

## Quick Redeploy

If you need to redeploy the functions, run:

```bash
supabase functions deploy send-email
supabase functions deploy send-estimate
supabase functions deploy send-invoice
supabase functions deploy notify-signature
```

## Email Configuration

```typescript
// In send-email/index.ts
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDER_EMAIL = 'noreply@levelworks.org'
const SENDER_NAME = 'Level Works'
```

## Resend API Call

```typescript
const resendResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: [recipientEmail],
    subject: emailSubject,
    html: emailHtml,
  }),
})
```

## Testing

Test email delivery by:
1. Creating a new estimate in the app
2. Clicking "Send to Client"
3. Check the recipient's inbox (and spam folder)

## Troubleshooting

### Check Edge Function Logs
```bash
supabase functions logs send-email --tail
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Email not received | Check spam folder, verify recipient email |
| API key error | Verify `RESEND_API_KEY` secret is set correctly |
| Domain error | Ensure `levelworks.org` is verified in Resend dashboard |
| Rate limit | Resend free tier: 100 emails/day, 3,000/month |

## Resend Dashboard

Manage your email settings at: https://resend.com/emails

- View sent emails
- Check delivery status
- Monitor bounces and complaints
- Manage API keys
