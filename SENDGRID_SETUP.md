# Email Setup Guide (Resend)

## ✅ What You've Completed

Great! You've already done the initial setup:
1. ✅ Created Resend account
2. ✅ Verified your domain or email

## 🔑 Get Your Resend API Key

You need to add the Resend API key to Supabase:

### Step 1: Create API Key in Resend

1. Log into Resend: https://resend.com
2. Go to **API Keys**
3. Click **Create API Key**
4. Name it: "Level Works App"
5. Choose permissions (Full access recommended)
6. Click **Create**
7. **COPY THE KEY NOW** (you won't see it again!)

### Step 2: Add to Supabase

1. Go to Supabase Dashboard → Your Project
2. Click **Project Settings** (gear icon bottom left)
3. Click **Edge Functions** → **Manage secrets**
4. Click **Add new secret**:
   - Name: `RESEND_API_KEY`
   - Value: Paste the API key you copied
5. Click **Add secret**

## 📋 Complete Environment Variables Checklist

Make sure this is set in Supabase secrets:

- [ ] **RESEND_API_KEY** - From Resend dashboard → API Keys

## 🚀 Next Step

After adding the Resend API key, follow the instructions in **DEPLOYMENT_COMPLETE.md** to deploy the edge function.

## 🧪 Testing

Once everything is deployed, test by:
1. Creating an estimate
2. Clicking "Send Estimate"
3. Checking that email arrives

## 🆘 Troubleshooting

**"Resend error 401"**: API key is incorrect or not set
**"Resend error 403"**: API key doesn't have send permission
**"Domain verification error"**: Domain not verified in Resend dashboard
