import { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/i18n';

/**
 * The card form on a public invoice. The PaymentIntent is created before this
 * mounts (see PublicInvoiceView) on the contractor's connected Stripe account,
 * and the <Elements> provider around this form is scoped to that same account —
 * a client secret from a connected account cannot be confirmed with the
 * platform's Stripe instance. After the card goes through, the server re-reads
 * the intent from Stripe and marks the invoice paid; the browser's word alone
 * never changes an invoice.
 */
interface Props {
  /** 'bank' uses Stripe's bank-transfer flow instead of card fields. */
  method?: 'card' | 'bank';
  invoiceId: string;
  viewToken: string;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  onSuccess: (pending?: boolean) => void;
}

export function InvoicePaymentForm({ method = 'card', invoiceId, viewToken, clientSecret, paymentIntentId, amount, clientName, clientEmail, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(clientEmail || '');
  const [name, setName] = useState(clientName || '');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      let paymentIntent: any;
      if (method === 'bank') {
        /*
         * Bank transfer. Stripe collects the account through its own hosted
         * flow (Financial Connections), so there are no account numbers in
         * this page and nothing sensitive passes through LevelWorks. Unlike a
         * card it does not finish here: the intent goes to `processing` and
         * takes about four business days to clear.
         */
        const collected = await stripe.collectBankAccountForPayment({
          clientSecret,
          params: { payment_method_type: 'us_bank_account', payment_method_data: { billing_details: { name, email } } },
        });
        if (collected.error) throw new Error(collected.error.message);
        // The customer can abandon Stripe's bank picker; that is not a failure.
        if (collected.paymentIntent?.status === 'requires_payment_method') { setLoading(false); return; }
        const confirmed = await stripe.confirmUsBankAccountPayment(clientSecret);
        if (confirmed.error) throw new Error(confirmed.error.message);
        paymentIntent = confirmed.paymentIntent;
        if (!['processing', 'succeeded'].includes(paymentIntent?.status)) throw new Error(t('pg.inv.payFailedBody'));
      } else {
        const card = elements.getElement(CardNumberElement);
        if (!card) throw new Error('Card element not found');

        const res = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card, billing_details: { name, email } },
          receipt_email: email || undefined,
        });
        if (res.error) throw new Error(res.error.message);
        paymentIntent = res.paymentIntent;
        if (paymentIntent?.status !== 'succeeded') throw new Error(t('pg.inv.payFailedBody'));
      }

      // Record it. If this call fails the card was still charged, so say so
      // plainly rather than "failed": the contractor can reconcile from Stripe.
      const r = await fetch('/api/invoice-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', invoiceId, viewToken, paymentIntentId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok && !data?.ok) console.error('[InvoicePaymentForm] confirm failed', data);

      const pending = paymentIntent?.status === 'processing';
      toast({
        title: pending ? t('pg.inv.bankPending') : t('pg.inv.paidToast'),
        description: pending ? t('pg.inv.bankPendingBody') : t('pg.inv.paidToastBody'),
      });
      onSuccess(pending);
    } catch (err: any) {
      toast({ title: t('pg.inv.payFailed'), description: err?.message || t('pg.inv.payFailedBody'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const elementOptions = {
    style: { base: { fontSize: '16px', color: '#0b1220', fontFamily: 'Inter, system-ui, sans-serif', '::placeholder': { color: '#94a3b8' } } },
  };
  const box: React.CSSProperties = { border: '1px solid var(--lv-line, #e6e9ef)', borderRadius: 10, padding: '14px 12px', background: '#fff' };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <label className="lv-field">
          <span className="lv-label">{t('pg.inv.payName')}</span>
          <input className="lv-input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="cc-name" />
        </label>
        <label className="lv-field">
          <span className="lv-label">{t('pg.inv.payEmail')}</span>
          <input className="lv-input" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
      </div>
      {method === 'bank' ? (
        <p className="lv-small">{t('pg.inv.bankIntro')}</p>
      ) : (
        <>
          <div className="lv-field">
            <span className="lv-label">{t('pg.inv.cardNumber')}</span>
            <div style={box}><CardNumberElement options={elementOptions} /></div>
          </div>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
            <div className="lv-field">
              <span className="lv-label">{t('pg.inv.expiry')}</span>
              <div style={box}><CardExpiryElement options={elementOptions} /></div>
            </div>
            <div className="lv-field">
              <span className="lv-label">{t('pg.inv.cvc')}</span>
              <div style={box}><CardCvcElement options={elementOptions} /></div>
            </div>
          </div>
        </>
      )}
      <button type="submit" className="lv-btn go lg wide" disabled={!stripe || loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        {loading ? t('pg.inv.processing') : t(method === 'bank' ? 'pg.inv.payBankButton' : 'pg.inv.payButton', { amount: `$${amount.toFixed(2)}` })}
      </button>
      <p className="lv-small" style={{ textAlign: 'center' }}>{t('pg.inv.stripeNote')}</p>
    </form>
  );
}
