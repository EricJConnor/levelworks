import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';
import { CancelSubscriptionDialog } from '@/components/CancelSubscriptionDialog';
import { UpdatePaymentDialog } from '@/components/UpdatePaymentDialog';
import { ProfileEditor } from '@/components/ProfileEditor';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { ReferralProgram } from '@/components/ReferralProgram';
import { PricingCountdown } from '@/components/PricingCountdown';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { EdgeFunctionDiagnostic } from '@/components/EdgeFunctionDiagnostic';
import AuthModal from '@/components/AuthModal';
import { Loader2, Gift, User, Mail, Calendar, Lock, AlertTriangle, Wrench } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [updatePaymentOpen, setUpdatePaymentOpen] = useState(false);
  const { profile, refreshProfile } = useProfile();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  const mountedRef = useRef(true);

  const loadSubscriptionData = useCallback(async () => {
    const customerId = localStorage.getItem('stripeCustomerId');
    if (customerId) {
      try {
        const { data } = await supabase.functions.invoke('get-subscription-status', { body: { customerId } });
        if (data?.subscription) setSubscription(data.subscription);
      } catch (e) { console.error('Subscription error:', e); }
    }
  }, []);

  useEffect(() => { 
    mountedRef.current = true;
    
    const checkAuthWithRetry = async (retries = 3): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) return session;
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
      }
      return null;
    };
    
    const initAuth = async () => {
      const session = await checkAuthWithRetry();
      if (!mountedRef.current) return;
      
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        setUserCreatedAt(session.user.created_at || null);
        await Promise.all([loadSubscriptionData(), refreshProfile()]);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    
    initAuth();
    
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      if (event === 'SIGNED_OUT') window.location.href = '/';
      else if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        setUserCreatedAt(session.user.created_at || null);
      }
    });
    
    return () => { mountedRef.current = false; authSub.unsubscribe(); };
  }, [loadSubscriptionData, refreshProfile]);

  const handleBackToApp = () => { navigate('/app'); };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your account.</p>
          <Button onClick={() => setShowAuthModal(true)} className="w-full">Sign In</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full mt-2">Back to Home</Button>
        </Card>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <Button onClick={handleBackToApp} variant="outline" size="sm">← Back to App</Button>
        <h1 className="text-xl md:text-2xl font-bold">Account Settings</h1>
      </div>
      
      <ProfileCard profile={profile} userEmail={userEmail} userCreatedAt={userCreatedAt} />

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-6 sm:flex gap-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm"><User className="w-3 h-3 mr-1" />Profile</TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs sm:text-sm">Plan</TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm"><Lock className="w-3 h-3 mr-1" />Security</TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs sm:text-sm"><Gift className="w-3 h-3 mr-1" />Refer</TabsTrigger>
          <TabsTrigger value="diagnostic" className="text-xs sm:text-sm"><Wrench className="w-3 h-3 mr-1" />Fix</TabsTrigger>
          <TabsTrigger value="danger" className="text-xs sm:text-sm text-red-600"><AlertTriangle className="w-3 h-3 mr-1" />Danger</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileEditor /></TabsContent>
        <TabsContent value="subscription"><SubscriptionCard subscription={subscription} onCancel={() => setCancelDialogOpen(true)} onUpdatePayment={() => setUpdatePaymentOpen(true)} /><PricingCountdown className="mt-4" /></TabsContent>
        <TabsContent value="security"><ChangePasswordForm /></TabsContent>
        <TabsContent value="referrals"><ReferralProgram /></TabsContent>
        <TabsContent value="diagnostic">
          <EdgeFunctionDiagnostic />
        </TabsContent>
        <TabsContent value="danger">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-white">
                <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. All your data including estimates, invoices, clients, and settings will be permanently removed.
                </p>
                <DeleteAccountDialog userEmail={userEmail || undefined} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      <CancelSubscriptionDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen} subscription={subscription} onSuccess={loadSubscriptionData} />
      <UpdatePaymentDialog open={updatePaymentOpen} onOpenChange={setUpdatePaymentOpen} onSuccess={loadSubscriptionData} />
    </div>
  );
}

function ProfileCard({ profile, userEmail, userCreatedAt }: { profile: any; userEmail: string | null; userCreatedAt: string | null }) {
  return (
    <Card className="mb-6">
      <CardHeader className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow">
            {profile?.profile_photo_url ? <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-blue-600" />}
          </div>
          <div><CardTitle className="text-lg">{profile?.full_name || 'Your Profile'}</CardTitle><CardDescription>{profile?.company_name || 'Account information'}</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Mail className="w-5 h-5 text-gray-500" /><div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-sm truncate">{userEmail || 'Not available'}</p></div></div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Calendar className="w-5 h-5 text-gray-500" /><div><p className="text-xs text-gray-500">Member Since</p><p className="font-medium text-sm">{userCreatedAt ? new Date(userCreatedAt).toLocaleDateString() : 'N/A'}</p></div></div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionCard({ subscription, onCancel, onUpdatePayment }: any) {
  if (!subscription) return (
    <Card className="mb-6">
      <CardHeader className="p-4"><CardTitle className="text-lg">No Active Subscription</CardTitle></CardHeader>
      <CardContent className="p-4 pt-0"><div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-sm text-blue-800 mb-3">Get started with a 14-day free trial.</p><Button className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button></div></CardContent>
    </Card>
  );
  const amount = subscription.plan?.amount ? (subscription.plan.amount / 100).toFixed(0) : null;
  return (
    <Card className="mb-6">
      <CardHeader className="p-4"><div className="flex justify-between items-start"><CardTitle className="text-lg">Subscription</CardTitle><Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>{subscription.status?.toUpperCase()}</Badge></div></CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-gray-600">Plan</p><p className="font-semibold">Professional</p></div><div><p className="text-xs text-gray-600">Rate</p><p className="font-semibold text-green-600">${amount}/mo</p></div></div>
        <div className="flex gap-2"><Button onClick={onUpdatePayment} variant="outline" size="sm">Update Payment</Button><Button onClick={onCancel} variant="destructive" size="sm">Cancel</Button></div>
      </CardContent>
    </Card>
  );
}
