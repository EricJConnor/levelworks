import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.5.0'

// Deploy with: supabase functions deploy stripe-recurring-webhook --no-verify-jwt
// Stripe posts here directly, so this endpoint can't require a Supabase user JWT.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})
const webhookSecret = Deno.env.get('STRIPE_RECURRING_WEBHOOK_SECRET') ?? ''
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const admin = createClient(supabaseUrl, serviceKey)

const escapeHtml = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const sendOwnerAlert = async (client: Record<string, any>) => {
  const { data: ownerUser } = await admin.auth.admin.getUserById(client.user_id)
  const ownerEmail = ownerUser?.user?.email
  if (!ownerEmail) return

  const amount = Number(client.billing_amount || 0).toFixed(2)
  const clientName = escapeHtml(client.name || 'A client')
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="background-color:#dc2626;padding:30px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">Payment Failed</h1>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <p style="margin:0 0 15px;color:#52525b;font-size:16px;line-height:1.6;">
            A recurring payment for <strong>${clientName}</strong> failed to process.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:8px;margin-bottom:25px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Monthly amount</p>
              <p style="margin:0;color:#dc2626;font-size:24px;font-weight:bold;">$${amount}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 10px;color:#52525b;font-size:15px;line-height:1.6;">
            Stripe will automatically retry the charge and email the customer reminders - no action is required there.
          </p>
          <p style="margin:0;color:#52525b;font-size:15px;line-height:1.6;">
            This client is now marked <strong>past due</strong> on your LevelWorks dashboard. You may want to reach out directly.
          </p>
        </td></tr>
        <tr><td style="background-color:#f4f4f5;padding:20px 30px;text-align:center;">
          <p style="margin:0;color:#71717a;font-size:12px;">© ${new Date().getFullYear()} Level Works. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: ownerEmail, subject: `Payment failed: ${client.name || 'a client'} is past due`, html }),
  })
}

const markPastDue = async (subscriptionId: string) => {
  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single()
  if (!client) return

  const wasAlreadyPastDue = client.billing_status === 'past_due'

  await admin
    .from('clients')
    .update({ billing_status: 'past_due', last_payment_failed_at: new Date().toISOString() })
    .eq('id', client.id)

  // Only email the first time a subscription goes past due, not on every retry.
  if (!wasAlreadyPastDue) await sendOwnerAlert(client)
}

const markCurrent = async (subscriptionId: string) => {
  await admin
    .from('clients')
    .update({ billing_status: 'current' })
    .eq('stripe_subscription_id', subscriptionId)
    .eq('billing_status', 'past_due')
}

const markCanceled = async (subscriptionId: string) => {
  await admin
    .from('clients')
    .update({ billing_enabled: false, billing_status: 'canceled' })
    .eq('stripe_subscription_id', subscriptionId)
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    if (!signature || !webhookSecret) throw new Error('Missing signature or webhook secret')
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider)
  } catch (err) {
    console.error('[stripe-recurring-webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : 'invalid signature'}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null
        if (subscriptionId) await markPastDue(subscriptionId)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null
        if (subscriptionId) await markCurrent(subscriptionId)
        break
      }
      case 'customer.subscription.updated': {
        // Stripe has no discrete "past_due" event - it's reported via subscription.updated.
        const sub = event.data.object as Stripe.Subscription
        if (sub.status === 'past_due') await markPastDue(sub.id)
        else if (sub.status === 'active') await markCurrent(sub.id)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await markCanceled(sub.id)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[stripe-recurring-webhook] Handler error:', err instanceof Error ? err.message : err)
    return new Response('Internal error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
