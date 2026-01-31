# 🚀 Deploy Edge Functions - Resend Email Integration

## Prerequisites ✅
You already have:
- ✅ Resend API Key configured (`RESEND_API_KEY` secret in Supabase)
- ✅ Domain verified in Resend: levelworks.org
- ✅ All secrets added to Supabase

## Quick Deploy (5 minutes)

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login and Link
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Create Function Files

Create these function files in your project:

---

#### `supabase/functions/send-email/index.ts`

This is the core email function that handles all email templates using **Resend**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDER_EMAIL = 'noreply@levelworks.org'
const SENDER_NAME = 'Level Works'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email templates with proper styling
const getEmailTemplate = (templateType: string, data: Record<string, any>): { subject: string; html: string } => {
  const buttonStyle = 'background-color:#10b981;border:1px solid #10b981;border-radius:8px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:220px;'
  
  switch (templateType) {
    case 'estimate_sent':
      return {
        subject: `New Estimate from Level Works - ${data.projectName || 'Your Project'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#10b981;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Level Works</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px;color:#18181b;font-size:24px;">New Estimate Ready</h2>
              <p style="margin:0 0 15px;color:#52525b;font-size:16px;line-height:1.6;">
                Hi ${data.clientName || 'there'},
              </p>
              <p style="margin:0 0 25px;color:#52525b;font-size:16px;line-height:1.6;">
                You have a new estimate ready for review:
              </p>
              <!-- Estimate Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:8px;margin-bottom:30px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Project</p>
                    <p style="margin:0 0 20px;color:#18181b;font-size:18px;font-weight:600;">${data.projectName || 'Your Project'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Estimated Total</p>
                    <p style="margin:0;color:#10b981;font-size:28px;font-weight:bold;">$${data.amount || '0.00'}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.estimateUrl}" style="${buttonStyle}">View Estimate</a>
                  </td>
                </tr>
              </table>
              <p style="margin:30px 0 0;color:#a1a1aa;font-size:14px;text-align:center;">
                Click the button above to view details and sign your estimate.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f4f5;padding:20px 30px;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} Level Works. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }
    
    case 'estimate_signed':
      return {
        subject: `Estimate Signed! - ${data.projectName || 'Project'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#10b981;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Level Works</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;text-align:center;">
              <div style="width:80px;height:80px;background-color:#dcfce7;border-radius:50%;margin:0 auto 20px;line-height:80px;">
                <span style="font-size:40px;color:#10b981;">✓</span>
              </div>
              <h2 style="margin:0 0 20px;color:#18181b;font-size:24px;">Estimate Signed!</h2>
              <p style="margin:0 0 25px;color:#52525b;font-size:16px;line-height:1.6;">
                Great news! ${data.signedByName || 'Your client'} has signed the estimate for <strong>${data.projectName || 'your project'}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:8px;margin-bottom:30px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Signed By</p>
                    <p style="margin:0 0 15px;color:#18181b;font-size:16px;font-weight:600;">${data.signedByName || 'Client'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Amount</p>
                    <p style="margin:0;color:#10b981;font-size:24px;font-weight:bold;">$${data.amount || '0.00'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f5;padding:20px 30px;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} Level Works. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }

    case 'invoice_sent':
      return {
        subject: `Invoice ${data.invoiceNumber || ''} from Level Works`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#3b82f6;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Level Works</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px;color:#18181b;font-size:24px;">Invoice Ready</h2>
              <p style="margin:0 0 15px;color:#52525b;font-size:16px;line-height:1.6;">
                Hi ${data.clientName || 'there'},
              </p>
              <p style="margin:0 0 25px;color:#52525b;font-size:16px;line-height:1.6;">
                Your invoice is ready for payment:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:8px;margin-bottom:30px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Invoice Number</p>
                    <p style="margin:0 0 20px;color:#18181b;font-size:18px;font-weight:600;">${data.invoiceNumber || 'N/A'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Project</p>
                    <p style="margin:0 0 20px;color:#18181b;font-size:18px;font-weight:600;">${data.projectName || 'Your Project'}</p>
                    <p style="margin:0 0 10px;color:#71717a;font-size:14px;">Amount Due</p>
                    <p style="margin:0;color:#3b82f6;font-size:28px;font-weight:bold;">$${data.amountDue || data.amount || '0.00'}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.invoiceUrl || data.paymentUrl}" style="background-color:#3b82f6;border:1px solid #3b82f6;border-radius:8px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:220px;">View & Pay Invoice</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f5;padding:20px 30px;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} Level Works. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }

    default:
      return {
        subject: data.subject || 'Message from Level Works',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <p>${data.message || 'You have a new message from Level Works.'}</p>
</body>
</html>`
      }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { to, subject, templateType, data, html } = body

    console.log('[send-email] Received request:', { to, templateType, data })

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing recipient email' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!RESEND_API_KEY) {
      console.error('[send-email] RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Get email content from template or use provided HTML
    let emailSubject = subject
    let emailHtml = html

    if (templateType && data) {
      const template = getEmailTemplate(templateType, data)
      emailSubject = emailSubject || template.subject
      emailHtml = template.html
      console.log('[send-email] Using template:', templateType)
      console.log('[send-email] Template data:', JSON.stringify(data))
      console.log('[send-email] estimateUrl in data:', data.estimateUrl)
    }

    console.log('[send-email] Sending email to:', to)
    console.log('[send-email] Subject:', emailSubject)

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    console.log('[send-email] Resend response status:', resendResponse.status)

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('[send-email] Resend error:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: `Resend error: ${errorData.message || resendResponse.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const responseData = await resendResponse.json()
    console.log('[send-email] Email sent successfully, id:', responseData.id)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', id: responseData.id }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[send-email] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

#### `supabase/functions/send-estimate/index.ts`

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
    const { estimateId, viewToken, clientEmail, sendEmail, estimateData } = body

    console.log('[send-estimate] Received:', { estimateId, viewToken, clientEmail, sendEmail })

    if (!viewToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing viewToken' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Build the public estimate URL
    const baseUrl = 'https://levelworks.org'
    const estimateUrl = `${baseUrl}/view-estimate/${viewToken}`

    console.log('[send-estimate] Generated estimateUrl:', estimateUrl)

    const results = { email: null, errors: [] as string[] }

    // Send email if requested
    if (sendEmail && clientEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

      const totalAmount = Number(estimateData?.total || 0)
      const clientName = String(estimateData?.clientName || 'Client')
      const projectName = String(estimateData?.projectName || 'Project')

      // Call the send-email function with template data
      const emailPayload = {
        to: clientEmail,
        templateType: 'estimate_sent',
        data: {
          clientName: clientName,
          projectName: projectName,
          amount: totalAmount.toFixed(2),
          estimateUrl: estimateUrl
        }
      }

      console.log('[send-estimate] Calling send-email with payload:', JSON.stringify(emailPayload))

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      const emailResult = await emailResponse.json()
      console.log('[send-estimate] Email result:', emailResult)

      if (!emailResponse.ok || emailResult.error) {
        results.errors.push(`Email error: ${emailResult.error || 'Unknown error'}`)
      }
      results.email = emailResult
    }

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        estimateUrl,
        ...results,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[send-estimate] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

#### `supabase/functions/send-invoice/index.ts`

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
    const { invoiceId, clientEmail, sendEmail, invoiceData } = body

    console.log('[send-invoice] Received:', { invoiceId, clientEmail, sendEmail })

    const viewToken = invoiceData?.viewToken
    if (!viewToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing viewToken in invoiceData' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Build the public invoice URL
    const baseUrl = 'https://levelworks.org'
    const invoiceUrl = `${baseUrl}/view-invoice/${viewToken}`

    console.log('[send-invoice] Generated invoiceUrl:', invoiceUrl)

    const results = { email: null, errors: [] as string[] }

    // Send email if requested
    if (sendEmail && clientEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

      const emailPayload = {
        to: clientEmail,
        templateType: 'invoice_sent',
        data: {
          clientName: String(invoiceData?.clientName || 'Client'),
          projectName: String(invoiceData?.projectName || 'Project'),
          invoiceNumber: String(invoiceData?.invoiceNumber || ''),
          amount: Number(invoiceData?.total || 0).toFixed(2),
          amountDue: Number(invoiceData?.amountDue || invoiceData?.total || 0).toFixed(2),
          invoiceUrl: invoiceUrl,
          paymentUrl: invoiceUrl
        }
      }

      console.log('[send-invoice] Calling send-email with payload:', JSON.stringify(emailPayload))

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      const emailResult = await emailResponse.json()
      console.log('[send-invoice] Email result:', emailResult)

      if (!emailResponse.ok || emailResult.error) {
        results.errors.push(`Email error: ${emailResult.error || 'Unknown error'}`)
      }
      results.email = emailResult
    }

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        invoiceUrl,
        ...results,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[send-invoice] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

#### `supabase/functions/notify-signature/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { viewToken, signatureData, signedByName, signedByEmail, contractorEmail, estimateData } = body

    console.log('[notify-signature] Received:', { viewToken, signedByName, contractorEmail })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update the estimate with signature info
    const { error: updateError } = await supabase
      .from('estimates')
      .update({
        signed_at: new Date().toISOString(),
        signed_by_name: signedByName,
        signed_by_email: signedByEmail,
        signature_data: signatureData,
      })
      .eq('view_token', viewToken)

    if (updateError) {
      console.error('[notify-signature] Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Send notification email to contractor
    if (contractorEmail) {
      const emailPayload = {
        to: contractorEmail,
        templateType: 'estimate_signed',
        data: {
          signedByName: signedByName || 'Client',
          signedByEmail: signedByEmail || '',
          projectName: estimateData?.projectName || 'Project',
          amount: Number(estimateData?.total || 0).toFixed(2),
        }
      }

      console.log('[notify-signature] Sending notification email:', emailPayload)

      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('[notify-signature] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

---

### 4. Deploy All Functions

```bash
supabase functions deploy send-email
supabase functions deploy send-estimate
supabase functions deploy send-invoice
supabase functions deploy notify-signature
```

## ✅ Configuration Summary

| Setting | Value |
|---------|-------|
| Email Provider | Resend |
| Sender Email | `noreply@levelworks.org` |
| Sender Name | Level Works |
| API Key Secret | `RESEND_API_KEY` |
| Domain | levelworks.org (verified) |

## ✅ Done!

Your Level Works app is now fully functional with Resend email notifications!

---

## Email Template Preview

### Estimate Email (estimate_sent)

The "View Estimate" button will have this HTML:

```html
<a href="https://levelworks.org/view-estimate/{view_token}" style="background-color:#10b981;border:1px solid #10b981;border-radius:8px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:220px;">View Estimate</a>
```

The `{view_token}` is replaced with the actual token from the estimate, creating a working link like:
`https://levelworks.org/view-estimate/abc123-def456-ghi789`

---

## Troubleshooting

### Button href is empty
If the button still has no href, check:
1. The `viewToken` is being passed from the frontend
2. The `estimateUrl` is being logged in the edge function
3. The `send-email` function is receiving the `data.estimateUrl` value

### Check Edge Function Logs
```bash
supabase functions logs send-estimate
supabase functions logs send-email
```

Look for these log lines:
- `[send-estimate] Generated estimateUrl: https://levelworks.org/view-estimate/...`
- `[send-email] estimateUrl in data: https://levelworks.org/view-estimate/...`

### Common Resend Errors

| Error | Solution |
|-------|----------|
| `validation_error` | Check email format and required fields |
| `missing_api_key` | Ensure `RESEND_API_KEY` is set in Supabase secrets |
| `invalid_from_address` | Make sure domain is verified in Resend |
| `rate_limit_exceeded` | You've hit Resend's rate limits |

### Verify Resend API Key
Test your API key directly:
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_RESEND_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Level Works <noreply@levelworks.org>",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "html": "<p>This is a test email from Level Works.</p>"
  }'
```
