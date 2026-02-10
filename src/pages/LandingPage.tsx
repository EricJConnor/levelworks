import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Menu, X, Gift, Receipt, FileText } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingNotifications from '@/components/landing/LandingNotifications';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingAI from '@/components/landing/LandingAI';
import LandingReferral from '@/components/landing/LandingReferral';
import LandingReceipts from '@/components/landing/LandingReceipts';
import { PricingCountdown } from '@/components/PricingCountdown';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/app');
      }
    };
    checkExistingSession();
  }, [navigate]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  const handleAuthSuccess = () => {
    // Use window.location for a clean navigation that ensures session is loaded
    window.location.href = '/app';
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setShowAuth(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <header className="border-b border-blue-900/30 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">level</div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-blue-200 hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo('features')} className="text-blue-200 hover:text-white transition-colors flex items-center gap-1"><FileText className="w-4 h-4" />Estimates</button>
            <button onClick={() => scrollTo('receipts')} className="text-blue-200 hover:text-white transition-colors flex items-center gap-1"><Receipt className="w-4 h-4" />Receipts</button>
            <button onClick={() => scrollTo('pricing')} className="text-blue-200 hover:text-white transition-colors">Pricing</button>
            <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white" onClick={openSignIn}>Sign In</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openSignUp}>Sign Up</Button>
          </nav>
          <div className="md:hidden flex items-center gap-3">
            <Button size="sm" variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white" onClick={openSignIn}>Sign In</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openSignUp}>Sign Up</Button>
            <button className="text-white" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-slate-900/95 border-t border-blue-900/30 p-4 space-y-4">
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-blue-200 hover:text-white py-2">Features</button>
            <button onClick={() => scrollTo('features')} className="w-full text-left text-blue-200 hover:text-white py-2 flex items-center gap-2"><FileText className="w-4 h-4" />Estimates</button>
            <button onClick={() => scrollTo('receipts')} className="w-full text-left text-blue-200 hover:text-white py-2 flex items-center gap-2"><Receipt className="w-4 h-4" />Receipts</button>
            <button onClick={() => scrollTo('referral')} className="w-full text-left text-blue-200 hover:text-white py-2 flex items-center gap-2"><Gift className="w-4 h-4" />Referral Program</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-blue-200 hover:text-white py-2">Pricing</button>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-blue-500 text-blue-400" onClick={() => { openSignIn(); setMobileMenu(false); }}>Sign In</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { openSignUp(); setMobileMenu(false); }}>Sign Up</Button>
            </div>
          </div>
        )}

      </header>

      {referralCode && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-3 px-6">
          <div className="container mx-auto flex items-center justify-center gap-2 text-white">
            <Gift className="w-5 h-5" /><span className="font-medium">Referral code <strong>{referralCode}</strong> applied! You'll get <strong>60 days free</strong> when you sign up.</span>
          </div>
        </div>
      )}

      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" /><span className="text-blue-300 text-sm font-medium">AI-Powered Business Tools</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">Create Professional Estimates in Minutes</h1>
            <p className="text-xl text-blue-200 mb-6">Create professional estimates, get digital signatures, and track receipts. All for just $5/month with unlimited estimates.</p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-lg"
              onClick={openSignUp}
            >
              Get Started Free
            </Button>

            <PricingCountdown variant="compact" className="mt-4" />
          </div>

          <div className="relative">
            <img src="https://d64gsuwffb70l.cloudfront.net/69192c98db8a9927f5f026a9_1764536657253_d1846fa9.webp" alt="Level App" className="rounded-lg shadow-2xl border border-blue-500/30" />
          </div>
        </div>
      </section>

      <LandingReceipts onGetStarted={openSignUp} />
      <LandingAI />
      <LandingNotifications />

      <LandingFeatures />
      <LandingReferral onGetStarted={openSignUp} />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingPricing onGetStarted={openSignUp} />
      <LandingFAQ />
      <LandingCTA onGetStarted={openSignUp} />


      <footer className="border-t border-blue-900/30 bg-black/20 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div><div className="text-2xl font-bold text-white mb-4">level</div><p className="text-blue-300 text-sm">Professional tools for contractors. Estimates, invoices, and AI assistance.</p></div>
            <div><h4 className="font-semibold text-white mb-4">Product</h4><div className="space-y-2"><button onClick={() => scrollTo('features')} className="block text-blue-300 hover:text-white text-sm">Features</button><button onClick={() => scrollTo('receipts')} className="block text-blue-300 hover:text-white text-sm">Receipts</button><button onClick={() => scrollTo('pricing')} className="block text-blue-300 hover:text-white text-sm">Pricing</button></div></div>
            <div><h4 className="font-semibold text-white mb-4">Legal</h4><div className="space-y-2"><button onClick={() => navigate('/terms')} className="block text-blue-300 hover:text-white text-sm">Terms</button><button onClick={() => navigate('/privacy')} className="block text-blue-300 hover:text-white text-sm">Privacy</button></div></div>
            <div><h4 className="font-semibold text-white mb-4">Support</h4><p className="text-blue-300 text-sm">support@levelworks.app</p></div>
          </div>
          <div className="border-t border-blue-900/30 pt-8 text-center text-blue-300 text-sm">&copy; 2025 Level. Built for contractors.</div>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} defaultMode={authMode} />
    </div>
  );
}
