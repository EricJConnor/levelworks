import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromise } from '@/lib/stripe';
import { StripePaymentForm } from './StripePaymentForm';
import { Loader2 } from 'lucide-react';

export default function PaymentForm() {
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
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md">
        <h3 className="font-semibold text-yellow-900 mb-2">Payment Processing Unavailable</h3>
        <p className="text-sm text-yellow-800">
          Payment processing is currently not configured. Please contact support to enable payment features.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <StripePaymentForm />
    </Elements>
  );
}
