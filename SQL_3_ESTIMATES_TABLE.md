# ESTIMATES Table SQL Script

Copy and paste this ENTIRE script into your Supabase SQL Editor and click **Run**.

---

```sql
-- ============================================
-- ESTIMATES TABLE - STANDALONE SCRIPT
-- ============================================

-- Create the estimates table
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  view_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own estimates
CREATE POLICY "Users can view own estimates" ON estimates
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own estimates
CREATE POLICY "Users can insert own estimates" ON estimates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own estimates
CREATE POLICY "Users can update own estimates" ON estimates
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own estimates
CREATE POLICY "Users can delete own estimates" ON estimates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Public can view estimates via view_token (for client viewing)
CREATE POLICY "Public can view estimates by token" ON estimates
  FOR SELECT USING (view_token IS NOT NULL);

-- RLS Policy: Public can update estimates (for signing)
CREATE POLICY "Public can sign estimates" ON estimates
  FOR UPDATE USING (view_token IS NOT NULL);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_view_token ON estimates(view_token);

-- Apply trigger to estimates table
DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates;
CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Estimates table created successfully.
-- ============================================
```

---

## After Running:

Go to **Table Editor** in Supabase and you should see the `estimates` table with these columns:
- id (uuid)
- user_id (uuid)
- client_name (text)
- client_email (text)
- client_phone (text)
- project_name (text)
- line_items (jsonb)
- tax_rate (numeric)
- deposit (numeric)
- total (numeric)
- status (text)
- view_token (uuid)
- created_at (timestamptz)
- updated_at (timestamptz)
- sent_at (timestamptz)
- read_at (timestamptz)
- signed_at (timestamptz)
- signed_by_name (text)
- signed_by_email (text)
