# CLIENTS Table SQL Script

Copy and paste this ENTIRE script into your Supabase SQL Editor and click **Run**.

---

```sql
-- ============================================
-- CLIENTS TABLE - STANDALONE SCRIPT
-- ============================================

-- Create the clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own clients
CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own clients
CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own clients
CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Apply trigger to clients table (uses the update_updated_at_column function)
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Clients table created successfully.
-- ============================================
```

---

## After Running:

Go to **Table Editor** in Supabase and you should see the `clients` table with these columns:
- id (uuid)
- user_id (uuid)
- name (text)
- email (text)
- phone (text)
- address (text)
- total_jobs (integer)
- total_value (numeric)
- created_at (timestamptz)
- updated_at (timestamptz)
