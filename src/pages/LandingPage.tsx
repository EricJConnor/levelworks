import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Check, FileText, Users, Briefcase, StickyNote, PenTool, Send, ChevronRight, Shield, Zap, Star } from 'lucide-react';
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
    { icon: Users, title: 'Client Database', desc: 'Every client, every job, every detail — organized and searchable.' },
    { icon: Briefcase, title: 'Job Management', desc: 'Track every job from first call to final payment.' },
    { icon: StickyNote, title: 'Job Notes', desc: 'Capture notes, reminders, and details for every job. Syncs across all your devices.' },
    { icon: Shield, title: 'Invoicing', desc: 'Convert estimates to invoices in one tap. Get paid faster.' },
  ];

  const steps = [
    { num: '01', title: 'Create Your Estimate', desc: 'Add your line items, materials, and labor. Takes minutes, not hours.' },
    { num: '02', title: 'Send to Your Client', desc: 'Email or text a professional link directly to your client.' },
    { num: '03', title: 'Client Signs Digitally', desc: 'They review and sign from their phone. You get notified immediately.' },
    { num: '04', title: 'Invoice & Get Paid', desc: 'Convert to invoice with one tap. Accept payment online.' },
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
            <span style={{ color: '#a8a8a8', fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Built for contractors</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-2px', color: '#fff', marginBottom: '24px' }}>
            Run your business.<br />
            <span style={{ color: '#3b82f6' }}>Not your paperwork.</span>
          </h1>
          <p style={{ fontSize: '20px', color: '#a8a8a8', lineHeight: '1.6', marginBottom: '16px', maxWidth: '560px' }}>
            Professional estimates, digital signatures, invoicing, and job tracking — everything other apps do, for <strong style={{ color: '#fff' }}>$5 a month</strong>.
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

      <section id="pricing" style={{ background: '#0f0f0f', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '12px' }}>Simple Pricing</h2>
            <p style={{ color: '#a0a0a0', fontSize: '18px' }}>One plan. Everything included. No surprises.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto', alignItems: 'center' }}>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '32px' }}>
              <p style={{ color: '#909090', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>The Competition</p>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: '800', color: '#444' }}>$149</span>
                <span style={{ color: '#444', fontSize: '16px' }}>/month</span>
              </div>
              <p style={{ color: '#444', fontSize: '14px', marginBottom: '24px' }}>What other providers charge for their top plan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Estimates & Invoices', 'Digital Signatures', 'Client Management', 'Job Tracking'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#444' }}>
                    <Check size={14} />
                    <span style={{ fontSize: '14px' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#0f1f3d', border: '2px solid #3b82f6', borderRadius: '12px', padding: '32px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '4px 16px', borderRadius: '20px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                LEVELWORKS
              </div>
              <p style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Your new app</p>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '64px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>$5</span>
                <span style={{ color: '#93c5fd', fontSize: '18px' }}>/month</span>
              </div>
              <p style={{ color: '#93c5fd', fontSize: '14px', marginBottom: '24px' }}>Everything you need. Nothing you don't.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {['Unlimited Estimates & Invoices', 'Digital Signatures', 'Client Database', 'Job Management', 'Job Notes', 'Push Notifications', 'Email & Text Sending'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e8e8e8' }}>
                    <Check size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={openSignUp} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px', borderRadius: '6px', fontSize: '16px', fontWeight: '700' }}>
                Start Free — 30 Days
              </button>
            </div>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '32px' }}>
              <p style={{ color: '#909090', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Your savings</p>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: '800', color: '#22c55e' }}>$1,728</span>
              </div>
              <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '24px' }}>Saved per year vs other providers</p>
              <div style={{ background: '#0f2010', border: '1px solid #1a4a20', borderRadius: '8px', padding: '16px' }}>
                <p style={{ color: '#4ade80', fontSize: '14px', lineHeight: '1.6' }}>
                  That's real money back in your pocket. Every month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '12px' }}>Everything You Need</h2>
          <p style={{ color: '#a0a0a0', fontSize: '18px' }}>Built by by a contractor, for contractors.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: '#1a1a1a', border: '1px solid #1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: '#0a0a0a', padding: '32px', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0f1520')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0a0a0a')}
            >
              <div style={{ width: '40px', height: '40px', background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <f.icon size={20} style={{ color: '#3b82f6' }} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ background: '#0f0f0f', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '12px' }}>How It Works</h2>
            <p style={{ color: '#a0a0a0', fontSize: '18px' }}>From estimate to signed approval in minutes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
            {steps.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '48px', fontWeight: '800', color: 'transparent', backgroundImage: 'linear-gradient(180deg, #c0c0c0 0%, #808080 50%, #c0c0c0 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', letterSpacing: '-2px', marginBottom: '16px', lineHeight: 1 }}>{s.num}</div>
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.7' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { quote: "I was paying $99 a month for another app. This does everything I need for $5. No brainer.", name: "Mike R.", trade: "General Contractor" },
            { quote: "My clients love that they can sign from their phone. I close jobs faster now.", name: "Dave T.", trade: "Roofing Contractor" },
            { quote: "Simple, fast, does what I need. I don't need a complicated system.", name: "Carlos M.", trade: "Electrical Contractor" },
          ].map((t, i) => (
            <div key={i} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '28px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(5)].map((_, j) => <Star key={j} size={14} style={{ color: '#3b82f6', fill: '#3b82f6' }} />)}
              </div>
              <p style={{ color: '#a8a8a8', fontSize: '15px', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' }}>"{t.quote}"</p>
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>{t.name}</p>
                <p style={{ color: '#909090', fontSize: '13px' }}>{t.trade}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#0f1f3d', borderTop: '1px solid #1e3a5f', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
            Ready to save $1,700 a year?
          </h2>
          <p style={{ color: '#93c5fd', fontSize: '18px', marginBottom: '40px' }}>Start your free 30-day trial. No credit card required.</p>
          <button onClick={openSignUp} style={{ background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', padding: '18px 48px', borderRadius: '6px', fontSize: '18px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Get Started Free <ChevronRight size={20} />
          </button>
          <p style={{ color: '#3b82f6', fontSize: '14px', marginTop: '16px' }}>$5/month after trial. Cancel anytime.</p>
        </div>
      </section>

      <footer style={{ background: '#050505', borderTop: '1px solid #111', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>LEVEL<span style={{ color: '#3b82f6' }}>WORKS</span></div>
            <p style={{ color: '#444', fontSize: '13px' }}>Professional tools for contractors.</p>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/terms')} style={{ color: '#444', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>Terms</button>
            <button onClick={() => navigate('/privacy')} style={{ color: '#444', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>Privacy</button>
            <a href="mailto:support@levelworks.org" style={{ color: '#444', fontSize: '13px', textDecoration: 'none' }}>support@levelworks.org</a>
          </div>
          <p style={{ color: '#333', fontSize: '12px' }}>© 2025 LevelWorks. Built for the trades.</p>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} defaultMode={authMode} />
    </div>
  );
}
