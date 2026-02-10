import { Gift, Users, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingReferralProps {
  onGetStarted: () => void;
}

export default function LandingReferral({ onGetStarted }: LandingReferralProps) {
  const benefits = [
    { icon: Gift, text: 'You get 1 free month' },
    { icon: Users, text: 'Your friend gets 60 days free' },
    { icon: Sparkles, text: 'No limit on referrals' },
  ];

  return (
    <section id="referral" className="container mx-auto px-6 py-20">
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-full px-4 py-2 mb-6">
              <Gift className="w-4 h-4 text-purple-300" />
              <span className="text-purple-200 text-sm font-medium">Referral Program</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Share Level, Earn Free Months</h2>
            <p className="text-lg text-purple-200 mb-6">
              Love Level? Share it with fellow contractors! When they sign up using your link, you both win.
            </p>
            <div className="space-y-3 mb-8">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
                    <b.icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="text-white font-medium">{b.text}</span>
                </div>
              ))}
            </div>
            <Button onClick={onGetStarted} size="lg" className="bg-purple-500 hover:bg-purple-600 text-white">
              Start Referring <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Sign up for Level', desc: 'Create your account and get your unique referral link' },
                { step: '2', title: 'Share with friends', desc: 'Send your link to contractor friends via text, email, or social' },
                { step: '3', title: 'Both earn rewards', desc: 'When they subscribe, you get 1 month free, they get 60 days!' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-purple-200 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-purple-500/20 rounded-lg border border-purple-400/30">
              <div className="flex items-center gap-2 text-purple-200">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm">Unlimited referrals - earn as many free months as you want!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
