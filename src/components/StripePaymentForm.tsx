import { useState, useEffect } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Lock, ArrowLeft, Flame, Gift, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PricingData {
  currentPrice: number;
  spotsRemaining: number;
  currentTier: string;
}

export function StripePaymentForm({ onSuccess, isUpdate = false }: { onSuccess?: () => void; isUpdate?: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPricing();
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref.toUpperCase());
  }, []);

  const fetchPricing = async () => {
    const { data } = await supabase.functions.invoke('get-pricing-tier');
    if (data) setPricing(data);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (name && email && password) setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error('Card element not found');
      const { error, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement, billing_details: { name, email } });
      if (error) throw new Error(error.message);
      
      // Try to create Supabase account first
      let userId: string;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      
      if (authError) {
        // If user already exists, try to sign in
        if (authError.message.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw new Error('Account exists. Please use correct password or sign in.');
          userId = signInData.user?.id || crypto.randomUUID();
        } else {
          throw new Error(authError.message);
        }
      } else {
        userId = authData.user?.id || crypto.randomUUID();
      }
      
      localStorage.setItem('userId', userId);
      
      // Create Stripe subscription
      const { data, error: subError } = await supabase.functions.invoke('subscribe-user', { 
        body: { email, name, paymentMethodId: paymentMethod.id, userId, referralCode: referralCode || undefined } 
      });
      
      if (subError) throw new Error(subError.message || 'Subscription failed');
      if (data?.error) {
        if (data.code === 'STRIPE_AUTH_ERROR') {
          setErrorMsg('Payment system updating. Try again in a few minutes.');
          return;
        }
        throw new Error(data.error);
      }
      
      if (data.customerId) localStorage.setItem('stripeCustomerId', data.customerId);
      
      // Try to sign in (in case signup didn't auto-login)
      await supabase.auth.signInWithPassword({ email, password });
      
      const trialDays = data.referralApplied ? 60 : 30;
      toast({ title: 'Success!', description: `Your ${trialDays}-day free trial has started!` });
      window.location.href = '/app';
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const priceText = pricing ? `$${pricing.currentPrice}/month` : '$4-6/month';
  const tierLabel = pricing?.currentTier === 'early_adopter' ? 'Early Adopter' : pricing?.currentTier === 'growth' ? 'Growth' : 'Standard';

  if (step === 1) {
    return (
      <form onSubmit={handleStep1Submit} className="bg-white rounded-xl p-5 md:p-6 shadow-2xl">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Start Your Free Trial</h3>
        {referralCode && (
          <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-2 rounded-lg mb-3 text-sm">
            <Gift className="w-4 h-4" /><span>Referral <strong>{referralCode}</strong> - <strong>60 days free!</strong></span>
          </div>
        )}
        {pricing && pricing.spotsRemaining > 0 && !referralCode && (
          <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-2 rounded-lg mb-3 text-sm">
            <Flame className="w-4 h-4" /><span><strong>{pricing.spotsRemaining}</strong> {tierLabel} spots at <strong>{priceText}</strong> for life!</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
            <AlertCircle className="w-4 h-4" /><span>{errorMsg}</span>
          </div>
        )}
        <p className="text-sm text-slate-600 mb-4">{referralCode ? '60' : '30'} days free, then {priceText}. Cancel anytime.</p>
        <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-2 rounded-lg px-4 py-4 text-base mb-3 focus:border-blue-500 focus:outline-none" required />
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 rounded-lg px-4 py-4 text-base mb-3 focus:border-blue-500 focus:outline-none" required />
        <input type="password" placeholder="Create Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 rounded-lg px-4 py-4 text-base mb-3 focus:border-blue-500 focus:outline-none" required minLength={6} />
        <input placeholder="Referral Code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="w-full border-2 rounded-lg px-4 py-4 text-base mb-4 focus:border-blue-500 focus:outline-none" />
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-base md:text-lg py-5 md:py-6">
          Continue to Payment
        </Button>
      </form>
    );
  }

  const elementOptions = { style: { base: { fontSize: '16px', color: '#1e293b', fontFamily: 'system-ui', '::placeholder': { color: '#94a3b8' } } } };

  return (
    <form onSubmit={handleStep2Submit} className="bg-white rounded-xl p-5 md:p-6 shadow-2xl max-w-md">
      <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4 py-2"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Payment Information</h3>
      {referralCode && <p className="text-sm text-purple-700 font-semibold mb-2">Referral bonus: 60 days free!</p>}
      <p className="text-sm text-green-700 font-semibold mb-4">Card NOT charged for {referralCode ? '60' : '30'} days</p>
      
      {errorMsg && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><div><p className="font-medium">Unable to process</p><p>{errorMsg}</p></div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Card Number</label>
          <div className="border-2 border-slate-300 rounded-lg p-4 focus-within:border-blue-500"><CardNumberElement options={elementOptions} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Expiration</label>
            <div className="border-2 border-slate-300 rounded-lg p-4 focus-within:border-blue-500"><CardExpiryElement options={elementOptions} /></div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">CVV</label>
            <div className="border-2 border-slate-300 rounded-lg p-4 focus-within:border-blue-500"><CardCvcElement options={elementOptions} /></div>
          </div>
        </div>
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-blue-600 hover:bg-blue-700 text-base md:text-lg py-5 md:py-6 mt-6 mb-3">
        <Lock className="w-4 h-4 mr-2" />{loading ? 'Processing...' : 'Complete Free Trial Setup'}
      </Button>
      <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-green-700 font-bold">Card NOT charged until trial expires</div>
        <div className="flex items-center gap-2 text-green-700 font-bold">Cancel anytime before trial ends</div>
        <p className="mt-2">After trial: {priceText} locked in for life.</p>
      </div>
    </form>
  );
}
