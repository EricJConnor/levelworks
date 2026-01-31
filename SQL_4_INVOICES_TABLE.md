# INVOICES Table SQL Script

Copy and paste this ENTIRE script into your Supabase SQL Editor and click **Run**.

---

```sql
-- ============================================
-- INVOICES TABLE - STANDALONE SCRIPT
-- ============================================

-- Create the invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  view_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own invoices
CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own invoices
CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own invoices
CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Public can view invoices via view_token (for client viewing/payment)
CREATE POLICY "Public can view invoices by token" ON invoices
  FOR SELECT USING (view_token IS NOT NULL);

-- RLS Policy: Public can update invoices (for payment recording)
CREATE POLICY "Public can update invoices for payment" ON invoices
  FOR UPDATE USING (view_token IS NOT NULL);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_view_token ON invoices(view_token);

-- Apply trigger to invoices table
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Invoices table created successfully.
-- ============================================
```

---

## After Running:

Go to **Table Editor** in Supabase and you should see the `invoices` table with these columns:
- id (uuid)
- user_id (uuid)
- estimate_id (uuid)
- invoice_number (text)
- client_name (text)
- client_email (text)
- client_phone (text)
- project_name (text)
- line_items (jsonb)
- tax_rate (numeric)
- total (numeric)
- amount_paid (numeric)
- payment_history (jsonb)
- status (text)
- issue_date (timestamptz)
- due_date (timestamptz)
- notes (text)
- view_token (uuid)
- created_at (timestamptz)
- updated_at (timestamptz)
- sent_at (timestamptz)

**NOTE:** This table references the `estimates` table, so make sure you've created the estimates table first!
