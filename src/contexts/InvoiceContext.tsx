import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Invoice, LineItem } from './DataContext';

interface InvoiceContextType {
  invoices: Invoice[];
  loading: boolean;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<string>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  recordPayment: (id: string, amount: number, note?: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);
export const useInvoices = () => { const ctx = useContext(InvoiceContext); if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider'); return ctx; };

/**
 * Safely convert a value to a number, returning 0 for NaN/undefined/null
 */
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Safely convert a value to a string, returning empty string for null/undefined
 */
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Safely parse line items from various formats
 * Handles: arrays, JSON strings, null/undefined
 */
const parseLineItems = (items: any): LineItem[] => {
  if (!items) return [];
  
  let arr: any[] = [];
  
  if (Array.isArray(items)) {
    arr = items;
  } else if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) {
        arr = parsed;
      }
    } catch (e) {
      console.error('[parseLineItems] Failed to parse:', e);
      return [];
    }
  } else {
    return [];
  }
  
  return arr.map((item: any, index: number) => ({
    id: safeString(item?.id || `item-${index}-${Date.now()}`),
    description: safeString(item?.description),
    quantity: safeNumber(item?.quantity),
    rate: safeNumber(item?.rate),
    total: safeNumber(item?.total)
  }));
};

/**
 * Format line items for database storage - returns clean JSON-safe array
 * All values are guaranteed to be JSON-safe primitives (no undefined, no NaN)
 */
const formatLineItemsForDb = (items: any): object[] => {
  const parsed = parseLineItems(items);
  
  if (parsed.length === 0) return [];
  
  // Create clean objects with NO undefined values and NO NaN values
  const cleanItems = parsed.map((item, index) => {
    return {
      id: safeString(item.id || `item-${index}`),
      description: safeString(item.description),
      quantity: safeNumber(item.quantity),
      rate: safeNumber(item.rate),
      total: safeNumber(item.total)
    };
  });
  
  // Validate by round-tripping through JSON - this ensures it's serializable
  try {
    const jsonString = JSON.stringify(cleanItems);
    console.log('[formatLineItemsForDb] JSON string:', jsonString);
    const result = JSON.parse(jsonString);
    console.log('[formatLineItemsForDb] Round-trip validation: PASSED');
    return result;
  } catch (e) {
    console.error('[formatLineItemsForDb] JSON validation failed:', e);
    return [];
  }
};

/**
 * Safely parse payment history - returns clean JSON-safe array
 * All values are guaranteed to be JSON-safe primitives (no undefined, no NaN)
 */
const parsePaymentHistory = (history: any): object[] => {
  if (!history) return [];
  
  let arr: any[] = [];
  
  if (Array.isArray(history)) {
    arr = history;
  } else if (typeof history === 'string') {
    try {
      const parsed = JSON.parse(history);
      if (Array.isArray(parsed)) {
        arr = parsed;
      }
    } catch (e) {
      console.error('[parsePaymentHistory] Failed to parse:', e);
      return [];
    }
  } else {
    return [];
  }
  
  // Clean each entry - use null instead of undefined for missing values
  const cleanHistory = arr.map(entry => {
    const clean: { amount: number; date: string; note: string | null } = {
      amount: safeNumber(entry?.amount),
      date: safeString(entry?.date || new Date().toISOString()),
      note: entry?.note ? safeString(entry.note) : null  // Use null, not undefined
    };
    return clean;
  });
  
  // Validate by round-tripping through JSON
  try {
    const jsonString = JSON.stringify(cleanHistory);
    console.log('[parsePaymentHistory] JSON string:', jsonString);
    const result = JSON.parse(jsonString);
    console.log('[parsePaymentHistory] Round-trip validation: PASSED');
    return result;
  } catch (e) {
    console.error('[parsePaymentHistory] JSON validation failed:', e);
    return [];
  }
};

const mapDbToInvoice = (i: any): Invoice => ({
  id: i.id, 
  estimateId: i.estimate_id || null, 
  invoiceNumber: i.invoice_number || '',
  clientName: i.client_name || '', 
  clientEmail: i.client_email || '', 
  clientPhone: i.client_phone || '',
  projectName: i.project_name || '',
  lineItems: parseLineItems(i.line_items),
  taxRate: safeNumber(i.tax_rate), 
  total: safeNumber(i.total), 
  amountPaid: safeNumber(i.amount_paid),
  paymentHistory: parsePaymentHistory(i.payment_history) as any[], 
  status: i.status || 'unpaid',
  issueDate: i.issue_date || '', 
  dueDate: i.due_date || null, 
  notes: i.notes || null,
  createdAt: i.created_at || '', 
  sentAt: i.sent_at || null, 
  viewToken: i.view_token || ''
});

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setInvoices(data.map(mapDbToInvoice));
    } catch (error) { console.error('Error loading invoices:', error); }
    finally { setLoading(false); }
  };

  const refreshInvoices = loadInvoices;

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const viewToken = crypto.randomUUID();
    const formattedItems = formatLineItemsForDb(invoice.lineItems);
    const formattedPaymentHistory = parsePaymentHistory(invoice.paymentHistory);
    
    // Build insert payload with all values properly typed - NO undefined values, NO NaN values
    const insertPayload = {
      user_id: user.id, 
      estimate_id: invoice.estimateId || null,  // null, not undefined
      invoice_number: safeString(invoice.invoiceNumber),
      client_name: safeString(invoice.clientName).trim(), 
      client_email: safeString(invoice.clientEmail).trim(),
      client_phone: safeString(invoice.clientPhone).trim(), 
      project_name: safeString(invoice.projectName).trim(),
      line_items: formattedItems, 
      tax_rate: safeNumber(invoice.taxRate), 
      total: safeNumber(invoice.total),
      amount_paid: safeNumber(invoice.amountPaid), 
      payment_history: formattedPaymentHistory,
      status: safeString(invoice.status || 'unpaid'), 
      issue_date: invoice.issueDate || new Date().toISOString(), 
      due_date: invoice.dueDate || null,  // null, not undefined
      notes: invoice.notes || null,  // null, not undefined
      sent_at: invoice.sentAt || null,  // null, not undefined
      view_token: viewToken
    };
    
    console.log('[addInvoice] Insert payload:', JSON.stringify(insertPayload, null, 2));
    
    // Validate the payload is valid JSON
    try {
      JSON.parse(JSON.stringify(insertPayload));
      console.log('[addInvoice] Payload validation: PASSED');
    } catch (validationError) {
      console.error('[addInvoice] Payload validation: FAILED', validationError);
      throw new Error('Failed to create valid JSON payload for invoice');
    }
    
    const { data, error } = await supabase.from('invoices').insert(insertPayload).select().single();
    
    if (error) {
      console.error('[addInvoice] Database error:', error);
      console.error('[addInvoice] Error code:', error.code);
      console.error('[addInvoice] Error message:', error.message);
      throw error;
    }
    
    setInvoices(prev => [mapDbToInvoice(data), ...prev]);
    toast({ title: 'Invoice created' });
    return data.id;
  };

  const updateInvoice = async (id: string, u: Partial<Invoice>) => {
    const db: Record<string, any> = {};
    
    if (u.invoiceNumber !== undefined) db.invoice_number = safeString(u.invoiceNumber);
    if (u.clientName !== undefined) db.client_name = safeString(u.clientName).trim();
    if (u.clientEmail !== undefined) db.client_email = safeString(u.clientEmail).trim();
    if (u.clientPhone !== undefined) db.client_phone = safeString(u.clientPhone).trim();
    if (u.projectName !== undefined) db.project_name = safeString(u.projectName).trim();
    
    if (u.lineItems !== undefined && Array.isArray(u.lineItems)) {
      db.line_items = formatLineItemsForDb(u.lineItems);
    }
    
    if (u.taxRate !== undefined) db.tax_rate = safeNumber(u.taxRate);
    if (u.total !== undefined) db.total = safeNumber(u.total);
    if (u.amountPaid !== undefined) db.amount_paid = safeNumber(u.amountPaid);
    
    if (u.paymentHistory !== undefined && Array.isArray(u.paymentHistory)) {
      db.payment_history = parsePaymentHistory(u.paymentHistory);
    }
    
    if (u.status !== undefined) db.status = safeString(u.status);
    if (u.issueDate !== undefined) db.issue_date = u.issueDate;
    if (u.dueDate !== undefined) db.due_date = u.dueDate || null;
    if (u.notes !== undefined) db.notes = u.notes || null;
    if (u.sentAt !== undefined) db.sent_at = u.sentAt;
    
    if (Object.keys(db).length === 0) return;
    
    console.log('[updateInvoice] Update payload:', JSON.stringify(db, null, 2));
    
    // Validate the payload is valid JSON
    try {
      JSON.parse(JSON.stringify(db));
      console.log('[updateInvoice] Payload validation: PASSED');
    } catch (validationError) {
      console.error('[updateInvoice] Payload validation: FAILED', validationError);
      throw new Error('Failed to create valid JSON payload for invoice update');
    }
    
    const { error } = await supabase.from('invoices').update(db).eq('id', id);
    if (error) {
      console.error('[updateInvoice] Database error:', error);
      throw error;
    }
    
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...u } : i));
    toast({ title: 'Invoice updated' });
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.filter(i => i.id !== id));
    toast({ title: 'Invoice deleted' });
  };

  const recordPayment = async (id: string, amount: number, note?: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) throw new Error('Invoice not found');
    
    const safeAmount = safeNumber(amount);
    const newAmountPaid = safeNumber(invoice.amountPaid) + safeAmount;
    const newPaymentEntry = { 
      amount: safeAmount, 
      date: new Date().toISOString(), 
      note: note ? safeString(note) : null  // Use null, not undefined
    };
    const newPaymentHistory = [...invoice.paymentHistory, newPaymentEntry];
    
    let newStatus: Invoice['status'] = 'unpaid';
    if (newAmountPaid >= safeNumber(invoice.total)) newStatus = 'paid';
    else if (newAmountPaid > 0) newStatus = 'partially_paid';
    
    await updateInvoice(id, { amountPaid: newAmountPaid, paymentHistory: newPaymentHistory, status: newStatus });
    toast({ title: 'Payment recorded' });
  };

  return (
    <InvoiceContext.Provider value={{ invoices, loading, addInvoice, updateInvoice, deleteInvoice, recordPayment, refreshInvoices }}>
      {children}
    </InvoiceContext.Provider>
  );
};
