import { useState, useEffect, useRef } from 'react';
import {
  Menu, X, Check, FileText, PenTool, CreditCard, Repeat, Camera, Users, ChevronDown, ChevronRight,
  ShieldCheck, Lock, Bell, Eye, Hammer, BadgeDollarSign, Image as ImageIcon, Sparkles,
} from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import './landing.css';

/* ------------------------------------------------------------------ */
/* Brand mark: a spirit level's bubble, centred. Level means true.      */
/* ------------------------------------------------------------------ */
function Mark() {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1.5" y="8.5" width="25" height="11" rx="3.5" stroke="#0b1220" strokeWidth="2" />
      <rect x="10" y="11" width="8" height="6" rx="2" fill="#2563eb" />
      <path d="M8.5 9v10M19.5 9v10" stroke="#0b1220" strokeWidth="1.5" strokeOpacity=".35" />
    </svg>
  );
}
function Logo() {
  return (
    <a href="/" className="lw-logo" aria-label="LevelWorks home">
      <Mark />
      <span>Level<b>Works</b></span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Product mockups. Built in code so they are crisp at every size and  */
/* always match the product's real vocabulary (line items, sign, pay). */
/* ------------------------------------------------------------------ */
const SigPath = () => (
  <path d="M4 30 C 14 4, 22 4, 26 22 S 38 40, 46 16 S 60 2, 66 20 S 78 36, 88 12 S 104 4, 116 24" stroke="#0b1220" strokeWidth="2" strokeLinecap="round" fill="none" />
);

function EstimateDoc({ signed = false }: { signed?: boolean }) {
  return (
    <div className="lw-doc">
      <div className="brand">
        <div className="mark">RP</div>
        <div><b>Ridgeline Painting Co.</b><small>Licensed &amp; insured · Bucks County, PA</small></div>
      </div>
      <div className="ttl"><b>Estimate #1042</b><span>Sep 6, 2026</span></div>
      <div className="to">Prepared for <b>Maria Keller</b> · 118 Elm St, Doylestown</div>
      <div className="li"><div><b>Exterior prep &amp; power wash</b><small>Scrape, sand, prime bare wood</small></div><span>$650.00</span></div>
      <div className="li"><div><b>Siding, 2 coats</b><small>Sherwin-Williams Duration</small></div><span>$3,400.00</span></div>
      <div className="li"><div><b>Trim &amp; shutters</b><small>16 windows, 2 doors</small></div><span>$800.00</span></div>
      <div className="sum">
        <div className="row"><span>Subtotal</span><span>$4,850.00</span></div>
        <div className="row"><span>Deposit due at signing</span><span>$1,455.00</span></div>
        <div className="row tot"><span>Total</span><span>$4,850.00</span></div>
        <div className="sig">
          <svg viewBox="0 0 120 40"><SigPath /></svg>
          <small>{signed ? 'Signed Sep 6, 2:14 PM' : 'Sign here'}</small>
        </div>
        <div className={`cta ${signed ? 'ok' : ''}`}>{signed ? 'Approved · Pay deposit' : 'Approve & sign'}</div>
      </div>
    </div>
  );
}

function PhoneShell({ children, mini = false }: { children: React.ReactNode; mini?: boolean }) {
  return (
    <div className={mini ? 'lw-mini-phone' : 'lw-phone'}>
      <div className="scr">{!mini && <div className="notch" />}{children}</div>
    </div>
  );
}

function InvoiceMock() {
  return (
    <div className="lw-stack">
      <div className="lw-card back">
        <div className="hd"><b>Invoice #1038</b><span className="pill">Sent</span></div>
        <div className="row"><div className="l"><b>Kitchen repaint · Dan Ortiz</b><small>Due Sep 20</small></div><div className="r">$2,150.00</div></div>
      </div>
      <div className="lw-card front">
        <div className="hd"><b>Invoice #1042</b><span className="pill ok">Paid</span></div>
        <div className="row"><div className="l"><b>Exterior repaint · Maria Keller</b><small>Paid by Visa ···4421 · Sep 12</small></div><div className="r">$4,850.00</div></div>
        <div className="row"><div className="l"><b>Processing</b><small>Stripe, card payment</small></div><div className="r"><small>2.9% + 30¢</small></div></div>
        <div className="row"><div className="l"><b>Deposited to your bank</b><small>Ridgeline Painting · Business checking</small></div><div className="r" style={{ color: '#16a34a' }}>$4,708.85</div></div>
        <div className="ft"><div className="btn sec">Receipt</div><div className="btn ok">Paid in full</div></div>
      </div>
    </div>
  );
}

function SignMock() {
  return (
    <PhoneShell mini>
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ fontSize: 12, color: '#5b6472' }}>Estimate #1042 · $4,850.00</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0b1220', marginTop: 4, letterSpacing: '-.01em' }}>Approve this estimate</div>
      </div>
      <div className="lw-bubble" style={{ marginTop: 12 }}>By signing you agree to the scope and total above. <b>Ridgeline Painting Co.</b> will be notified instantly.</div>
      <div className="lw-sigpad">
        <svg viewBox="0 0 200 70"><path d="M6 52 C 26 6, 40 6, 48 40 S 70 68, 84 26 S 104 2, 116 34 S 140 62, 156 20 S 180 6, 194 40" stroke="#0b1220" strokeWidth="2.5" strokeLinecap="round" fill="none" /></svg>
        <small>Draw your signature</small>
      </div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#2563eb', color: '#fff', borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 12 }}>Sign &amp; approve</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#5b6472', marginTop: 10 }}>Works on any phone. No app to download.</div>
      </div>
      <div className="lw-float" style={{ position: 'absolute', left: 12, right: 12, bottom: 14, padding: '10px 12px' }}>
        <div className="ic" style={{ background: '#e8efff', color: '#2563eb', width: 30, height: 30 }}><Bell size={15} /></div>
        <div><div className="t" style={{ fontSize: 12.5 }}>Maria Keller signed</div><div className="s" style={{ fontSize: 11 }}>Push notification · just now</div></div>
      </div>
    </PhoneShell>
  );
}

function RecurringMock() {
  return (
    <div className="lw-card" style={{ maxWidth: 470 }}>
      <div className="hd"><b>Recurring billing</b><span className="pill blue">4 active</span></div>
      <div className="row"><div className="l"><b>HVAC maintenance · Grant Family</b><small>Quarterly · next Oct 1 · Visa ···2210</small></div><div className="r">$189.00<small>auto-pay</small></div></div>
      <div className="row"><div className="l"><b>Lawn care · Oakwood HOA</b><small>Monthly · next Sep 15 · Mastercard ···8817</small></div><div className="r">$640.00<small>auto-pay</small></div></div>
      <div className="row alert"><div className="l"><b>Card declined · Tom Reyes</b><small>Retrying tomorrow · you were alerted 9:02 AM</small></div><div className="r"><small style={{ color: '#d97706', fontWeight: 600 }}>Past due</small></div></div>
      <div className="row"><div className="l"><b>Website hosting · Bella Salon</b><small>Yearly · next Mar 1 · Amex ···1003</small></div><div className="r">$1,200.00<small>auto-pay</small></div></div>
      <div className="ft"><div className="btn sec">Edit schedule</div><div className="btn">+ New schedule</div></div>
    </div>
  );
}

function PhotosMock() {
  return (
    <PhoneShell mini>
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ fontSize: 12, color: '#5b6472' }}>Job update · Keller exterior</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0b1220', marginTop: 4, letterSpacing: '-.01em' }}>Day 3: second coat on</div>
      </div>
      <div className="lw-photos">
        <div /><div /><div /><div /><div /><div />
      </div>
      <div className="lw-bubble">Hi Maria, siding is done and looking great. Trim and shutters tomorrow, weather permitting. <b>— Rob</b></div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#0b1220', color: '#fff', borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 12 }}>Send update to client</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#5b6472', marginTop: 10 }}>Photos are tagged before / during / after</div>
      </div>
    </PhoneShell>
  );
}

function ClientsMock() {
  const rows = [
    ['MK', 'Maria Keller', 'Exterior repaint · Signed, deposit paid', '#2563eb'],
    ['DO', 'Dan Ortiz', 'Kitchen repaint · Invoice sent', '#7c3aed'],
    ['GF', 'Grant Family', 'HVAC maintenance · Quarterly', '#16a34a'],
    ['OH', 'Oakwood HOA', 'Lawn care · Monthly', '#d97706'],
    ['BS', 'Bella Salon', 'Hosting · Yearly', '#dc2626'],
  ];
  return (
    <div className="lw-card" style={{ maxWidth: 450 }}>
      <div className="hd"><b>Clients</b><span className="pill">Search, sorted by last activity</span></div>
      {rows.map(([i, n, s, c]) => (
        <div className="row" key={n}>
          <div className="l withav"><div className="av" style={{ background: c }}>{i}</div><div><b>{n}</b><small>{s}</small></div></div>
          <ChevronRight size={16} color="#9aa3b2" />
        </div>
      ))}
    </div>
  );
}

function BrandMock() {
  return (
    <div className="lw-card" style={{ maxWidth: 440 }}>
      <div style={{ padding: '22px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#0b1b33', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15, letterSpacing: '-.02em' }}>RP</div>
          <div><div style={{ fontWeight: 700, color: '#0b1220', fontSize: 16 }}>Ridgeline Painting Co.</div><div style={{ fontSize: 12.5, color: '#5b6472' }}>rob@ridgelinepainting.com · (215) 555-0148</div></div>
        </div>
        <div style={{ marginTop: 18, borderTop: '1px solid #e6e9ef', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5b6472' }}>
          <span>Estimate #1042</span><span>Sep 6, 2026</span>
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: '#eef1f6', width: '70%' }} />
        <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: '#eef1f6', width: '55%' }} />
        <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: '#eef1f6', width: '62%' }} />
      </div>
      <div className="ft" style={{ justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#5b6472' }}>
        <span>Sent from <b style={{ color: '#0b1220' }}>your</b> business</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600 }}><Check size={14} /> No LevelWorks branding</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: 'estimates', icon: FileText, title: 'Estimates', blurb: 'Line items, sections, deposits and your logo. Build one on your phone in the driveway and send it before you pull out.' },
  { id: 'sign', icon: PenTool, title: 'Digital signatures', blurb: 'Clients approve and sign from a link, on any device, no app needed. You get a push notification the moment they do.' },
  { id: 'invoices', icon: CreditCard, title: 'Invoices & card payments', blurb: 'Turn a signed estimate into an invoice in one tap. Clients pay by card, Apple Pay or Google Pay and the money goes straight to your bank.' },
  { id: 'recurring', icon: Repeat, title: 'Recurring billing', blurb: 'Put maintenance contracts on autopilot: monthly, quarterly, yearly, any schedule. Failed cards retry automatically and you are alerted.' },
  { id: 'photos', icon: Camera, title: 'Photo updates', blurb: 'Snap job-site photos and send a clean before / during / after progress update to the client with one tap.' },
  { id: 'clients', icon: Users, title: 'Clients & jobs', blurb: 'Every client, job, note and document in one place, searchable, synced across all your devices.' },
] as const;

const FAQS = [
  { q: 'How much does LevelWorks cost?', a: 'One plan at $5 a month with everything included: unlimited estimates and invoices, signatures, card payments, recurring billing, photo updates, clients, jobs and notes. Once you are on it, your rate is locked. There are no tiers and nothing to unlock later.' },
  { q: 'Is there a free trial?', a: 'Yes. Every new account gets 30 days free with full access to every feature, and no credit card is needed to start. If you sign up with a referral link you get 60 days.' },
  { q: 'How do clients sign an estimate?', a: 'You send a link by email or text. They open it on their phone, tablet or computer, review the line items and draw their signature with a finger or mouse. You get a push notification the moment it is signed.' },
  { q: 'How do I get paid?', a: 'Send an invoice link and your client pays by credit card, Apple Pay or Google Pay. Payments run through Stripe and are deposited directly to your bank account. Standard card processing fees apply; LevelWorks adds nothing on top.' },
  { q: 'What is recurring billing?', a: 'For clients on a service agreement, like HVAC maintenance, lawn care or a hosting retainer, you set the amount and the schedule once and their card is charged automatically. If a card fails, it is retried and you are alerted right away, and the client is marked past due on your dashboard.' },
  { q: 'Will my estimates carry LevelWorks branding?', a: 'No. Upload your logo once and every estimate, invoice and update carries your name and your logo only. Your client deals with you.' },
  { q: 'Is my data secure?', a: 'All data is encrypted in transit and at rest, and card details never touch our servers; they are handled entirely by Stripe, the same processor used by companies like Amazon and Shopify.' },
  { q: 'Can I cancel any time?', a: 'Yes. No contracts, cancel from your dashboard whenever you like, and your data stays yours.' },
];

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('estimates');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate('/app');
    };
    checkExistingSession();
  }, [navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // One soft rise per block as it enters. Nothing re-animates.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.lw-rv'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  // New signups get the business setup step first; returning users go
  // straight into the app.
  const handleAuthSuccess = (result?: { isNewUser?: boolean }) => {
    window.location.href = result?.isNewUser ? '/welcome' : '/app';
  };
  const openSignIn = () => { setAuthMode('signin'); setShowAuth(true); setMobileMenu(false); };
  const openSignUp = () => { setAuthMode('signup'); setShowAuth(true); setMobileMenu(false); };

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="lw" ref={rootRef}>

      {/* ---------------- header ---------------- */}
      <header className={`lw-hdr ${scrolled ? 'scrolled' : ''}`}>
        <div className="lw-wrap">
          <Logo />
          <nav className="lw-nav" aria-label="Primary">
            <button onClick={() => scrollTo('features')}>Features</button>
            <button onClick={() => scrollTo('payments')}>Payments</button>
            <button onClick={() => scrollTo('how-it-works')}>How it works</button>
            <button onClick={() => scrollTo('pricing')}>Pricing</button>
            <button onClick={() => scrollTo('faq')}>FAQ</button>
          </nav>
          <div className="lw-hdr-cta">
            <button className="lw-btn ghost signin" onClick={openSignIn}>Sign in</button>
            <button className="lw-btn pri" onClick={openSignUp}>Start free trial</button>
            <button className="lw-burger" aria-label="Menu" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <div className={`lw-sheet ${mobileMenu ? 'open' : ''}`}>
          <button onClick={() => scrollTo('features')}>Features</button>
          <button onClick={() => scrollTo('payments')}>Payments</button>
          <button onClick={() => scrollTo('how-it-works')}>How it works</button>
          <button onClick={() => scrollTo('pricing')}>Pricing</button>
          <button onClick={() => scrollTo('faq')}>FAQ</button>
          <button onClick={openSignIn}>Sign in</button>
          <button className="lw-btn pri wide" onClick={openSignUp}>Start free 30-day trial</button>
        </div>
      </header>

      {referralCode && (
        <div className="lw-ref">Referral code <strong>{referralCode}</strong> applied. You get <strong>60 days free</strong> when you sign up.</div>
      )}

      {/* ---------------- hero ---------------- */}
      <section className="lw-hero">
        <div className="lw-wrap">
          <div className="lw-hero-copy">
            <div className="lw-price-chip"><b>$5/mo</b> Estimates, signatures, invoices and payments. All of it.</div>
            <h1 className="lw-h1">The estimating and invoicing app built by a contractor.</h1>
            <p className="lw-lead">
              Write a professional estimate on your phone, get it signed from the client's, and get paid by card straight to your bank. All of it for $5 a month.
            </p>
            <div className="lw-hero-cta">
              <button className="lw-btn pri lg" onClick={openSignUp}>Start free 30-day trial <ChevronRight size={18} /></button>
              <button className="lw-btn sec lg" onClick={() => scrollTo('features')}>See the app</button>
            </div>
            <div className="lw-hero-fine">
              <span><Check size={15} /> No credit card to start</span>
              <span><Check size={15} /> Every feature included</span>
              <span><Check size={15} /> Cancel any time</span>
            </div>
          </div>

          <div className="lw-stage" aria-hidden="true">
            <PhoneShell><EstimateDoc /></PhoneShell>
            <div className="lw-float paid">
              <div className="ic"><BadgeDollarSign size={20} /></div>
              <div><div className="t">$4,850.00 paid</div><div className="s">Deposited to your bank</div></div>
            </div>
            <div className="lw-float signed">
              <div className="ic"><PenTool size={18} /></div>
              <div><div className="t">Maria Keller signed</div><div className="s">Estimate #1042 · just now</div></div>
            </div>
            <div className="lw-float viewed">
              <div className="ic"><Eye size={18} /></div>
              <div><div className="t">Estimate viewed</div><div className="s">Dan Ortiz opened #1038</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- proof strip ---------------- */}
      <section className="lw-proof">
        <div className="lw-wrap">
          <div className="it"><Hammer size={20} /><div><b>Built by a working contractor</b><span>Designed on real jobs in the Philadelphia suburbs, not in a boardroom.</span></div></div>
          <div className="it"><ShieldCheck size={20} /><div><b>Payments secured by Stripe</b><span>Card details never touch our servers. Money lands in your bank.</span></div></div>
          <div className="it"><FileText size={20} /><div><b>Unlimited estimates &amp; invoices</b><span>No per-document caps, no tiers, no add-ons.</span></div></div>
          <div className="it"><ImageIcon size={20} /><div><b>Your logo, not ours</b><span>Nothing you send carries LevelWorks branding.</span></div></div>
        </div>
      </section>

      <div className="lw-trades">
        <p>Made for every trade</p>
        <ul>
          {['General contractors', 'Painters', 'Remodelers', 'Electricians', 'Plumbers', 'HVAC', 'Landscapers', 'Roofers', 'Handymen', 'Flooring', 'Cleaning services'].map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>

      {/* ---------------- features (tabs) ---------------- */}
      <section id="features" className="lw-sec">
        <div className="lw-wrap">
          <div className="lw-sec-head lw-rv">
            <span className="lw-eyebrow">Everything in one app</span>
            <h2 className="lw-h2">From first estimate to final payment, without leaving your phone.</h2>
            <p className="lw-lead">The same tools the big platforms sell in pieces. Here they are one app, one price.</p>
          </div>
          <div className="lw-tabs lw-rv">
            <div className="lw-tablist" role="tablist" aria-label="Features">
              {TABS.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className={`lw-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
                  <div className="ic"><t.icon size={18} /></div>
                  <div><b>{t.title}</b><span>{t.blurb}</span></div>
                </button>
              ))}
            </div>
            <div>
              <p className="lw-tab-desc">{active.blurb}</p>
              <div className="lw-tabpane">
                <div className={`pane ${tab === 'estimates' ? 'on' : ''}`}><PhoneShell mini><EstimateDoc /></PhoneShell></div>
                <div className={`pane ${tab === 'sign' ? 'on' : ''}`}><SignMock /></div>
                <div className={`pane ${tab === 'invoices' ? 'on' : ''}`}><InvoiceMock /></div>
                <div className={`pane ${tab === 'recurring' ? 'on' : ''}`}><RecurringMock /></div>
                <div className={`pane ${tab === 'photos' ? 'on' : ''}`}><PhotosMock /></div>
                <div className={`pane ${tab === 'clients' ? 'on' : ''}`}><ClientsMock /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- payments ---------------- */}
      <section id="payments" className="lw-sec lw-pay">
        <div className="lw-wrap">
          <div className="lw-split">
            <div className="copy lw-rv">
              <span className="lw-eyebrow">Get paid from the app</span>
              <h2 className="lw-h2">Send the invoice. They tap pay. It's in your bank.</h2>
              <p className="lw-lead">No chasing checks, no waiting on a middleman. Your client pays the invoice link by card and the money goes directly to your business account.</p>
              <ul className="lw-checks">
                <li><Check size={17} /> Visa, Mastercard, American Express, Discover</li>
                <li><Check size={17} /> Apple Pay and Google Pay on the client's phone</li>
                <li><Check size={17} /> Deposits on estimates, balances on invoices</li>
                <li><Check size={17} /> Receipts sent automatically, every payment logged</li>
              </ul>
              <div className="lw-paymethods"><span>VISA</span><span>Mastercard</span><span>AMEX</span><span>Discover</span><span>Apple Pay</span><span>Google Pay</span></div>
              <p className="lw-note"><Lock size={14} /> Processed by Stripe. Included in your $5 plan; only standard card fees apply.</p>
            </div>
            <div className="art lw-rv"><InvoiceMock /></div>
          </div>
        </div>
      </section>

      {/* ---------------- deep dives ---------------- */}
      <section className="lw-sec">
        <div className="lw-wrap">
          <div className="lw-split flip">
            <div className="copy lw-rv">
              <span className="lw-eyebrow">Recurring billing</span>
              <h2 className="lw-h2">Service agreements that bill themselves.</h2>
              <p className="lw-lead">HVAC tune-ups, lawn care, maintenance retainers. Set the amount and the schedule once and stop re-invoicing the same client by hand every month.</p>
              <ul className="lw-checks">
                <li><Check size={17} /> Monthly, quarterly, yearly or any interval you set</li>
                <li><Check size={17} /> Failed cards retry automatically</li>
                <li><Check size={17} /> Instant alert if a payment fails, client marked past due</li>
                <li><Check size={17} /> A feature most contractor apps still don't offer</li>
              </ul>
            </div>
            <div className="art lw-rv"><RecurringMock /></div>
          </div>

          <div className="lw-split">
            <div className="copy lw-rv">
              <span className="lw-eyebrow">Your business, not our billboard</span>
              <h2 className="lw-h2">Your name. Your logo. Your client.</h2>
              <p className="lw-lead">Other apps stamp their brand on every estimate you send and turn your paperwork into their advertising. Every document from LevelWorks carries your name, your logo and nothing else.</p>
              <ul className="lw-checks">
                <li><Check size={17} /> Upload your logo once, it's on everything</li>
                <li><Check size={17} /> Estimates, invoices, receipts and photo updates</li>
                <li><Check size={17} /> The client sees you, and only you</li>
              </ul>
            </div>
            <div className="art lw-rv"><BrandMock /></div>
          </div>

          <div className="lw-split flip">
            <div className="copy lw-rv">
              <span className="lw-eyebrow">Photo updates</span>
              <h2 className="lw-h2">Show the client the job while you're still on it.</h2>
              <p className="lw-lead">Snap before, during and after photos from the site, add a line, and send a clean progress update. Fewer "how's it going?" calls, and a client who feels looked after.</p>
              <ul className="lw-checks">
                <li><Check size={17} /> One tap from camera to client</li>
                <li><Check size={17} /> Photos stay attached to the job forever</li>
                <li><Check size={17} /> An AI assistant on hand for code and material questions</li>
              </ul>
            </div>
            <div className="art lw-rv"><PhotosMock /></div>
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section id="how-it-works" className="lw-sec soft">
        <div className="lw-wrap">
          <div className="lw-sec-head lw-center lw-rv">
            <span className="lw-eyebrow">How it works</span>
            <h2 className="lw-h2">Estimate to paid, in four taps.</h2>
          </div>
          <div className="lw-steps lw-rv">
            {[
              ['Build the estimate', 'Add line items, materials and labor. Save your common items and it takes a couple of minutes.'],
              ['Send the link', 'Email or text it. The client opens a clean, branded page on any device.'],
              ['Client signs', 'They review and sign with a finger. You get a push notification the moment it happens.'],
              ['Invoice and get paid', 'Convert to an invoice in one tap. They pay by card and the money lands in your bank.'],
            ].map(([t, d], i) => (
              <div className="lw-step" key={t}>
                <div className="n">{i + 1}</div>
                <div><h3 className="lw-h3">{t}</h3><p className="lw-p">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- pricing ---------------- */}
      <section id="pricing" className="lw-sec">
        <div className="lw-wrap">
          <div className="lw-sec-head lw-center lw-rv">
            <span className="lw-eyebrow">Pricing</span>
            <h2 className="lw-h2">One plan. Everything in it. Five dollars.</h2>
            <p className="lw-lead">Most estimating apps charge $19 to $149 a month and hold half their features behind higher tiers. We charge $5 flat, and it never goes up once you're on it.</p>
          </div>
          <div className="lw-price lw-rv">
            <div className="lw-plan them">
              <div className="who">Typical contractor apps</div>
              <div className="amt"><small>$19</small><small>–</small><b>$149</b><span>/month</span></div>
              <p className="sub">Tiered plans. The features you actually want sit on the top one.</p>
              <ul>
                <li><Check size={16} /> Estimates &amp; invoices</li>
                <li><Check size={16} /> Digital signatures</li>
                <li><Check size={16} /> Card payments</li>
                <li className="no"><Check size={16} /> Recurring billing on the base plan</li>
                <li className="no"><Check size={16} /> Their branding off your documents</li>
                <li className="no"><Check size={16} /> Unlimited users and documents</li>
              </ul>
            </div>
            <div className="lw-plan us">
              <div className="tag">LEVELWORKS</div>
              <div className="who">Everything, one price</div>
              <div className="amt"><b>$5</b><span>/month</span></div>
              <p className="sub">30 days free to start, no credit card. Your rate is locked for as long as you stay.</p>
              <ul>
                <li><Check size={16} /> Unlimited estimates &amp; invoices</li>
                <li><Check size={16} /> Digital signatures with instant notifications</li>
                <li><Check size={16} /> Card, Apple Pay &amp; Google Pay payments to your bank</li>
                <li><Check size={16} /> Automated recurring billing</li>
                <li><Check size={16} /> Your logo on everything, no LevelWorks branding</li>
                <li><Check size={16} /> Job-site photo updates</li>
                <li><Check size={16} /> Clients, jobs, notes, receipts</li>
                <li><Check size={16} /> Email &amp; text sending, push notifications</li>
                <li><Check size={16} /> AI assistant</li>
              </ul>
              <button className="lw-btn pri lg wide" onClick={openSignUp}>Start free 30-day trial</button>
              <p className="fine">$5/month after the trial. Cancel any time.</p>
            </div>
          </div>
          <p className="lw-save lw-rv">Against a $149 plan that's <b>$1,728 a year</b> back in the truck.</p>
        </div>
      </section>

      {/* ---------------- founder ---------------- */}
      <section className="lw-sec soft">
        <div className="lw-wrap">
          <div className="lw-founder">
            <div className="lw-rv">
              <span className="lw-eyebrow">Why it exists</span>
              <blockquote style={{ marginTop: 16 }}>
                "I run a home improvement company. I was paying over a hundred dollars a month for estimating software that put its own logo on my paperwork and still didn't do recurring billing. So I built the app I wanted, and priced it the way I'd want to pay for it."
              </blockquote>
              <div className="who">
                <div className="av">EC</div>
                <div><b>Eric Connor</b><span>Founder, LevelWorks · Owner, <a href="https://ec-homes.com" target="_blank" rel="noreferrer">EC Home Improvement</a>, Philadelphia</span></div>
              </div>
            </div>
            <div className="lw-facts lw-rv">
              <div className="lw-fact"><b>$5</b><span>a month, every feature, rate locked</span></div>
              <div className="lw-fact"><b>30 days</b><span>free, no credit card to start</span></div>
              <div className="lw-fact"><b>0</b><span>LevelWorks logos on your documents</span></div>
              <div className="lw-fact"><b>1 tap</b><span>from signed estimate to invoice</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section id="faq" className="lw-sec">
        <div className="lw-wrap">
          <div className="lw-sec-head lw-center lw-rv">
            <span className="lw-eyebrow">Questions</span>
            <h2 className="lw-h2">Straight answers.</h2>
          </div>
          <div className="lw-faq lw-rv">
            {FAQS.map((f, i) => (
              <div className={`lw-q ${openFaq === i ? 'open' : ''}`} key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>{f.q}<ChevronDown size={20} /></button>
                <div className="a"><div><p>{f.a}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- final cta ---------------- */}
      <section className="lw-sec lw-final">
        <div className="lw-wrap">
          <div className="box lw-rv">
            <h2 className="lw-h2">Send your first estimate tonight.</h2>
            <p className="lw-lead">Thirty days free, every feature on, no card needed. If it doesn't earn its five dollars, walk away.</p>
            <div className="cta">
              <button className="lw-btn onink lg" onClick={openSignUp}>Start free trial <ChevronRight size={18} /></button>
              <button className="lw-btn onink sec lg" onClick={openSignIn}>Sign in</button>
            </div>
            <p className="fine">$5/month after the trial. Cancel any time.</p>
          </div>
        </div>
      </section>

      {/* ---------------- footer ---------------- */}
      <footer className="lw-ft">
        <div className="lw-wrap">
          <div className="top">
            <div className="about">
              <Logo />
              <p>Estimates, signatures, invoices, payments and recurring billing for contractors. Built by a contractor in Philadelphia, PA.</p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><button onClick={() => scrollTo('features')}>Features</button></li>
                <li><button onClick={() => scrollTo('payments')}>Payments</button></li>
                <li><button onClick={() => scrollTo('how-it-works')}>How it works</button></li>
                <li><button onClick={() => scrollTo('pricing')}>Pricing</button></li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li><button onClick={openSignUp}>Start free trial</button></li>
                <li><button onClick={openSignIn}>Sign in</button></li>
                <li><button onClick={() => scrollTo('faq')}>FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="mailto:support@levelworks.org">support@levelworks.org</a></li>
                <li><button onClick={() => navigate('/terms')}>Terms</button></li>
                <li><button onClick={() => navigate('/privacy')}>Privacy</button></li>
              </ul>
            </div>
          </div>
          <div className="bot">
            <span>© {new Date().getFullYear()} LevelWorks. Built for the trades.</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={13} /> Made in Philadelphia</span>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} defaultMode={authMode} />
    </div>
  );
}
