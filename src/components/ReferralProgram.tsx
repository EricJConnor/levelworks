import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, Users, CreditCard, Share2, Check, Loader2, Bell, Clock, CheckCircle2 } from 'lucide-react';

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
    toast({ title: 'Copied!', description: 'Referral link copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join Level Works',
        text: 'Sign up using my referral link and we both get a free month!',
        url: referralLink
      });
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Referral Program</CardTitle>
            {stats?.completedReferrals ? <Badge className="bg-green-500">{stats.completedReferrals} earned</Badge> : null}
          </div>
          <CardDescription>Invite friends and earn free months! You'll get notified when someone signs up.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm font-medium mb-2">Your Referral Link</p>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="text-sm bg-gray-50" />
              <Button onClick={copyLink} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button onClick={shareLink} size="icon" className="bg-purple-600 hover:bg-purple-700">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Code: <span className="font-mono font-bold">{stats?.referralCode}</span></p>
          </div>
          <div className="bg-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-purple-700" />
              <p className="font-semibold text-purple-800 text-sm">Get notified instantly!</p>
            </div>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Push notification when someone signs up</li>
              <li>• Email confirmation with referral details</li>
              <li>• Track all your referrals below</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ReferralStatsCards stats={stats} />
      <RecentReferralsList referrals={stats?.recentReferrals || []} />
    </div>
  );
}

function ReferralStatsCards({ stats }: { stats: ReferralStats | null }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card><CardContent className="p-4 text-center"><Users className="h-6 w-6 mx-auto mb-2 text-blue-600" /><p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p><p className="text-xs text-gray-600">Total Referrals</p></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><Check className="h-6 w-6 mx-auto mb-2 text-green-600" /><p className="text-2xl font-bold">{stats?.completedReferrals || 0}</p><p className="text-xs text-gray-600">Completed</p></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><Gift className="h-6 w-6 mx-auto mb-2 text-purple-600" /><p className="text-2xl font-bold">{stats?.totalCreditsEarned || 0}</p><p className="text-xs text-gray-600">Months Earned</p></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><CreditCard className="h-6 w-6 mx-auto mb-2 text-orange-600" /><p className="text-2xl font-bold">{stats?.creditsAvailable || 0}</p><p className="text-xs text-gray-600">Available</p></CardContent></Card>
    </div>
  );
}

function RecentReferralsList({ referrals }: { referrals: RecentReferral[] }) {
  if (referrals.length === 0) {
    return (
      <Card><CardContent className="p-6 text-center text-gray-500"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No referrals yet. Share your link to get started!</p></CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4"><CardTitle className="text-base">Recent Referrals</CardTitle></CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {referrals.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.status === 'credited' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {r.status === 'credited' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-yellow-600" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{r.referredName}</p>
                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant={r.status === 'credited' ? 'default' : 'secondary'} className={r.status === 'credited' ? 'bg-green-500' : ''}>{r.creditApplied ? '+1 month' : 'Pending'}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
