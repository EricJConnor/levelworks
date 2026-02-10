import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, FolderOpen, Search, Smartphone, CheckCircle, Zap, Star, Clock } from 'lucide-react';


interface LandingReceiptsProps {
  onGetStarted?: () => void;
}

// Store Logo SVG Components - Inline SVGs for reliability (matching Receipts.tsx)
// Defined outside component to prevent re-renders
const StoreLogoSVGs: Record<string, React.FC<{ className?: string }>> = {
  'Home Depot': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#F96302"/>
      <path d="M8 12H32V28H8V12Z" fill="white"/>
      <path d="M12 16H18V24H12V16Z" fill="#F96302"/>
      <path d="M22 16H28V24H22V16Z" fill="#F96302"/>
      <path d="M18 14L20 10L22 14H18Z" fill="white"/>
    </svg>
  ),
  "Lowe's": ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#004990"/>
      <path d="M10 12H16V28H10V12Z" fill="white"/>
      <path d="M10 22H22V28H10V22Z" fill="white"/>
      <circle cx="28" cy="20" r="6" stroke="white" strokeWidth="3" fill="none"/>
    </svg>
  ),
  'Gas Station': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#2E7D32"/>
      <rect x="10" y="12" width="14" height="20" rx="2" fill="white"/>
      <rect x="12" y="14" width="10" height="8" fill="#2E7D32"/>
      <path d="M26 16H30V24C30 25.1 29.1 26 28 26H26V16Z" fill="white"/>
      <circle cx="17" cy="28" r="2" fill="#2E7D32"/>
    </svg>
  ),
  'Restaurant': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#E65100"/>
      <path d="M12 10V18C12 20.2 13.8 22 16 22V32H18V22C20.2 22 22 20.2 22 18V10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 10V16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 10V32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 10C26 10 30 12 30 18C30 22 26 22 26 22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

// Helper component for store logos - Memoized to prevent unnecessary re-renders
const StoreLogo = memo<{ store: string; className?: string }>(({ store, className = 'w-5 h-5' }) => {
  const LogoComponent = StoreLogoSVGs[store];
  if (!LogoComponent) return null;
  return <LogoComponent className={className} />;
});
StoreLogo.displayName = 'StoreLogo';

// Feature data - defined outside component for stability
const FEATURES = [
  {
    icon: Zap,
    title: 'Smart Auto-Categorize',
    description: 'Type "Home Depot" and watch it auto-select Materials. Smart keyword matching saves you time.',
  },
  {
    icon: Camera,
    title: 'One-Tap Store Buttons',
    description: 'Quick-select buttons for Home Depot, Lowe\'s, Gas Station & more - fills label, category, and logo instantly.',
  },
  {
    icon: Star,
    title: 'Remembers Your Habits',
    description: 'Tracks your favorite labels and last-used categories. The more you use it, the smarter it gets.',
  },
  {
    icon: Clock,
    title: 'Organized by Day or Job',
    description: 'Receipts auto-grouped into Today, Yesterday, This Week, and Older—or organize by job for easy project tracking.',
  },
] as const;

const CATEGORIES = [
  { name: 'Materials', color: 'bg-blue-500 text-white' },
  { name: 'Tools', color: 'bg-orange-500 text-white' },
  { name: 'Fuel', color: 'bg-green-500 text-white' },
  { name: 'Food', color: 'bg-purple-500 text-white' },
  { name: 'Misc', color: 'bg-gray-500 text-white' },
] as const;

const QUICK_STORES = [
  { name: 'Home Depot', category: 'Materials' },
  { name: "Lowe's", category: 'Materials' },
  { name: 'Gas Station', category: 'Fuel' },
  { name: 'Restaurant', category: 'Food' },
] as const;

const DEMO_RECEIPTS = [
  { label: 'Home Depot', category: 'Materials', amount: '$247.89', store: 'Home Depot' },
  { label: 'Shell Gas', category: 'Fuel', amount: '$68.50', store: 'Gas Station' },
] as const;

const BENEFITS = [
  { icon: Search, title: 'Smart Search', desc: 'Find by label, category, or store' },
  { icon: FolderOpen, title: 'Auto-Group', desc: 'Organized by day or job' },
  { icon: Smartphone, title: '100% Offline', desc: 'Works without internet' },
  { icon: CheckCircle, title: 'Tax Ready', desc: 'Organized for tax season' },
] as const;


export default function LandingReceipts({ onGetStarted }: LandingReceiptsProps) {
  return (
    <section id="receipts" className="py-20 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-teal-600/30 border border-teal-500/40 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-teal-300" />
            <span className="text-teal-200 text-sm font-medium">SMART RECEIPTS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            The Fastest Way to Track Receipts
          </h2>
          <p className="text-xl text-teal-200 max-w-3xl mx-auto">
            Auto-categorization, store logos, and smart suggestions. 
            Snap a photo and let Levelworks do the rest.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Feature List */}
          <div className="space-y-6">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-teal-200">{feature.description}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <Button 
                size="lg" 
                className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 min-h-[48px]"
                onClick={onGetStarted}
              >
                Start Tracking Receipts
              </Button>
            </div>
          </div>

          {/* Right: Visual Demo */}
          <div className="relative">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 rounded-2xl">
              {/* Mock Receipt Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Add Receipt</h4>
                </div>
                
                {/* Quick Store Buttons Demo */}
                <div className="space-y-2">
                  <p className="text-teal-300 text-xs uppercase tracking-wide">Quick Select Store</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_STORES.map((store, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg"
                      >
                        <StoreLogo store={store.name} className="w-5 h-5 rounded" />
                        <span className="text-white text-sm">{store.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Chips Demo */}
                <div className="space-y-2">
                  <p className="text-teal-300 text-xs uppercase tracking-wide">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat, i) => (
                      <span 
                        key={i} 
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          i === 0 ? cat.color : 'bg-white/10 text-white/70 border border-white/20'
                        }`}
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mock Receipt Cards with Logos */}
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <p className="text-teal-300 text-xs uppercase tracking-wide">Today</p>
                  <div className="space-y-2">
                    {DEMO_RECEIPTS.map((receipt, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <StoreLogo store={receipt.store} className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{receipt.label}</p>
                          <p className="text-teal-300 text-sm">{receipt.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{receipt.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" aria-hidden="true" />
          </div>
        </div>

        {/* Bottom Benefits */}
        <div className="grid md:grid-cols-4 gap-4">
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <benefit.icon className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold text-sm">{benefit.title}</h4>
                <p className="text-teal-200 text-xs">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
