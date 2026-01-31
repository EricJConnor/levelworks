# Edge Function Troubleshooting Guide

## Issue: "Send Estimate" loads but does nothing

### Quick Checklist

1. **Verify RESEND_API_KEY is set in Supabase Secrets**
   - Go to: Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Confirm `RESEND_API_KEY` exists and has the correct value from Resend

2. **Verify the Edge Function is Deployed**
   - Go to: Supabase Dashboard → Edge Functions
   - Check that `send-email` function exists and is deployed
   - Check the function logs for any errors

3. **Check Edge Function Logs**
   - In Supabase Dashboard → Edge Functions → `send-email` → Logs
   - Look for error messages like:
     - `RESEND_API_KEY not configured` - The secret is not set
     - `Resend error: ...` - The API key is invalid or there's a Resend issue
     - `validation_error` - The email format is wrong

### How Secrets Work in Supabase Edge Functions

Edge functions in Supabase run on Deno, NOT Node.js. They access secrets using:

```typescript
// CORRECT - Deno way (used in Supabase Edge Functions)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// WRONG - Node.js way (does NOT work in Supabase Edge Functions)
const RESEND_API_KEY = process.env.RESEND_API_KEY
```

### Verify Your Edge Function Code

Your `send-email` edge function should have this at the top:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDER_EMAIL = 'noreply@levelworks.org'
const SENDER_NAME = 'Level Works'
```

### Frontend Configuration

The frontend does NOT need the Resend API key. It calls the edge function which handles the API key securely.

Frontend environment variables (optional, has defaults):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Testing the Edge Function Directly

You can test the edge function using curl:

```bash
curl -X POST 'https://vqonfzleebbcydfafoio.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "to": "test@example.com",
    "templateType": "estimate_sent",
    "data": {
      "clientName": "Test Client",
      "projectName": "Test Project",
      "amount": "100.00",
      "estimateUrl": "https://example.com/estimate/123",
      "contractorName": "Test Contractor"
    }
  }'
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Email service not configured" | Add RESEND_API_KEY to Supabase Edge Function Secrets |
| "Invalid API key" | Verify the API key in Resend dashboard and update the secret |
| "Domain not verified" | Verify your domain in Resend dashboard |
| "Rate limit exceeded" | Wait and try again, or upgrade Resend plan |
| Request times out | Check edge function logs for errors, may need to redeploy |

### Redeploying Edge Functions

If you need to update or redeploy the edge functions:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref vqonfzleebbcydfafoio

# Deploy the send-email function
supabase functions deploy send-email

# Check logs
supabase functions logs send-email --tail
```

### Checking Browser Console

Open browser DevTools (F12) and check the Console tab when clicking "Send Estimate":

1. You should see: `[SendEstimate] Sending request to edge function: ...`
2. Then: `[SendEstimate] Response status: 200` (or an error code)
3. Then: `[SendEstimate] Response text: ...`

If you see a non-200 status or an error in the response, that will tell you what's wrong.

### Still Having Issues?

1. Check that your Resend account is active and has sending capability
2. Verify the sender email domain is verified in Resend
3. Check Resend dashboard for any failed email attempts
4. Look at Supabase Edge Function logs for detailed error messages
