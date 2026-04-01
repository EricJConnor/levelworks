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
import { SubscriptionBlocker } from './SubscriptionBlocker';
import { ProfileEditor } from './ProfileEditor';
import { ChangePasswordForm } from './ChangePasswordForm';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { Notes } from './Notes';
import { DesignStudio } from './DesignStudio';
import AuthModal from './AuthModal';
import { useData, Estimate } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabase';
import { Menu, X, Bell, Gift, Loader2, User, LogOut, ArrowLeft, Receipt, FileText, Eye, ExternalLink, CheckCircle, Clock, Send, ChefHat, Sparkles } from 'lucide-react';
import { isPushSubscribed } from '@/lib/pushNotifications';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type View = 'dashboard' | 'clients' | 'ai' | 'notifications' | 'estimates' | 'invoices' | 'referrals' | 'account' | 'notes' | 'design';

export const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showEstimate, setShowEstimate] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceInitialData, setInvoiceInitialData] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { jobs, clients, estimates, addJob, addClient, loading } = useData();
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

  // Handle design to estimate conversion
  const handleDesignToEstimate = (items: any[], roomType: string, dimensions: any) => {
    // Store design data for estimate builder
    const lineItems = items.map(item => ({
      id: item.id,
      description: `${item.name}${item.options?.length ? ` (${item.options.join(', ')})` : ''}`,
      quantity: item.quantity,
      rate: item.unitPrice,
      total: item.total
    }));
    
    // Add labor line item
    const materialTotal = items.reduce((sum, item) => sum + item.total, 0);
    lineItems.push({
      id: `labor-${Date.now()}`,
      description: `Labor - ${roomType.charAt(0).toUpperCase() + roomType.slice(1)} (${dimensions.length}' x ${dimensions.width}')`,
      quantity: 1,
      rate: materialTotal * 0.5,
      total: materialTotal * 0.5
    });

    setShowEstimate(true);
    toast({ title: 'Design Ready', description: 'Your design has been prepared for estimate creation' });
  };

  if (isAuthenticated === null || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  
  if (isAuthenticated === false) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
        <p className="text-gray-600 mb-6">Please sign in to access the app.</p>
        <Button onClick={() => setShowAuthModal(true)} className="w-full">Sign In</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full mt-2">Back to Home</Button>
      </Card>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => window.location.reload()} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold cursor-pointer" onClick={() => setCurrentView('dashboard')}>Level</h1>
          <nav className="hidden lg:flex gap-4">
            {navItems.map(item => (
              <button 
                key={item.key} 
                onClick={() => handleNavClick(item.key as View)} 
                className={`hover:text-blue-200 text-sm flex items-center gap-1 ${currentView === item.key ? 'font-semibold' : ''}`}
              >
                {item.icon}
                {item.label}
                             </button>
            ))}
          </nav>
          <div className="hidden md:flex gap-2 items-center">
            <AddToHomeScreen />
            <button onClick={() => handleNavClick('notes')} className="p-2 hover:bg-blue-700 rounded" title="Notes"><Bell size={20} /></button>
            <button onClick={() => handleNavClick('notifications')} className="p-2 hover:bg-blue-700 rounded relative"><Bell size={20} />{!pushEnabled && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}</button>
            <Button onClick={handleAccountClick} variant="ghost" size="sm" className="!bg-white/20 hover:!bg-white/30 !text-white border border-white/50 flex items-center gap-2">{profile?.profile_photo_url ? <img src={profile.profile_photo_url} alt="" className="w-5 h-5 rounded-full object-cover" /> : <User size={16} />}{profile?.full_name?.split(' ')[0] || 'Account'}</Button>
            <Button onClick={() => setShowEstimate(true)} size="sm" className="bg-orange-500 hover:bg-orange-600">+ Estimate</Button>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="!bg-white/20 hover:!bg-white/30 !text-white border border-white/50 flex items-center gap-1"><LogOut size={16} />Sign Out</Button>
          </div>
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-blue-700 px-4 py-4 space-y-2">
            {navItems.map(item => (
              <button 
                key={item.key} 
                onClick={() => handleNavClick(item.key as View)} 
                className={`block w-full text-left py-2 px-3 rounded flex items-center gap-2 ${currentView === item.key ? 'bg-blue-800 font-semibold' : 'hover:bg-blue-600'}`}
              >
                {item.icon}
                {item.label}
                             </button>
            ))}
            <div className="pt-3 border-t border-blue-500 space-y-2">
              <AddToHomeScreen />
              <Button onClick={() => { setShowEstimate(true); setMobileMenuOpen(false); }} className="w-full bg-orange-500 hover:bg-orange-600">+ New Estimate</Button>
              <Button onClick={handleAccountClick} variant="ghost" className="w-full !bg-white/20 hover:!bg-white/30 !text-white border border-white/50 flex items-center gap-2"><User size={16} />Account</Button>
              <Button onClick={handleSignOut} variant="ghost" className="w-full !bg-white/20 hover:!bg-white/30 !text-white border border-white/50 flex items-center gap-2"><LogOut size={16} />Sign Out</Button>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {currentView === 'dashboard' && (
          <DashboardView 
            jobs={jobs} 
            clients={clients} 
            estimates={estimates}
            onCreateEstimate={() => setShowEstimate(true)} 
            onViewNotes={() => setCurrentView('notes')}
            onViewEstimates={() => setCurrentView('estimates')}
            onOpenDesign={() => setCurrentView('design')} 
            onViewEstimate={(estimate) => { setSelectedEstimate(estimate); setShowEstimate(true); }}
          />
        )}
                {currentView === 'notifications' && <NotificationSettings />}
        {currentView === 'clients' && <ClientsList clients={clients} onAddClient={addClient} onCreateEstimate={() => { setCurrentView('estimates'); setShowEstimate(true); }} />}
        {currentView === 'estimates' && <EstimatesList />}
        {currentView === 'invoices' && <InvoicesList />}
        {currentView === 'notes' && <Notes />}
        {currentView === 'account' && <AccountView onBack={() => setCurrentView('dashboard')} />}
      </main>
      {showEstimate && <EstimateBuilder 
        onClose={() => { setShowEstimate(false); setSelectedEstimate(null); }} 
        existingEstimate={selectedEstimate}
        onConvertToInvoice={(data) => { 
          setShowEstimate(false);
          setSelectedEstimate(null);
          setInvoiceInitialData(data);
          setShowInvoice(true); 
        }} 
      />}
      {showInvoice && <InvoiceBuilder 
        initialData={invoiceInitialData} 
        onClose={() => { 
          setShowInvoice(false); 
          setInvoiceInitialData(null); 
        }} 
      />}
    </div>
  );
};




interface DashboardViewProps {
  jobs: any[];
  clients: any[];
  estimates: Estimate[];
  onCreateEstimate: () => void;
  onViewNotes: () => void;
  onViewEstimates: () => void;
  onOpenDesign: () => void;
  onViewEstimate: (estimate: any) => void;
  
}

function DashboardView({ jobs, clients, estimates, onCreateEstimate, onViewNotes, onViewEstimates, onOpenDesign, onViewEstimate }: DashboardViewProps) {
  const { toast } = useToast();
  const [receiptCount, setReceiptCount] = useState(0);
  
  useEffect(() => {
    const stored = localStorage.getItem('levelworks_notes');
    if (stored) {
      try {
        const notes = JSON.parse(stored);
        setReceiptCount(notes.length);
      } catch (e) {
        setReceiptCount(0);
      }
    }
  }, []);

  // Get recent estimates (last 5)
  const recentEstimates = estimates.slice(0, 3);

  // Calculate estimate stats
  const pendingEstimates = estimates.filter(e => e.status === 'sent').length;
  const approvedEstimates = estimates.filter(e => e.status === 'approved').length;
  const totalEstimateValue = estimates.reduce((sum, e) => sum + (e.total || 0), 0);

  

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500 text-xs">Approved</Badge>;
      case 'sent': return <Badge className="bg-blue-500 text-xs">Sent</Badge>;
      case 'rejected': return <Badge className="bg-red-500 text-xs">Rejected</Badge>;
      default: return <Badge className="bg-gray-500 text-xs">Draft</Badge>;
    }
  };

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Dashboard</h2>
      
            
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-6">
        <Card className="p-4 md:p-6">
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{jobs.length}</div>
          <div className="text-xs md:text-sm text-gray-600">Active Jobs</div>
        </Card>
        <Card className="p-4 md:p-6">
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">${totalEstimateValue.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Value</div>
        </Card>
        <Card className="p-4 md:p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={onViewEstimates}>
          <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">{estimates.length}</div>
          <div className="text-xs md:text-sm text-gray-600">Estimates</div>
        </Card>
        <Card className="p-4 md:p-6">
          <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">{pendingEstimates}</div>
          <div className="text-xs md:text-sm text-gray-600">Pending</div>
        </Card>
        <Card className="p-4 md:p-6">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{clients.length}</div>
          <div className="text-xs md:text-sm text-gray-600">Clients</div>
        </Card>
        <Card 
          className="p-4 md:p-6 cursor-pointer hover:shadow-md transition-shadow border-2 border-teal-100 bg-teal-50/50"
          onClick={onViewNotes}
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            <div className="text-2xl md:text-3xl font-bold text-teal-600 mb-1">{receiptCount}</div>
          </div>
          <div className="text-xs md:text-sm text-gray-600">Notes</div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Recent Estimates - Takes 2 columns */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Estimates</h3>
            <Button variant="outline" size="sm" onClick={onViewEstimates}>
              View All
            </Button>
          </div>
          
          {recentEstimates.length === 0 ? (
            <Card className="p-6 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No estimates yet</p>
              <Button onClick={onCreateEstimate} className="bg-orange-500 hover:bg-orange-600">
                Create Your First Estimate
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentEstimates.map((estimate) => (
                <Card 
                  key={estimate.id} 
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                 onClick={() => onViewEstimate(estimate)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                        {getStatusIcon(estimate.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {estimate.projectName || 'Unnamed Project'}
                          </h4>
                          {getStatusBadge(estimate.status)}
                          {estimate.signedAt && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Signed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{estimate.clientName}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>EST-{estimate.id.slice(-6)}</span>
                          <span>{new Date(estimate.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900">
                        ${(estimate.total || 0).toLocaleString()}
                      </div>
                      {estimate.viewToken && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                          <ExternalLink className="w-3 h-3" />
                          <span>View</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
                            <Button onClick={onCreateEstimate} className="w-full bg-orange-500 hover:bg-orange-600">
                + New Estimate
              </Button>
              <Button variant="outline" onClick={onViewEstimates} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                All Estimates
              </Button>
            </div>
          </div>

          {/* Referral Widget */}
          <div>
                     </div>
        </div>
      </div>

      
    </div>
  );
}

function AccountView({ onBack }: { onBack: () => void }) {

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={onBack} variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        <h2 className="text-2xl font-bold">Account Settings</h2>
      </div>
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger" className="text-red-600 data-[state=active]:text-red-600">Danger</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileEditor /></TabsContent>
        <TabsContent value="security"><ChangePasswordForm /></TabsContent>
        <TabsContent value="danger">
          <Card className="p-6 border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. All your data including estimates, 
              invoices, clients, and jobs will be permanently removed.
            </p>
            <DeleteAccountDialog />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
