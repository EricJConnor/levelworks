import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Mark } from '@/components/Mark';
import { Building2, Camera, Check, CreditCard, FileText, Loader2 } from 'lucide-react';

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
    <div className="lv-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={30} className="animate-spin" style={{ color: 'var(--lv-blue)' }} />
    </div>
  );

  const logo = (size: number) => (
    <div
      style={{
        width: size, height: size, flexShrink: 0, overflow: 'hidden',
        borderRadius: 'var(--lv-r)',
        background: 'var(--lv-sunken)',
        border: '1px solid var(--lv-line)',
        display: 'grid', placeItems: 'center',
      }}
    >
      {form.profile_photo_url
        ? <img src={form.profile_photo_url} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        : <Building2 size={Math.round(size * 0.38)} style={{ color: 'var(--lv-faint)' }} />}
    </div>
  );

  return (
    <div className="lv-app">
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px 64px' }}>
        <div className="lv-inline" style={{ gap: 8, fontWeight: 700, fontSize: 17, letterSpacing: '-.02em', marginBottom: 30 }}>
          <Mark size={24} />
          Level<span style={{ color: 'var(--lv-blue)' }}>Works</span>
        </div>

        {step === 'setup' ? (
          <>
            <span className="lv-eyebrow">Step 1 of 2</span>
            <h1 className="lv-h1" style={{ marginTop: 8 }}>Set up your business</h1>
            <p className="lv-sub" style={{ marginTop: 8, marginBottom: 22 }}>
              These details go at the top of every estimate and invoice you send. You can change them later.
            </p>

            <form onSubmit={handleContinue}>
              <div className="lv-card lv-card-pad">
                <div className="lv-inline" style={{ gap: 16, marginBottom: 22 }}>
                  {logo(68)}
                  <div style={{ minWidth: 0 }}>
                    <button
                      type="button"
                      className="lv-btn sec sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                      {uploading ? 'Uploading…' : 'Upload your logo'}
                    </button>
                    <p className="lv-small" style={{ marginTop: 7 }}>Optional. It appears on everything you send.</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </div>

                <div className="lv-field">
                  <label className="lv-label" htmlFor="company_name">Company name</label>
                  <input
                    id="company_name"
                    className="lv-input"
                    type="text"
                    value={form.company_name}
                    onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Smith Contracting LLC"
                    required
                  />
                </div>

                <div className="lv-field">
                  <label className="lv-label" htmlFor="phone_number">Phone number</label>
                  <input
                    id="phone_number"
                    className="lv-input"
                    type="tel"
                    value={form.phone_number}
                    onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="lv-field">
                  <label className="lv-label" htmlFor="business_email">Email</label>
                  <input
                    id="business_email"
                    className="lv-input"
                    type="email"
                    value={form.business_email}
                    onChange={e => setForm(p => ({ ...p, business_email: e.target.value }))}
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <button type="submit" className="lv-btn pri wide lg" style={{ marginTop: 18 }} disabled={saving || uploading}>
                {saving ? <><Loader2 size={17} className="animate-spin" /> Saving…</> : 'Continue'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" className="lv-btn quiet sm" onClick={handleSetUpPayments} disabled={saving}>
                  <CreditCard size={15} /> Set up card payments
                </button>
                <p className="lv-small" style={{ marginTop: 4 }}>Optional. You can do this any time from your account.</p>
              </div>
            </form>
          </>
        ) : (
          <>
            <span className="lv-eyebrow">Step 2 of 2</span>
            <h1 className="lv-h1" style={{ marginTop: 8 }}>You’re set up</h1>
            <p className="lv-sub" style={{ marginTop: 8, marginBottom: 22 }}>
              Your business details are saved. Write your first estimate whenever you’re ready.
            </p>

            <div className="lv-card">
              <div className="lv-card-head">
                <div className="lv-inline" style={{ gap: 14, minWidth: 0, flexWrap: 'nowrap' }}>
                  {logo(52)}
                  <div style={{ minWidth: 0 }}>
                    <p className="lv-h3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.company_name}
                    </p>
                    <p className="lv-small" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[form.phone_number, form.business_email].filter(Boolean).join(' · ') || 'Business profile'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="lv-card-pad">
                <ul className="lv-stack" style={{ gap: 9, listStyle: 'none', margin: 0, padding: 0 }}>
                  {['Your logo', 'Your business details', 'Your estimates, with your name on them'].map(item => (
                    <li key={item} className="lv-inline" style={{ gap: 9, flexWrap: 'nowrap' }}>
                      <Check size={16} style={{ color: 'var(--lv-green)', flexShrink: 0 }} />
                      <span className="lv-sub" style={{ color: 'var(--lv-ink-2)' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button className="lv-btn pri wide lg" style={{ marginTop: 18 }} onClick={() => goToApp(true)}>
              <FileText size={17} /> Write your first estimate
            </button>
            <button className="lv-btn quiet wide" style={{ marginTop: 8 }} onClick={() => goToApp(false)}>
              Skip for now
            </button>
          </>
        )}
      </main>
    </div>
  );
}
