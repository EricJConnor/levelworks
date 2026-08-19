import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, Camera, Check, CreditCard, FileText, Loader2, Mail, Phone } from 'lucide-react';

const CARD: React.CSSProperties = {
  background: '#1c1c1e',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
};

const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px', // matches the global mobile input rule - avoids iOS zoom
  padding: '11px 13px',
  outline: 'none',
  fontFamily: 'inherit',
};

const LABEL: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  color: '#a1a1aa',
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '7px',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, loading, updateProfile, uploadPhoto, refreshProfile } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Once the form is submitted the saved profile flows back through context -
  // this keeps that refresh from bouncing us past the success state.
  const submittedRef = useRef(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [step, setStep] = useState<'setup' | 'done'>('setup');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    phone_number: '',
    business_email: '',
    profile_photo_url: '',
  });

  // Onboarding is for signed-in users only. Anyone who already set up their
  // business goes straight to the app instead of repeating this step.
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/', { replace: true }); return; }
      setForm(prev => ({ ...prev, business_email: prev.business_email || session.user.email || '' }));
      setCheckingSession(false);
    };
    check();
  }, [navigate]);

  useEffect(() => {
    if (!profile) return;
    if (profile.company_name && step === 'setup' && !submittedRef.current) { navigate('/app', { replace: true }); return; }
    setForm(prev => ({
      company_name: prev.company_name || profile.company_name || '',
      phone_number: prev.phone_number || profile.phone_number || '',
      business_email: prev.business_email || profile.business_email || '',
      profile_photo_url: prev.profile_photo_url || profile.profile_photo_url || '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const url = await uploadPhoto(file);
    if (url) setForm(prev => ({ ...prev, profile_photo_url: url }));
    else toast({ title: 'Upload failed', description: 'Please try another image', variant: 'destructive' });
    setUploading(false);
  };

  const saveProfile = async () => {
    return updateProfile({
      company_name: form.company_name.trim(),
      phone_number: form.phone_number.trim(),
      business_email: form.business_email.trim(),
      profile_photo_url: form.profile_photo_url,
    });
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      toast({ title: 'Company name required', description: 'Add your company name to continue', variant: 'destructive' });
      return;
    }
    setSaving(true);
    submittedRef.current = true;
    const success = await saveProfile();
    setSaving(false);
    if (!success) {
      submittedRef.current = false;
      toast({ title: 'Error', description: 'Could not save your business details. Please try again.', variant: 'destructive' });
      return;
    }
    setStep('done');
  };

  // Secondary, optional path - save what's been entered first so nothing is
  // lost while Stripe takes over the tab.
  const handleSetUpPayments = async () => {
    setSaving(true);
    submittedRef.current = true;
    if (form.company_name.trim()) await saveProfile();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); navigate('/', { replace: true }); return; }
    window.location.href = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_T3ss3sYTBR7iYQrEPRYmsQYyo8BI5XVA&scope=read_write&redirect_uri=https://levelworks.org/stripe-connect-callback&state=${user.id}`;
  };

  const goToApp = async (createEstimate: boolean) => {
    await refreshProfile();
    window.location.href = createEstimate ? '/app?new=estimate' : '/app';
  };

  if (checkingSession || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <header style={{ background: '#1c1c1e', boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#fff', letterSpacing: '0.04em', margin: 0 }}>
            LEVEL<span style={{ color: '#3b82f6' }}>WORKS</span>
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 16px 56px' }}>
        {step === 'setup' ? (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>Welcome to LevelWorks 👋</h2>
              <p style={{ fontSize: '17px', color: '#e4e4e7', margin: '0 0 8px' }}>Let's set up your business</p>
              <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
                Add your details so your estimates look professional and show your brand.
              </p>
            </div>

            <form onSubmit={handleContinue} style={{ ...CARD, padding: '22px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {form.profile_photo_url
                    ? <img src={form.profile_photo_url} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <Building2 size={28} style={{ color: '#52525b' }} />}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ background: 'none', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.4)', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: uploading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}
                  >
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                    {uploading ? 'Uploading...' : 'Upload Your Logo'}
                  </button>
                  <p style={{ color: '#71717a', fontSize: '12px', margin: '7px 0 0' }}>Optional — appears on every estimate you send.</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="company_name" style={LABEL}><Building2 size={14} /> Company Name</label>
                <input
                  id="company_name"
                  type="text"
                  value={form.company_name}
                  onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Smith Contracting LLC"
                  required
                  style={INPUT}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="phone_number" style={LABEL}><Phone size={14} /> Phone Number</label>
                <input
                  id="phone_number"
                  type="tel"
                  value={form.phone_number}
                  onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))}
                  placeholder="(555) 123-4567"
                  style={INPUT}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label htmlFor="business_email" style={LABEL}><Mail size={14} /> Email</label>
                <input
                  id="business_email"
                  type="email"
                  value={form.business_email}
                  onChange={e => setForm(p => ({ ...p, business_email: e.target.value }))}
                  placeholder="you@email.com"
                  style={INPUT}
                />
              </div>

              <button
                type="submit"
                disabled={saving || uploading}
                style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving || uploading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Continue'}
              </button>

              <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', marginTop: '18px', paddingTop: '14px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleSetUpPayments}
                  disabled={saving}
                  style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}
                >
                  <CreditCard size={14} /> Set Up Payments
                </button>
                <p style={{ color: '#52525b', fontSize: '12px', margin: '5px 0 0' }}>Optional — you can do this anytime from your dashboard.</p>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>You're all set! 🎉</h2>
              <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>Your business profile is ready.</p>
            </div>

            <div style={{ ...CARD, padding: '22px 20px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {form.profile_photo_url
                    ? <img src={form.profile_photo_url} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <Building2 size={22} style={{ color: '#52525b' }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 2px' }}>{form.company_name}</p>
                  <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0 }}>
                    {[form.phone_number, form.business_email].filter(Boolean).join(' · ') || 'Business profile'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Your logo', 'Your business information', 'Your branded estimates'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Check size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                    <span style={{ color: '#e4e4e7', fontSize: '14px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => goToApp(true)}
              style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}
            >
              <FileText size={16} /> Create Your First Estimate
            </button>
            <button
              onClick={() => goToApp(false)}
              style={{ width: '100%', background: 'none', color: '#a1a1aa', border: '0.5px solid rgba(255,255,255,0.12)', padding: '12px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}
            >
              Go To Dashboard
            </button>
          </>
        )}
      </main>
    </div>
  );
}
