import { Sparkles, MessageSquare, Zap, BookOpen } from 'lucide-react';

const capabilities = [
  { icon: MessageSquare, title: 'Ask Anything', desc: 'Building codes, material specs, best practices - get expert answers instantly' },
  { icon: Zap, title: 'Lightning Fast', desc: 'No more searching forums or waiting for callbacks. Answers in seconds' },
  { icon: BookOpen, title: 'Always Learning', desc: 'Up-to-date knowledge on regulations, techniques, and industry standards' }
];

const sampleQuestions = [
  'What size wire do I need for a 200 amp service?',
  'How much concrete do I need for a 10x10 slab?',
  'What\'s the code for stair riser height?',
  'Best waterproofing for basement walls?'
];

export default function LandingAI() {
  return (
    <section id="ai-assistant" className="container mx-auto px-6 py-20 border-y border-blue-900/30 bg-gradient-to-r from-purple-950/50 to-blue-950/50">

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          <div className="bg-slate-900/80 rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-500/20">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">AI Assistant</p>
                <p className="text-purple-300 text-xs">Always online</p>
              </div>
            </div>
            <div className="space-y-4">
              {sampleQuestions.map((q, i) => (
                <div key={i} className="bg-blue-600/20 rounded-lg p-3 ml-8">
                  <p className="text-blue-100 text-sm">{q}</p>
                </div>
              ))}
              <div className="bg-purple-600/20 rounded-lg p-3 mr-8">
                <p className="text-purple-100 text-sm">I can help with all of these! Just ask me anything about your contracting work...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">AI POWERED</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Your 24/7 Expert Assistant</h2>
          <p className="text-xl text-blue-200 mb-8">Get instant answers to contractor questions without leaving the app. Like having an expert consultant in your pocket.</p>
          <div className="space-y-4">
            {capabilities.map((c, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{c.title}</h4>
                  <p className="text-blue-200 text-sm">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
