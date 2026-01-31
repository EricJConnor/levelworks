# Fix Emails Going to Spam

Your emails are going to spam because the sender email `eric@soundwavemusicapp.com` needs proper verification and domain authentication.

## Steps to Fix:

### 1. Verify Sender Email in SendGrid
1. Log into SendGrid: https://app.sendgrid.com
2. Go to Settings → Sender Authentication → Single Sender Verification
3. Add `eric@soundwavemusicapp.com` as a verified sender
4. Check your email inbox for verification link and click it

### 2. Authenticate Your Domain (CRITICAL for avoiding spam)
1. In SendGrid, go to Settings → Sender Authentication → Authenticate Your Domain
2. Select your DNS host (GoDaddy, Cloudflare, etc.)
3. Enter your domain: `soundwavemusicapp.com`
4. SendGrid will provide DNS records (CNAME records for SPF, DKIM, and DMARC)
5. Add these DNS records to your domain provider:
   - Usually 3 CNAME records
   - May take 24-48 hours to propagate

### 3. DNS Records You'll Need to Add
SendGrid will give you records like:
```
Type: CNAME
Host: s1._domainkey.soundwavemusicapp.com
Value: s1.domainkey.u12345.wl.sendgrid.net

Type: CNAME
Host: s2._domainkey.soundwavemusicapp.com
Value: s2.domainkey.u12345.wl.sendgrid.net

Type: CNAME
Host: em1234.soundwavemusicapp.com
Value: u12345.wl.sendgrid.net
```

### 4. Additional Best Practices
- Use a professional "From Name" like "Level Works" or "Eric from Level Works"
- Avoid spam trigger words in subject lines
- Include an unsubscribe link (SendGrid adds this automatically)
- Make sure your email content has good text-to-image ratio

## Why This Matters
Without domain authentication:
- Emails go to spam/junk folders
- Email providers (Gmail, Outlook) don't trust your emails
- Your sender reputation suffers

With domain authentication:
- Emails land in inbox
- Professional appearance
- Better deliverability rates (95%+ vs 20%)

## Check Status
After setting up, verify at: https://app.sendgrid.com/settings/sender_auth/senders
