-- =====================================================================
-- Close the hole: estimates and invoices are readable by anyone
-- =====================================================================
--
-- Found Sep 20 2026. The `estimates` and `invoices` tables have no row
-- level security, so ANY visitor to levelworks.org can read EVERY
-- contractor's rows. Not "any signed-in user" as the notes said — anybody
-- at all. The anon key that unlocks it is in the site's JavaScript, which
-- is public by design; the key was never the secret, the row policy was
-- supposed to be.
--
-- Verified from outside, signed in as nobody:
--   estimates  42 rows, including client_name, client_email, client_phone,
--              client address and every line and price
--   invoices   15 rows, the same
--   clients, profiles, jobs, line_titles — 0 rows. Those are already fine.
--
-- So the hole is exactly two tables, and this file closes it.
--
-- WHY IT WAS LEFT OPEN, and why that is not a reason to leave it open:
-- the public links (/view-estimate/<token>, /view-invoice/<token>) read the
-- table straight from the browser with the anon key. Turning on row level
-- security naively would break every estimate a contractor has ever sent.
-- So the public path moves to two SECURITY DEFINER functions that take the
-- token and return one row. The token is a UUID, 122 random bits, and is
-- already the only thing protecting those links. Nothing about what a
-- client can see changes; what changes is that you can no longer ask for
-- everyone else's.
--
-- A function is used rather than a view on purpose: a readable view can be
-- listed with no filter at all, which is exactly the bug being fixed. A
-- function cannot be asked for "all rows" — it only answers a token.
--
-- HOW TO RUN IT: Supabase dashboard -> SQL Editor -> New query -> paste
-- this whole file -> Run. It is safe to run twice.
--
-- ORDER MATTERS: deploy the site first (it already calls the functions),
-- then run this. The functions are created before RLS is switched on in
-- the same transaction, so there is no window where the links are broken.

begin;

-- ---------------------------------------------------------------------
-- 1. The public path: one row, by token, and nothing else.
-- ---------------------------------------------------------------------

create or replace function public.estimate_by_token(t text)
returns setof public.estimates
language sql
security definer
stable
set search_path = public
as $$
  select * from public.estimates
  where view_token is not null
    and view_token::text = t
  limit 1;
$$;

create or replace function public.invoice_by_token(t text)
returns setof public.invoices
language sql
security definer
stable
set search_path = public
as $$
  select * from public.invoices
  where view_token is not null
    and view_token::text = t
  limit 1;
$$;

-- An empty or missing token must never match a row. Belt and braces on top
-- of the `view_token is not null` above.
revoke all on function public.estimate_by_token(text) from public;
revoke all on function public.invoice_by_token(text) from public;
grant execute on function public.estimate_by_token(text) to anon, authenticated;
grant execute on function public.invoice_by_token(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Lock the tables. A contractor sees his own rows and nobody else's.
-- ---------------------------------------------------------------------
-- The server routes under /api use the service role key, which bypasses
-- row level security by design, so nothing server-side changes.

alter table public.estimates enable row level security;
alter table public.invoices  enable row level security;

-- Older Postgres has no "create policy if not exists", so drop first.
drop policy if exists "estimates are the owner's" on public.estimates;
create policy "estimates are the owner's"
  on public.estimates
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "invoices are the owner's" on public.invoices;
create policy "invoices are the owner's"
  on public.invoices
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;

-- =====================================================================
-- CHECK IT WORKED
-- =====================================================================
-- Run these as a second query, or just load a shared estimate link and a
-- contractor's own Estimates list. Both must still work.
--
--   select count(*) from public.estimates;   -- as service role: 42
--
-- From outside, with only the anon key, this must now return nothing:
--   GET /rest/v1/estimates?select=id
--
-- And this must still return exactly one row:
--   POST /rest/v1/rpc/estimate_by_token   { "t": "<a real view token>" }
--
-- =====================================================================
-- STILL OPEN AFTER THIS, smaller and worth a look
-- =====================================================================
-- `public_estimate_branding` (37 rows) and `public_invoice_branding` (12)
-- can still be listed with no token. They carry only a company name and a
-- logo, so it is a list of who uses LevelWorks rather than anyone's client
-- data. Lower severity, same shape of fix: turn each into a function that
-- takes the token. Left out of this file so the urgent change stays small
-- and easy to read.
