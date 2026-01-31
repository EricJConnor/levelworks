# 🚀 Level Works - Complete Supabase Migration Guide

## Target Project
**Supabase URL:** `https://vqonfzleebbcydfafoio.supabase.co`

---

## ⏳ AWAITING YOUR APPROVAL

Review this document and confirm you want to proceed. Once approved, follow the steps below to migrate everything to your real Supabase project.

---

# PART 1: DATABASE TABLES & POLICIES

## Step 1: Open SQL Editor
1. Go to: https://supabase.com/dashboard/project/vqonfzleebbcydfafoio
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Copy and paste the ENTIRE SQL below
5. Click **"Run"**

```sql
-- ============================================
-- COMPLETE DATABASE SETUP FOR LEVEL WORKS
-- Target: https://vqonfzleebbcydfafoio.supabase.co
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Stores user profile/business information
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  phone_number TEXT DEFAULT '',
  business_address TEXT DEFAULT '',
  profile_photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. CLIENTS TABLE
-- Stores client/customer information
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  total_jobs INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Clients policies
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clients" ON clients;
CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. JOBS TABLE
-- Stores job/project tracking information
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT DEFAULT '',
  project_type TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'in-progress', 'completed')),
  total NUMERIC DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies
DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own jobs" ON jobs;
CREATE POLICY "Users can insert own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own jobs" ON jobs;
CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. ESTIMATES TABLE
-- Stores estimates/quotes for clients
-- ============================================
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  project_name TEXT DEFAULT '',
  line_items JSONB DEFAULT '[]'::jsonb,
  tax_rate NUMERIC DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  view_token UUID DEFAULT uuid_generate_v4() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_email TEXT,
  signature_data TEXT
);

-- Enable RLS
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- Estimates policies - users can manage their own
DROP POLICY IF EXISTS "Users can view own estimates" ON estimates;
CREATE POLICY "Users can view own estimates" ON estimates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own estimates" ON estimates;
CREATE POLICY "Users can insert own estimates" ON estimates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own estimates" ON estimates;
CREATE POLICY "Users can update own estimates" ON estimates
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own estimates" ON estimates;
CREATE POLICY "Users can delete own estimates" ON estimates
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view estimates via view_token (for client viewing)
DROP POLICY IF EXISTS "Public can view estimates by token" ON estimates;
CREATE POLICY "Public can view estimates by token" ON estimates
  FOR SELECT USING (view_token IS NOT NULL);

-- Public can update estimates (for signing)
DROP POLICY IF EXISTS "Public can sign estimates" ON estimates;
CREATE POLICY "Public can sign estimates" ON estimates
  FOR UPDATE USING (view_token IS NOT NULL);

-- ============================================
-- 5. INVOICES TABLE
-- Stores invoices for billing
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
  invoice_number TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  project_name TEXT DEFAULT '',
  line_items JSONB DEFAULT '[]'::jsonb,
  tax_rate NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  payment_history JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue')),
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  notes TEXT,
  view_token UUID DEFAULT uuid_generate_v4() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Invoices policies - users can manage their own
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;
CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view invoices via view_token (for client viewing/payment)
DROP POLICY IF EXISTS "Public can view invoices by token" ON invoices;
CREATE POLICY "Public can view invoices by token" ON invoices
  FOR SELECT USING (view_token IS NOT NULL);

-- Public can update invoices (for payment recording)
DROP POLICY IF EXISTS "Public can update invoices for payment" ON invoices;
CREATE POLICY "Public can update invoices for payment" ON invoices
  FOR UPDATE USING (view_token IS NOT NULL);

-- ============================================
-- 6. PROJECT PHOTOS TABLE
-- Stores photos attached to estimates/projects
-- ============================================
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- Project photos policies
DROP POLICY IF EXISTS "Users can view own photos" ON project_photos;
CREATE POLICY "Users can view own photos" ON project_photos
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own photos" ON project_photos;
CREATE POLICY "Users can insert own photos" ON project_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own photos" ON project_photos;
CREATE POLICY "Users can delete own photos" ON project_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view photos for estimates they can access
DROP POLICY IF EXISTS "Public can view photos for accessible estimates" ON project_photos;
CREATE POLICY "Public can view photos for accessible estimates" ON project_photos
  FOR SELECT USING (
    estimate_id IN (SELECT id FROM estimates WHERE view_token IS NOT NULL)
  );

-- ============================================
-- 7. AI CHAT HISTORY TABLE
-- Stores AI assistant conversation history
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- AI chat history policies
DROP POLICY IF EXISTS "Users can view own chat history" ON ai_chat_history;
CREATE POLICY "Users can view own chat history" ON ai_chat_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat messages" ON ai_chat_history;
CREATE POLICY "Users can insert own chat messages" ON ai_chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat history" ON ai_chat_history;
CREATE POLICY "Users can delete own chat history" ON ai_chat_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_view_token ON estimates(view_token);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_view_token ON invoices(view_token);
CREATE INDEX IF NOT EXISTS idx_project_photos_user_id ON project_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_estimate_id ON project_photos(estimate_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);

-- ============================================
-- 9. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates;
CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! All tables created successfully.
-- ============================================
```

---

# PART 2: STORAGE BUCKETS

## Step 2: Create Storage Buckets

1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Create these buckets:

### Bucket 1: profile-photos
- Name: `profile-photos`
- Public bucket: **YES** (toggle on)
- Click "Create bucket"

### Bucket 2: project-photos
- Name: `project-photos`
- Public bucket: **YES** (toggle on)
- Click "Create bucket"

## Step 3: Set Storage Policies

Run this SQL in the SQL Editor:

```sql
-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Profile photos bucket policies
CREATE POLICY "Users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Public can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Project photos bucket policies
CREATE POLICY "Users can upload project photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-photos');

CREATE POLICY "Public can view project photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-photos');

CREATE POLICY "Users can delete own project photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-photos');
```

---

# PART 3: EDGE FUNCTIONS

## Step 4: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 5: Login and Link Project

```bash
supabase login
supabase link --project-ref vqonfzleebbcydfafoio
```

## Step 6: Add Secrets to Supabase

Go to: **Supabase Dashboard → Project Settings → Edge Functions → Manage secrets**

Add these secrets:

| Secret Name | Description |
|-------------|-------------|
| `RESEND_API_KEY` | Your Resend API key for emails |
| `OPENAI_API_KEY` | Your OpenAI API key for AI chat |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |

## Step 7: Create Edge Function Files

Create this folder structure in your project:

```
supabase/
  functions/
    send-email/
      index.ts
    send-estimate/
      index.ts
    send-invoice/
      index.ts
    save-signature/
      index.ts
    notify-signature/
      index.ts
    ai-chat/
      index.ts
    get-stripe-config/
      index.ts
    subscribe-user/
      index.ts
    get-subscription-status/
      index.ts
    cancel-subscription/
      index.ts
    create-invoice-payment/
      index.ts
    delete-account/
      index.ts
```

---

### Function 1: `supabase/functions/send-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDER_EMAIL = 'noreply@levelworks.org'
const SENDER_NAME = 'Level Works'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getEmailTemplate = (templateType: string, data: Record<string, any>): { subject: string; html: string } => {
  const buttonStyle = 'background-color:#10b981;border:1px solid #10b981;border-radius:8px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:220px;'
  
  switch (templateType) {
    case 'estimate_sent':
      return {
        subject: `New Estimate from Level Works - ${data.projectName || 'Your Project'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#10b981;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Level Works</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px;color:#18181b;font-size:24px;">New Estimate Ready</h2>
              <p style="margin:0 0 15px;color:#52525b;font-size:16px;line-height:1.6;">
                Hi ${data.clientName || 'there'},
              </p>
              <p style="margin:0 0 25px;color:#52525b;font-size:16px;line-height:1.6;">
                You have a new estimate ready for review:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:8px;margin-bottom:30px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Project</p>
                    <p style="margin:0 0 20px;color:#18181b;font-size:18px;font-weight:600;">${data.projectName || 'Your Project'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Estimated Total</p>
                    <p style="margin:0;color:#10b981;font-size:28px;font-weight:bold;">$${data.amount || '0.00'}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.estimateUrl}" style="${buttonStyle}">View Estimate</a>
                  </td>
                </tr>
              </table>
              <p style="margin:30px 0 0;color:#a1a1aa;font-size:14px;text-align:center;">
                Click the button above to view details and sign your estimate.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f5;padding:20px 30px;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} Level Works. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }
    
    case 'estimate_signed':
      return {
        subject: `Estimate Signed! - ${data.projectName || 'Project'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#10b981;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Level Works</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;text-align:center;">
              <div style="width:80px;height:80px;background-color:#dcfce7;border-radius:50%;margin:0 auto 20px;line-height:80px;">
                <span style="font-size:40px;color:#10b981;">✓</span>
              </div>
              <h2 style="margin:0 0 20px;color:#18181b;font-size:24px;">Estimate Signed!</h2>
              <p style="margin:0 0 25px;color:#52525b;font-size:16px;line-height:1.6;">
                Great news! ${data.signedByName || 'Your client'} has signed the estimate for <strong>${data.projectName || 'your project'}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:8px;margin-bottom:30px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Signed By</p>
                    <p style="margin:0 0 15px;color:#18181b;font-size:16px;font-weight:600;">${data.signedByName || 'Client'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Amount</p>
                    <p style="margin:0;color:#10b981;font-size:24px;font-weight:bold;">$${data.amount || '0.00'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f5;padding:20px 30px;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} Level Works. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }

    case 'invoice_sent':
      return {
        subject: `Invoice ${data.invoiceNumber || ''} from Level Works`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#3b82f6;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Level Works</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px;color:#18181b;font-size:24px;">Invoice Ready</h2>
              <p style="margin:0 0 15px;color:#52525b;font-size:16px;line-height:1.6;">
                Hi ${data.clientName || 'there'},
              </p>
              <p style="margin:0 0 25px;color:#52525b;font-size:16px;line-height:1.6;">
                Your invoice is ready for payment:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:8px;margin-bottom:30px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Invoice Number</p>
                    <p style="margin:0 0 20px;color:#18181b;font-size:18px;font-weight:600;">${data.invoiceNumber || 'N/A'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Project</p>
                    <p style="margin:0 0 20px;color:#18181b;font-size:18px;font-weight:600;">${data.projectName || 'Your Project'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Amount Due</p>
                    <p style="margin:0;color:#3b82f6;font-size:28px;font-weight:bold;">$${data.amountDue || data.amount || '0.00'}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.invoiceUrl || data.paymentUrl}" style="background-color:#3b82f6;border:1px solid #3b82f6;border-radius:8px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:220px;">View & Pay Invoice</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f5;padding:20px 30px;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} Level Works. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }

    default:
      return {
        subject: data.subject || 'Message from Level Works',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <p>${data.message || 'You have a new message from Level Works.'}</p>
</body>
</html>`
      }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { to, subject, templateType, data, html } = body

    console.log('[send-email] Received request:', { to, templateType, data })

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing recipient email' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!RESEND_API_KEY) {
      console.error('[send-email] RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    let emailSubject = subject
    let emailHtml = html

    if (templateType && data) {
      const template = getEmailTemplate(templateType, data)
      emailSubject = emailSubject || template.subject
      emailHtml = template.html
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('[send-email] Resend error:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: `Resend error: ${errorData.message || resendResponse.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const responseData = await resendResponse.json()
    console.log('[send-email] Email sent successfully, id:', responseData.id)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', id: responseData.id }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[send-email] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### Function 2: `supabase/functions/send-estimate/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { estimateId, viewToken, clientEmail, sendEmail, estimateData } = body

    console.log('[send-estimate] Received:', { estimateId, viewToken, clientEmail, sendEmail })

    if (!viewToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing viewToken' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const baseUrl = 'https://levelworks.org'
    const estimateUrl = `${baseUrl}/view-estimate/${viewToken}`

    console.log('[send-estimate] Generated estimateUrl:', estimateUrl)

    const results = { email: null, errors: [] as string[] }

    if (sendEmail && clientEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

      const totalAmount = Number(estimateData?.total || 0)
      const clientName = String(estimateData?.clientName || 'Client')
      const projectName = String(estimateData?.projectName || 'Project')

      const emailPayload = {
        to: clientEmail,
        templateType: 'estimate_sent',
        data: {
          clientName: clientName,
          projectName: projectName,
          amount: totalAmount.toFixed(2),
          estimateUrl: estimateUrl
        }
      }

      console.log('[send-estimate] Calling send-email with payload:', JSON.stringify(emailPayload))

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      const emailResult = await emailResponse.json()
      console.log('[send-estimate] Email result:', emailResult)

      if (!emailResponse.ok || emailResult.error) {
        results.errors.push(`Email error: ${emailResult.error || 'Unknown error'}`)
      }
      results.email = emailResult
    }

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        estimateUrl,
        ...results,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[send-estimate] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### Function 3: `supabase/functions/send-invoice/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { invoiceId, clientEmail, sendEmail, invoiceData } = body

    console.log('[send-invoice] Received:', { invoiceId, clientEmail, sendEmail })

    const viewToken = invoiceData?.viewToken
    if (!viewToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing viewToken in invoiceData' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const baseUrl = 'https://levelworks.org'
    const invoiceUrl = `${baseUrl}/view-invoice/${viewToken}`

    console.log('[send-invoice] Generated invoiceUrl:', invoiceUrl)

    const results = { email: null, errors: [] as string[] }

    if (sendEmail && clientEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

      const emailPayload = {
        to: clientEmail,
        templateType: 'invoice_sent',
        data: {
          clientName: String(invoiceData?.clientName || 'Client'),
          projectName: String(invoiceData?.projectName || 'Project'),
          invoiceNumber: String(invoiceData?.invoiceNumber || ''),
          amount: Number(invoiceData?.total || 0).toFixed(2),
          amountDue: Number(invoiceData?.amountDue || invoiceData?.total || 0).toFixed(2),
          invoiceUrl: invoiceUrl,
          paymentUrl: invoiceUrl
        }
      }

      console.log('[send-invoice] Calling send-email with payload:', JSON.stringify(emailPayload))

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      const emailResult = await emailResponse.json()
      console.log('[send-invoice] Email result:', emailResult)

      if (!emailResponse.ok || emailResult.error) {
        results.errors.push(`Email error: ${emailResult.error || 'Unknown error'}`)
      }
      results.email = emailResult
    }

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        invoiceUrl,
        ...results,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[send-invoice] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### Function 4: `supabase/functions/save-signature/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { estimateId, signedByName, signedByEmail, signatureData } = body

    console.log('[save-signature] Saving signature for estimate:', estimateId)

    if (!estimateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing estimateId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const updateData = {
      signed_at: new Date().toISOString(),
      signed_by_name: signedByName,
      signed_by_email: signedByEmail,
      signature_data: signatureData,
      status: 'approved'
    }

    console.log('[save-signature] Updating estimate with fields:', Object.keys(updateData))

    const response = await fetch(
      `${supabaseUrl}/rest/v1/estimates?id=eq.${estimateId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[save-signature] Update failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `Update failed: ${response.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log('[save-signature] Signature saved successfully')
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[save-signature] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### Function 5: `supabase/functions/notify-signature/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { viewToken, signatureData, signedByName, signedByEmail, contractorEmail, estimateData } = body

    console.log('[notify-signature] Received:', { viewToken, signedByName, contractorEmail })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error: updateError } = await supabase
      .from('estimates')
      .update({
        signed_at: new Date().toISOString(),
        signed_by_name: signedByName,
        signed_by_email: signedByEmail,
        signature_data: signatureData,
        status: 'approved'
      })
      .eq('view_token', viewToken)

    if (updateError) {
      console.error('[notify-signature] Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (contractorEmail) {
      const emailPayload = {
        to: contractorEmail,
        templateType: 'estimate_signed',
        data: {
          signedByName: signedByName || 'Client',
          signedByEmail: signedByEmail || '',
          projectName: estimateData?.projectName || 'Project',
          amount: Number(estimateData?.total || 0).toFixed(2),
        }
      }

      console.log('[notify-signature] Sending notification email:', emailPayload)

      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[notify-signature] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### Function 6: `supabase/functions/ai-chat/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory, appContext } = await req.json()

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const systemPrompt = `You are a helpful AI assistant for Level Works, a contractor management app. 
You help contractors with estimates, invoices, clients, and job management.
Current app context: ${JSON.stringify(appContext)}
Be concise, helpful, and professional.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[ai-chat] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### Function 7: `supabase/functions/get-stripe-config/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY')

    if (!publishableKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({ publishableKey }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### Function 8: `supabase/functions/delete-account/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, confirmEmail } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete user data from all tables
    await supabase.from('ai_chat_history').delete().eq('user_id', userId)
    await supabase.from('project_photos').delete().eq('user_id', userId)
    await supabase.from('invoices').delete().eq('user_id', userId)
    await supabase.from('estimates').delete().eq('user_id', userId)
    await supabase.from('jobs').delete().eq('user_id', userId)
    await supabase.from('clients').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('user_id', userId)

    // Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('[delete-account] Auth delete error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[delete-account] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

## Step 8: Deploy All Edge Functions

Run these commands in your terminal:

```bash
supabase functions deploy send-email
supabase functions deploy send-estimate
supabase functions deploy send-invoice
supabase functions deploy save-signature
supabase functions deploy notify-signature
supabase functions deploy ai-chat
supabase functions deploy get-stripe-config
supabase functions deploy delete-account
```

---

# PART 4: VERIFICATION CHECKLIST

After completing all steps, verify in your Supabase dashboard:

## Tables (Table Editor → public)
- [ ] profiles
- [ ] clients
- [ ] jobs
- [ ] estimates
- [ ] invoices
- [ ] project_photos
- [ ] ai_chat_history

## Storage Buckets (Storage)
- [ ] profile-photos
- [ ] project-photos

## Edge Functions (Edge Functions)
- [ ] send-email
- [ ] send-estimate
- [ ] send-invoice
- [ ] save-signature
- [ ] notify-signature
- [ ] ai-chat
- [ ] get-stripe-config
- [ ] delete-account

## Secrets (Project Settings → Edge Functions → Manage secrets)
- [ ] RESEND_API_KEY
- [ ] OPENAI_API_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY

---

# ✅ READY FOR YOUR APPROVAL

**Please review this migration guide and confirm:**
1. You want to proceed with creating all tables in your Supabase project
2. You want to deploy all edge functions
3. You have the required API keys (Resend, OpenAI, Stripe)

**Reply "APPROVED" to proceed with the migration.**
