import { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Props {
  invoiceId: string;
  viewToken: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  onSuccess: () => void;
}

export function InvoicePaymentForm({ invoiceId, viewToken, amount, clientName, clientEmail, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(clientEmail);
  const [name, setName] = useState(clientName);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-invoice-payment', {
        body: { invoiceId, amount, customerEmail: email, customerName: name, viewToken }
      });

      if (fnError || !data?.clientSecret) throw new Error(fnError?.message || 'Failed to create payment');

      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement, billing_details: { name, email } }
      });

      if (confirmError) throw new Error(confirmError.message);

      if (paymentIntent?.status === 'succeeded') {
        toast({ title: 'Payment Successful!', description: 'Thank you for your payment.' });
        onSuccess();
      }
    } catch (err: any) {
      toast({ title: 'Payment Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const elementOptions = {
    style: { base: { fontSize: '16px', color: '#1e293b', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#94a3b8' } } }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border-2 rounded-lg px-4 py-4 text-base focus:border-green-500 focus:outline-none" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border-2 rounded-lg px-4 py-4 text-base focus:border-green-500 focus:outline-none" placeholder="you@email.com" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
        <div className="border-2 border-gray-300 rounded-lg p-4 focus-within:border-green-500">
          <CardNumberElement options={elementOptions} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry</label>
          <div className="border-2 border-gray-300 rounded-lg p-4 focus-within:border-green-500">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">CVC</label>
          <div className="border-2 border-gray-300 rounded-lg p-4 focus-within:border-green-500">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-green-600 hover:bg-green-700 py-5 md:py-6 text-base md:text-lg">
        <Lock className="w-4 h-4 mr-2" />
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
      <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Secure payment powered by Stripe
      </p>
    </form>
  );
}
