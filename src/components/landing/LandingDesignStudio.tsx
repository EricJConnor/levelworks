import { ChefHat, Bath, Home, Palette, DollarSign, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingDesignStudioProps {
  onGetStarted: () => void;
}

const designFeatures = [
  { icon: ChefHat, title: 'Kitchen Design', description: 'Cabinets, countertops, appliances, backsplash, and more' },
  { icon: Bath, title: 'Bathroom Design', description: 'Vanities, showers, tubs, tile, fixtures, and lighting' },
  { icon: Home, title: 'Basement Finishing', description: 'Flooring, walls, ceilings, HVAC, electrical, and plumbing' },
];

const capabilities = [
  'Pre-built material libraries with real pricing',
  'Fixture options with upgrade selections',
  'Automatic labor cost calculations',
  'Room dimension calculators',
  'Save and load designs',
  'Convert designs to estimates instantly',
  'Professional project templates',
  'Cost breakdowns by category',
];

export default function LandingDesignStudio({ onGetStarted }: LandingDesignStudioProps) {
  return (
    <section id="design-studio" className="container mx-auto px-6 py-20 border-t border-blue-900/30">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">NEW FEATURE</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Design Studio
        </h2>
        <p className="text-xl text-blue-200 max-w-3xl mx-auto">
          Design kitchens, bathrooms, and basements with accurate material costs. 
          Select fixtures, finishes, and features — then convert directly to professional estimates.
        </p>
      </div>

      {/* Room Types */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {designFeatures.map((feature, idx) => (
          <div 
            key={idx}
            className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-all hover:scale-105"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <feature.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-blue-200">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h3 className="text-3xl font-bold text-white mb-6">
            Everything You Need to Design & Estimate
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {capabilities.map((cap, idx) => (
              <div key={idx} className="flex items-center gap-3 text-blue-100">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                {cap}
              </div>
            ))}
          </div>
          <Button 
            onClick={onGetStarted}
            className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg"
          >
            Try Design Studio Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="relative">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-blue-500/30">
            {/* Mock Design Studio UI */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-400 text-sm ml-2">Design Studio</span>
            </div>
            
            <div className="space-y-4">
              {/* Room Type Selector */}
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <ChefHat className="w-4 h-4" /> Kitchen
                </div>
                <div className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg text-sm flex items-center gap-2">
                  <Bath className="w-4 h-4" /> Bathroom
                </div>
                <div className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg text-sm flex items-center gap-2">
                  <Home className="w-4 h-4" /> Basement
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Length</p>
                  <p className="text-white font-semibold">14 ft</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Width</p>
                  <p className="text-white font-semibold">12 ft</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Area</p>
                  <p className="text-white font-semibold">168 sq ft</p>
                </div>
              </div>

              {/* Materials Preview */}
              <div className="space-y-2">
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Selected Materials
                </p>
                <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-white text-sm">Shaker Cabinets (12 linear ft)</span>
                  <span className="text-green-400 font-semibold">$4,200</span>
                </div>
                <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-white text-sm">Quartz Countertop (28 sq ft)</span>
                  <span className="text-green-400 font-semibold">$2,660</span>
                </div>
                <div className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-white text-sm">Subway Tile Backsplash (15 sq ft)</span>
                  <span className="text-green-400 font-semibold">$225</span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold">Total Estimate</span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">$18,450</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <p className="text-blue-200 mb-4">
          Stop guessing on project costs. Design with confidence and win more jobs.
        </p>
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="bg-white text-purple-700 hover:bg-purple-100 font-semibold px-8"
        >
          Start Designing Now
        </Button>
      </div>
    </section>
  );
}
