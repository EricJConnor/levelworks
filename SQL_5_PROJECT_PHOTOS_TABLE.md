# PROJECT_PHOTOS Table SQL Script

Copy and paste this ENTIRE script into your Supabase SQL Editor and click **Run**.

---

```sql
-- ============================================
-- PROJECT_PHOTOS TABLE - STANDALONE SCRIPT
-- ============================================

-- Create the project_photos table
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own photos
CREATE POLICY "Users can view own photos" ON project_photos
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own photos
CREATE POLICY "Users can insert own photos" ON project_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos" ON project_photos
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Public can view photos for estimates they can access
CREATE POLICY "Public can view photos for accessible estimates" ON project_photos
  FOR SELECT USING (
    estimate_id IN (SELECT id FROM estimates WHERE view_token IS NOT NULL)
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_project_photos_user_id ON project_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_estimate_id ON project_photos(estimate_id);

-- ============================================
-- DONE! Project_photos table created successfully.
-- ============================================
```

---

## After Running:

Go to **Table Editor** in Supabase and you should see the `project_photos` table with these columns:
- id (uuid)
- user_id (uuid)
- estimate_id (uuid)
- file_url (text)
- caption (text)
- created_at (timestamptz)

**NOTE:** This table references the `estimates` table, so make sure you've created the estimates table first!
