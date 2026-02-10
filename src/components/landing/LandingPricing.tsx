import { Check, Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPricingProps {
  onGetStarted: () => void;
}

const features = [
  'Unlimited Estimates & Invoices',
  'AI Assistant (Unlimited Questions)',
  'Push Notifications',
  'Digital Signatures',
  'Receipt Tracking',
  'Client Database',
  'Job Management',
  'Photo Documentation',
  'Email & SMS Notifications',
  'Custom Branding',
  'Priority Support',
  'Referral Program'
];

export default function LandingPricing({ onGetStarted }: LandingPricingProps) {
  return (
    <section id="pricing" className="container mx-auto px-6 py-20 border-t border-blue-900/30">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
        <p className="text-xl text-blue-200">One plan, all features included</p>
      </div>
      
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-2 border-blue-500 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold px-4 py-1 rounded-bl-lg">ALL FEATURES</div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">Pro Plan</h3>
          </div>
          <div className="mb-6">
            <span className="text-5xl font-bold text-white">$5</span>
            <span className="text-blue-300">/month</span>
          </div>
          <p className="text-blue-200 mb-4">Everything you need to run your contracting business professionally.</p>
          
          <ul className="space-y-3 mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                {f}
              </li>
            ))}
          </ul>
          <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-purple-200">
              <Gift className="w-5 h-5 text-purple-300" />
              <span className="text-sm font-medium">Refer friends & earn unlimited free months!</span>
            </div>
          </div>
          <Button onClick={onGetStarted} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold">
            Start Free Trial
          </Button>
          <p className="text-center text-blue-300 text-sm mt-4">14-day free trial. No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
