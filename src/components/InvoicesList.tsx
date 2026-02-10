
import React, { useState } from 'react';
import { useInvoices } from '@/contexts/InvoiceContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Calendar, Trash2, Link, Copy, Check, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { sendInvoiceEmail } from '@/lib/edgeFunctions';

export const InvoicesList: React.FC = () => {
  const { invoices, deleteInvoice, recordPayment, updateInvoice } = useInvoices();
  const { toast } = useToast();
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; invoiceId: string | null }>({ open: false, invoiceId: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleRecordPayment = async () => {
    if (!paymentDialog.invoiceId || !paymentAmount) return;
    await recordPayment(paymentDialog.invoiceId, parseFloat(paymentAmount), paymentNote);
    setPaymentDialog({ open: false, invoiceId: null });
    setPaymentAmount('');
    setPaymentNote('');
  };

  const copyPaymentLink = (invoice: any) => {
    const link = `${window.location.origin}/view-invoice/${invoice.viewToken}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invoice.id);
    toast({ title: 'Payment link copied!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendInvoice = async (invoice: any) => {
    if (!invoice.clientEmail) {
      toast({ title: 'Error', description: 'Client email is required to send invoice', variant: 'destructive' });
      return;
    }
    
    setSendingId(invoice.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const result = await sendInvoiceEmail({
        invoiceId: invoice.id,
        clientEmail: invoice.clientEmail,
        invoiceData: {
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          clientPhone: invoice.clientPhone,
          projectName: invoice.projectName,
          total: invoice.total,
          amountDue: invoice.total - invoice.amountPaid,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          notes: invoice.notes,
          viewToken: invoice.viewToken
        },
        userId: user?.id
      });

      if (result.error) throw result.error;
      
      // Update sentAt
      await updateInvoice(invoice.id, { sentAt: new Date().toISOString() });
      toast({ title: 'Invoice sent successfully!' });
    } catch (error: any) {
      console.error('Send invoice error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to send invoice', variant: 'destructive' });
    } finally {
      setSendingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold">Invoices</h2>
      </div>

      {invoices.length === 0 ? (
        <Card className="p-6 md:p-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600">No invoices yet. Convert an approved estimate to create one.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => (
            <Card key={invoice.id} className="p-3 md:p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base md:text-lg font-semibold">{invoice.invoiceNumber}</h3>
                  <Badge className={`${getStatusColor(invoice.status)} text-xs`}>{invoice.status.replace('_', ' ').toUpperCase()}</Badge>
                  {!invoice.sentAt && <Badge className="bg-orange-100 text-orange-800 text-xs">Not Sent</Badge>}
                </div>
                <p className="text-sm text-gray-600">{invoice.clientName} - {invoice.projectName}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(invoice.issueDate).toLocaleDateString()}</span>
                  {invoice.dueDate && <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs md:text-sm py-2 border-t border-b">
                  <div><span className="text-gray-500 block">Total</span><span className="font-semibold">${invoice.total.toFixed(2)}</span></div>
                  <div><span className="text-gray-500 block">Paid</span><span className="font-semibold text-green-600">${invoice.amountPaid.toFixed(2)}</span></div>
                  <div><span className="text-gray-500 block">Balance</span><span className="font-semibold text-blue-600">${(invoice.total - invoice.amountPaid).toFixed(2)}</span></div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!invoice.sentAt && (
                    <Button 
                      size="sm" 
                      className="text-xs h-8 bg-green-600 hover:bg-green-700" 
                      onClick={() => handleSendInvoice(invoice)}
                      disabled={sendingId === invoice.id}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {sendingId === invoice.id ? 'Sending...' : 'Send Invoice'}
                    </Button>
                  )}
                  {invoice.status !== 'paid' && (
                    <>
                      <Button size="sm" className="text-xs h-8 flex-1" onClick={() => setPaymentDialog({ open: true, invoiceId: invoice.id })}>
                        <DollarSign className="h-3 w-3 mr-1" />Record Payment
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => copyPaymentLink(invoice)}>
                        {copiedId === invoice.id ? <Check className="h-3 w-3 mr-1" /> : <Link className="h-3 w-3 mr-1" />}
                        {copiedId === invoice.id ? 'Copied!' : 'Link'}
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="destructive" className="text-xs h-8" onClick={() => deleteInvoice(invoice.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ open, invoiceId: null })}>
        <DialogContent className="mx-2 max-w-md p-0 overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <DialogTitle className="text-lg font-bold">Record Payment</DialogTitle>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label htmlFor="amount" className="block text-sm font-semibold mb-2">Payment Amount *</Label>
              <input id="amount" type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none" />
            </div>
            <div>
              <Label htmlFor="note" className="block text-sm font-semibold mb-2">Note (optional)</Label>
              <textarea id="note" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Payment method, check number, etc." className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-green-500 focus:outline-none resize-none" rows={3} />
            </div>
            <Button onClick={handleRecordPayment} className="w-full py-4 text-base">Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
