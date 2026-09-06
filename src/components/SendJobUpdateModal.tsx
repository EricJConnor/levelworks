import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { X, Loader2, Copy, Check } from 'lucide-react';
import { useT } from '@/i18n';

interface Props {
  jobId: string;
  clientName: string;
  photoCount: number;
  onClose: () => void;
}

export const SendJobUpdateModal: React.FC<Props> = ({ jobId, clientName, photoCount, onClose }) => {
  const t = useT();
  const [summary, setSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  const handleGenerateAndCopy = async () => {
    setGenerating(true);
    try {
      const newToken = crypto.randomUUID();
      const { error } = await supabase
        .from('jobs')
        .update({ view_token: newToken, update_summary: summary.trim() || null, update_sent_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;

      const url = `${window.location.origin}/view-job/${newToken}`;
      setUpdateUrl(url);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({ title: t('a.copied'), description: t('mod.pasteIntoTextOrEmail') });
    } catch (err: any) {
      toast({ title: t('e.somethingWrong'), description: err.message || t('mod.couldNotCreateUpdateLink'), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="lv-scrim">
      <div className="lv-modal">

        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">{t('mod.jobUpdate')}</span>
            <h2 className="lv-h2">{t('mod.sendPhotosToClient')}</h2>
          </div>
          <button className="lv-icon-btn" onClick={onClose} disabled={generating} aria-label={t('a.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="lv-modal-body">
          <div className="lv-stack">

            <div className="lv-card">
              <div className="lv-row">
                <div style={{ minWidth: 0 }}>
                  <div className="lv-row-t">{clientName}</div>
                  <div className="lv-row-s">{t('mod.goesOutWithPhotos')}</div>
                </div>
                <span className="lv-pill blue">{photoCount === 1 ? t('mod.photoCountOne', { n: photoCount }) : t('mod.photoCountMany', { n: photoCount })}</span>
              </div>
            </div>

            <div>
              <label className="lv-field">
                <span className="lv-label">{t('mod.messageToClientOptional')}</span>
                <textarea
                  className="lv-textarea"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder={t('mod.jobUpdatePlaceholder')}
                  disabled={generating}
                />
              </label>
            </div>

            {updateUrl ? (
              <div className="lv-card lv-card-pad">
                <p className="lv-h3 lv-inline" style={{ color: 'var(--lv-green)' }}>
                  <Check size={18} /> {t('mod.linkCopied')}
                </p>
                <p className="lv-sub" style={{ marginTop: 6 }}>
                  {t('mod.openMessagesAndPaste')}
                </p>
                <p className="lv-small" style={{ marginTop: 10, wordBreak: 'break-all', color: 'var(--lv-faint)' }}>
                  {updateUrl}
                </p>
              </div>
            ) : (
              <p className="lv-small">
                {t('mod.copyingSavesMessage')}
              </p>
            )}

          </div>
        </div>

        <div className="lv-modal-foot">
          <div className="lv-actions">
            <button className="lv-btn quiet" onClick={onClose} disabled={generating}>{t('a.done')}</button>
            <span className="spacer" />
            <button className="lv-btn pri" onClick={handleGenerateAndCopy} disabled={generating}>
              {generating
                ? <><Loader2 size={16} className="animate-spin" /> {t('mod.preparing')}</>
                : linkCopied
                  ? <><Check size={16} /> {t('mod.linkCopied')}</>
                  : <><Copy size={16} /> {t('a.copyLink')}</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
