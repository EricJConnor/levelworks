import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import TermsContent from './TermsContent';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <Button onClick={() => navigate('/')} variant="outline" className="mb-6">
          ← Back to Home
        </Button>
        
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none text-slate-700">
          <p className="text-sm text-slate-600 mb-6">Last updated: November 22, 2025</p>
          <p className="text-sm text-slate-600 mb-6">Effective Date: November 22, 2025</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing and using Level Works ("Service", "Platform", "Software"), operated by Level Works LLC, you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">2. Description of Service</h2>
          <p className="mb-4">Level Works provides comprehensive contractor management software including estimate creation, client management, job tracking, invoicing, payment processing, and AI-powered assistance. The Service is offered on a subscription basis with various pricing tiers. We reserve the right to modify, suspend, or discontinue any part of the Service with 30 days notice for material changes.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">3. Account Registration and Security</h2>
          <p className="mb-4">You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must immediately notify us of any unauthorized use or security breach. We reserve the right to refuse service or terminate accounts at our discretion.</p>
          
          <TermsContent />
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">8. Intellectual Property Rights</h2>
          <p className="mb-4">All content, features, functionality, software, and technology comprising the Service are owned by Level Works LLC and protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, lease, or reverse engineer any part of the Service without explicit written permission.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">9. User Content and Data</h2>
          <p className="mb-4">You retain all rights to content you create using our Service (estimates, invoices, client data, etc.). You grant Level Works a worldwide, non-exclusive, royalty-free license to use, store, display, and process your content solely to provide and improve the Service. You are responsible for maintaining backups of your critical business data. We implement industry-standard security measures but cannot guarantee absolute security.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">10. Acceptable Use Policy</h2>
          <p className="mb-4">You agree not to: (a) violate any laws or regulations; (b) infringe on others' intellectual property rights; (c) transmit malware or harmful code; (d) attempt to gain unauthorized access to our systems; (e) use the Service for illegal activities; (f) harass or harm others; (g) send spam or unauthorized communications; (h) interfere with the Service's operation.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">11. Payment Terms</h2>
          <p className="mb-4">Subscription fees are billed in advance on a monthly or annual basis. All payments are non-refundable except as required by law or as explicitly stated in these Terms. We reserve the right to change pricing with 30 days notice. Failed payments may result in service suspension. You authorize us to charge your payment method for all fees and applicable taxes.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">12. Disclaimer of Warranties</h2>
          <p className="mb-4">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. We do not warrant the accuracy or completeness of any information provided through the Service.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">13. Limitation of Liability</h2>
          <p className="mb-4">TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEVEL WORKS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, EVEN IF ADVISED OF THE POSSIBILITY. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE TWELVE MONTHS PRECEDING THE CLAIM.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">14. Indemnification</h2>
          <p className="mb-4">You agree to defend, indemnify, and hold harmless Level Works LLC, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorney fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any rights of another party; (d) your content or data.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">15. Termination</h2>
          <p className="mb-4">Either party may terminate these Terms at any time. You may cancel your subscription through your account settings. We may suspend or terminate your account for violations of these Terms with or without notice. Upon termination, your right to use the Service ceases immediately. You may export your data within 30 days of termination, after which we may delete your data.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">16. Governing Law and Dispute Resolution</h2>
          <p className="mb-4">These Terms are governed by the laws of Delaware, United States, without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules, except you may assert claims in small claims court if eligible. Class actions and class arbitrations are not permitted.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">17. Changes to Terms</h2>
          <p className="mb-4">We reserve the right to modify these Terms at any time. Material changes will be notified via email or in-app notification at least 30 days before taking effect. Continued use after changes constitutes acceptance. If you disagree with changes, you must discontinue use of the Service.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">18. Severability and Waiver</h2>
          <p className="mb-4">If any provision of these Terms is found invalid or unenforceable, the remaining provisions shall continue in full force. Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-900">19. Contact Information</h2>
          <p className="mb-4">For questions about these Terms or the Service, contact us at:</p>
          <p className="mb-4">Level Works LLC<br/>Email: support@levelworks.org<br/>Website: https://levelworks.org</p>
        </div>
      </div>
    </div>
  );
}
