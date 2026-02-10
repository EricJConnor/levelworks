import React, { useState } from 'react';
import { useInvoices } from '@/contexts/InvoiceContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Send, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendInvoiceEmail } from '@/lib/edgeFunctions';
import { useToast } from '@/hooks/use-toast';

interface InvoiceBuilderProps {
  estimateId?: string;
  initialData?: any;
  onComplete?: () => void;
  onClose?: () => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ estimateId, initialData, onComplete, onClose }) => {
  const { addInvoice } = useInvoices();
  const { toast } = useToast();
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '');
  const [projectName, setProjectName] = useState(initialData?.projectName || '');
  const [lineItems, setLineItems] = useState(initialData?.lineItems || [{ description: '', quantity: 1, rate: 0 }]);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  // Determine if this is a conversion from an estimate
  const isConversion = !!(estimateId || initialData);

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_: any, i: number) => i !== index));
  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    return subtotal + (subtotal * (taxRate / 100));
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  // Handle conversion - just save the invoice without sending email
  const handleConvert = async () => {
    if (!clientName || !projectName || lineItems.length === 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      // Helper to safely convert to number (handles NaN)
      const safeNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };
      
      // Helper to safely convert to string
      const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        return String(val);
      };
      
      const invoiceNumber = generateInvoiceNumber();
      const total = calculateTotal();
      
      // Clean line items before saving - NO NaN, NO undefined
      const cleanLineItems = lineItems.map((item: any, index: number) => ({
        id: safeString(item.id || `item-${index}`),
        description: safeString(item.description),
        quantity: safeNumber(item.quantity),
        rate: safeNumber(item.rate),
        total: safeNumber(item.quantity) * safeNumber(item.rate)
      }));
      
      console.log('[InvoiceBuilder] Converting estimate to invoice...');
      console.log('[InvoiceBuilder] Clean line items:', JSON.stringify(cleanLineItems));
      
      // Save the invoice to the database (without sending email)
      const invoiceId = await addInvoice({
        estimateId: estimateId || undefined, 
        invoiceNumber, 
        clientName: safeString(clientName).trim(), 
        clientEmail: safeString(clientEmail).trim(), 
        clientPhone: safeString(clientPhone).trim(), 
        projectName: safeString(projectName).trim(), 
        lineItems: cleanLineItems, 
        taxRate: safeNumber(taxRate), 
        total: safeNumber(total),
        amountPaid: 0, 
        paymentHistory: [], 
        status: 'unpaid', 
        issueDate: new Date().toISOString(),
        dueDate: dueDate || null,
        notes: notes ? `Converted from estimate. ${notes}` : 'Converted from estimate.',
        sentAt: null // Not sent yet
      });

      console.log('[InvoiceBuilder] Invoice created with ID:', invoiceId);
      toast({ title: 'Invoice created successfully!', description: 'You can send it from the Invoices list.' });

      onComplete?.();
      onClose?.();
    } catch (error: any) {
      console.error('Convert to invoice error:', error);
      let errorMessage = 'Error creating invoice';
      if (error?.message) {
        errorMessage = error.message;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally { 
      setSending(false); 
    }
  };

  // Handle sending a new invoice (not conversion)
  const handleSendInvoice = async () => {
    if (!clientName || !clientEmail || !projectName || lineItems.length === 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      // Helper to safely convert to number (handles NaN)
      const safeNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };
      
      // Helper to safely convert to string
      const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        return String(val);
      };
      
      const invoiceNumber = generateInvoiceNumber();
      const total = calculateTotal();
      
      // Clean line items before saving - NO NaN, NO undefined
      const cleanLineItems = lineItems.map((item: any, index: number) => ({
        id: safeString(item.id || `item-${index}`),
        description: safeString(item.description),
        quantity: safeNumber(item.quantity),
        rate: safeNumber(item.rate),
        total: safeNumber(item.quantity) * safeNumber(item.rate)
      }));
      
      console.log('[InvoiceBuilder] Clean line items:', JSON.stringify(cleanLineItems));
      
      // First, save the invoice to the database
      const invoiceId = await addInvoice({
        estimateId, 
        invoiceNumber, 
        clientName: safeString(clientName).trim(), 
        clientEmail: safeString(clientEmail).trim(), 
        clientPhone: safeString(clientPhone).trim(), 
        projectName: safeString(projectName).trim(), 
        lineItems: cleanLineItems, 
        taxRate: safeNumber(taxRate), 
        total: safeNumber(total),
        amountPaid: 0, 
        paymentHistory: [], 
        status: 'unpaid', 
        issueDate: new Date().toISOString(),
        dueDate: dueDate || null,  // Use null, not undefined
        notes: notes || null,  // Use null, not undefined
        sentAt: new Date().toISOString()
      });

      // Wait a moment for the database to fully commit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch the saved invoice to get the view_token
      const { data: invoiceData } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Sending invoice email...');

      // Use the edge function helper
      const result = await sendInvoiceEmail({
        invoiceId,
        clientEmail,
        invoiceData: {
          invoiceNumber,
          clientName,
          clientEmail,
          clientPhone,
          projectName,
          total,
          amountDue: total,
          issueDate: new Date().toISOString(),
          dueDate,
          notes,
          viewToken: invoiceData?.view_token
        },
        userId: user?.id
      });

      console.log('Send invoice result:', result);
      
      if (result.error) {
        console.error('Send invoice error:', result.error);
        throw result.error;
      }

      const responseData = result.data;

      if (responseData?.errors && responseData.errors.length > 0) {
        toast({ title: 'Invoice sent with warnings', description: responseData.errors.join(', ') });
      } else {
        toast({ title: 'Invoice sent successfully!' });
      }

      onComplete?.();
      onClose?.();
    } catch (error: any) {
      console.error('Send invoice error:', error);
      let errorMessage = 'Error sending invoice';
      if (error?.message) {
        errorMessage = error.message;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally { 
      setSending(false); 
    }
  };

  // Choose the appropriate handler based on mode
  const handleSubmit = isConversion ? handleConvert : handleSendInvoice;
  const buttonText = isConversion 
    ? (sending ? 'Converting...' : 'Convert to Invoice') 
    : (sending ? 'Sending...' : 'Send Invoice');
  const buttonIcon = isConversion ? <FileText className="h-5 w-5 mr-2" /> : <Send className="h-5 w-5 mr-2" />;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-auto">
        <div className="sticky top-0 bg-green-600 text-white p-3 md:p-4 flex justify-between items-center z-10">
          <h2 className="text-lg md:text-xl font-bold">{isConversion ? 'Convert to Invoice' : 'Create Invoice'}</h2>
          <button onClick={() => { onClose?.(); onComplete?.(); }} className="p-2 hover:bg-green-700 rounded"><X size={24} /></button>
        </div>
        <div className="p-4 md:p-6 space-y-4">
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Client Name *</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none" placeholder="Client name" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Client Email {!isConversion && '*'}</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none" placeholder="client@email.com" />
              {isConversion && <p className="text-xs text-gray-500 mt-1">Email is optional for conversion. You can send the invoice later.</p>}
            </div>
          </div>
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Client Phone</label>
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Project Name *</label>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none" placeholder="Project name" />
            </div>
          </div>
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-3">Line Items *</label>
            <div className="space-y-3">
              {lineItems.map((item: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Item {index + 1}</span>
                    <button onClick={() => removeLineItem(index)} className="text-red-600 p-1"><Trash2 size={18} /></button>
                  </div>
                  <textarea placeholder="Description" value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none resize-none" rows={2} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Qty</label>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-full border-2 rounded-lg px-3 py-3 text-base text-center focus:border-green-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Rate ($)</label>
                      <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)} className="w-full border-2 rounded-lg px-3 py-3 text-base text-center focus:border-green-500 focus:outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addLineItem} className="mt-3 flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:bg-gray-50 text-gray-600">
              <Plus size={18} /> Add Line Item
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, additional information..." className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none resize-none" rows={3} />
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-right text-2xl font-bold text-green-700">Total: ${calculateTotal().toFixed(2)}</div>
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full py-4 text-base bg-green-600 hover:bg-green-700">
            {buttonIcon}{buttonText}
          </Button>
        </div>
      </Card>
    </div>
  );
};

