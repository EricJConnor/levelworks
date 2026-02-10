import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Gift, Copy, Share2, Check, Users, ArrowRight } from 'lucide-react';
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
    toast({ title: 'Copied!', description: 'Referral link copied' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join Level', text: 'Sign up and we both get a free month!', url: referralLink });
    } else {
      copyLink();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white border-0 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <CardContent className="p-4 md:p-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <span className="font-bold">Refer & Earn</span>
          </div>
          {stats.earned > 0 && <Badge className="bg-white/20 text-white">{stats.earned} months earned</Badge>}
        </div>
        <p className="text-purple-100 text-sm mb-4">Share your link and both get a free month!</p>
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-sm truncate font-mono">{referralCode || '...'}</div>
          <Button onClick={copyLink} size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button onClick={shareLink} size="sm" className="bg-white text-purple-600 hover:bg-purple-50">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{stats.total} referred</span></div>
          </div>
          <Button onClick={() => navigate('/dashboard?tab=referrals')} variant="link" className="text-white p-0 h-auto text-sm">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
