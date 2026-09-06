import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Share2, Check, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function ReferralWidget() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, earned: 0 });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const { data: codeData } = await supabase.functions.invoke('get-referral-code', { body: { user_id: userId } });
      const { data: statsData } = await supabase.functions.invoke('get-referral-stats', { body: { user_id: userId } });
      if (codeData?.code) setReferralCode(codeData.code);
      if (statsData) setStats({ total: statsData.totalReferrals || 0, earned: statsData.totalCreditsEarned || 0 });
    } catch (error) {
      console.error('Failed to load referral data:', error);
    }
  };

  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Link copied', description: 'Your referral link is on the clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join Level', text: 'Sign up and we both get a free month.', url: referralLink });
    } else {
      copyLink();
    }
  };

  return (
    <div className="lv-card">
      <div className="lv-card-head">
        <div>
          <h3 className="lv-h3">Refer a contractor</h3>
          <p className="lv-small" style={{ marginTop: 2 }}>They subscribe, you both get a free month.</p>
        </div>
        {stats.earned > 0 && <span className="lv-pill green">{stats.earned} months earned</span>}
      </div>

      <div className="lv-card-pad">
        <div className="lv-inline" style={{ gap: 8 }}>
          <input
            className="lv-input"
            value={referralCode || ''}
            readOnly
            placeholder="Loading"
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Your referral code"
            style={{ flex: '1 1 140px', minWidth: 0, letterSpacing: '.04em' }}
          />
          <button className="lv-btn sec" onClick={copyLink} disabled={!referralLink} style={{ flexShrink: 0 }}>
            {copied ? <><Check size={15} style={{ color: 'var(--lv-green)' }} /> Copied</> : <><Copy size={15} /> Copy</>}
          </button>
          <button className="lv-btn sec" onClick={shareLink} disabled={!referralLink} style={{ flexShrink: 0 }} aria-label="Share your referral link">
            <Share2 size={15} /> Share
          </button>
        </div>
      </div>

      <div className="lv-card-foot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className="lv-small"><b className="lv-num" style={{ color: 'var(--lv-ink)' }}>{stats.total}</b> referred so far</span>
        <button className="lv-btn quiet sm" onClick={() => navigate('/dashboard?tab=referrals')}>
          View all <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
