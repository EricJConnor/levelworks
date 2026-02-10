import { FileText, Send, PenTool, CreditCard, ArrowRight, Gift, Users } from 'lucide-react';

const steps = [
  { icon: FileText, num: '1', title: 'Create Estimate', desc: 'Build professional estimates with our easy-to-use builder. Add line items, photos, and your branding.' },
  { icon: Send, num: '2', title: 'Send to Client', desc: 'Email or text your estimate directly to clients. They can view it on any device.' },
  { icon: PenTool, num: '3', title: 'Get Signed', desc: 'Clients review and sign digitally. You get notified instantly when they approve.' },
  { icon: CreditCard, num: '4', title: 'Get Paid', desc: 'Send an invoice and clients pay online with credit card. Money goes directly to your bank account.' }
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-xl text-blue-200 max-w-2xl mx-auto">From estimate to payment in four simple steps</p>
      </div>
      <div className="grid md:grid-cols-4 gap-6 relative">
        <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500" />
        {steps.map((s, i) => (
          <div key={i} className="relative text-center">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl rotate-6 opacity-50" />
              <div className="absolute inset-0 bg-slate-900 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <s.icon className="w-12 h-12 text-blue-400" />
              </div>
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{s.num}</div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
            <p className="text-blue-200 text-sm">{s.desc}</p>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute top-16 -right-3 w-6 h-6 text-blue-500" />
            )}
          </div>
        ))}
      </div>
      
      {/* Referral bonus section */}
      <div className="mt-16 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8 text-purple-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Bonus: Refer & Earn</h3>
              <p className="text-purple-200">Share Level with friends and both get a free month!</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">1 Month</div>
              <div className="text-purple-300 text-sm">You earn</div>
            </div>
            <div className="text-purple-400 text-2xl">+</div>
            <div>
              <div className="text-3xl font-bold text-white">60 Days</div>
              <div className="text-purple-300 text-sm">Friend gets</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
