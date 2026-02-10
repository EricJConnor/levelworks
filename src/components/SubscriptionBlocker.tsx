import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SubscriptionBlockerProps {
  status: string;
  onRetry: () => void;
}

export function SubscriptionBlocker({ status, onRetry }: SubscriptionBlockerProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleManageSubscription = () => {
    window.location.href = '/dashboard?tab=subscription';
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'canceled':
        return { title: 'Subscription Canceled', desc: 'Your subscription has been canceled. Reactivate to continue using Level.' };
      case 'past_due':
        return { title: 'Payment Past Due', desc: 'Your payment is past due. Please update your payment method to continue.' };
      case 'unpaid':
        return { title: 'Payment Required', desc: 'Your subscription payment failed. Please update your payment method.' };
      case 'incomplete':
        return { title: 'Setup Incomplete', desc: 'Your subscription setup is incomplete. Please complete payment.' };
      case 'incomplete_expired':
        return { title: 'Trial Expired', desc: 'Your free trial has expired. Subscribe to continue using Level.' };
      default:
        return { title: 'Subscription Required', desc: 'An active subscription is required to access Level.' };
    }
  };

  const { title, desc } = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleManageSubscription} className="w-full bg-blue-600 hover:bg-blue-700">
            <CreditCard className="w-4 h-4 mr-2" />
            {status === 'past_due' || status === 'unpaid' ? 'Update Payment Method' : 'Manage Subscription'}
          </Button>
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Again
          </Button>
          <Button onClick={handleSignOut} variant="ghost" className="w-full text-gray-500">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}