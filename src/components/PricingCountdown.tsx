import { useState, useEffect } from 'react';
import { Flame, Sparkles } from 'lucide-react';

interface PricingCountdownProps {
  variant?: 'landing' | 'compact' | 'full';
  className?: string;
}

export function PricingCountdown({ variant = 'landing', className = '' }: PricingCountdownProps) {
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">
            Just $5/month - All features included!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold">Simple Pricing</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Pro Plan</span>
            <span className="text-2xl font-bold">$5/mo</span>
          </div>
          <p className="text-blue-200 text-sm mt-2">All features included. No hidden fees.</p>
        </div>
        
        <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-200">
              30-day free trial. No credit card required.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingCountdown;
