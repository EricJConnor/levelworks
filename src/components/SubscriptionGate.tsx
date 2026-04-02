import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';

const stripePromise = loadStripe('pk_live_51Rv0bbCrlMKmuUj4ll9r1pdjnK3SKP7LmqlTMi4CYBlBHuLu5NtO0UOBSj8aFGiw1qKNkFQgjm3roSWupxHFbUxL00BEFePpG1');

function PaymentForm({ userId, userEmail, onSuccess }: { userId: string; userEmail: string; onSuccess: () => void }) {
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
        billing_details: { email: userEmail }
      });

      if (stripeError) throw new Error(stripeError.message);

      const { data, error: fnError } = await supabase.functions.invoke('create-subscription', {
        body: { userId, userEmail, paymentMethodId: paymentMethod.id }
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
      base: { fontSize: '16px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } }
    }
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
        {loading ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : <><Lock size={20} /> Subscribe — $5/month</>}
      </button>
      <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-xs text-gray-600">
        <p className="font-semibold text-green-700">✓ Cancel anytime from your account settings</p>
        <p className="font-semibold text-green-700">✓ $5/month — no hidden fees</p>
        <p className="font-semibold text-green-700">✓ Keep all your estimates, clients, and invoices</p>
      </div>
    </form>
  );
}

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const [status, setStatus] = useState<'loading' | 'trial' | 'active' | 'expired' | 'cancelled'>('loading');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    // Timeout after 5 seconds - fail open
    const timeout = setTimeout(() => {
      setStatus('active');
    }, 5000);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { clearTimeout(timeout); setStatus('active'); return; }

      setUserId(user.id);
      setUserEmail(user.email || '');
      setUserName(user.user_metadata?.full_name || '');

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: { userId: user.id, userEmail: user.email, userName: user.user_metadata?.full_name || '' }
      });

      if (error) {
        setStatus('active');
        return;
      }

      setStatus(data.status);
      setDaysLeft(data.daysLeft);
    } catch (err) {
      clearTimeout(timeout);
      setStatus('active');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'expired' || status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-blue-600 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">LEVEL<span className="text-blue-200">WORKS</span></h1>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {status === 'cancelled' ? 'Reactivate Your Account' : 'Your Trial Has Ended'}
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Subscribe for just <strong>$5/month</strong> to keep access to all your estimates, clients, and invoices.
            </p>
            <Elements stripe={stripePromise}>
              <PaymentForm
                userId={userId}
                userEmail={userEmail}
                onSuccess={() => setStatus('active')}
              />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {status === 'trial' && daysLeft !== null && daysLeft <= 5 && (
        <div className={`${daysLeft <= 2 ? 'bg-red-600' : 'bg-orange-500'} text-white text-center py-2 px-4 text-sm font-semibold`}>
          ⚠️ Your free trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. <button onClick={() => setStatus('expired')} className="underline ml-1">Subscribe now — $5/month</button>
        </div>
      )}
      {children}
    </>
  );
};
