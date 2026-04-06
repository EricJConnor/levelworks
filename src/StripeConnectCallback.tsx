import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function StripeConnectCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state'); // userId
        const error = params.get('error');

        if (error) throw new Error('Stripe connection was cancelled or failed.');
        if (!code || !state) throw new Error('Missing required parameters.');

        const { data, error: fnError } = await supabase.functions.invoke('connect-stripe-account', {
          body: { action: 'exchange_code', userId: state, code }
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        setStatus('success');
        setMessage('Your payment account is connected! You can now accept card payments from clients.');
        
        setTimeout(() => navigate('/app'), 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Something went wrong. Please try again.');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">LEVEL<span className="text-blue-600">WORKS</span></h1>
        </div>
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Connecting your payment account...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">You're all set!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-400">Redirecting you back to the app...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/app')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Back to App
            </button>
          </>
        )}
      </div>
    </div>
  );
}
