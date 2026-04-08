import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ClientsList } from './ClientsList';
import { EstimateBuilder } from './EstimateBuilder';
import { InvoiceBuilder } from './InvoiceBuilder';
import { InvoicesList } from './InvoicesList';
import { NotificationSettings } from './NotificationSettings';
import { EstimatesList } from './EstimatesList';
import { AddToHomeScreen } from './AddToHomeScreen';
import { ProfileEditor } from './ProfileEditor';
import { ChangePasswordForm } from './ChangePasswordForm';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { Notes } from './Notes';
import AuthModal from './AuthModal';
import { useData, Estimate } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabase';
import { Menu, X, Bell, Loader2, User, LogOut, ArrowLeft, Receipt, FileText, ExternalLink, CheckCircle, Clock, Send } from 'lucide-react';
import { isPushSubscribed } from '@/lib/pushNotifications';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type View = 'dashboard' | 'clients' | 'notifications' | 'estimates' | 'invoices' | 'account' | 'notes';

export const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showEstimate, setShowEstimate] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceInitialData, setInvoiceInitialData] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { clients, estimates, addClient, loading } = useData();
  const { profile } = useProfile();
  const { toast } = useToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mountedRef.current) setIsAuthenticated(!!session?.user);
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

  const checkPushStatus = async () => { setPushEnabled(await isPushSubscribed()); };
  const handleSignOut = async () => { await supabase.auth.signOut(); };
  const handleAccountClick = () => { setCurrentView('account'); setMobileMenuOpen(false); };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'clients', label: 'Clients' },
    { key: 'estimates', label: 'Estimates' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'notes', label: 'Notes' },
  ];

  const handleNavClick = (view: View) => { setCurrentView(view); setMobileMenuOpen(false); };

  if (isAuthenticated === null || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f5' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f97316' }} />
    </div>
  );

  if (isAuthenticated === false) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f5', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '0.5px solid #e4e4e7' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#18181b', marginBottom: '8px' }}>Sign In Required</h2>
        <p style={{ color: '#71717a', fontSize: '15px', marginBottom: '24px' }}>Please sign in to access LevelWorks.</p>
        <button onClick={() => setShowAuthModal(true)} style={{ width: '100%', background: '#1c1c1e', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', marginBottom: '10px' }}>Sign In</button>
        <button onClick={() => window.location.href = '/'} style={{ width: '100%', background: 'none', color: '#71717a', border: '0.5px solid #e4e4e7', padding: '12px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>Back to Home</button>
      </div>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => window.location.reload()} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5' }}>
      <header style={{ background: '#1c1c1e', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <h1
              style={{ fontSize: '17px', fontWeight: '600', color: '#fff', cursor: 'pointer', letterSpacing: '0.04em', margin: 0 }}
              onClick={() => setCurrentView('dashboard')}
            >
              LEVEL<span style={{ color: '#f97316' }}>WORKS</span>
            </h1>
            <nav style={{ display: 'none' }} className="desktop-nav">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key as View)}
                  style={{
                    background: currentView === item.key ? 'rgba(255,255,255,0.12)' : 'none',
                    color: currentView === item.key ? '#fff' : '#a1a1aa',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: currentView === item.key ? '500' : '400',
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="hide-mobile"><AddToHomeScreen /></span>
            <button onClick={() => handleNavClick('notifications')} className="hide-mobile" style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '8px', borderRadius: '6px', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} />
              {!pushEnabled && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', background: '#f97316', borderRadius: '50%' }} />}
            </button>
            <button onClick={handleAccountClick} className="hide-mobile" style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)', color: '#e4e4e7', padding: '6px 12px', borderRadius: '7px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {profile?.profile_photo_url ? <img src={profile.profile_photo_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={15} />}
              <span>{profile?.full_name?.split(' ')[0] || 'Account'}</span>
            </button>
            <button onClick={() => { setSelectedEstimate(null); setShowEstimate(true); }} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              + Estimate
            </button>
            <button onClick={handleSignOut} className="hide-mobile" style={{ background: 'none', border: '0.5px solid rgba(255,255,255,0.12)', color: '#a1a1aa', padding: '6px 12px', borderRadius: '7px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={15} /> Sign Out
            </button>
            <button className="mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '8px', cursor: 'pointer' }}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div style={{ background: '#141416', borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '12px 16px 16px' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => handleNavClick(item.key as View)} style={{ display: 'block', width: '100%', textAlign: 'left', background: currentView === item.key ? 'rgba(255,255,255,0.08)' : 'none', color: currentView === item.key ? '#fff' : '#a1a1aa', border: 'none', padding: '10px 14px', borderRadius: '7px', fontSize: '15px', fontWeight: currentView === item.key ? '500' : '400', cursor: 'pointer', marginBottom: '2px' }}>
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', marginTop: '10px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => { setSelectedEstimate(null); setShowEstimate(true); setMobileMenuOpen(false); }} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '11px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>+ New Estimate</button>
              <button onClick={handleAccountClick} style={{ background: 'rgba(255,255,255,0.06)', color: '#e4e4e7', border: 'none', padding: '11px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><User size={16} /> Account</button>
              <button onClick={handleSignOut} style={{ background: 'none', color: '#71717a', border: '0.5px solid rgba(255,255,255,0.08)', padding: '11px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><LogOut size={16} /> Sign Out</button>
            </div>
          </div>
        )}
      </header>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; gap: 2px; }
          .hide-mobile { display: inline !important; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 1023px) {
          .hide-mobile { display: none !important; }
          .mobile-only { display: block !important; }
        }
      `}</style>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        {currentView === 'dashboard' && (
          <DashboardView
            clients={clients}
            estimates={estimates}
            onCreateEstimate={() => { setSelectedEstimate(null); setShowEstimate(true); }}
            onViewNotes={() => setCurrentView('notes')}
            onViewEstimates={() => setCurrentView('estimates')}
            onViewEstimate={(estimate) => { setSelectedEstimate(estimate); setShowEstimate(true); }}
            onConnectStripe={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              window.location.href = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_T3ss3sYTBR7iYQrEPRYmsQYyo8BI5XVA&scope=read_write&redirect_uri=https://levelworks.org/stripe-connect-callback&state=${user.id}`;
            }}
            stripeConnected={!!profile?.stripe_account_id}
          />
        )}
        {currentView === 'notifications' && <NotificationSettings />}
        {currentView === 'clients' && <ClientsList clients={clients} onAddClient={addClient} onCreateEstimate={() => { setCurrentView('estimates'); setShowEstimate(true); }} />}
        {currentView === 'estimates' && <EstimatesList />}
        {currentView === 'invoices' && <InvoicesList />}
        {currentView === 'notes' && <Notes />}
        {currentView === 'account' && <AccountView onBack={() => setCurrentView('dashboard')} />}
      </main>

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
    </div>
  );
};

interface DashboardViewProps {
  clients: any[];
  estimates: Estimate[];
  onCreateEstimate: () => void;
  onViewNotes: () => void;
  onViewEstimates: () => void;
  onViewEstimate: (estimate: any) => void;
  onConnectStripe: () => void;
  stripeConnected: boolean;
}

function DashboardView({ clients, estimates, onCreateEstimate, onViewNotes, onViewEstimates, onViewEstimate, onConnectStripe, stripeConnected }: DashboardViewProps) {
  const [receiptCount, setReceiptCount] = useState(0);

  useEffect(() => {
    const loadNoteCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setReceiptCount(count || 0);
    };
    loadNoteCount();
  }, []);

  const recentEstimates = estimates.slice(0, 3);
  const pendingEstimates = estimates.filter(e => e.status === 'sent').length;
  const totalEstimateValue = estimates.reduce((sum, e) => sum + (e.total || 0), 0);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      approved: { background: '#dcfce7', color: '#16a34a' },
      sent: { background: '#dbeafe', color: '#1d4ed8' },
      draft: { background: '#f4f4f5', color: '#52525b' },
    };
    const s = styles[status] || styles.draft;
    return <span style={{ ...s, fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
  <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#18181b', margin: 0 }}>Dashboard</h2>
  <AddToHomeScreen />
</div>
  <AddToHomeScreen />
</div>

      {!stripeConnected && (
        <div style={{ background: '#1c1c1e', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: '500', margin: '0 0 3px' }}>Collect Client Payments</p>
            <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>Accept credit cards directly. Money goes straight to your bank.</p>
          </div>
          <button onClick={onConnectStripe} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Set Up Payments
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }} className="stats-grid">
        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 18px', border: '0.5px solid #e4e4e7' }}>
          <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 6px' }}>Total Value</p>
          <p style={{ color: '#16a34a', fontSize: '26px', fontWeight: '600', margin: 0 }}>${totalEstimateValue.toLocaleString()}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 18px', border: '0.5px solid #e4e4e7', cursor: 'pointer' }} onClick={onViewEstimates}>
          <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 6px' }}>Estimates</p>
          <p style={{ color: '#f97316', fontSize: '26px', fontWeight: '600', margin: 0 }}>{estimates.length}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 18px', border: '0.5px solid #e4e4e7' }}>
          <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 6px' }}>Pending</p>
          <p style={{ color: '#eab308', fontSize: '26px', fontWeight: '600', margin: 0 }}>{pendingEstimates}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 18px', border: '0.5px solid #e4e4e7' }}>
          <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 6px' }}>Clients</p>
          <p style={{ color: '#18181b', fontSize: '26px', fontWeight: '600', margin: 0 }}>{clients.length}</p>
        </div>
      </div>

      <style>{`.stats-grid { } @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4, 1fr) !important; } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '500', color: '#18181b', margin: 0 }}>Recent Estimates</h3>
        <button onClick={onViewEstimates} style={{ background: 'none', border: '0.5px solid #e4e4e7', color: '#52525b', padding: '6px 14px', borderRadius: '7px', fontSize: '13px', cursor: 'pointer' }}>View All</button>
      </div>

      {recentEstimates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '0.5px solid #e4e4e7' }}>
          <FileText style={{ width: '40px', height: '40px', color: '#d4d4d8', margin: '0 auto 12px' }} />
          <p style={{ color: '#71717a', fontSize: '15px', marginBottom: '16px' }}>No estimates yet</p>
          <button onClick={onCreateEstimate} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Create Your First Estimate</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentEstimates.map((estimate) => (
            <div key={estimate.id} onClick={() => onViewEstimate(estimate)}
              style={{ background: '#fff', borderRadius: '10px', padding: '16px 18px', border: '0.5px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#a1a1aa')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e4e4e7')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: '500', color: '#18181b', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{estimate.projectName || 'Unnamed Project'}</p>
                <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 4px' }}>{estimate.clientName}</p>
                <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>EST-{estimate.id.slice(-6)} · {new Date(estimate.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                <p style={{ fontSize: '17px', fontWeight: '600', color: '#18181b', margin: '0 0 5px' }}>${(estimate.total || 0).toLocaleString()}</p>
                {getStatusBadge(estimate.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={onCreateEstimate} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>+ New Estimate</button>
        <button onClick={onViewEstimates} style={{ background: '#fff', color: '#18181b', border: '0.5px solid #e4e4e7', padding: '11px 20px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>All Estimates</button>
      </div>
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
    <div style={{ maxWidth: '480px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e4e4e7' }}>
        <p style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Subscription Status</p>
        {status === 'active' && (
          <div>
            <p style={{ color: '#16a34a', fontSize: '17px', fontWeight: '500', marginBottom: '6px' }}>Active — $5/month</p>
            <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '16px' }}>Your subscription is active. Thank you!</p>
            <button onClick={handleCancel} disabled={cancelling} style={{ background: 'none', border: '0.5px solid #fca5a5', color: '#dc2626', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </div>
        )}
        {status === 'trial' && (
          <div>
            <p style={{ color: '#1d4ed8', fontSize: '17px', fontWeight: '500', marginBottom: '4px' }}>Free Trial</p>
            <p style={{ color: '#71717a', fontSize: '14px' }}>{daysLeft !== null ? `${daysLeft} days remaining` : 'Trial active'}</p>
          </div>
        )}
        {status === 'cancelled' && (
          <div>
            <p style={{ color: '#71717a', fontSize: '17px', fontWeight: '500', marginBottom: '4px' }}>Cancelled</p>
            <p style={{ color: '#71717a', fontSize: '14px' }}>Your subscription has been cancelled.</p>
          </div>
        )}
        {status === null && <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Loading...</p>}
      </div>
    </div>
  );
}

function AccountView({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: '#fff', border: '0.5px solid #e4e4e7', color: '#52525b', padding: '7px 14px', borderRadius: '7px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ArrowLeft size={15} /> Back
        </button>
        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#18181b', margin: 0 }}>Account Settings</h2>
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
    </div>
  );
}
