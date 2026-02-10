import { Bell, Eye, PenTool, CreditCard, Gift } from 'lucide-react';

const notifications = [
  { icon: Eye, title: 'Estimate Viewed', desc: 'Know the moment your client opens your estimate', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { icon: PenTool, title: 'Estimate Signed', desc: 'Get notified instantly when clients approve and sign', color: 'text-green-400', bg: 'bg-green-500/20' },
  { icon: CreditCard, title: 'Payment Received', desc: 'Real-time alerts when customers pay invoices online', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { icon: Gift, title: 'Referral Bonus', desc: 'Get notified when friends sign up using your link!', color: 'text-purple-400', bg: 'bg-purple-500/20', highlight: true }
];

export default function LandingNotifications() {
  return (
    <section className="container mx-auto px-6 py-20 border-y border-blue-900/30 bg-gradient-to-r from-blue-950/50 to-purple-950/50">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-4 py-2 mb-4">
            <Bell className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">NEW FEATURE</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Never Miss a Beat with Push Notifications</h2>
          <p className="text-xl text-blue-200 mb-8">Stay on top of your business with instant alerts delivered right to your device. Know exactly when clients engage with your estimates, pay invoices, or when friends sign up using your referral link.</p>
          <div className="space-y-4">
            {notifications.map((n, i) => (
              <div key={i} className={`flex items-center gap-4 ${n.bg} rounded-lg p-4 border ${n.highlight ? 'border-purple-400/50' : 'border-white/10'} relative`}>
                {n.highlight && <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>}
                <div className={`w-10 h-10 rounded-full ${n.bg} flex items-center justify-center`}>
                  <n.icon className={`w-5 h-5 ${n.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{n.title}</h4>
                  <p className="text-blue-200 text-sm">{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <img src="https://d64gsuwffb70l.cloudfront.net/69192c98db8a9927f5f026a9_1764536658162_e730e48f.webp" alt="Push Notifications" className="rounded-2xl shadow-2xl border border-blue-500/30 mx-auto max-w-sm" />
          <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 shadow-xl animate-pulse">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-white" />
              <div>
                <p className="text-white font-semibold text-sm">Payment Received!</p>
                <p className="text-green-200 text-xs">John Smith paid $2,450.00</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-white" />
              <div>
                <p className="text-white font-semibold text-sm">Referral Bonus!</p>
                <p className="text-purple-200 text-xs">Mike signed up - you earned 1 month!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
