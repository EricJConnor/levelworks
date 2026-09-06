import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Upload } from 'lucide-react';
import { useT } from '@/i18n';

export const ProfileEditor: React.FC = () => {
  const { profile, loading, updateProfile, uploadPhoto } = useProfile();
  const { toast } = useToast();
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone_number: '',
    business_address: '',
    profile_photo_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone_number: profile.phone_number || '',
        business_address: profile.business_address || '',
        profile_photo_url: profile.profile_photo_url || ''
      });
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: t('mod.notAnImage'), description: t('mod.uploadPngOrJpg'), variant: 'destructive' });
      return;
    }

    setUploading(true);
    const url = await uploadPhoto(file);
    if (url) {
      setFormData(prev => ({ ...prev, profile_photo_url: url }));
      await updateProfile({ profile_photo_url: url });
      toast({ title: t('mod.logoUpdated'), description: t('mod.logoShowsOnDocuments') });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfile(formData);
    if (success) {
      toast({ title: t('mod.profileSaved'), description: t('mod.profileSavedSub') });
    } else {
      toast({ title: t('mod.couldNotSave'), description: t('mod.checkConnection'), variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="lv-card" style={{ maxWidth: 640, display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--lv-blue)' }} />
    </div>
  );

  return (
    <form className="lv-card" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
      <div className="lv-card-head">
        <div>
          <h2 className="lv-h2">{t('mod.businessProfile')}</h2>
          <p className="lv-small" style={{ marginTop: 3 }}>{t('mod.businessProfileSub')}</p>
        </div>
      </div>

      <div className="lv-card-pad">
        <div className="lv-inline" style={{ gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 64, height: 64, flexShrink: 0, overflow: 'hidden',
              borderRadius: 'var(--lv-r)', border: '1px solid var(--lv-line)',
              background: 'var(--lv-surface-2)', display: 'grid', placeItems: 'center'
            }}
          >
            {formData.profile_photo_url
              ? <img src={formData.profile_photo_url} alt={t('mod.companyLogo')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <Building2 size={24} style={{ color: 'var(--lv-faint)' }} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <button type="button" className="lv-btn sec" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading
                ? <><Loader2 size={15} className="animate-spin" /> {t('mod.uploading')}</>
                : <><Upload size={15} /> {formData.profile_photo_url ? t('mod.replaceLogo') : t('mod.uploadLogo')}</>}
            </button>
            <p className="lv-small" style={{ marginTop: 6 }}>{t('mod.pngOrJpgOfLogo')}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>

        <div className="lv-grid-2">
          <div>
            <label className="lv-field">
              <span className="lv-label">{t('mod.yourName')}</span>
              <input
                className="lv-input"
                id="full_name"
                autoComplete="name"
                value={formData.full_name}
                onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                placeholder={t('mod.fullNamePlaceholder')}
              />
            </label>
          </div>
          <div>
            <label className="lv-field">
              <span className="lv-label">{t('mod.companyName')}</span>
              <input
                className="lv-input"
                id="company_name"
                autoComplete="organization"
                value={formData.company_name}
                onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))}
                placeholder={t('mod.companyNamePlaceholder')}
              />
            </label>
          </div>
        </div>

        <label className="lv-field" style={{ marginTop: 14 }}>
          <span className="lv-label">{t('m.phone')}</span>
          <input
            className="lv-input"
            id="phone_number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formData.phone_number}
            onChange={e => setFormData(p => ({ ...p, phone_number: e.target.value }))}
            placeholder="(555) 123-4567"
          />
        </label>

        <label className="lv-field">
          <span className="lv-label">{t('mod.businessAddress')}</span>
          <textarea
            className="lv-textarea"
            id="business_address"
            rows={3}
            value={formData.business_address}
            onChange={e => setFormData(p => ({ ...p, business_address: e.target.value }))}
            placeholder={t('mod.businessAddressPlaceholder')}
          />
        </label>
      </div>

      <div className="lv-card-foot">
        <button type="submit" className="lv-btn pri" disabled={saving}>
          {saving ? <><Loader2 size={15} className="animate-spin" /> {t('a.saving')}</> : t('mod.saveProfile')}
        </button>
      </div>
    </form>
  );
};
