# SendGrid Sender Email Verification

## ⚠️ CRITICAL STEP: Verify Your Sender Email

Your SendGrid API key is configured, but **you must verify your sender email** before you can send emails.

## Step-by-Step Verification Process

### 1. Go to SendGrid Sender Authentication
- Visit: https://app.sendgrid.com/settings/sender_auth/senders
- Or navigate: **Settings** → **Sender Authentication** → **Single Sender Verification**

### 2. Create a Verified Sender
- Click **"Create New Sender"**
- Fill in the form:
  - **From Name**: Level Works (or your company name)
  - **From Email Address**: The email you want to send from (e.g., estimates@yourdomain.com)
  - **Reply To**: Same email or support email
  - **Company Address**: Your business address
  - **Nickname**: LevelWorks Production
- Click **"Create"**

### 3. Verify the Email
- Check the inbox of the email you entered
- Click the verification link in the SendGrid email
- You should see "Sender verified successfully"

### 4. Update Your Supabase Secret
- Go to: https://supabase.com/dashboard
- Select your project → **Project Settings** → **Edge Functions**
- Find the secret: **SENDER_EMAIL**
- Update it to match your verified email
- Click **"Update secret"**

## Testing After Verification

Once verified, test your email functionality:

1. Log into Level Works
2. Create a test estimate
3. Click "Send Estimate"
4. Enter a real email address you control
5. Click "Send"
6. Check your inbox!

## Common Issues

**"The from address does not match a verified Sender Identity"**
- Your SENDER_EMAIL secret doesn't match a verified sender
- Verify the email in SendGrid first
- Make sure SENDER_EMAIL in Supabase matches exactly

**"Sender already exists"**
- You may have already created this sender
- Check your verified senders list
- Use that email in your SENDER_EMAIL secret

## Current Status

✅ SendGrid API Key: Configured
✅ SENDER_EMAIL Secret: Configured
⚠️ Sender Verification: **REQUIRED** (do this now!)

After verification, your email system will be fully functional!
