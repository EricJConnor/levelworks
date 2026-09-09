import { useState, useEffect, useRef } from 'react';
import {
  Menu, X, Check, FileText, PenTool, CreditCard, Repeat, Camera, Users, ChevronDown, ChevronRight,
  ShieldCheck, Lock, Bell, Eye, Hammer, BadgeDollarSign, Image as ImageIcon, Sparkles,
} from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useT, LanguageToggle } from '@/i18n';
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
  const t = useT();
  return (
    <a href="/" className="lw-logo" aria-label={t('lp.logoAria')}>
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
  const t = useT();
  return (
    <div className="lw-doc">
      <div className="brand">
        <div className="mark">RP</div>
        <div><b>Ridgeline Painting Co.</b><small>{t('lp.mockBizLine')}</small></div>
      </div>
      <div className="ttl"><b>{t('lp.mockEstimateNo')}</b><span>{t('lp.mockDate')}</span></div>
      <div className="to">{t('lp.mockPreparedFor')} <b>Maria Keller</b> · {t('lp.mockAddress')}</div>
      <div className="li"><div><b>{t('lp.mockItem1')}</b><small>{t('lp.mockItem1Sub')}</small></div><span>$650.00</span></div>
      <div className="li"><div><b>{t('lp.mockItem2')}</b><small>{t('lp.mockItem2Sub')}</small></div><span>$3,400.00</span></div>
      <div className="li"><div><b>{t('lp.mockItem3')}</b><small>{t('lp.mockItem3Sub')}</small></div><span>$800.00</span></div>
      <div className="sum">
        <div className="row"><span>{t('lp.mockSubtotal')}</span><span>$4,850.00</span></div>
        <div className="row"><span>{t('lp.mockDeposit')}</span><span>$1,455.00</span></div>
        <div className="row tot"><span>{t('lp.mockTotal')}</span><span>$4,850.00</span></div>
        <div className="sig">
          <svg viewBox="0 0 120 40"><SigPath /></svg>
          <small>{signed ? t('lp.mockSignedAt') : t('lp.mockSignHere')}</small>
        </div>
        <div className={`cta ${signed ? 'ok' : ''}`}>{signed ? t('lp.mockApprovedPay') : t('lp.mockApproveSign')}</div>
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
  const t = useT();
  return (
    <div className="lw-stack">
      <div className="lw-card back">
        <div className="hd"><b>{t('lp.mockInv1No')}</b><span className="pill">{t('lp.mockInv1Status')}</span></div>
        <div className="row"><div className="l"><b>{t('lp.mockInv1Line')}</b><small>{t('lp.mockInv1Due')}</small></div><div className="r">$2,150.00</div></div>
      </div>
      <div className="lw-card front">
        <div className="hd"><b>{t('lp.mockInv2No')}</b><span className="pill ok">{t('lp.mockInv2Status')}</span></div>
        <div className="row"><div className="l"><b>{t('lp.mockInv2Line')}</b><small>{t('lp.mockInv2Sub')}</small></div><div className="r">$4,850.00</div></div>
        <div className="row"><div className="l"><b>{t('lp.mockProcessing')}</b><small>{t('lp.mockProcessingSub')}</small></div><div className="r"><small>2.9% + 30¢</small></div></div>
        <div className="row"><div className="l"><b>{t('lp.mockDeposited')}</b><small>{t('lp.mockDepositedSub')}</small></div><div className="r" style={{ color: '#16a34a' }}>$4,708.85</div></div>
        <div className="ft"><div className="btn sec">{t('lp.mockReceipt')}</div><div className="btn ok">{t('lp.mockPaidInFull')}</div></div>
      </div>
    </div>
  );
}

function SignMock() {
  const t = useT();
  return (
    <PhoneShell mini>
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ fontSize: 12, color: '#5b6472' }}>{t('lp.mockSignEyebrow')}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0b1220', marginTop: 4, letterSpacing: '-.01em' }}>{t('lp.mockSignTitle')}</div>
      </div>
      <div className="lw-bubble" style={{ marginTop: 12 }}>{t('lp.mockSignBubblePre')} <b>Ridgeline Painting Co.</b> {t('lp.mockSignBubblePost')}</div>
      <div className="lw-sigpad">
        <svg viewBox="0 0 200 70"><path d="M6 52 C 26 6, 40 6, 48 40 S 70 68, 84 26 S 104 2, 116 34 S 140 62, 156 20 S 180 6, 194 40" stroke="#0b1220" strokeWidth="2.5" strokeLinecap="round" fill="none" /></svg>
        <small>{t('lp.mockDrawSignature')}</small>
      </div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#2563eb', color: '#fff', borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 12 }}>{t('lp.mockSignApprove')}</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#5b6472', marginTop: 10 }}>{t('lp.mockSignFine')}</div>
      </div>
      <div className="lw-float" style={{ position: 'absolute', left: 12, right: 12, bottom: 14, padding: '10px 12px' }}>
        <div className="ic" style={{ background: '#e8efff', color: '#2563eb', width: 30, height: 30 }}><Bell size={15} /></div>
        <div><div className="t" style={{ fontSize: 12.5 }}>{t('lp.floatSigned')}</div><div className="s" style={{ fontSize: 11 }}>{t('lp.mockSignPush')}</div></div>
      </div>
    </PhoneShell>
  );
}

function RecurringMock() {
  const t = useT();
  return (
    <div className="lw-card" style={{ maxWidth: 470 }}>
      <div className="hd"><b>{t('lp.mockRecTitle')}</b><span className="pill blue">{t('lp.mockRecActive')}</span></div>
      <div className="row"><div className="l"><b>{t('lp.mockRec1')}</b><small>{t('lp.mockRec1Sub')}</small></div><div className="r">$189.00<small>{t('lp.mockAutoPay')}</small></div></div>
      <div className="row"><div className="l"><b>{t('lp.mockRec2')}</b><small>{t('lp.mockRec2Sub')}</small></div><div className="r">$640.00<small>{t('lp.mockAutoPay')}</small></div></div>
      <div className="row alert"><div className="l"><b>{t('lp.mockRec3')}</b><small>{t('lp.mockRec3Sub')}</small></div><div className="r"><small style={{ color: '#d97706', fontWeight: 600 }}>{t('lp.mockRec3Tag')}</small></div></div>
      <div className="row"><div className="l"><b>{t('lp.mockRec4')}</b><small>{t('lp.mockRec4Sub')}</small></div><div className="r">$1,200.00<small>{t('lp.mockAutoPay')}</small></div></div>
      <div className="ft"><div className="btn sec">{t('lp.mockEditSchedule')}</div><div className="btn">{t('lp.mockNewSchedule')}</div></div>
    </div>
  );
}

function PhotosMock() {
  const t = useT();
  return (
    <PhoneShell mini>
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ fontSize: 12, color: '#5b6472' }}>{t('lp.mockPhotoEyebrow')}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0b1220', marginTop: 4, letterSpacing: '-.01em' }}>{t('lp.mockPhotoTitle')}</div>
      </div>
      <div className="lw-photos">
        <div /><div /><div /><div /><div /><div />
      </div>
      <div className="lw-bubble">{t('lp.mockPhotoBubble')} <b>{t('lp.mockPhotoSignoff')}</b></div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#0b1220', color: '#fff', borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 12 }}>{t('lp.mockPhotoSend')}</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#5b6472', marginTop: 10 }}>{t('lp.mockPhotoFine')}</div>
      </div>
    </PhoneShell>
  );
}

function ClientsMock() {
  const t = useT();
  const rows = [
    ['MK', 'Maria Keller', t('lp.mockClient1Sub'), '#2563eb'],
    ['DO', 'Dan Ortiz', t('lp.mockClient2Sub'), '#7c3aed'],
    ['GF', 'Grant Family', t('lp.mockClient3Sub'), '#16a34a'],
    ['OH', 'Oakwood HOA', t('lp.mockClient4Sub'), '#d97706'],
    ['BS', 'Bella Salon', t('lp.mockClient5Sub'), '#dc2626'],
  ];
  return (
    <div className="lw-card" style={{ maxWidth: 450 }}>
      <div className="hd"><b>{t('lp.mockClientsTitle')}</b><span className="pill">{t('lp.mockClientsPill')}</span></div>
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
  const t = useT();
  return (
    <div className="lw-card" style={{ maxWidth: 440 }}>
      <div style={{ padding: '22px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#0b1b33', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15, letterSpacing: '-.02em' }}>RP</div>
          <div><div style={{ fontWeight: 700, color: '#0b1220', fontSize: 16 }}>Ridgeline Painting Co.</div><div style={{ fontSize: 12.5, color: '#5b6472' }}>rob@ridgelinepainting.com · (215) 555-0148</div></div>
        </div>
        <div style={{ marginTop: 18, borderTop: '1px solid #e6e9ef', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5b6472' }}>
          <span>{t('lp.mockEstimateNo')}</span><span>{t('lp.mockDate')}</span>
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: '#eef1f6', width: '70%' }} />
        <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: '#eef1f6', width: '55%' }} />
        <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: '#eef1f6', width: '62%' }} />
      </div>
      <div className="ft" style={{ justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#5b6472' }}>
        <span>{t('lp.mockBrandSentPre')} <b style={{ color: '#0b1220' }}>{t('lp.mockBrandSentYour')}</b> {t('lp.mockBrandSentPost')}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600 }}><Check size={14} /> {t('lp.mockBrandNoBranding')}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */
type TabId = 'estimates' | 'sign' | 'invoices' | 'recurring' | 'photos' | 'clients';

const TABS = (t: (k: string) => string) => ([
  { id: 'estimates' as TabId, icon: FileText, title: t('lp.tabEstimates'), blurb: t('lp.tabEstimatesBlurb') },
  { id: 'sign' as TabId, icon: PenTool, title: t('lp.tabSign'), blurb: t('lp.tabSignBlurb') },
  { id: 'invoices' as TabId, icon: CreditCard, title: t('lp.tabInvoices'), blurb: t('lp.tabInvoicesBlurb') },
  { id: 'recurring' as TabId, icon: Repeat, title: t('lp.tabRecurring'), blurb: t('lp.tabRecurringBlurb') },
  { id: 'photos' as TabId, icon: Camera, title: t('lp.tabPhotos'), blurb: t('lp.tabPhotosBlurb') },
  { id: 'clients' as TabId, icon: Users, title: t('lp.tabClients'), blurb: t('lp.tabClientsBlurb') },
]);

const FAQS = (t: (k: string) => string) => ([
  { q: t('lp.faq1Q'), a: t('lp.faq1A') },
  { q: t('lp.faq2Q'), a: t('lp.faq2A') },
  { q: t('lp.faq3Q'), a: t('lp.faq3A') },
  { q: t('lp.faq4Q'), a: t('lp.faq4A') },
  { q: t('lp.faq5Q'), a: t('lp.faq5A') },
  { q: t('lp.faq6Q'), a: t('lp.faq6A') },
  { q: t('lp.faq7Q'), a: t('lp.faq7A') },
  { q: t('lp.faq8Q'), a: t('lp.faq8A') },
]);

export default function LandingPage() {
  const t = useT();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState<TabId>('estimates');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  // /?signup=1 (from the annual page's "start a free trial" line) opens the
  // signup form straight away instead of making them find the button.
  useEffect(() => {
    if (searchParams.get('signup') === '1') { setAuthMode('signup'); setShowAuth(true); }
  }, [searchParams]);

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

  const tabs = TABS(t);
  const faqs = FAQS(t);
  const trades = [
    t('lp.tradeGeneral'), t('lp.tradePainters'), t('lp.tradeRemodelers'), t('lp.tradeElectricians'),
    t('lp.tradePlumbers'), t('lp.tradeHvac'), t('lp.tradeLandscapers'), t('lp.tradeRoofers'),
    t('lp.tradeHandymen'), t('lp.tradeFlooring'), t('lp.tradeCleaning'),
  ];
  const active = tabs.find((x) => x.id === tab)!;

  return (
    <div className="lw" ref={rootRef}>

      {/* ---------------- header ---------------- */}
      <header className={`lw-hdr ${scrolled ? 'scrolled' : ''}`}>
        <div className="lw-wrap">
          <Logo />
          <nav className="lw-nav" aria-label={t('lp.navAria')}>
            <button onClick={() => scrollTo('features')}>{t('lp.navFeatures')}</button>
            <button onClick={() => scrollTo('payments')}>{t('lp.navPayments')}</button>
            <button onClick={() => scrollTo('how-it-works')}>{t('lp.navHowItWorks')}</button>
            <button onClick={() => scrollTo('pricing')}>{t('lp.navPricing')}</button>
            <button onClick={() => scrollTo('faq')}>{t('lp.navFaq')}</button>
          </nav>
          <div className="lw-hdr-cta">
            <LanguageToggle className="lw-lang-fix" />
            <button className="lw-btn ghost signin" onClick={openSignIn}>{t('lp.signIn')}</button>
            <button className="lw-btn pri hdr-cta-long" onClick={openSignUp}>{t('lp.startTrial')}</button>
            <button className="lw-btn pri hdr-cta-short" onClick={openSignUp}>{t('lp.startTrialShort')}</button>
            <button className="lw-burger" aria-label={t('lp.menuAria')} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <div className={`lw-sheet ${mobileMenu ? 'open' : ''}`}>
          <button onClick={() => scrollTo('features')}>{t('lp.navFeatures')}</button>
          <button onClick={() => scrollTo('payments')}>{t('lp.navPayments')}</button>
          <button onClick={() => scrollTo('how-it-works')}>{t('lp.navHowItWorks')}</button>
          <button onClick={() => scrollTo('pricing')}>{t('lp.navPricing')}</button>
          <button onClick={() => scrollTo('faq')}>{t('lp.navFaq')}</button>
          <button onClick={openSignIn}>{t('lp.signIn')}</button>
          <button className="lw-btn pri wide" onClick={openSignUp}>{t('lp.startTrial30')}</button>
        </div>
      </header>

      {referralCode && (
        <div className="lw-ref">{t('lp.refPre')} <strong>{referralCode}</strong> {t('lp.refApplied')} <strong>{t('lp.ref60')}</strong> {t('lp.refPost')}</div>
      )}

      {/* ---------------- hero ---------------- */}
      <section className="lw-hero">
        <div className="lw-wrap">
          <div className="lw-hero-copy">
            <div className="lw-price-chip"><b>{t('lp.priceChipAmount')}</b> {t('lp.priceChipText')}</div>
            <h1 className="lw-h1">{t('lp.heroTitle')}</h1>
            <p className="lw-lead">
              {t('lp.heroLead')}
            </p>
            <div className="lw-hero-cta">
              <button className="lw-btn pri lg" onClick={openSignUp}>{t('lp.startTrial30')} <ChevronRight size={18} /></button>
              <button className="lw-btn sec lg" onClick={() => scrollTo('features')}>{t('lp.heroSeeApp')}</button>
            </div>
            <div className="lw-hero-fine">
              <span><Check size={15} /> {t('lp.heroFine1')}</span>
              <span><Check size={15} /> {t('lp.heroFine2')}</span>
              <span><Check size={15} /> {t('lp.heroFine3')}</span>
            </div>
          </div>

          <div className="lw-stage" aria-hidden="true">
            <PhoneShell><EstimateDoc /></PhoneShell>
            <div className="lw-float paid">
              <div className="ic"><BadgeDollarSign size={20} /></div>
              <div><div className="t">{t('lp.floatPaid')}</div><div className="s">{t('lp.floatPaidSub')}</div></div>
            </div>
            <div className="lw-float signed">
              <div className="ic"><PenTool size={18} /></div>
              <div><div className="t">{t('lp.floatSigned')}</div><div className="s">{t('lp.floatSignedSub')}</div></div>
            </div>
            <div className="lw-float viewed">
              <div className="ic"><Eye size={18} /></div>
              <div><div className="t">{t('lp.floatViewed')}</div><div className="s">{t('lp.floatViewedSub')}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- proof strip ---------------- */}
      <section className="lw-proof">
        <div className="lw-wrap">
          <div className="it"><Hammer size={20} /><div><b>{t('lp.proof1')}</b><span>{t('lp.proof1Sub')}</span></div></div>
          <div className="it"><ShieldCheck size={20} /><div><b>{t('lp.proof2')}</b><span>{t('lp.proof2Sub')}</span></div></div>
          <div className="it"><FileText size={20} /><div><b>{t('lp.proof3')}</b><span>{t('lp.proof3Sub')}</span></div></div>
          <div className="it"><ImageIcon size={20} /><div><b>{t('lp.proof4')}</b><span>{t('lp.proof4Sub')}</span></div></div>
        </div>
      </section>

      <div className="lw-trades">
        <p>{t('lp.tradesTitle')}</p>
        <ul>
          {trades.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </div>

      {/* ---------------- features (tabs) ---------------- */}
      <section id="features" className="lw-sec">
        <div className="lw-wrap">
          <div className="lw-sec-head lw-rv">
            <span className="lw-eyebrow">{t('lp.featEyebrow')}</span>
            <h2 className="lw-h2">{t('lp.featTitle')}</h2>
            <p className="lw-lead">{t('lp.featLead')}</p>
          </div>
          <div className="lw-tabs lw-rv">
            <div className="lw-tablist" role="tablist" aria-label={t('lp.featTablistAria')}>
              {tabs.map((x) => (
                <button key={x.id} role="tab" aria-selected={tab === x.id} className={`lw-tab ${tab === x.id ? 'on' : ''}`} onClick={() => setTab(x.id)}>
                  <div className="ic"><x.icon size={18} /></div>
                  <div><b>{x.title}</b><span>{x.blurb}</span></div>
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
              <span className="lw-eyebrow">{t('lp.payEyebrow')}</span>
              <h2 className="lw-h2">{t('lp.payTitle')}</h2>
              <p className="lw-lead">{t('lp.payLead')}</p>
              <ul className="lw-checks">
                <li><Check size={17} /> {t('lp.payCheck1')}</li>
                <li><Check size={17} /> {t('lp.payCheck2')}</li>
                <li><Check size={17} /> {t('lp.payCheck3')}</li>
                <li><Check size={17} /> {t('lp.payCheck4')}</li>
              </ul>
              <div className="lw-paymethods"><span>VISA</span><span>Mastercard</span><span>AMEX</span><span>Discover</span><span>Apple Pay</span><span>Google Pay</span></div>
              <p className="lw-note"><Lock size={14} /> {t('lp.payNote')}</p>
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
              <span className="lw-eyebrow">{t('lp.recEyebrow')}</span>
              <h2 className="lw-h2">{t('lp.recTitle')}</h2>
              <p className="lw-lead">{t('lp.recLead')}</p>
              <ul className="lw-checks">
                <li><Check size={17} /> {t('lp.recCheck1')}</li>
                <li><Check size={17} /> {t('lp.recCheck2')}</li>
                <li><Check size={17} /> {t('lp.recCheck3')}</li>
                <li><Check size={17} /> {t('lp.recCheck4')}</li>
              </ul>
            </div>
            <div className="art lw-rv"><RecurringMock /></div>
          </div>

          <div className="lw-split">
            <div className="copy lw-rv">
              <span className="lw-eyebrow">{t('lp.brandEyebrow')}</span>
              <h2 className="lw-h2">{t('lp.brandTitle')}</h2>
              <p className="lw-lead">{t('lp.brandLead')}</p>
              <ul className="lw-checks">
                <li><Check size={17} /> {t('lp.brandCheck1')}</li>
                <li><Check size={17} /> {t('lp.brandCheck2')}</li>
                <li><Check size={17} /> {t('lp.brandCheck3')}</li>
              </ul>
            </div>
            <div className="art lw-rv"><BrandMock /></div>
          </div>

          <div className="lw-split flip">
            <div className="copy lw-rv">
              <span className="lw-eyebrow">{t('lp.photoEyebrow')}</span>
              <h2 className="lw-h2">{t('lp.photoTitle')}</h2>
              <p className="lw-lead">{t('lp.photoLead')}</p>
              <ul className="lw-checks">
                <li><Check size={17} /> {t('lp.photoCheck1')}</li>
                <li><Check size={17} /> {t('lp.photoCheck2')}</li>
                <li><Check size={17} /> {t('lp.photoCheck3')}</li>
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
            <span className="lw-eyebrow">{t('lp.hiwEyebrow')}</span>
            <h2 className="lw-h2">{t('lp.hiwTitle')}</h2>
          </div>
          <div className="lw-steps lw-rv">
            {[
              [t('lp.hiwStep1'), t('lp.hiwStep1Body')],
              [t('lp.hiwStep2'), t('lp.hiwStep2Body')],
              [t('lp.hiwStep3'), t('lp.hiwStep3Body')],
              [t('lp.hiwStep4'), t('lp.hiwStep4Body')],
            ].map(([ttl, d], i) => (
              <div className="lw-step" key={ttl}>
                <div className="n">{i + 1}</div>
                <div><h3 className="lw-h3">{ttl}</h3><p className="lw-p">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- pricing ---------------- */}
      <section id="pricing" className="lw-sec">
        <div className="lw-wrap">
          <div className="lw-sec-head lw-center lw-rv">
            <span className="lw-eyebrow">{t('lp.pricingEyebrow')}</span>
            <h2 className="lw-h2">{t('lp.pricingTitle')}</h2>
            <p className="lw-lead">{t('lp.pricingLead')}</p>
          </div>
          <div className="lw-price lw-rv">
            <div className="lw-plan them">
              <div className="who">{t('lp.planThemWho')}</div>
              <div className="amt"><small>$19</small><small>–</small><b>$149</b><span>{t('lp.planPerMonth')}</span></div>
              <p className="sub">{t('lp.planThemSub')}</p>
              <ul>
                <li><Check size={16} /> {t('lp.planThem1')}</li>
                <li><Check size={16} /> {t('lp.planThem2')}</li>
                <li><Check size={16} /> {t('lp.planThem3')}</li>
                <li className="no"><Check size={16} /> {t('lp.planThem4')}</li>
                <li className="no"><Check size={16} /> {t('lp.planThem5')}</li>
                <li className="no"><Check size={16} /> {t('lp.planThem6')}</li>
              </ul>
            </div>
            <div className="lw-plan us">
              <div className="tag">LEVELWORKS</div>
              <div className="who">{t('lp.planUsWho')}</div>
              <div className="amt"><b>$5</b><span>{t('lp.planPerMonth')}</span></div>
              <p className="sub">{t('lp.planUsSub')}</p>
              <ul>
                <li><Check size={16} /> {t('lp.planUs1')}</li>
                <li><Check size={16} /> {t('lp.planUs2')}</li>
                <li><Check size={16} /> {t('lp.planUs3')}</li>
                <li><Check size={16} /> {t('lp.planUs4')}</li>
                <li><Check size={16} /> {t('lp.planUs5')}</li>
                <li><Check size={16} /> {t('lp.planUs6')}</li>
                <li><Check size={16} /> {t('lp.planUs7')}</li>
                <li><Check size={16} /> {t('lp.planUs8')}</li>
                <li><Check size={16} /> {t('lp.planUs9')}</li>
              </ul>
              <button className="lw-btn pri lg wide" onClick={openSignUp}>{t('lp.startTrial30')}</button>
              <p className="fine">{t('lp.planFine')}</p>
            </div>
          </div>
          <p className="lw-save lw-rv">{t('lp.savePre')} <b>{t('lp.saveAmount')}</b> {t('lp.savePost')}</p>
        </div>
      </section>

      {/* ---------------- founder ---------------- */}
      <section className="lw-sec soft">
        <div className="lw-wrap">
          <div className="lw-founder">
            <div className="lw-rv">
              <span className="lw-eyebrow">{t('lp.founderEyebrow')}</span>
              <blockquote style={{ marginTop: 16 }}>
                {t('lp.founderQuote')}
              </blockquote>
              <div className="who">
                <div className="av">EC</div>
                <div><b>Eric Connor</b><span>{t('lp.founderRolePre')} <a href="https://ec-homes.com" target="_blank" rel="noreferrer">EC Home Improvement</a>{t('lp.founderRolePost')}</span></div>
              </div>
            </div>
            <div className="lw-facts lw-rv">
              <div className="lw-fact"><b>$5</b><span>{t('lp.fact1')}</span></div>
              <div className="lw-fact"><b>{t('lp.fact2Amount')}</b><span>{t('lp.fact2')}</span></div>
              <div className="lw-fact"><b>0</b><span>{t('lp.fact3')}</span></div>
              <div className="lw-fact"><b>{t('lp.fact4Amount')}</b><span>{t('lp.fact4')}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section id="faq" className="lw-sec">
        <div className="lw-wrap">
          <div className="lw-sec-head lw-center lw-rv">
            <span className="lw-eyebrow">{t('lp.faqEyebrow')}</span>
            <h2 className="lw-h2">{t('lp.faqTitle')}</h2>
          </div>
          <div className="lw-faq lw-rv">
            {faqs.map((f, i) => (
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
            <h2 className="lw-h2">{t('lp.finalTitle')}</h2>
            <p className="lw-lead">{t('lp.finalLead')}</p>
            <div className="cta">
              <button className="lw-btn onink lg" onClick={openSignUp}>{t('lp.startTrial')} <ChevronRight size={18} /></button>
              <button className="lw-btn onink sec lg" onClick={openSignIn}>{t('lp.signIn')}</button>
            </div>
            <p className="fine">{t('lp.planFine')}</p>
          </div>
        </div>
      </section>

      {/* ---------------- footer ---------------- */}
      <footer className="lw-ft">
        <div className="lw-wrap">
          <div className="top">
            <div className="about">
              <Logo />
              <p>{t('lp.footerAbout')}</p>
            </div>
            <div>
              <h4>{t('lp.footerProduct')}</h4>
              <ul>
                <li><button onClick={() => scrollTo('features')}>{t('lp.navFeatures')}</button></li>
                <li><button onClick={() => scrollTo('payments')}>{t('lp.navPayments')}</button></li>
                <li><button onClick={() => scrollTo('how-it-works')}>{t('lp.navHowItWorks')}</button></li>
                <li><button onClick={() => scrollTo('pricing')}>{t('lp.navPricing')}</button></li>
              </ul>
            </div>
            <div>
              <h4>{t('lp.footerAccount')}</h4>
              <ul>
                <li><button onClick={openSignUp}>{t('lp.startTrial')}</button></li>
                <li><button onClick={openSignIn}>{t('lp.signIn')}</button></li>
                <li><button onClick={() => scrollTo('faq')}>{t('lp.navFaq')}</button></li>
              </ul>
            </div>
            <div>
              <h4>{t('lp.footerCompany')}</h4>
              <ul>
                <li><a href="mailto:support@levelworks.org">support@levelworks.org</a></li>
                <li><button onClick={() => navigate('/terms')}>{t('lp.footerTerms')}</button></li>
                <li><button onClick={() => navigate('/privacy')}>{t('lp.footerPrivacy')}</button></li>
              </ul>
            </div>
          </div>
          <div className="bot">
            <span>{t('lp.footerCopyright', { year: new Date().getFullYear() })}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={13} /> {t('lp.footerMade')}</span>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} defaultMode={authMode} />
    </div>
  );
}
