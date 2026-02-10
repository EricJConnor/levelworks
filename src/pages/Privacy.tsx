import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <Button onClick={() => navigate('/')} variant="outline" className="mb-6">
          ← Back to Home
        </Button>
        
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none text-slate-700">
          <p className="text-sm text-slate-600 mb-6">Last updated: November 22, 2025</p>
          <p className="text-sm text-slate-600 mb-6">Effective Date: November 22, 2025</p>
          
          <p className="mb-6">Level Works LLC ("we," "us," "our," "Level Works") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service at levelworks.org.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">1. Information We Collect</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900">Personal Information You Provide</h3>
          <p className="mb-4">Account data: name, email, phone, business name, address, tax ID. Payment info: processed by Stripe (we don't store card details). Business data: estimates, invoices, client info, job details, signatures.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900">Automatically Collected Information</h3>
          <p className="mb-4">Device data: IP address, browser type, OS, device ID. Usage data: pages viewed, features used, timestamps, referral sources. Cookies: session management, preferences, analytics tracking.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">2. How We Use Your Information</h2>
          <p className="mb-4">Service delivery: provide core functionality, process payments, send estimates/invoices. Communications: service updates, security alerts, customer support, marketing (with consent). Improvements: analyze usage, fix bugs, develop features, personalize experience. Legal: comply with laws, enforce terms, protect rights, prevent fraud.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">3. Information Sharing</h2>
          <p className="mb-4"><strong>Service Providers:</strong> Stripe (payments), Twilio (SMS), SendGrid (email), Supabase (hosting), Vercel (deployment).</p>

          <p className="mb-4"><strong>Your Clients:</strong> Estimate/invoice data shared when you send to clients.</p>
          <p className="mb-4"><strong>Legal Requirements:</strong> Court orders, subpoenas, government requests, fraud prevention.</p>
          <p className="mb-4"><strong>Business Transfers:</strong> Mergers, acquisitions, bankruptcy proceedings.</p>
          <p className="mb-4">We NEVER sell your personal information to third parties.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">4. Data Security</h2>
          <p className="mb-4">Technical measures: SSL/TLS encryption, secure databases, regular backups, access controls. Organizational: limited employee access, confidentiality agreements, security training. Third-party: vetted providers, data processing agreements, compliance verification.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">5. Data Retention</h2>
          <p className="mb-4">Active accounts: data retained while account active. Post-cancellation: 30 days for export, then deletion (except legal requirements). Backups: may persist up to 90 days in backup systems. Legal holds: retained as required by law or litigation.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">6. Your Rights and Controls</h2>
          <p className="mb-4"><strong>Access:</strong> View your data through account dashboard.</p>
          <p className="mb-4"><strong>Correction:</strong> Update information in account settings.</p>
          <p className="mb-4"><strong>Deletion:</strong> Request account deletion via support.</p>
          <p className="mb-4"><strong>Export:</strong> Download your data in standard formats.</p>
          <p className="mb-4"><strong>Opt-out:</strong> Unsubscribe from marketing, disable analytics.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">7. Cookie Policy</h2>
          <p className="mb-4">Essential: authentication, security, preferences. Analytics: usage patterns, performance monitoring. You can control cookies via browser settings, though some features may not function properly.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">8. International Transfers</h2>
          <p className="mb-4">Data may be processed in the United States and other countries. We ensure appropriate safeguards through standard contractual clauses and data processing agreements.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">9. Children's Privacy</h2>
          <p className="mb-4">Service not intended for users under 18. We don't knowingly collect children's data. Contact us immediately if you believe we have collected information from a minor.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">10. California Privacy Rights (CCPA)</h2>
          <p className="mb-4">California residents have rights to: know what data is collected, request deletion, opt-out of sales (we don't sell data), non-discrimination. Contact privacy@levelworks.org to exercise rights.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">11. GDPR Compliance (EU Users)</h2>
          <p className="mb-4">Legal basis: contract performance, legitimate interests, consent. Rights: access, rectification, erasure, portability, restriction, objection. Data Protection Officer available at dpo@levelworks.org.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">12. Third-Party Services</h2>
          <p className="mb-4">Our Service integrates with third-party services (Stripe, Twilio, etc.). Review their privacy policies as we're not responsible for their practices.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">13. Changes to Privacy Policy</h2>
          <p className="mb-4">We'll notify you of material changes via email or in-app notification 30 days before effectiveness. Continued use after changes constitutes acceptance.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">14. Contact Information</h2>
          <p className="mb-4">Level Works LLC<br/>Email: privacy@levelworks.org<br/>Support: support@levelworks.org<br/>Website: https://levelworks.org</p>
          
          <p className="mb-4">For privacy concerns or to exercise your rights, email privacy@levelworks.org with subject line "Privacy Request".</p>
        </div>
      </div>
    </div>
  );
}