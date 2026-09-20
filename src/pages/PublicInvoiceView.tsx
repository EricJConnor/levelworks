import { useEffect, useState } from 'react';
import { linePricesShown, lineAmountShown } from '@/lib/linePrices';
import { clientAddressOf } from '@/lib/clientAddress';
import { payMethodsOf, allowsCard, allowsBank } from '@/lib/payMethods';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/i18n';
import { Loader2, CheckCircle, CreditCard, Landmark } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromiseForAccount } from '@/lib/stripe';
import { InvoicePaymentForm } from '@/components/InvoicePaymentForm';

export default function PublicInvoiceView() {
  const { token } = useParams();
  const { toast } = useToast();
  const t = useT();
  const [invoice, setInvoice] = useState<any>(null);
  const [branding, setBranding] = useState<{ company_name?: string; profile_photo_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // Payment happens on the contractor's own Stripe account: the intent is
  // created server-side (/api/invoice-payment) and Stripe.js is loaded scoped
  // to that account before the card form mounts.
  const [payment, setPayment] = useState<{ clientSecret: string; paymentIntentId: string; amount: number; method: 'card' | 'bank' } | null>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [preparing, setPreparing] = useState(false);
  const [payBlocked, setPayBlocked] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  /**
   * A bank debit does not clear at the counter: Stripe holds it `processing`
   * for about four business days. The server records it as pending and `sync`
   * finishes the job, so the page has to say "on its way" rather than either
   * "paid" or "unpaid", both of which would be wrong.
   */
  const [bankPending, setBankPending] = useState(false);
  /**
   * A bank transfer can bounce days after it was accepted, usually because the
   * account was short. Without saying so the page would simply show the pay
   * buttons again, and a customer who believes she has paid would have no idea
   * why she is being asked twice.
   */
  const [bankFailed, setBankFailed] = useState(false);

  useEffect(() => { loadInvoice(); }, [token]);

  const startPayment = async (method: 'card' | 'bank' = 'card') => {
    if (!invoice) return;
    setPreparing(true);
    setPayBlocked(null);
    try {
      const r = await fetch('/api/invoice-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', method, invoiceId: invoice.id, viewToken: token, customerName: invoice.client_name, customerEmail: invoice.client_email }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 409 && data?.error === 'not_set_up') { setPayBlocked(t('pg.inv.notSetUp')); return; }
      if (r.status === 409 && data?.error === 'bank_not_enabled') { setPayBlocked(t('pg.inv.bankNotOn')); return; }
      if (r.status === 409 && data?.error === 'method_not_allowed') { setPayBlocked(data?.message || t('pg.inv.payFailedBody')); return; }
      if (r.status === 409 && data?.error === 'already_paid') { setPaymentSuccess(true); loadInvoice(); return; }
      if (!r.ok || !data?.clientSecret) throw new Error(data?.message || t('pg.inv.payFailedBody'));
      const s = await getStripePromiseForAccount(data.stripeAccountId);
      if (!s) throw new Error(t('pg.inv.payFailedBody'));
      setStripe(s);
      setPayment({ clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId, amount: Number(data.amount) || 0, method });
    } catch (e: any) {
      toast({ title: t('pg.inv.payFailed'), description: e?.message || t('pg.inv.payFailedBody'), variant: 'destructive' });
    } finally {
      setPreparing(false);
    }
  };

  const loadInvoice = async () => {
    try {
      const { data, error } = await supabase.from('invoices').select('*').eq('view_token', token).single();
      if (error) throw error;
      setInvoice(data);
      loadBranding();
      // Anything still clearing gets re-checked whenever the page is opened.
      // That is what stands in for a webhook: a bank debit settles days later,
      // and whoever looks next is the one who finishes recording it.
      const history = Array.isArray(data?.payment_history) ? data.payment_history : [];
      const last = [...history].reverse().find((h: any) => h && h.method === 'bank');
      setBankFailed(!!last?.failed);
      if (history.some((h: any) => h && h.pending)) {
        setBankPending(true);
        try {
          const sr = await fetch('/api/invoice-payment', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync', invoiceId: data.id, viewToken: token }),
          });
          const sd = await sr.json().catch(() => ({}));
          if (sd?.changed) {
            const { data: fresh } = await supabase.from('invoices').select('*').eq('view_token', token).single();
            if (fresh) setInvoice(fresh);
            setBankPending(Number(sd.pending) > 0);
            const fh = Array.isArray(fresh?.payment_history) ? fresh.payment_history : [];
            const fl = [...fh].reverse().find((h: any) => h && h.method === 'bank');
            setBankFailed(!!fl?.failed);
          }
        } catch { /* the next open tries again */ }
      }
    } catch (error: any) {
      console.error('Load invoice error:', error);
      toast({ title: t('e.somethingWrong'), description: t('pg.inv.loadFailed'), variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadBranding = async () => {
    try {
      const { data } = await supabase.from('public_invoice_branding').select('company_name, profile_photo_url').eq('view_token', token).maybeSingle();
      if (data) setBranding(data);
    } catch {
      // Branding is optional - silently skip if unavailable
    }
  };

  const handlePaymentSuccess = (pending?: boolean) => {
    // A bank debit is accepted, not settled. Showing the green "paid" tick for
    // it would be a lie for the next four business days.
    if (pending) setBankPending(true); else setPaymentSuccess(true);
    setPayment(null);
    loadInvoice();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!invoice) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">{t('pg.inv.notFound')}</p></div>;

  // Safely parse line_items - handle both array and string formats
  const parseLineItems = (items: any) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const total = Number(invoice.total) || 0;
  const amountPaid = Number(invoice.amount_paid) || 0;
  const amountDue = total - amountPaid;
  const taxRate = Number(invoice.tax_rate) || 0;
  const isPaid = invoice.status === 'paid';
  const lineItems = parseLineItems(invoice.line_items);
  const pricesShown = linePricesShown(lineItems);
  const payMethods = payMethodsOf(invoice?.line_items as any);


  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex items-start gap-3">
              {branding?.profile_photo_url && (
                <img src={branding.profile_photo_url} alt={t('pg.pub.logoAlt')} className="w-12 h-12 rounded-lg object-contain border bg-white shrink-0" />
              )}
              <div>
                <h2 className="text-lg md:text-xl text-gray-600">{t('m.invoice')}</h2>
                {branding?.company_name && <p className="text-sm font-medium text-gray-700 mt-1">{branding.company_name}</p>}
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-base md:text-lg font-semibold">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-500">{t('pg.inv.issued')}: {new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()}</p>
              {invoice.due_date && <p className="text-sm text-gray-500">{t('pg.inv.due')}: {new Date(invoice.due_date).toLocaleDateString()}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">{t('pg.inv.billTo')}</p><p className="font-semibold">{invoice.client_name}</p><p className="text-sm">{invoice.client_email}</p>{clientAddressOf(lineItems) && <p className="text-sm">{clientAddressOf(lineItems)}</p>}</div>
              <div><p className="text-sm text-gray-500">{t('m.project')}</p><p className="font-semibold">{invoice.project_name}</p></div>
            </div>

            {/* Mobile-friendly line items */}
            <div className="space-y-3 md:hidden">
              {lineItems.map((item: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                  <p className={`font-medium whitespace-pre-wrap${lineAmountShown(item, pricesShown) ? ' mb-2' : ''}`}>{item.description}</p>
                  {lineAmountShown(item, pricesShown) && <div className="flex justify-between text-sm text-gray-600">
                    <span>{Number(item.quantity) || 0} x ${Number(item.rate || 0).toFixed(2)}</span>
                    <span className="font-semibold text-gray-900">${((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}</span>
                  </div>}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="text-left p-3">{t('m.description')}</th>{pricesShown && <><th className="text-right p-3">{t('m.qty')}</th><th className="text-right p-3">{t('m.rate')}</th><th className="text-right p-3">{t('m.amount')}</th></>}</tr></thead>
                <tbody>
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3 whitespace-pre-wrap">{item.description}</td>
                      {pricesShown && (lineAmountShown(item, true)
                        ? <><td className="p-3 text-right">{Number(item.quantity) || 0}</td><td className="p-3 text-right">${Number(item.rate || 0).toFixed(2)}</td><td className="p-3 text-right">${((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td></>
                        : <td className="p-3" colSpan={3} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              {pricesShown && <div className="flex justify-between text-sm"><span>{t('m.subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>}
              {taxRate > 0 && <div className="flex justify-between text-sm"><span>{t('m.tax')} ({taxRate}%)</span><span>${taxAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>{t('m.total')}</span><span>${total.toFixed(2)}</span></div>
              {amountPaid > 0 && <div className="flex justify-between text-green-600"><span>{t('s.paid')}</span><span>-${amountPaid.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-xl text-blue-700"><span>{t('m.balanceDue')}</span><span>${amountDue.toFixed(2)}</span></div>
            </div>

            {invoice.notes && <div className="bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-600">{invoice.notes}</p></div>}

            <p className="text-sm text-gray-500 text-center italic">{t('pg.pub.thanksInvoice')}</p>

            {isPaid || paymentSuccess ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-semibold text-lg">{t('pg.inv.paidTitle')}</p>
                <p className="text-sm text-green-600">{t('pg.inv.thankYou')}</p>
              </div>
            ) : payment && stripe ? (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">{payment.method === 'bank' ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />} {t('pg.inv.payInvoice')}</h3>
                <Elements stripe={stripe}>
                  <InvoicePaymentForm method={payment.method} invoiceId={invoice.id} viewToken={token || ''} clientSecret={payment.clientSecret} paymentIntentId={payment.paymentIntentId} amount={payment.amount} clientName={invoice.client_name} clientEmail={invoice.client_email} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            ) : payBlocked ? (
              <div className="bg-gray-50 border p-5 rounded-lg text-center"><p className="text-sm text-gray-700">{payBlocked}</p></div>
            ) : bankPending ? (
              /* Money is on its way but not landed. Saying "unpaid" here would
                 tell someone who has already paid that they have not. */
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-2 animate-spin" />
                <p className="text-blue-900 font-semibold">{t('pg.inv.bankPending')}</p>
                <p className="text-sm text-blue-700">{t('pg.inv.bankPendingBody')}</p>
              </div>
            ) : (
             <>
              {bankFailed && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                  <p className="text-amber-900 font-semibold">{t('pg.inv.bankFailed')}</p>
                  <p className="text-sm text-amber-800">{t('pg.inv.bankFailedBody')}</p>
                </div>
              )}
              {/* The contractor chose which of these the client gets. A bank
                  transfer saves him the card fee, which on a big job is the
                  difference between $5 and several hundred dollars. */}
              {allowsCard(payMethods) && (
                <Button onClick={() => startPayment('card')} disabled={preparing} className="w-full bg-green-600 hover:bg-green-700 py-5 md:py-6 text-base md:text-lg">
                  {preparing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CreditCard className="w-5 h-5 mr-2" />}
                  {preparing ? t('pg.inv.preparing') : t('pg.inv.payNow', { amount: `$${amountDue.toFixed(2)}` })}
                </Button>
              )}
              {allowsBank(payMethods) && (
                <Button
                  onClick={() => startPayment('bank')}
                  disabled={preparing}
                  variant={allowsCard(payMethods) ? 'outline' : 'default'}
                  className={allowsCard(payMethods)
                    ? 'w-full py-5 md:py-6 text-base md:text-lg mt-3'
                    : 'w-full bg-green-600 hover:bg-green-700 py-5 md:py-6 text-base md:text-lg'}
                >
                  {preparing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Landmark className="w-5 h-5 mr-2" />}
                  {preparing ? t('pg.inv.preparing') : t('pg.inv.payBankNow', { amount: `$${amountDue.toFixed(2)}` })}
                </Button>
              )}
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                🔒 {t('pg.inv.secure')}
              </p>
              </>
            )}
          </div>
        </Card>
        <p className="text-center text-xs text-gray-400 mt-4">{t('pg.pub.poweredBy')}</p>
      </div>
    </div>
  );
}
