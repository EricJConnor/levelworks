import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe';
import { InvoicePaymentForm } from '@/components/InvoicePaymentForm';

export default function PublicInvoiceView() {
  const { token } = useParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    loadInvoice();
    getStripePromise().then(setStripe);
  }, [token]);

  const loadInvoice = async () => {
    try {
      const { data, error } = await supabase.from('invoices').select('*').eq('view_token', token).single();
      if (error) throw error;
      setInvoice(data);
    } catch (error: any) {
      console.error('Load invoice error:', error);
      toast({ title: 'Error', description: 'Unable to load invoice', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setShowPayment(false);
    loadInvoice();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!invoice) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">Invoice not found</p></div>;

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


  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Level Works</h1>
              <h2 className="text-lg md:text-xl text-gray-600">Invoice</h2>
            </div>
            <div className="md:text-right">
              <p className="text-base md:text-lg font-semibold">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-500">Issued: {new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()}</p>
              {invoice.due_date && <p className="text-sm text-gray-500">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Bill To</p><p className="font-semibold">{invoice.client_name}</p><p className="text-sm">{invoice.client_email}</p></div>
              <div><p className="text-sm text-gray-500">Project</p><p className="font-semibold">{invoice.project_name}</p></div>
            </div>

            {/* Mobile-friendly line items */}
            <div className="space-y-3 md:hidden">
              {lineItems.map((item: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-2">{item.description}</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{Number(item.quantity) || 0} x ${Number(item.rate || 0).toFixed(2)}</span>
                    <span className="font-semibold text-gray-900">${((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="text-left p-3">Description</th><th className="text-right p-3">Qty</th><th className="text-right p-3">Rate</th><th className="text-right p-3">Amount</th></tr></thead>
                <tbody>
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">{Number(item.quantity) || 0}</td>
                      <td className="p-3 text-right">${Number(item.rate || 0).toFixed(2)}</td>
                      <td className="p-3 text-right">${((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {taxRate > 0 && <div className="flex justify-between text-sm"><span>Tax ({taxRate}%)</span><span>${taxAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
              {amountPaid > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>-${amountPaid.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-xl text-blue-700"><span>Amount Due</span><span>${amountDue.toFixed(2)}</span></div>
            </div>

            {invoice.notes && <div className="bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-600">{invoice.notes}</p></div>}

            {isPaid || paymentSuccess ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-semibold text-lg">Invoice Paid</p>
                <p className="text-sm text-green-600">Thank you!</p>
              </div>
            ) : showPayment && stripe ? (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Pay Invoice</h3>
                <Elements stripe={stripe}>
                  <InvoicePaymentForm invoiceId={invoice.id} viewToken={token || ''} amount={amountDue} clientName={invoice.client_name} clientEmail={invoice.client_email} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            ) : (
              <Button onClick={() => setShowPayment(true)} className="w-full bg-green-600 hover:bg-green-700 py-5 md:py-6 text-base md:text-lg">
                <CreditCard className="w-5 h-5 mr-2" /> Pay ${amountDue.toFixed(2)} Now
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
