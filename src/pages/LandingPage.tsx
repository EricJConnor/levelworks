import { useState, useEffect } from 'react';
import { Menu, X, Check, FileText, Users, Briefcase, StickyNote, PenTool, Send, ChevronRight, Shield, Zap, Star, CreditCard } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate('/app');
    };
    checkExistingSession();
  }, [navigate]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  const handleAuthSuccess = () => { window.location.href = '/app'; };
  const openSignIn = () => { setAuthMode('signin'); setShowAuth(true); };
  const openSignUp = () => { setAuthMode('signup'); setShowAuth(true); };

  const features = [
    { icon: FileText, title: 'Unlimited Estimates', desc: 'Create professional estimates in minutes. Send via email or text.' },
    { icon: PenTool, title: 'Digital Signatures', desc: 'Clients sign from any device. You get notified instantly.' },
    { icon: CreditCard, title: 'Accept Payments', desc: 'Clients pay invoices online by credit card. Money goes straight to your bank account.', highlight: true },
    { icon: Users, title: 'Client Database', desc: 'Every client, every job, every detail — organized and searchable.' },
    { icon: Shield, title: 'Invoicing', desc: 'Convert estimates to invoices in one tap. Get paid faster.' },
    { icon: StickyNote, title: 'Job Notes', desc: 'Capture notes, reminders, and details for every job. Syncs across all your devices.' },
  ];

  const steps = [
    { num: '01', title: 'Create Your Estimate', desc: 'Add your line items, materials, and labor. Takes minutes, not hours.' },
    { num: '02', title: 'Send to Your Client', desc: 'Email or text a professional link directly to your client.' },
    { num: '03', title: 'Client Signs Digitally', desc: 'They review and sign from their phone. You get notified immediately.' },
    { num: '04', title: 'Invoice & Get Paid', desc: 'Convert to invoice with one tap. Client pays online by card — money goes straight to your bank.' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#e8e8e8', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      <header style={{ borderBottom: '1px solid #222', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>
            LEVEL<span style={{ color: '#3b82f6' }}>WORKS</span>
          </div>
          <nav className="hidden md:flex" style={{ gap: '32px', alignItems: 'center' }}>
            <button onClick={() => scrollTo('features')} style={{ color: '#a8a8a8', fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>Features</button>
            <button onClick={() => scrollTo('how-it-works')} style={{ color: '#a8a8a8', fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>How It Works</button>
            <button onClick={() => scrollTo('pricing')} style={{ color: '#a8a8a8', fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>Pricing</button>
            <button onClick={openSignIn} style={{ color: '#e8e8e8', fontSize: '14px', fontWeight: '500', background: 'none', border: '1px solid #333', cursor: 'pointer', padding: '8px 20px', borderRadius: '6px' }}>Sign In</button>
            <button onClick={openSignUp} style={{ background: '#3b82f6', color: '#fff', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', padding: '8px 20px', borderRadius: '6px' }}>Get Started</button>
          </nav>
          <div className="md:hidden" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={openSignIn} style={{ color: '#e8e8e8', fontSize: '13px', background: 'none', border: '1px solid #333', cursor: 'pointer', padding: '6px 14px', borderRadius: '6px' }}>Sign In</button>
            <button onClick={() => setMobileMenu(!mobileMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div style={{ background: '#111', borderTop: '1px solid #222', padding: '16px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button onClick={() => scrollTo('features')} style={{ color: '#a8a8a8', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}>Features</button>
              <button onClick={() => scrollTo('how-it-works')} style={{ color: '#a8a8a8', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}>How It Works</button>
              <button onClick={() => scrollTo('pricing')} style={{ color: '#a8a8a8', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}>Pricing</button>
              <button onClick={() => { openSignUp(); setMobileMenu(false); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', padding: '12px', borderRadius: '6px', fontSize: '15px', fontWeight: '600' }}>Get Started — $5/mo</button>
            </div>
          </div>
        )}
      </header>

      {referralCode && (
        <div style={{ background: '#1a3a5c', borderBottom: '1px solid #1e4a7a', padding: '12px 24px', textAlign: 'center' }}>
          <span style={{ color: '#93c5fd', fontSize: '14px' }}>Referral code <strong style={{ color: '#fff' }}>{referralCode}</strong> applied — you'll get <strong style={{ color: '#fff' }}>60 days free</strong> when you sign up.</span>
        </div>
      )}

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: '760px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', border: '1px solid #222', borderRadius: '4px', padding: '6px 14px', marginBottom: '32px' }}>
            <Zap size={14} style={{ color: '#3b82f6' }} />
            <span style={{ color: '#a8a8a8', fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Built by a contractor for contractors</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-2px', color: '#fff', marginBottom: '24px' }}>
            Run your business.<br />
            <span style={{ color: '#3b82f6' }}>Not your paperwork.</span>
          </h1>
          <p style={{ fontSize: '20px', color: '#a8a8a8', lineHeight: '1.6', marginBottom: '16px', maxWidth: '560px' }}>
            Professional estimates, digital signatures, invoicing, client payments — everything other apps do, for <strong style={{ color: '#fff' }}>$5 a month</strong>.
          </p>
          <p style={{ fontSize: '15px', color: '#909090', marginBottom: '40px' }}>
            Other providers charge up to $149/month. We don't.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={openSignUp} style={{ background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', padding: '16px 32px', borderRadius: '6px', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Start Free Trial <ChevronRight size={18} />
            </button>
            <button onClick={() => scrollTo('how-it-works')} style={{ background: 'transparent', color: '#a8a8a8', border: '1px solid #333', cursor: 'pointer', padding: '16px 32px', borderRadius: '6px', fontSize: '16px', fontWeight: '500' }}>
              See How It Works
            </button>
          </div>
          <p style={{ color: '#444', fontSize: '13px', marginTop: '16px' }}>No credit card required. 30-day free trial.</p>
        </div>
      </section>

      <section style={{ background: '#0f1f3d', borderTop: '1px solid #1e3a5f', borderBottom: '1px solid #1e3a5f', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '4px', padding: '6px 14px', marginBottom: '24px' }}>
            <CreditCard size={14} style={{ color: '#3b82f6' }} />
            <span style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Now Available</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
            Get Paid Directly From the App
          </h2>
          <p style={{ color: '#93c5fd', fontSize: '18px', maxWidth: '600px', lineHeight: '1.6', marginBottom: '32px' }}>
            Send your client an invoice link. They pay by credit card. The money goes straight to your bank account — no middleman, no waiting.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '700px', width: '100%' }}>
            {['Visa & Mastercard', 'American Express', 'Apple Pay & Google Pay', 'Direct to your bank'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px' }}>
                <Check size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <span style={{ color: '#e8e8e8', fontSize: '14px', fontWeight: '500' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ background: '#0f0f0f', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
