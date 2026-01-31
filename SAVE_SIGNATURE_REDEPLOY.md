# Redeploy save-signature Edge Function

Now that you've refreshed the schema, redeploy the `save-signature` function with the full signature_data support.

## Quick Deploy

Run this in your terminal:

```bash
supabase functions deploy save-signature
```

## Updated Function Code

Make sure your `supabase/functions/save-signature/index.ts` has this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { estimateId, signedByName, signedByEmail, signatureData } = body

    console.log('[save-signature] Saving signature for estimate:', estimateId)

    if (!estimateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing estimateId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Update the estimate with signature data using service role key
    const updateData = {
      signed_at: new Date().toISOString(),
      signed_by_name: signedByName,
      signed_by_email: signedByEmail,
      signature_data: signatureData
    }

    console.log('[save-signature] Updating estimate with fields:', Object.keys(updateData))

    const response = await fetch(
      `${supabaseUrl}/rest/v1/estimates?id=eq.${estimateId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[save-signature] Update failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `Update failed: ${response.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log('[save-signature] Signature saved successfully')
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[save-signature] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

## That's It!

After redeploying, the "Sign and Accept Estimate" button will:
1. Save the signer's name
2. Save the signer's email  
3. Save the timestamp
4. Save the signature image (signature_data)

All fields will now be saved properly since the schema cache is refreshed.
