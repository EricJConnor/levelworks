# Add Signature Data Column to Estimates Table

Copy and paste this script into your Supabase SQL Editor and click **Run**.

---

```sql
-- ============================================
-- ADD SIGNATURE_DATA COLUMN TO ESTIMATES TABLE
-- ============================================

-- Add the signature_data column to store the customer's digital signature
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN estimates.signature_data IS 'Base64 encoded signature image from customer';

-- ============================================
-- DONE! Signature column added successfully.
-- ============================================
```

---

## Why This Is Needed:

When customers sign estimates digitally, their signature is captured as a base64-encoded image. This column stores that signature so:

1. Contractors can view the actual signature in their dashboard
2. The signature serves as proof of agreement
3. It can be included in PDF exports or printed estimates

## After Running:

Your `estimates` table will now have a `signature_data` column that stores the customer's digital signature.
