# Recurring Billing + Payment Alerts - Setup

This feature lets a LevelWorks user put a client on a monthly charge (via the
client's connected Stripe account - the same one used for one-off invoice
payments), and alerts the account owner by email if Stripe reports a failed
payment.

## 1. Run the SQL migration

Run `SQL_RECURRING_BILLING_TABLE.md` in the Supabase SQL Editor. It adds
billing columns to the `clients` table.

## 2. Deploy the new edge functions

```bash
supabase functions deploy manage-recurring-billing
supabase functions deploy stripe-recurring-webhook --no-verify-jwt
```

`manage-recurring-billing` is called by the logged-in app user (Authorization
header carries their session), so it keeps normal JWT verification.
`stripe-recurring-webhook` is called directly by Stripe, so it must be
deployed with `--no-verify-jwt`.

## 3. Add a secret for the new webhook

In the Stripe Dashboard, create a webhook endpoint pointing at:

```
https://<your-project-ref>.supabase.co/functions/v1/stripe-recurring-webhook
```

Select these events:
- `invoice.payment_failed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

> Note: Stripe doesn't have a discrete "subscription past due" event - a
> subscription moving to `past_due` shows up as a `customer.subscription.updated`
> event with `status: "past_due"`. The webhook function checks for that itself;
> just make sure `customer.subscription.updated` is one of the selected events.

Copy the endpoint's signing secret and add it as a Supabase Edge Function secret:

```bash
supabase secrets set STRIPE_RECURRING_WEBHOOK_SECRET=whsec_...
```

This is separate from any existing `STRIPE_WEBHOOK_SECRET` already used by the
platform's own subscription billing, so the two webhooks don't share a secret.

## 4. Existing secrets this feature reuses

No new secrets are needed beyond the one above - `manage-recurring-billing`
and `stripe-recurring-webhook` reuse:
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY` (indirectly, via the existing `send-email` function)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (set automatically for all edge functions)

## How it works

1. A user opens a client in the Clients tab and enters a monthly amount + card.
   The card is confirmed via a Stripe SetupIntent scoped to the user's connected
   Stripe account (`profiles.stripe_account_id` - the same OAuth connection used
   for invoice payments), so the money goes straight to the contractor, not
   LevelWorks.
2. `manage-recurring-billing` creates a Stripe Customer + Subscription on that
   connected account and stores `stripe_customer_id` / `stripe_subscription_id`
   / `billing_status` on the `clients` row.
3. Stripe charges the card monthly, retries failed payments, and emails the
   customer reminders automatically - none of that is built here.
4. When a charge fails, `stripe-recurring-webhook` marks the client `past_due`
   in the database and emails the account owner (looked up via
   `auth.admin.getUserById`) using the existing `send-email` function. It only
   sends one alert per past-due episode, not on every Stripe retry.
5. When a later retry succeeds, the same webhook flips the client back to
   `current`.

## Out of scope (Phase 1)

- No auto-shutoff of a client's site/service on non-payment.
- No custom reminder email templates/logic - Stripe's default dunning emails
  are used as-is.

Phase 2 (auto-shutoff for ECWD hosted clients, configurable grace periods) is
not implemented.
