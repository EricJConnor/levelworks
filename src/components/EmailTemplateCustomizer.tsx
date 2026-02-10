import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Save, Mail, Eye } from 'lucide-react';

export function EmailTemplateCustomizer() {
  const [templateType, setTemplateType] = useState('estimate_sent');
  const [fromName, setFromName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const templates = [
    { value: 'estimate_sent', label: 'New Estimate Sent', defaultSubject: 'Your Estimate from {{company_name}}', defaultBody: 'Hi {{client_name}},\n\nPlease find your estimate for {{project_name}} attached.\n\nTotal: ${{total}}\n\nClick below to view and sign:\n{{view_link}}\n\nThank you!' },
    { value: 'estimate_approved', label: 'Estimate Approved', defaultSubject: 'Estimate Approved - {{project_name}}', defaultBody: 'Great news! {{client_name}} has approved the estimate for {{project_name}}.\n\nTotal: ${{total}}\nSigned at: {{signed_at}}' },
    { value: 'invoice_sent', label: 'Invoice Sent', defaultSubject: 'Invoice {{invoice_number}} from {{company_name}}', defaultBody: 'Hi {{client_name}},\n\nPlease find your invoice for {{project_name}}.\n\nAmount Due: ${{amount_due}}\nDue Date: {{due_date}}\n\nPay online: {{payment_link}}\n\nThank you!' },
    { value: 'payment_received', label: 'Payment Received', defaultSubject: 'Payment Received - Thank You!', defaultBody: 'Hi {{client_name}},\n\nWe received your payment of ${{amount}} for {{project_name}}.\n\nThank you for your business!' },
    { value: 'invoice_overdue', label: 'Invoice Overdue', defaultSubject: 'Reminder: Invoice {{invoice_number}} is Overdue', defaultBody: 'Hi {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{project_name}} is now overdue.\n\nAmount Due: ${{amount_due}}\n\nPlease pay at your earliest convenience: {{payment_link}}' }
  ];

  useEffect(() => {
    loadTemplate(templateType);
  }, [templateType]);

  const loadTemplate = async (type: string) => {
    const template = templates.find(t => t.value === type);
    if (template) {
      setSubject(template.defaultSubject);
      setBodyTemplate(template.defaultBody);
    }
    // Try to load saved customization
    const saved = localStorage.getItem(`email_template_${type}`);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.subject) setSubject(data.subject);
      if (data.body) setBodyTemplate(data.body);
      if (data.fromName) setFromName(data.fromName);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`email_template_${templateType}`, JSON.stringify({ subject, body: bodyTemplate, fromName }));
      toast({ title: 'Template Saved', description: 'Your email template has been saved successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handlePreview = () => {
    const previewData = { client_name: 'John Smith', project_name: 'Kitchen Remodel', company_name: 'Your Company', total: '5,000.00', amount_due: '5,000.00', invoice_number: 'INV-001', due_date: 'Dec 15, 2025', amount: '2,500.00', view_link: '#', payment_link: '#', signed_at: 'Dec 1, 2025' };
    let preview = bodyTemplate;
    Object.entries(previewData).forEach(([key, value]) => { preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value); });
    alert(`Subject: ${subject.replace(/{{(\w+)}}/g, (_, k) => previewData[k as keyof typeof previewData] || k)}\n\n${preview}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Email Templates</CardTitle>
        <CardDescription>Customize the emails sent to your clients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Template Type</Label>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{templates.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>From Name</Label>
          <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your Company Name" />
        </div>
        <div>
          <Label>Subject Line</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <Label>Email Body</Label>
          <Textarea value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} rows={8} className="font-mono text-sm" />
          <p className="text-xs text-gray-500 mt-1">Available variables: {'{{client_name}}, {{project_name}}, {{total}}, {{company_name}}, {{view_link}}, {{payment_link}}'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Template'}</Button>
          <Button onClick={handlePreview} variant="outline"><Eye className="w-4 h-4 mr-2" />Preview</Button>
        </div>
      </CardContent>
    </Card>
  );
}
