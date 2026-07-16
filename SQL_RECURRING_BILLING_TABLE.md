# Recurring Billing - SQL Migration Script

Copy and paste this ENTIRE script into your Supabase SQL Editor and click **Run**.

This adds recurring billing / subscription tracking to the existing `clients` table
so a LevelWorks user can put a customer on a monthly charge and see a "past due"
status if Stripe reports a failed payment.

---

```sql
-- ============================================
-- RECURRING BILLING - ALTER CLIENTS TABLE
-- ============================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_enabled BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_amount NUMERIC;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_interval_count INTEGER DEFAULT 1;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'none';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_started_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_payment_failed_at TIMESTAMPTZ;

-- Keep billing_status constrained to known values (drop/recreate so re-running this script is safe)
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_billing_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_billing_status_check
  CHECK (billing_status IN ('none', 'current', 'past_due', 'canceled'));

-- The webhook looks up a client by its Stripe subscription id
CREATE INDEX IF NOT EXISTS idx_clients_stripe_subscription_id ON clients(stripe_subscription_id);

-- Make sure the Stripe Connect column referenced by the app (profiles.stripe_account_id)
-- exists on projects that only ran the original SQL_1_PROFILES_TABLE.md script.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- ============================================
-- DONE! Recurring billing columns added.
-- ============================================
```

---

## After Running:

The `clients` table gains:
- `billing_enabled` (boolean) - true once a recurring subscription is active
- `billing_amount` (numeric) - the monthly amount charged to this client
- `billing_interval` (text) - `'month'` or `'year'`
- `billing_interval_count` (integer) - how many `billing_interval` units between charges (e.g. `3` + `'month'` = quarterly)
- `billing_status` (text) - `none` / `current` / `past_due` / `canceled`
- `stripe_customer_id` (text) - the Stripe Customer created on the contractor's connected account
- `stripe_subscription_id` (text) - the Stripe Subscription id, used to match incoming webhooks
- `billing_started_at` (timestamptz)
- `last_payment_failed_at` (timestamptz)

No new RLS policies are needed - the existing "own clients" policies on `clients` already
cover reads/writes from the app, and the webhook/edge functions use the Supabase
service role key, which bypasses RLS entirely.
