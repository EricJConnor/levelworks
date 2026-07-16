import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) return json({ error: 'Not authenticated' }, 401)

    const admin = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    const { action, clientId } = body

    if (!clientId) return json({ error: 'Missing clientId' }, 400)

    const { data: clientRow, error: clientErr } = await admin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()
    if (clientErr || !clientRow) return json({ error: 'Client not found' }, 404)

    const { data: profileRow } = await admin
      .from('profiles')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()
    const stripeAccountId = profileRow?.stripe_account_id
    if (!stripeAccountId) return json({ error: 'Connect your Stripe account before setting up recurring billing.' }, 400)

    if (action === 'create_setup_intent') {
      if (!clientRow.email) return json({ error: 'Add an email address for this client first - Stripe uses it to send payment reminders.' }, 400)

      let stripeCustomerId: string | null = clientRow.stripe_customer_id
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create(
          { email: clientRow.email, name: clientRow.name || undefined },
          { stripeAccount: stripeAccountId }
        )
        stripeCustomerId = customer.id
        await admin.from('clients').update({ stripe_customer_id: stripeCustomerId }).eq('id', clientId)
      }

      const setupIntent = await stripe.setupIntents.create(
        { customer: stripeCustomerId, usage: 'off_session', payment_method_types: ['card'] },
        { stripeAccount: stripeAccountId }
      )

      return json({ clientSecret: setupIntent.client_secret, stripeAccountId, stripeCustomerId })
    }

    if (action === 'activate_subscription') {
      const { paymentMethodId, amount } = body
      const numAmount = Number(amount)
      if (!paymentMethodId) return json({ error: 'Missing payment method' }, 400)
      if (!numAmount || numAmount <= 0) return json({ error: 'Enter a valid monthly amount' }, 400)
      if (!clientRow.stripe_customer_id) return json({ error: 'Set up a card for this client first' }, 400)

      const subscription = await stripe.subscriptions.create(
        {
          customer: clientRow.stripe_customer_id,
          items: [
            {
              price_data: {
                currency: 'usd',
                unit_amount: Math.round(numAmount * 100),
                recurring: { interval: 'month' },
                product_data: { name: `${clientRow.name || 'Client'} - Recurring Billing` },
              },
            },
          ],
          default_payment_method: paymentMethodId,
          expand: ['latest_invoice.payment_intent'],
        },
        { stripeAccount: stripeAccountId }
      )

      const billingStatus = subscription.status === 'active' || subscription.status === 'trialing' ? 'current' : 'past_due'

      await admin
        .from('clients')
        .update({
          billing_enabled: true,
          billing_amount: numAmount,
          billing_interval: 'month',
          billing_status: billingStatus,
          stripe_subscription_id: subscription.id,
          billing_started_at: new Date().toISOString(),
        })
        .eq('id', clientId)

      const latestInvoice = subscription.latest_invoice
      const paymentIntent = typeof latestInvoice === 'object' ? latestInvoice?.payment_intent : undefined
      const requiresAction = typeof paymentIntent === 'object' && paymentIntent?.status === 'requires_action'

      return json({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        requiresAction,
        clientSecret: requiresAction && typeof paymentIntent === 'object' ? paymentIntent.client_secret : undefined,
      })
    }

    if (action === 'cancel_subscription') {
      if (!clientRow.stripe_subscription_id) return json({ error: 'No active subscription for this client' }, 400)

      await stripe.subscriptions.cancel(clientRow.stripe_subscription_id, {}, { stripeAccount: stripeAccountId })

      await admin
        .from('clients')
        .update({ billing_enabled: false, billing_status: 'canceled' })
        .eq('id', clientId)

      return json({ success: true })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (err) {
    console.error('[manage-recurring-billing] Error:', err instanceof Error ? err.message : err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
