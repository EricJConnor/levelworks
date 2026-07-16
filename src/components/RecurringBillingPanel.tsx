import { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripePromiseForAccount } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/contexts/DataContext';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';

interface Props {
  client: Client;
  stripeAccountId: string;
  onUpdated: (updates: Partial<Client>) => void;
}

const cardElementOptions = {
  style: { base: { fontSize: '16px', color: '#1e293b', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#94a3b8' } } },
};

const SCHEDULE_OPTIONS: { value: string; label: string; unit: 'month' | 'year'; count: number }[] = [
  { value: 'month-1', label: 'Monthly', unit: 'month', count: 1 },
  { value: 'month-2', label: 'Every 2 months', unit: 'month', count: 2 },
  { value: 'month-3', label: 'Quarterly (every 3 months)', unit: 'month', count: 3 },
  { value: 'month-4', label: 'Every 4 months', unit: 'month', count: 4 },
  { value: 'month-6', label: 'Every 6 months', unit: 'month', count: 6 },
  { value: 'year-1', label: 'Yearly', unit: 'year', count: 1 },
];

const cadenceLabel = (unit?: string, count?: number) => {
  const u = unit || 'month';
  const c = count || 1;
  if (u === 'year') return 'year';
  return c === 1 ? 'month' : `${c} months`;
};

const formatBillingLine = (amount: number, unit?: string, count?: number) => {
  const amt = `$${amount.toFixed(2)}`;
  const u = unit || 'month';
  const c = count || 1;
  if (u === 'year') return `${amt}/yr`;
  if (c === 1) return `${amt}/mo`;
  return `${amt} every ${c} months`;
};

function BillingSetupForm({ client, onUpdated }: Omit<Props, 'stripeAccountId'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(client.billingAmount ? String(client.billingAmount) : '');
  const [schedule, setSchedule] = useState('month-1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    const option = SCHEDULE_OPTIONS.find((o) => o.value === schedule) || SCHEDULE_OPTIONS[0];

    setLoading(true);
    try {
      const { data: setupData, error: setupErr } = await supabase.functions.invoke('manage-recurring-billing', {
        body: { action: 'create_setup_intent', clientId: client.id },
      });
      if (setupErr || setupData?.error) throw new Error(setupData?.error || setupErr?.message || 'Failed to start billing setup');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(setupData.clientSecret, {
        payment_method: { card: cardElement, billing_details: { name: client.name, email: client.email || undefined } },
      });
      if (confirmError) throw new Error(confirmError.message);

      const paymentMethodId = typeof setupIntent?.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;
      if (!paymentMethodId) throw new Error('Could not confirm card details');

      const { data: subData, error: subErr } = await supabase.functions.invoke('manage-recurring-billing', {
        body: {
          action: 'activate_subscription',
          clientId: client.id,
          paymentMethodId,
          amount: numAmount,
          intervalUnit: option.unit,
          intervalCount: option.count,
        },
      });
      if (subErr || subData?.error) throw new Error(subData?.error || subErr?.message || 'Failed to start recurring billing');

      if (subData.requiresAction && subData.clientSecret) {
        const { error: actionError } = await stripe.confirmCardPayment(subData.clientSecret);
        if (actionError) throw new Error(actionError.message);
      }

      onUpdated({
        billingEnabled: true,
        billingAmount: numAmount,
        billingInterval: option.unit,
        billingIntervalCount: option.count,
        billingStatus: subData.status === 'past_due' ? 'past_due' : 'current',
      });
      toast({ title: 'Recurring billing set up!', description: `${client.name} will be charged ${formatBillingLine(numAmount, option.unit, option.count)}.` });
    } catch (err: any) {
      toast({ title: 'Setup failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-200">Amount ($)</label>
        <input
          type="number" min="1" step="0.01" value={amount} required
          onChange={(e) => setAmount(e.target.value)}
          placeholder="99.00"
          className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-200">Billing schedule</label>
        <select
          value={schedule} onChange={(e) => setSchedule(e.target.value)}
          className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none bg-white"
        >
          {SCHEDULE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-200">Card</label>
        <div className="border-2 border-gray-300 rounded-lg p-3 focus-within:border-blue-500 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      <button
        type="submit" disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {loading ? 'Setting up...' : 'Start Recurring Billing'}
      </button>
      <p className="text-xs text-center text-gray-400">Stripe charges this card automatically on the schedule above and handles retries/reminders on failure.</p>
    </form>
  );
}

export function RecurringBillingPanel({ client, stripeAccountId, onUpdated }: Props) {
  const [stripe, setStripe] = useState<Stripe | null | undefined>(undefined);
  const [canceling, setCanceling] = useState(false);
  const { toast } = useToast();

  useEffect(() => { getStripePromiseForAccount(stripeAccountId).then(setStripe); }, [stripeAccountId]);

  const handleCancel = async () => {
    if (!confirm(`Stop recurring billing for ${client.name}? They will not be charged again.`)) return;
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-recurring-billing', {
        body: { action: 'cancel_subscription', clientId: client.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Failed to cancel');
      onUpdated({ billingEnabled: false, billingStatus: 'canceled' });
      toast({ title: 'Recurring billing canceled' });
    } catch (err: any) {
      toast({ title: 'Could not cancel', description: err.message, variant: 'destructive' });
    } finally {
      setCanceling(false);
    }
  };

  if (client.billingEnabled) {
    return (
      <div className="bg-white/5 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Billed every {cadenceLabel(client.billingInterval, client.billingIntervalCount)}</p>
            <p className="text-lg font-semibold text-white">{formatBillingLine(Number(client.billingAmount || 0), client.billingInterval, client.billingIntervalCount)}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${client.billingStatus === 'past_due' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {client.billingStatus === 'past_due' ? 'Past Due' : 'Current'}
          </span>
        </div>
        {client.billingStatus === 'past_due' && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Stripe couldn't collect the last payment and is retrying automatically. Reach out to the customer, or cancel billing below.</span>
          </div>
        )}
        <button
          onClick={handleCancel} disabled={canceling}
          className="w-full text-sm text-red-400 border-2 border-red-400/30 rounded-lg py-2 font-semibold hover:bg-red-400/10 disabled:opacity-60"
        >
          {canceling ? 'Canceling...' : 'Cancel Recurring Billing'}
        </button>
      </div>
    );
  }

  if (stripe === undefined) {
    return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  if (stripe === null) {
    return <p className="text-sm text-gray-400 bg-white/5 rounded-lg p-4">Payment processing is currently unavailable.</p>;
  }

  return (
    <Elements stripe={stripe}>
      <BillingSetupForm client={client} onUpdated={onUpdated} />
    </Elements>
  );
}
