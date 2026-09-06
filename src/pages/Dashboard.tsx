import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { useT } from '@/i18n';
import { Loader2, Gift, User, Mail, Calendar, Lock, AlertTriangle, Wrench, ArrowLeft } from 'lucide-react';

// One class list for the six tabs, so the strip reads as the app's own
// segmented control rather than the shadcn default.
const TAB_LIST = 'grid grid-cols-3 sm:inline-flex sm:w-auto w-full h-auto gap-1 p-1 rounded-[10px] bg-[var(--lv-sunken)]';
const TAB = 'gap-1.5 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-[var(--lv-mute)] data-[state=active]:bg-[var(--lv-surface)] data-[state=active]:text-[var(--lv-ink)] data-[state=active]:font-semibold data-[state=active]:shadow-sm';

export default function Dashboard() {
  const navigate = useNavigate();
  const t = useT();

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

  if (loading) return (
    <div className="lv-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={30} className="animate-spin" style={{ color: 'var(--lv-blue)' }} />
    </div>
  );

  if (isAuthenticated === false) {
    return (
      <div className="lv-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="lv-card lv-card-pad" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <h2 className="lv-h2">{t('gate.title')}</h2>
          <p className="lv-sub" style={{ margin: '8px 0 20px' }}>{t('pg.dash.gateBody')}</p>
          <button className="lv-btn pri wide" onClick={() => setShowAuthModal(true)}>{t('a.signIn')}</button>
          <button className="lv-btn quiet wide" style={{ marginTop: 8 }} onClick={() => window.location.href = '/'}>{t('gate.backHome')}</button>
        </div>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="lv-app">
      <main className="lv-main" style={{ maxWidth: 1024 }}>
        <button className="lv-btn quiet sm" style={{ marginBottom: 12, marginLeft: -10 }} onClick={handleBackToApp}>
          <ArrowLeft size={15} /> {t('pg.dash.backToApp')}
        </button>

        <div className="lv-page-head">
          <div>
            <h1 className="lv-h1">{t('pg.dash.title')}</h1>
            <p className="lv-sub">{t('pg.dash.sub')}</p>
          </div>
        </div>

        <ProfileCard profile={profile} userEmail={userEmail} userCreatedAt={userCreatedAt} />

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className={TAB_LIST}>
            <TabsTrigger value="profile" className={TAB}><User className="w-3.5 h-3.5" />{t('pg.dash.tabProfile')}</TabsTrigger>
            <TabsTrigger value="subscription" className={TAB}>{t('pg.dash.tabPlan')}</TabsTrigger>
            <TabsTrigger value="security" className={TAB}><Lock className="w-3.5 h-3.5" />{t('pg.dash.tabSecurity')}</TabsTrigger>
            <TabsTrigger value="referrals" className={TAB}><Gift className="w-3.5 h-3.5" />{t('pg.dash.tabRefer')}</TabsTrigger>
            <TabsTrigger value="diagnostic" className={TAB}><Wrench className="w-3.5 h-3.5" />{t('pg.dash.tabFix')}</TabsTrigger>
            <TabsTrigger value="danger" className={TAB}><AlertTriangle className="w-3.5 h-3.5" />{t('pg.dash.tabDelete')}</TabsTrigger>
          </TabsList>
          <TabsContent value="profile"><ProfileEditor /></TabsContent>
          <TabsContent value="subscription"><SubscriptionCard subscription={subscription} onCancel={() => setCancelDialogOpen(true)} onUpdatePayment={() => setUpdatePaymentOpen(true)} /><PricingCountdown className="mt-4" /></TabsContent>
          <TabsContent value="security"><ChangePasswordForm /></TabsContent>
          <TabsContent value="referrals"><ReferralProgram /></TabsContent>
          <TabsContent value="diagnostic">
            <EdgeFunctionDiagnostic />
          </TabsContent>
          <TabsContent value="danger">
            <div className="lv-card" style={{ maxWidth: 560 }}>
              <div className="lv-card-head">
                <h2 className="lv-h2">{t('pg.dash.deleteTitle')}</h2>
              </div>
              <div className="lv-card-pad">
                <p className="lv-sub" style={{ marginBottom: 16 }}>
                  {t('pg.dash.deleteBody')}
                </p>
                <DeleteAccountDialog userEmail={userEmail || undefined} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <CancelSubscriptionDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen} subscription={subscription} onSuccess={loadSubscriptionData} />
        <UpdatePaymentDialog open={updatePaymentOpen} onOpenChange={setUpdatePaymentOpen} onSuccess={loadSubscriptionData} />
      </main>
    </div>
  );
}

function ProfileCard({ profile, userEmail, userCreatedAt }: { profile: any; userEmail: string | null; userCreatedAt: string | null }) {
  const t = useT();
  return (
    <div className="lv-card" style={{ marginBottom: 20 }}>
      <div className="lv-card-head">
        <div className="lv-inline" style={{ gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'var(--lv-blue-soft)', color: 'var(--lv-blue)',
              display: 'grid', placeItems: 'center',
            }}
          >
            {profile?.profile_photo_url
              ? <img src={profile.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={22} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="lv-h3">{profile?.full_name || t('pg.dash.yourProfile')}</p>
            <p className="lv-small" style={{ marginTop: 2 }}>{profile?.company_name || t('pg.dash.accountInfo')}</p>
          </div>
        </div>
      </div>
      <div className="lv-card-pad">
        <div className="lv-grid-2">
          <div className="lv-inline" style={{ gap: 11, padding: '11px 13px', background: 'var(--lv-sunken)', borderRadius: 'var(--lv-r)', flexWrap: 'nowrap', minWidth: 0 }}>
            <Mail size={17} style={{ color: 'var(--lv-faint)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p className="lv-eyebrow">{t('m.email')}</p>
              <p className="lv-small" style={{ color: 'var(--lv-ink)', fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail || t('pg.dash.notAvailable')}
              </p>
            </div>
          </div>
          <div className="lv-inline" style={{ gap: 11, padding: '11px 13px', background: 'var(--lv-sunken)', borderRadius: 'var(--lv-r)', flexWrap: 'nowrap', minWidth: 0 }}>
            <Calendar size={17} style={{ color: 'var(--lv-faint)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p className="lv-eyebrow">{t('pg.dash.memberSince')}</p>
              <p className="lv-small lv-num" style={{ color: 'var(--lv-ink)', fontWeight: 500, marginTop: 2 }}>
                {userCreatedAt ? new Date(userCreatedAt).toLocaleDateString() : t('pg.dash.notAvailable')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionCard({ subscription, onCancel, onUpdatePayment }: any) {
  const t = useT();
  if (!subscription) return (
    <div className="lv-card" style={{ maxWidth: 560 }}>
      <div className="lv-card-head">
        <h2 className="lv-h2">{t('pg.dash.planTitle')}</h2>
        <span className="lv-pill">{t('pg.dash.noSubscription')}</span>
      </div>
      <div className="lv-card-pad">
        <p className="lv-sub" style={{ marginBottom: 16 }}>
          {t('pg.dash.noSubBody')}
        </p>
        <button className="lv-btn pri">{t('pg.dash.startTrial')}</button>
      </div>
    </div>
  );
  const amount = subscription.plan?.amount ? (subscription.plan.amount / 100).toFixed(0) : null;
  const status = subscription.status || '';
  const tone = status === 'active' ? 'green' : status === 'canceled' || status === 'unpaid' ? 'red' : 'amber';
  return (
    <div className="lv-card" style={{ maxWidth: 560 }}>
      <div className="lv-card-head">
        <h2 className="lv-h2">{t('pg.dash.planTitle')}</h2>
        <span className={`lv-pill ${tone}`}>{status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : t('pg.dash.statusUnknown')}</span>
      </div>
      <div className="lv-card-pad">
        <div className="lv-grid-2">
          <div>
            <p className="lv-eyebrow">{t('pg.dash.planLabel')}</p>
            <p className="lv-h3" style={{ marginTop: 4 }}>{t('pg.dash.planName')}</p>
          </div>
          <div>
            <p className="lv-eyebrow">{t('m.rate')}</p>
            <p className="lv-h3 lv-num" style={{ marginTop: 4 }}>{amount ? t('pg.dash.amountAMonth', { amount }) : '—'}</p>
          </div>
        </div>
      </div>
      <div className="lv-card-foot">
        <div className="lv-inline">
          <button className="lv-btn sec sm" onClick={onUpdatePayment}>{t('pg.dash.updatePayment')}</button>
          <button className="lv-btn danger sm" onClick={onCancel}>{t('pg.dash.cancelSubscription')}</button>
        </div>
      </div>
    </div>
  );
}
