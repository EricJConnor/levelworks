import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrialCheckoutForm } from './TrialCheckoutForm';
import { Loader2 } from 'lucide-react';

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
            <TrialCheckoutForm
              userId={userId}
              userEmail={userEmail}
              onSuccess={() => setStatus('active')}
            />
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
