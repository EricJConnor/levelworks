# AI_CHAT_HISTORY Table SQL Script

Copy and paste this ENTIRE script into your Supabase SQL Editor and click **Run**.

---

```sql
-- ============================================
-- AI_CHAT_HISTORY TABLE - STANDALONE SCRIPT
-- ============================================

-- Create the ai_chat_history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own chat history
CREATE POLICY "Users can view own chat history" ON ai_chat_history
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own chat messages
CREATE POLICY "Users can insert own chat messages" ON ai_chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own chat history
CREATE POLICY "Users can delete own chat history" ON ai_chat_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);

-- ============================================
-- DONE! AI_chat_history table created successfully.
-- ============================================
```

---

## After Running:

Go to **Table Editor** in Supabase and you should see the `ai_chat_history` table with these columns:
- id (uuid)
- user_id (uuid)
- role (text)
- content (text)
- timestamp (timestamptz)
