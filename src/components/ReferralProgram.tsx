import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, Check, Loader2, Users } from 'lucide-react';

interface RecentReferral {
  id: string;
  referredName: string;
  referredEmail: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  creditApplied: boolean;
}

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  creditsApplied: number;
  creditsAvailable: number;
  recentReferrals: RecentReferral[];
}

export function ReferralProgram() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadReferralData(); }, []);

  const loadReferralData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const { data: codeData } = await supabase.functions.invoke('get-referral-code', {
        body: { user_id: userId }
      });

      const { data: statsData } = await supabase.functions.invoke('get-referral-stats', {
        body: { user_id: userId }
      });

      if (statsData) {
        setStats({ ...statsData, referralCode: codeData?.code || statsData.referralCode });
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = stats?.referralCode ? `${window.location.origin}?ref=${stats.referralCode}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Link copied', description: 'Your referral link is on the clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join Level Works',
        text: 'Sign up using my referral link and we both get a free month.',
        url: referralLink
      });
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div className="lv-card" style={{ maxWidth: 640, display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--lv-blue)' }} />
      </div>
    );
  }

  return (
    <div className="lv-stack" style={{ maxWidth: 640 }}>
      <div className="lv-card">
        <div className="lv-card-head">
          <div>
            <h2 className="lv-h2">Refer another contractor</h2>
            <p className="lv-small" style={{ marginTop: 3 }}>When they subscribe, you both get a free month.</p>
          </div>
          {stats?.completedReferrals
            ? <span className="lv-pill green">{stats.completedReferrals} signed up</span>
            : null}
        </div>

        <div className="lv-card-pad">
          <span className="lv-label">Your referral link</span>
          <div className="lv-inline" style={{ gap: 8 }}>
            <input
              className="lv-input"
              value={referralLink}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Your referral link"
              style={{ flex: '1 1 200px', minWidth: 0 }}
            />
            <button className="lv-btn sec" onClick={copyLink} disabled={!referralLink} style={{ flexShrink: 0 }}>
              {copied ? <><Check size={15} style={{ color: 'var(--lv-green)' }} /> Copied</> : <><Copy size={15} /> Copy</>}
            </button>
            <button className="lv-btn sec" onClick={shareLink} disabled={!referralLink} style={{ flexShrink: 0 }} aria-label="Share your referral link">
              <Share2 size={15} /> Share
            </button>
          </div>

          {stats?.referralCode && (
            <p className="lv-small" style={{ marginTop: 10 }}>
              Or give them the code <b className="lv-num" style={{ color: 'var(--lv-ink)', letterSpacing: '.04em' }}>{stats.referralCode}</b>
            </p>
          )}

          <hr className="lv-hr" style={{ margin: '16px 0' }} />

          <p className="lv-small">
            You get a push notification and an email as soon as someone signs up with your link, and the month is
            credited once they subscribe.
          </p>
        </div>
      </div>

      <ReferralStatsCards stats={stats} />
      <RecentReferralsList referrals={stats?.recentReferrals || []} />
    </div>
  );
}

function ReferralStatsCards({ stats }: { stats: ReferralStats | null }) {
  const tiles = [
    { n: stats?.totalReferrals || 0, label: 'People referred' },
    { n: stats?.completedReferrals || 0, label: 'Signed up' },
    { n: stats?.totalCreditsEarned || 0, label: 'Months earned' },
    { n: stats?.creditsAvailable || 0, label: 'Months to use' },
  ];
  return (
    <div className="lv-stats">
      {tiles.map(t => (
        <div key={t.label} className="lv-stat" style={{ cursor: 'default' }}>
          <b>{t.n}</b><span>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

function RecentReferralsList({ referrals }: { referrals: RecentReferral[] }) {
  if (referrals.length === 0) {
    return (
      <div className="lv-empty">
        <Users size={30} />
        <h3>No referrals yet</h3>
        <p>Send your link to a contractor you know. When they subscribe, you both get a free month.</p>
      </div>
    );
  }

  return (
    <div className="lv-card">
      <div className="lv-card-head">
        <h2 className="lv-h2">Recent referrals</h2>
      </div>
      {referrals.map((r) => (
        <div key={r.id} className="lv-row">
          <div style={{ minWidth: 0 }}>
            <div className="lv-row-t" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.referredName}</div>
            <div className="lv-row-s">{new Date(r.createdAt).toLocaleDateString()}</div>
          </div>
          <span className={`lv-pill ${r.creditApplied ? 'green' : ''}`} style={{ flexShrink: 0 }}>
            {r.creditApplied ? '1 month credited' : 'Pending'}
          </span>
        </div>
      ))}
    </div>
  );
}
