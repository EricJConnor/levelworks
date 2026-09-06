import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { X, Loader2, Copy, Check } from 'lucide-react';

interface Props {
  jobId: string;
  clientName: string;
  photoCount: number;
  onClose: () => void;
}

export const SendJobUpdateModal: React.FC<Props> = ({ jobId, clientName, photoCount, onClose }) => {
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
      toast({ title: 'Link Copied!', description: 'Paste it into a text or email to your client.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not create the update link.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="lv-scrim">
      <div className="lv-modal">

        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">Job update</span>
            <h2 className="lv-h2">Send photos to your client</h2>
          </div>
          <button className="lv-icon-btn" onClick={onClose} disabled={generating} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="lv-modal-body">
          <div className="lv-stack">

            <div className="lv-card">
              <div className="lv-row">
                <div style={{ minWidth: 0 }}>
                  <div className="lv-row-t">{clientName}</div>
                  <div className="lv-row-s">Goes out with the photos on this job</div>
                </div>
                <span className="lv-pill blue">{photoCount} photo{photoCount === 1 ? '' : 's'}</span>
              </div>
            </div>

            <div>
              <label className="lv-field">
                <span className="lv-label">Message to your client (optional)</span>
                <textarea
                  className="lv-textarea"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Demo and rough-in are done. Here is where things stand."
                  disabled={generating}
                />
              </label>
            </div>

            {updateUrl ? (
              <div className="lv-card lv-card-pad">
                <p className="lv-h3 lv-inline" style={{ color: 'var(--lv-green)' }}>
                  <Check size={18} /> Link copied
                </p>
                <p className="lv-sub" style={{ marginTop: 6 }}>
                  Open your messages or email and paste it to your client.
                </p>
                <p className="lv-small" style={{ marginTop: 10, wordBreak: 'break-all', color: 'var(--lv-faint)' }}>
                  {updateUrl}
                </p>
              </div>
            ) : (
              <p className="lv-small">
                Copying the link saves your message and opens the update for your client.
              </p>
            )}

          </div>
        </div>

        <div className="lv-modal-foot">
          <div className="lv-actions">
            <button className="lv-btn quiet" onClick={onClose} disabled={generating}>Done</button>
            <span className="spacer" />
            <button className="lv-btn pri" onClick={handleGenerateAndCopy} disabled={generating}>
              {generating
                ? <><Loader2 size={16} className="animate-spin" /> Preparing…</>
                : linkCopied
                  ? <><Check size={16} /> Link copied</>
                  : <><Copy size={16} /> Copy link</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
