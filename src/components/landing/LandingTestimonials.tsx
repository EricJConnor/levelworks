import { Star, Gift } from 'lucide-react';

const testimonials = [
  {
    name: 'Mike Johnson',
    role: 'General Contractor',
    image: 'https://d64gsuwffb70l.cloudfront.net/69192c98db8a9927f5f026a9_1764536663133_e5efc033.webp',
    quote: 'Level has completely transformed how I run my business. The push notifications let me know the second a client views my estimate. I can follow up at the perfect time.',
    rating: 5
  },
  {
    name: 'David Martinez',
    role: 'Electrician',
    image: 'https://d64gsuwffb70l.cloudfront.net/69192c98db8a9927f5f026a9_1764536665168_9b72c086.webp',
    quote: 'The AI assistant is like having a knowledgeable partner available 24/7. It helps me with code questions and material recommendations instantly.',
    rating: 5,
    referral: true
  },
  {
    name: 'James Wilson',
    role: 'Plumber',
    image: 'https://d64gsuwffb70l.cloudfront.net/69192c98db8a9927f5f026a9_1764536667050_578d500e.webp',
    quote: "I've referred 5 contractors and earned 5 free months! The referral program is amazing. Getting paid used to take weeks - now I get paid same day.",
    rating: 5,
    referral: true
  }
];

export default function LandingTestimonials() {
  return (
    <section className="container mx-auto px-6 py-20 border-t border-blue-900/30">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Trusted by Contractors</h2>
        <p className="text-xl text-blue-200">See what professionals are saying about Level</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <div key={i} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-900/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all relative">
            {t.referral && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Gift className="w-3 h-3" /> Referral Fan
              </div>
            )}
            <div className="flex gap-1 mb-4">
              {[...Array(t.rating)].map((_, j) => (
                <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-blue-100 mb-6 italic">"{t.quote}"</p>
            <div className="flex items-center gap-4">
              <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30" />
              <div>
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-blue-300 text-sm">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
