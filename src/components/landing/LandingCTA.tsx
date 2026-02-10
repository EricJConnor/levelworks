import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Gift } from 'lucide-react';
import { PricingCountdown } from '@/components/PricingCountdown';

interface LandingCTAProps {
  onGetStarted: () => void;
}

export default function LandingCTA({ onGetStarted }: LandingCTAProps) {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMiAwIDIgMiA0IDIgNHMtMiAyLTQgMi00IDAtNCAyIDAgMiAyIDQgMiA0cy0yIDItNCAyLTQgMC00IDIgMCAyIDIgNCAyIDQiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Simple Pricing: Just $5/month</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Level Up Your Business?</h2>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of contractors who are saving time and running their business more professionally. Just $5/month!
          </p>
          <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg px-4 py-3 mb-6 max-w-md mx-auto">
            <Gift className="w-5 h-5 text-white" />
            <span className="text-white text-sm"><strong>Referral Program:</strong> Invite friends & both get a free month!</span>
          </div>
          <PricingCountdown variant="compact" className="inline-flex mb-6" />
          <div>
            <Button onClick={onGetStarted} size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 font-semibold">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <p className="text-blue-200 mt-4 text-sm">No credit card required. Cancel anytime.</p>
        </div>
      </div>
    </section>
  );
}
