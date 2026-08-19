# Add `business_email` Column to PROFILES

The onboarding screen (`/welcome`) collects a business contact email. Everything
else it saves — company name, phone number, and logo — already exists on the
`profiles` table. This adds the one new column.

**This is optional.** If you don't run it, onboarding still works: saving falls
back to storing the other fields and the email is simply not persisted.

Copy this into your Supabase SQL Editor and click **Run**.

---

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS business_email TEXT DEFAULT '';
```

---

## After Running:

Go to **Table Editor** → `profiles` and confirm the `business_email` column is
there. No RLS or policy changes are needed — the existing profile policies cover
the new column.
