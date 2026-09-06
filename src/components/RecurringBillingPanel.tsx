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

/* Stripe draws the card field inside its own iframe, so these have to be
   literal values rather than the CSS variables used everywhere else. They are
   the same tokens: ink, faint, Inter, and the 16px that stops iOS zooming. */
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0b1220',
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      '::placeholder': { color: '#8a93a3' },
    },
  },
};

/* Scoped to the `rb-` prefix so nothing here can reach another screen. */
const styles = `
.rb-card-box {
  background: var(--lv-surface);
  border: 1px solid var(--lv-line-2);
  border-radius: var(--lv-r);
  padding: 12px;
  transition: border-color var(--lv-t) var(--lv-ease), box-shadow var(--lv-t) var(--lv-ease);
}
.rb-card-box:focus-within { border-color: var(--lv-blue); box-shadow: 0 0 0 3px rgba(37, 99, 235, .13); }
.rb-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0 18px 14px;
  padding: 11px 12px;
  border-radius: var(--lv-r);
  background: var(--lv-red-soft);
  color: var(--lv-red);
  font-size: 13px;
  line-height: 1.5;
}
.rb-note svg { flex-shrink: 0; margin-top: 1px; }
.rb-rows .lv-row:last-child { border-bottom: 0; }
.rb-rows .lv-row-s { margin-top: 0; }
.rb-wait { display: flex; justify-content: center; padding: 18px; }
`;

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
      toast({ title: 'Recurring billing is on', description: `${client.name} will be charged ${formatBillingLine(numAmount, option.unit, option.count)}.` });
    } catch (err: any) {
      toast({ title: 'Setup failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="lv-card">
      <div className="lv-card-head">
        <div>
          <span className="lv-eyebrow">Recurring billing</span>
          <h3 className="lv-h3" style={{ marginTop: 2 }}>Set up a schedule</h3>
        </div>
        {client.billingStatus === 'canceled' && <span className="lv-pill">Cancelled</span>}
      </div>

      <div className="lv-card-pad">
        <label className="lv-field">
          <span className="lv-label">Amount</span>
          <input
            type="number" min="1" step="0.01" value={amount} required
            onChange={(e) => setAmount(e.target.value)}
            placeholder="99.00"
            className="lv-input num"
          />
        </label>

        <label className="lv-field">
          <span className="lv-label">Billing schedule</span>
          <select
            value={schedule} onChange={(e) => setSchedule(e.target.value)}
            className="lv-select"
          >
            {SCHEDULE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <div className="lv-field">
          <span className="lv-label">Card</span>
          <div className="rb-card-box">
            <CardElement options={cardElementOptions} />
          </div>
        </div>
      </div>

      <div className="lv-card-foot">
        <button type="submit" disabled={!stripe || loading} className="lv-btn pri wide">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          {loading ? 'Setting up…' : 'Start recurring billing'}
        </button>
        <p className="lv-small" style={{ marginTop: 10, textAlign: 'center' }}>
          Stripe charges this card on the schedule above, and handles retries and reminders if a payment fails.
        </p>
      </div>
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
      toast({ title: 'Recurring billing stopped' });
    } catch (err: any) {
      toast({ title: 'Could not cancel', description: err.message, variant: 'destructive' });
    } finally {
      setCanceling(false);
    }
  };

  if (client.billingEnabled) {
    const pastDue = client.billingStatus === 'past_due';
    return (
      <div className="lv-card">
        <style>{styles}</style>

        <div className="lv-card-head">
          <div style={{ minWidth: 0 }}>
            <span className="lv-eyebrow">Recurring billing</span>
            <h3 className="lv-h3" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</h3>
          </div>
          <span className={`lv-pill ${pastDue ? 'red' : 'green'}`}>{pastDue ? 'Past due' : 'Current'}</span>
        </div>

        <div className="rb-rows">
          <div className="lv-row">
            <span className="lv-row-s">Amount</span>
            <span className="lv-row-r lv-num">{formatBillingLine(Number(client.billingAmount || 0), client.billingInterval, client.billingIntervalCount)}</span>
          </div>
          <div className="lv-row">
            <span className="lv-row-s">Interval</span>
            <span className="lv-row-r">Every {cadenceLabel(client.billingInterval, client.billingIntervalCount)}</span>
          </div>
          <div className="lv-row">
            {/* Stripe holds the schedule; nothing in the client record carries the
                next charge date, so this says how it happens rather than guessing when. */}
            <span className="lv-row-s">Next charge</span>
            <span className="lv-row-r">{pastDue ? 'Retrying' : 'Automatic'}</span>
          </div>
        </div>

        {pastDue && (
          <div className="rb-note" style={{ marginTop: 14 }}>
            <AlertTriangle size={16} />
            <span>Stripe could not collect the last payment and is retrying automatically. Reach out to the client, or stop billing below.</span>
          </div>
        )}

        <div className="lv-card-foot">
          <p className="lv-small" style={{ marginBottom: 10 }}>
            Stripe charges the card on file every {cadenceLabel(client.billingInterval, client.billingIntervalCount)} and handles retries and reminders.
          </p>
          <button onClick={handleCancel} disabled={canceling} type="button" className="lv-btn danger wide">
            {canceling ? 'Stopping…' : 'Stop recurring billing'}
          </button>
        </div>
      </div>
    );
  }

  if (stripe === undefined) {
    return (
      <div className="lv-card">
        <style>{styles}</style>
        <div className="rb-wait"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--lv-faint)' }} /></div>
      </div>
    );
  }

  if (stripe === null) {
    return (
      <div className="lv-card lv-card-pad">
        <p className="lv-small">Card payments are unavailable right now. Try again in a few minutes.</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <style>{styles}</style>
      <BillingSetupForm client={client} onUpdated={onUpdated} />
    </Elements>
  );
}
