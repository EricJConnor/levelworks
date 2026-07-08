import { useState, useEffect } from 'react';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromise } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock } from 'lucide-react';

interface TrialCheckoutFormProps {
  userId: string;
  userEmail: string;
  onSuccess: () => void;
}

function CheckoutFields({ userId, userEmail, onSuccess }: TrialCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { email: userEmail },
      });

      if (stripeError) throw new Error(stripeError.message);

      const { data, error: fnError } = await supabase.functions.invoke('create-subscription', {
        body: { userId, userEmail, paymentMethodId: paymentMethod.id },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const elementOptions = {
    style: {
      base: { fontSize: '16px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">Card Number</label>
        <div className="border-2 border-gray-300 rounded-lg p-4 focus-within:border-blue-500">
          <CardNumberElement options={elementOptions} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Expiration</label>
          <div className="border-2 border-gray-300 rounded-lg p-4 focus-within:border-blue-500">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">CVV</label>
          <div className="border-2 border-gray-300 rounded-lg p-4 focus-within:border-blue-500">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Lock size={20} /> Subscribe — $5/month
          </>
        )}
      </button>
      <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-xs text-gray-600">
        <p className="font-semibold text-green-700">✓ Cancel anytime from your account settings</p>
        <p className="font-semibold text-green-700">✓ $5/month — no hidden fees</p>
        <p className="font-semibold text-green-700">✓ Keep all your estimates, clients, and invoices</p>
      </div>
    </form>
  );
}

export function TrialCheckoutForm(props: TrialCheckoutFormProps) {
  const [stripe, setStripe] = useState<Stripe | null | undefined>(undefined);

  useEffect(() => {
    getStripePromise().then(setStripe);
  }, []);

  if (stripe === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (stripe === null) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        Payment processing is currently unavailable. Please try again shortly or contact support.
      </div>
    );
  }

  return (
    <Elements stripe={Promise.resolve(stripe)}>
      <CheckoutFields {...props} />
    </Elements>
  );
}
