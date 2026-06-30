# JOB_UPDATES Table SQL Script

Copy and paste this ENTIRE script into your Supabase SQL Editor and click **Run**.

---

```sql
-- ============================================
-- JOB_UPDATES TABLE
-- Supports named, repeatable project update
-- documents that can be sent to clients.
-- ============================================

-- Main updates table
CREATE TABLE IF NOT EXISTS job_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Project Update',
  description TEXT,
  view_token UUID,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link photos to updates (adds update_id column to existing project_photos table)
ALTER TABLE project_photos ADD COLUMN IF NOT EXISTS update_id UUID REFERENCES job_updates(id) ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own job updates" ON job_updates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_updates_user_id ON job_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_job_updates_job_id ON job_updates(job_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_update_id ON project_photos(update_id);

-- ============================================
-- Public views for the client-facing update page
-- (anon can read only via a secret view_token)
-- ============================================

CREATE OR REPLACE VIEW public_update_details AS
SELECT
  u.id,
  u.view_token,
  u.name,
  u.description,
  u.sent_at,
  u.created_at
FROM job_updates u
WHERE u.view_token IS NOT NULL;

CREATE OR REPLACE VIEW public_update_photos AS
SELECT
  u.view_token,
  p.id,
  p.file_url,
  p.caption
FROM project_photos p
JOIN job_updates u ON u.id = p.update_id
WHERE u.view_token IS NOT NULL;

CREATE OR REPLACE VIEW public_update_branding AS
SELECT
  u.view_token,
  pr.company_name,
  pr.profile_photo_url
FROM job_updates u
JOIN profiles pr ON pr.user_id = u.user_id
WHERE u.view_token IS NOT NULL;

GRANT SELECT ON public_update_details TO anon;
GRANT SELECT ON public_update_photos TO anon;
GRANT SELECT ON public_update_branding TO anon;

-- ============================================
-- DONE!
-- ============================================
```

---

## After Running:

You'll have a new `job_updates` table with these columns:
- `id` (uuid) — unique ID for each update document
- `user_id` (uuid) — which contractor owns it
- `job_id` (uuid, optional) — links to a job/estimate if applicable
- `name` (text) — the document's title ("Week 1 Progress", "Final Walkthrough", etc.)
- `description` (text) — message/summary to the client
- `view_token` (uuid) — the secret token used to generate the shareable link
- `sent_at` (timestamptz) — when the link was last sent
- `created_at` (timestamptz)

And `project_photos` gets a new `update_id` column so photos can belong to an update document.
