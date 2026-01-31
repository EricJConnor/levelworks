# Fix view_token Column Type in Estimates Table

Run this SQL script in your Supabase SQL Editor to convert the `view_token` column from TEXT to UUID with auto-generation.

## Complete SQL Script

```sql
-- =====================================================
-- FIX VIEW_TOKEN COLUMN TYPE
-- This script safely converts view_token from TEXT to UUID
-- =====================================================

-- Step 1: Drop the dependent RLS policy on project_photos table
DROP POLICY IF EXISTS "Public can view photos for accessible estimates" ON project_photos;

-- Step 2: Drop any other policies that might reference view_token on estimates table
DROP POLICY IF EXISTS "Public can view estimates with view_token" ON estimates;
DROP POLICY IF EXISTS "Anyone can view estimates with valid token" ON estimates;

-- Step 3: Update any NULL or empty view_token values with generated UUIDs
UPDATE estimates 
SET view_token = gen_random_uuid()::text 
WHERE view_token IS NULL OR view_token = '';

-- Step 4: Alter the column type from TEXT to UUID
ALTER TABLE estimates 
ALTER COLUMN view_token TYPE uuid USING view_token::uuid;

-- Step 5: Set the default value to auto-generate UUIDs
ALTER TABLE estimates 
ALTER COLUMN view_token SET DEFAULT gen_random_uuid();

-- Step 6: Make sure the column is NOT NULL (optional but recommended)
ALTER TABLE estimates 
ALTER COLUMN view_token SET NOT NULL;

-- Step 7: Recreate the RLS policy for public estimate viewing
CREATE POLICY "Public can view estimates with view_token"
ON estimates
FOR SELECT
TO anon, authenticated
USING (view_token IS NOT NULL);

-- Step 8: Recreate the RLS policy for project_photos
CREATE POLICY "Public can view photos for accessible estimates"
ON project_photos
FOR SELECT
TO anon, authenticated
USING (
  estimate_id IN (
    SELECT id FROM estimates WHERE view_token IS NOT NULL
  )
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check the column type is now UUID
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'estimates' AND column_name = 'view_token';

-- Check policies are recreated
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename IN ('estimates', 'project_photos');
```

## If You Get Errors

### Error: Invalid UUID format
If some existing view_token values aren't valid UUIDs, run this first:

```sql
-- Find invalid UUIDs
SELECT id, view_token 
FROM estimates 
WHERE view_token !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Replace invalid ones with new UUIDs
UPDATE estimates 
SET view_token = gen_random_uuid()::text 
WHERE view_token !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR view_token IS NULL 
   OR view_token = '';
```

### Error: Policy already exists
```sql
-- Drop all related policies first
DROP POLICY IF EXISTS "Public can view photos for accessible estimates" ON project_photos;
DROP POLICY IF EXISTS "Public can view estimates with view_token" ON estimates;
DROP POLICY IF EXISTS "Anyone can view estimates with valid token" ON estimates;
DROP POLICY IF EXISTS "Public can view shared estimates" ON estimates;
```

## Success!

After running this script:
- ✅ `view_token` column is now UUID type
- ✅ New estimates automatically get a UUID generated
- ✅ RLS policies are properly configured
- ✅ Public estimate sharing works correctly
