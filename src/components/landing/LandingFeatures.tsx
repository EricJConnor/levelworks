
import { Bell, FileText, Receipt, Users, Camera, Sparkles, PenTool, FolderOpen, Shield, Gift } from 'lucide-react';

const features = [
  { icon: Bell, title: 'Push Notifications', desc: 'Get instant alerts when estimates are viewed, signed, or clients respond', color: 'bg-red-500', new: true },
  { icon: Sparkles, title: 'AI Assistant', desc: 'Get instant expert answers to contractor questions 24/7', color: 'bg-purple-500', new: true },
  { icon: Receipt, title: 'Receipt Tracking', desc: 'Snap photos of receipts and organize expenses by job', color: 'bg-emerald-500', new: true },
  { icon: Gift, title: 'Referral Program', desc: 'Invite friends and both get a free month - no limits!', color: 'bg-pink-500', new: true },
  { icon: FileText, title: 'Professional Estimates', desc: 'Create beautiful, branded estimates in minutes', color: 'bg-blue-500' },
  { icon: PenTool, title: 'Digital Signatures', desc: 'Clients can sign estimates directly from their phone or computer', color: 'bg-indigo-500' },
  { icon: Users, title: 'Client Database', desc: 'Store all client info, history, and communications', color: 'bg-cyan-500' },
  { icon: FolderOpen, title: 'Job Management', desc: 'Track all your jobs from start to finish', color: 'bg-orange-500' },
  { icon: Camera, title: 'Photo Documentation', desc: 'Upload and organize project photos for each job', color: 'bg-amber-500' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Bank-level encryption keeps your data safe', color: 'bg-slate-500' }
];

export default function LandingFeatures() {
  return (
    <section id="features" className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Run Your Business</h2>
        <p className="text-xl text-blue-200 max-w-2xl mx-auto">Powerful tools designed specifically for contractors</p>
      </div>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div key={i} className="bg-slate-900/50 border border-blue-900/30 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:scale-105 group relative">
            {f.new && <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>}
            <div className={`w-12 h-12 ${f.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-blue-200 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
