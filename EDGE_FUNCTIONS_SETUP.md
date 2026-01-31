# Edge Functions Setup Guide

Your app requires several Supabase Edge Functions for full email functionality.

## 📋 Required Edge Functions

1. **send-email** - Core email function with templates
2. **send-estimate** - Sends estimate emails to clients
3. **send-invoice** - Sends invoice emails to clients
4. **notify-signature** - Notifies you when estimates are signed

## 🔑 Required Environment Variables in Supabase

Go to: **Supabase Dashboard → Your Project → Project Settings → Edge Functions → Manage secrets**

Add these secrets:

```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=your_verified_sender_email
```

## 🚀 Deployment Instructions

**See the complete deployment guide with all function code in:**

👉 **[DEPLOY_EDGE_FUNCTIONS.md](./DEPLOY_EDGE_FUNCTIONS.md)**

This file contains:
- Complete code for all 4 edge functions
- Professional HTML email templates
- The fix for the "View Estimate" button href issue
- Deployment commands
- Troubleshooting guide

## Quick Deploy Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy send-email
supabase functions deploy send-estimate
supabase functions deploy send-invoice
supabase functions deploy notify-signature
```

## 🧪 Testing

After deployment, test by:
1. Creating an estimate
2. Clicking "Send Estimate"
3. Checking that email arrives with a **clickable** "View Estimate" button

## 🆘 Common Issues

### "View Estimate" button not clickable

This was fixed! The issue was that the email template wasn't properly inserting the `estimateUrl` into the button's `href` attribute.

**Solution:** Deploy the updated `send-email` function from DEPLOY_EDGE_FUNCTIONS.md which includes the proper template:

```html
<a href="${data.estimateUrl}" style="...">View Estimate</a>
```

The `estimateUrl` is generated as:
```
https://levelworks.org/view-estimate/{viewToken}
```

### Check Edge Function Logs

```bash
supabase functions logs send-estimate
supabase functions logs send-email
```

Look for:
- `[send-estimate] Generated estimateUrl: https://levelworks.org/view-estimate/...`
- `[send-email] estimateUrl in data: https://levelworks.org/view-estimate/...`
