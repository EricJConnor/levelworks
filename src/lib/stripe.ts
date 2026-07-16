import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

let stripePromiseCache: Promise<Stripe | null> | null = null;

// Fetch Stripe publishable key from edge function and initialize Stripe
export const getStripePromise = async (): Promise<Stripe | null> => {
  if (stripePromiseCache) {
    return stripePromiseCache;
  }

  stripePromiseCache = (async () => {
    try {
      // IMPORTANT: Always pass a body object (even empty) to avoid 400 errors
      const { data, error } = await supabase.functions.invoke('get-stripe-config', {
        body: {}
      });
      
      if (error) {
        console.error('Stripe config error:', error);
        return null;
      }
      
      if (!data?.publishableKey) {
        console.warn('Stripe not configured - no publishable key returned');
        return null;
      }

      return await loadStripe(data.publishableKey);
    } catch (err) {
      console.error('Failed to load Stripe:', err);
      return null;
    }
  })();

  return stripePromiseCache;
};

// For backwards compatibility
export const stripePromise = getStripePromise();

const accountStripePromiseCache = new Map<string, Promise<Stripe | null>>();

// Fetch a Stripe instance scoped to a connected account (Stripe Connect), so
// SetupIntents/PaymentIntents created on that account can be confirmed client-side.
export const getStripePromiseForAccount = (stripeAccountId: string): Promise<Stripe | null> => {
  const cached = accountStripePromiseCache.get(stripeAccountId);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-config', {
        body: {}
      });

      if (error || !data?.publishableKey) {
        console.error('Stripe config error:', error);
        return null;
      }

      return await loadStripe(data.publishableKey, { stripeAccount: stripeAccountId });
    } catch (err) {
      console.error('Failed to load Stripe for connected account:', err);
      return null;
    }
  })();

  accountStripePromiseCache.set(stripeAccountId, promise);
  return promise;
};
