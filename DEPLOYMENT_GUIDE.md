# Deploy Level Works to levelworks.org


## Quick Setup (15 minutes)

### Step 1: Deploy to Vercel (Free Hosting)

1. **Create Vercel Account**
   - Go to https://vercel.com/signup
   - Sign up with GitHub, GitLab, or Bitbucket

2. **Import Your Project**
   - Click "Add New Project"
   - Import your git repository
   - Vercel will auto-detect it's a Vite React app

3. **Configure Build Settings** (should auto-fill):
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables** (CRITICAL):
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL=https://vqonfzleebbcydfafoio.supabase.co
   VITE_SUPABASE_ANON_KEY=[your-supabase-anon-key]
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `your-app.vercel.app`

### Step 2: Connect GoDaddy Domain

1. **Get Vercel DNS Info**
   - In Vercel, go to your project → Settings → Domains
   - Click "Add Domain"
   - Enter: `levelworks.org`
   - Vercel will show you DNS records to add

2. **Configure GoDaddy DNS**
   - Log into GoDaddy.com
   - Go to "My Products" → "Domains" → levelworks.org
   - Click "DNS" or "Manage DNS"
   
3. **Add DNS Records**
   Add these records (Vercel will provide exact values):
   
   **Option A: Using A Record (Recommended)**
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel's IP)
   - TTL: 600
   
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: 600

   **Option B: Using CNAME**
   - Type: `CNAME`
   - Name: `@`
   - Value: `cname.vercel-dns.com`
   - TTL: 600

4. **Verify Domain**
   - Back in Vercel, click "Verify"
   - DNS propagation takes 5-60 minutes
   - Once verified, your app is live at levelworks.org!

### Step 3: SSL Certificate (Automatic)
- Vercel automatically provisions SSL certificate
- Your site will be https://levelworks.org
- No additional configuration needed

## Alternative: Netlify Deployment

If you prefer Netlify:

1. Go to https://netlify.com
2. "Add new site" → "Import existing project"
3. Build settings: `npm run build`, publish directory: `dist`
4. Add same environment variables
5. Add custom domain: levelworks.org
6. Follow Netlify's DNS instructions for GoDaddy

## Troubleshooting

**Build Fails?**
- Check environment variables are set correctly
- Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present

**Domain Not Working?**
- Wait up to 48 hours for DNS propagation (usually 5-60 min)
- Clear browser cache
- Try incognito/private browsing
- Check DNS with: https://dnschecker.org

**Stripe Not Working?**
- Verify Stripe webhook URL is updated to: https://levelworks.org
- Update webhook in Stripe Dashboard

## Post-Deployment Checklist

✅ Test signup/login at levelworks.org
✅ Test creating an estimate
✅ Test Stripe payment flow
✅ Update Stripe webhook URL
✅ Test email sending

## Support

- Vercel Docs: https://vercel.com/docs
- GoDaddy DNS Help: https://godaddy.com/help/dns
