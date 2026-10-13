// create-subscription: the $5 a month plan, started from inside the app.
//
// Deployed on Supabase (verify_jwt off, as it always was; the app passes the user id
// and a payment method it just tokenised). This copy is the source of truth; deploy
// it with the Supabase tools after editing.
//
// Oct 13 2026: a customer subscribing before his trial ended was charged on the spot
// and lost his remaining free days. Now the subscription's trial end comes from the
// user's own `subscriptions` row, never from the request: Stripe starts billing when
// the free days run out. If Stripe refuses the trial end (too close to now), the
// subscription is created without one, which is the old behaviour.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const stripePriceId = Deno.env.get('STRIPE_PRICE_ID')!

    const { userId, userEmail, paymentMethodId } = await req.json()

    if (!userId || !userEmail || !paymentMethodId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // The free days he still has, from his own row. Only a future trial end counts.
    let trialEndUnix = 0
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=status,trial_end`, {
        headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${supabaseServiceKey}` }
      })
      const rows = await r.json()
      const row = Array.isArray(rows) ? rows[0] : null
      if (row && row.status === 'trial' && row.trial_end) {
        const t = Math.floor(new Date(row.trial_end).getTime() / 1000)
        if (t > Math.floor(Date.now() / 1000) + 60) trialEndUnix = t
      }
    } catch { /* no row, no trial: bill now as before */ }

    // Create Stripe customer
    const customerRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: userEmail, payment_method: paymentMethodId, 'invoice_settings[default_payment_method]': paymentMethodId })
    })
    const customer = await customerRes.json()
    if (customer.error) throw new Error(customer.error.message)

    // Create subscription, keeping the remaining free days when there are any
    const createSub = async (withTrial: boolean) => {
      const params = new URLSearchParams({
        customer: customer.id,
        'items[0][price]': stripePriceId,
        'default_payment_method': paymentMethodId,
      })
      if (withTrial && trialEndUnix) params.set('trial_end', String(trialEndUnix))
      const res = await fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      })
      return res.json()
    }
    let subscription = await createSub(true)
    if (subscription.error && trialEndUnix && /trial_end/i.test(subscription.error.message || '')) {
      subscription = await createSub(false)
    }
    if (subscription.error) throw new Error(subscription.error.message)

    // Update subscription record in Supabase
    await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'active',
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
    })

    return new Response(JSON.stringify({ success: true, customerId: customer.id, subscriptionId: subscription.id, trialKeptUntil: trialEndUnix ? new Date(trialEndUnix * 1000).toISOString() : null }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
