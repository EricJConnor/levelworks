import React, { useState, useEffect, useRef } from 'react';
import { ClientsList } from './ClientsList';
import { EstimateBuilder } from './EstimateBuilder';
import { InvoiceBuilder } from './InvoiceBuilder';
import { InvoicesList } from './InvoicesList';
import { NotificationSettings } from './NotificationSettings';
import { EstimatesList } from './EstimatesList';
import { PhotosHub } from './PhotosHub';
import { AddToHomeScreen } from './AddToHomeScreen';
import { ProfileEditor } from './ProfileEditor';
import { ChangePasswordForm } from './ChangePasswordForm';
import { Notes } from './Notes';
import AuthModal from './AuthModal';
import { useData, Estimate } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabase';
import { Menu, Bell, Loader2, User, Users, LogOut, ArrowLeft, Receipt, FileText, CheckCircle, HelpCircle, Plus, CreditCard, Home, StickyNote, Camera, ChevronRight } from 'lucide-react';
import { isPushSubscribed } from '@/lib/pushNotifications';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { HelpModal } from './HelpModal';
import { Mark } from './Mark';

type View = 'dashboard' | 'clients' | 'notifications' | 'estimates' | 'photos' | 'invoices' | 'account' | 'notes';

const money = (n: number) => `$${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [estimatesFilter, setEstimatesFilter] = useState<'all' | 'sent'>('all');
  const [showEstimate, setShowEstimate] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceInitialData, setInvoiceInitialData] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { clients, estimates, addClient, loading } = useData();
  const { profile } = useProfile();
  const mountedRef = useRef(true);

  const handleConnectStripe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    window.location.href = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_T3ss3sYTBR7iYQrEPRYmsQYyo8BI5XVA&scope=read_write&redirect_uri=https://levelworks.org/stripe-connect-callback&state=${user.id}`;
  };

  useEffect(() => {
    mountedRef.current = true;
    // On a cold PWA launch, localStorage/session rehydration can lag behind
    // this first getSession() call - retry briefly instead of bouncing the
    // user to the sign-in screen while a valid session is still loading.
    const checkAuthWithRetry = async (retries = 3): Promise<boolean> => {
      for (let i = 0; i < retries; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) return true;
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
      }
      return false;
    };
    const checkAuth = async () => {
      const authenticated = await checkAuthWithRetry();
      if (mountedRef.current) setIsAuthenticated(authenticated);
    };
    checkAuth();
    checkPushStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      if (event === 'SIGNED_OUT') { setIsAuthenticated(false); window.location.href = '/'; }
      else if (session?.user) setIsAuthenticated(true);
    });
    return () => { mountedRef.current = false; subscription.unsubscribe(); };
  }, []);

  // Handoff from onboarding: /app?new=estimate opens the estimate builder
  // right away, then drops the param so a refresh doesn't reopen it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'estimate') {
      setSelectedEstimate(null);
      setShowEstimate(true);
      params.delete('new');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    }
  }, []);

  const checkPushStatus = async () => { setPushEnabled(await isPushSubscribed()); };
  const handleSignOut = async () => { await supabase.auth.signOut(); };
  const handleAccountClick = () => { setCurrentView('account'); setMobileMenuOpen(false); };
  const handleHelpClick = () => { setShowHelpModal(true); setMobileMenuOpen(false); };

  const navItems: { key: View; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'estimates', label: 'Estimates', icon: FileText },
    { key: 'invoices', label: 'Invoices', icon: Receipt },
    { key: 'clients', label: 'Clients', icon: Users },
    { key: 'photos', label: 'Photos', icon: Camera },
    { key: 'notes', label: 'Notes', icon: StickyNote },
  ];

  const handleNavClick = (view: View) => {
    if (view === 'estimates') setEstimatesFilter('all');
    setCurrentView(view);
    setMobileMenuOpen(false);
  };
  const goToEstimates = (filter: 'all' | 'sent' = 'all') => { setEstimatesFilter(filter); setCurrentView(filter === 'sent' ? 'estimates' : 'estimates'); };
  const newEstimate = () => { setSelectedEstimate(null); setShowEstimate(true); setMobileMenuOpen(false); };
  const newInvoice = () => { setInvoiceInitialData(null); setShowInvoice(true); setMobileMenuOpen(false); };

  if (isAuthenticated === null || loading) return (
    <div className="lv-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={30} className="animate-spin" style={{ color: 'var(--lv-blue)' }} />
    </div>
  );

  if (isAuthenticated === false) return (
    <div className="lv-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="lv-card lv-card-pad" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <h2 className="lv-h1" style={{ fontSize: 21, marginBottom: 6 }}>Sign in to continue</h2>
        <p className="lv-sub" style={{ marginBottom: 20 }}>Your estimates and clients are waiting.</p>
        <button className="lv-btn pri wide" onClick={() => setShowAuthModal(true)}>Sign in</button>
        <button className="lv-btn quiet wide" style={{ marginTop: 8 }} onClick={() => (window.location.href = '/')}>Back to home</button>
      </div>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => window.location.reload()} />
    </div>
  );

  const viewTitle: Record<View, string> = {
    dashboard: 'Dashboard', clients: 'Clients', notifications: 'Notifications', estimates: 'Estimates',
    photos: 'Photos', invoices: 'Invoices', account: 'Account', notes: 'Notes',
  };

  return (
    <div className="lv-app">
      <header className="lv-hdr">
        <div className="lv-hdr-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, minWidth: 0 }}>
            <button className="lv-brand" onClick={() => setCurrentView('dashboard')}>
              <Mark />
              <span>Level<b>Works</b></span>
            </button>
            <nav className="lv-nav lv-hide-mobile" aria-label="Sections">
              {navItems.map(item => (
                <button key={item.key} className={currentView === item.key ? 'on' : ''} onClick={() => handleNavClick(item.key)}>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="lv-hdr-tools">
            <button className="lv-btn pri sm lv-hide-mobile" onClick={newEstimate}><Plus size={15} /> New estimate</button>
            <button className="lv-btn sec sm lv-hide-mobile" onClick={newInvoice}><Plus size={15} /> Invoice</button>
            <button className="lv-icon-btn lv-hide-mobile" onClick={handleHelpClick} title="Help" aria-label="Help"><HelpCircle size={19} /></button>
            <button className="lv-icon-btn lv-hide-mobile" onClick={() => handleNavClick('notifications')} title="Notifications" aria-label="Notifications">
              <Bell size={19} />
              {!pushEnabled && <span className="dot" />}
            </button>
            <button className="lv-btn quiet sm lv-hide-mobile" onClick={handleAccountClick}>
              {profile?.profile_photo_url
                ? <img src={profile.profile_photo_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                : <User size={15} />}
              {profile?.full_name?.split(' ')[0] || 'Account'}
            </button>
            <button className="lv-icon-btn lv-hide-mobile" onClick={handleSignOut} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>

            {/* mobile: one primary action lives in the header, the rest in the tab bar */}
            <button className="lv-btn pri sm lv-hide-desktop" onClick={newEstimate}><Plus size={15} /> Estimate</button>
          </div>
        </div>
      </header>

      <main className="lv-main" style={{ paddingBottom: 96 }}>
        {currentView !== 'dashboard' && (
          <button className="lv-btn quiet sm" style={{ marginBottom: 12, marginLeft: -10 }} onClick={() => setCurrentView('dashboard')}>
            <ArrowLeft size={15} /> Dashboard
          </button>
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            clients={clients}
            estimates={estimates}
            onCreateEstimate={newEstimate}
            onViewEstimates={(filter) => goToEstimates(filter)}
            onViewClients={() => setCurrentView('clients')}
            onViewEstimate={(estimate) => { setSelectedEstimate(estimate); setShowEstimate(true); }}
            onConnectStripe={handleConnectStripe}
            stripeConnected={!!profile?.stripe_account_id}
            firstName={profile?.full_name?.split(' ')[0]}
          />
        )}
        {currentView === 'notifications' && <NotificationSettings />}
        {currentView === 'clients' && <ClientsList clients={clients} onAddClient={addClient} onCreateEstimate={() => { setCurrentView('estimates'); setShowEstimate(true); }} onConnectStripe={handleConnectStripe} />}
        {currentView === 'estimates' && <EstimatesList initialStatusFilter={estimatesFilter} />}
        {currentView === 'photos' && <PhotosHub onOpenEstimate={(est) => { setSelectedEstimate(est); setShowEstimate(true); }} />}
        {currentView === 'invoices' && <InvoicesList onCreateInvoice={newInvoice} />}
        {currentView === 'notes' && <Notes />}
        {currentView === 'account' && <AccountView onBack={() => setCurrentView('dashboard')} />}
      </main>

      {mobileMenuOpen && (
        <>
          <div className="lv-sheet-scrim lv-hide-desktop" onClick={() => setMobileMenuOpen(false)} />
          <div className="lv-sheet lv-hide-desktop">
            {navItems.filter(i => !['dashboard', 'estimates', 'invoices', 'clients'].includes(i.key)).map(item => (
              <button key={item.key} className={currentView === item.key ? 'on' : ''} onClick={() => handleNavClick(item.key)}>
                <item.icon size={17} /> {item.label}
              </button>
            ))}
            <button className={currentView === 'notifications' ? 'on' : ''} onClick={() => handleNavClick('notifications')}><Bell size={17} /> Notifications</button>
            <hr />
            <button onClick={newInvoice}><Plus size={17} /> New invoice</button>
            <button onClick={handleAccountClick}><User size={17} /> Account</button>
            <AddToHomeScreen />
            <button onClick={handleHelpClick}><HelpCircle size={17} /> Help</button>
            <button onClick={handleSignOut} style={{ color: 'var(--lv-mute)' }}><LogOut size={17} /> Sign out</button>
          </div>
        </>
      )}

      <nav className="lv-tabs lv-hide-desktop" aria-label="Main">
        {navItems.slice(0, 4).map(({ key, label, icon: Icon }) => (
          <button key={key} className={currentView === key ? 'on' : ''} onClick={() => handleNavClick(key)}>
            <Icon size={21} /><span>{label}</span>
          </button>
        ))}
        <button
          className={mobileMenuOpen || !['dashboard', 'estimates', 'invoices', 'clients'].includes(currentView) ? 'on' : ''}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={21} /><span>More</span>
        </button>
      </nav>

      {showEstimate && (
        <EstimateBuilder
          onClose={() => { setShowEstimate(false); setSelectedEstimate(null); }}
          existingEstimate={selectedEstimate}
          onConvertToInvoice={(data) => {
            setShowEstimate(false);
            setSelectedEstimate(null);
            setInvoiceInitialData(data);
            setShowInvoice(true);
          }}
        />
      )}
      {showInvoice && (
        <InvoiceBuilder
          initialData={invoiceInitialData}
          onClose={() => { setShowInvoice(false); setInvoiceInitialData(null); }}
        />
      )}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      <span style={{ display: 'none' }}>{viewTitle[currentView]}</span>
    </div>
  );
};

interface DashboardViewProps {
  clients: any[];
  estimates: Estimate[];
  onCreateEstimate: () => void;
  onViewEstimates: (filter?: 'all' | 'sent') => void;
  onViewClients: () => void;
  onViewEstimate: (estimate: any) => void;
  onConnectStripe: () => void;
  stripeConnected: boolean;
  firstName?: string;
}

function DashboardView({ clients, estimates, onCreateEstimate, onViewEstimates, onViewClients, onViewEstimate, onConnectStripe, stripeConnected, firstName }: DashboardViewProps) {
  const recentEstimates = estimates.slice(0, 5);
  const pendingEstimates = estimates.filter(e => e.status === 'sent').length;
  const totalEstimateValue = estimates.reduce((sum, e) => sum + (e.total || 0), 0);

  const statusPill = (status: string) => {
    const tone = status === 'approved' ? 'green' : status === 'sent' ? 'blue' : '';
    return <span className={`lv-pill ${tone}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <div>
      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">{firstName ? `Hi ${firstName}` : 'Dashboard'}</h1>
          <p className="lv-sub">Here’s where every job stands.</p>
        </div>
        <div className="lv-inline">
          <button className="lv-btn pri" onClick={onCreateEstimate}><Plus size={16} /> New estimate</button>
        </div>
      </div>

      {!stripeConnected && (
        <div className="lv-card lv-card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderColor: '#cfe0ff', background: 'linear-gradient(180deg, #f7faff, #ffffff)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--lv-blue-soft)', color: 'var(--lv-blue)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <CreditCard size={18} />
            </div>
            <div>
              <p className="lv-h3">Get paid by card</p>
              <p className="lv-small" style={{ marginTop: 2 }}>Connect Stripe once and clients can pay any invoice online.</p>
            </div>
          </div>
          <button className="lv-btn sec" onClick={onConnectStripe}>Set up payments</button>
        </div>
      )}

      <div className="lv-stats" style={{ marginBottom: 24 }}>
        <button className="lv-stat" onClick={() => onViewEstimates()}>
          <b>{money(totalEstimateValue)}</b><span>Total estimated</span>
        </button>
        <button className="lv-stat" onClick={() => onViewEstimates()}>
          <b>{estimates.length}</b><span>Estimates</span>
        </button>
        <button className="lv-stat" onClick={() => onViewEstimates('sent')}>
          <b>{pendingEstimates}</b><span>Awaiting a client</span>
        </button>
        <button className="lv-stat" onClick={onViewClients}>
          <b>{clients.length}</b><span>Clients</span>
        </button>
      </div>

      <div className="lv-page-head" style={{ marginBottom: 12, alignItems: 'center' }}>
        <h2 className="lv-h2">Recent estimates</h2>
        <button className="lv-btn quiet sm" onClick={() => onViewEstimates()}>View all <ChevronRight size={15} /></button>
      </div>

      {recentEstimates.length === 0 ? (
        <div className="lv-empty">
          <FileText size={30} />
          <h3>No estimates yet</h3>
          <p>Write your first one now — it takes a couple of minutes, and your client can sign it from their phone.</p>
          <button className="lv-btn pri" onClick={onCreateEstimate}><Plus size={16} /> Create your first estimate</button>
        </div>
      ) : (
        <div className="lv-card">
          {recentEstimates.map((estimate) => (
            <button className="lv-row" key={estimate.id} onClick={() => onViewEstimate(estimate)}>
              <div style={{ minWidth: 0 }}>
                <div className="lv-row-t" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{estimate.projectName || 'Unnamed project'}</div>
                <div className="lv-row-s">{estimate.clientName} · EST-{estimate.id.slice(-6)} · {new Date(estimate.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="lv-inline" style={{ flexShrink: 0, gap: 12 }}>
                <span className="lv-row-r">{money(estimate.total || 0)}</span>
                {statusPill(estimate.status)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BillingSettings() {
  const [status, setStatus] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.functions.invoke('check-subscription', {
        body: { userId: user.id, userEmail: user.email, userName: '' }
      });
      if (data) { setStatus(data.status); setDaysLeft(data.daysLeft); }
    };
    loadStatus();
  }, []);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.functions.invoke('cancel-subscription', { body: { userId: user.id } });
      if (error) throw error;
      setStatus('cancelled');
      toast({ title: 'Subscription cancelled', description: 'You can reactivate anytime.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to cancel', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="lv-card lv-card-pad" style={{ maxWidth: 460 }}>
      <span className="lv-eyebrow">Subscription</span>
      {status === 'active' && (
        <div style={{ marginTop: 10 }}>
          <p className="lv-h2" style={{ color: 'var(--lv-green)' }}>Active — $5/month</p>
          <p className="lv-sub" style={{ margin: '6px 0 16px' }}>Thanks for being here. Everything is switched on.</p>
          <button className="lv-btn danger sm" onClick={handleCancel} disabled={cancelling}>{cancelling ? 'Cancelling…' : 'Cancel subscription'}</button>
        </div>
      )}
      {status === 'trial' && (
        <div style={{ marginTop: 10 }}>
          <p className="lv-h2" style={{ color: 'var(--lv-blue)' }}>Free trial</p>
          <p className="lv-sub" style={{ marginTop: 4 }}>{daysLeft !== null ? `${daysLeft} days remaining` : 'Trial active'}</p>
        </div>
      )}
      {status === 'cancelled' && (
        <div style={{ marginTop: 10 }}>
          <p className="lv-h2">Cancelled</p>
          <p className="lv-sub" style={{ marginTop: 4 }}>Your subscription has been cancelled.</p>
        </div>
      )}
      {status === null && <p className="lv-sub" style={{ marginTop: 10 }}>Loading…</p>}
    </div>
  );
}

function AccountView({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">Account</h1>
          <p className="lv-sub">Your business details, security and billing.</p>
        </div>
      </div>
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileEditor /></TabsContent>
        <TabsContent value="security"><ChangePasswordForm /></TabsContent>
        <TabsContent value="billing"><BillingSettings /></TabsContent>
      </Tabs>
      <button className="lv-btn quiet sm" style={{ marginTop: 18, marginLeft: -10 }} onClick={onBack}><ArrowLeft size={15} /> Back to dashboard</button>
      <span style={{ display: 'none' }}><CheckCircle size={1} /></span>
    </div>
  );
}
