import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Job { id: string; clientName: string; projectType: string; status: 'draft' | 'sent' | 'approved' | 'in-progress' | 'completed'; total: number; date: string; }
export interface Client { id: string; name: string; email: string; phone: string; address: string; totalJobs: number; totalValue: number; }
export interface LineItem { id: string; description: string; quantity: number; rate: number; total: number; }
export interface Estimate { 
  id: string; clientName: string; clientEmail: string; clientPhone?: string; projectName: string; 
  lineItems: LineItem[]; taxRate: number; deposit: number; total: number; 
  status: 'draft' | 'sent' | 'approved' | 'rejected'; createdAt: string; sentAt?: string; 
  readAt?: string; signedAt?: string; signedByName?: string; signedByEmail?: string; viewToken?: string;
}
export interface Invoice { id: string; estimateId?: string; invoiceNumber: string; clientName: string; clientEmail: string; clientPhone?: string; projectName: string; lineItems: LineItem[]; taxRate: number; total: number; amountPaid: number; paymentHistory: any[]; status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue'; issueDate: string; dueDate?: string; notes?: string; createdAt: string; sentAt?: string; viewToken?: string; }

interface DataContextType {
  jobs: Job[]; clients: Client[]; estimates: Estimate[]; loading: boolean;
  addJob: (job: Omit<Job, 'id'>) => Promise<void>; updateJob: (id: string, job: Partial<Job>) => Promise<void>; deleteJob: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>; updateClient: (id: string, client: Partial<Client>) => Promise<void>; deleteClient: (id: string) => Promise<void>;
  addEstimate: (estimate: Omit<Estimate, 'id' | 'createdAt'>) => Promise<{ id: string; viewToken: string }>; updateEstimate: (id: string, updates: Partial<Estimate>) => Promise<void>; deleteEstimate: (id: string) => Promise<void>;
  refreshEstimates: () => Promise<void>;
}


const DataContext = createContext<DataContextType | undefined>(undefined);
export const useData = () => { const ctx = useContext(DataContext); if (!ctx) throw new Error('useData must be used within DataProvider'); return ctx; };

/**
 * Safely convert a value to a number, returning 0 for NaN/undefined/null/empty string
 */
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
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
 * Clean and format a single line item for database storage
 * Returns null if the item is invalid/blank
 */
const cleanLineItem = (item: any, index: number): object | null => {
  // Skip null/undefined items
  if (!item || typeof item !== 'object') return null;
  
  // Extract and convert values - be very explicit about types
  const description = safeString(item.description).trim();
  
  // Handle both 'quantity' and 'qty' field names
  const quantity = safeNumber(item.quantity ?? item.qty);
  
  // Handle both 'rate' and 'unit_price' field names
  const rate = safeNumber(item.rate ?? item.unit_price ?? item.unitPrice);
  
  // Calculate total (ignore any provided total, always recalculate)
  const total = Math.round((quantity * rate) * 100) / 100; // Round to 2 decimal places
  
  // A valid line item must have:
  // 1. A non-empty description
  // 2. A positive quantity (> 0)
  // Rate can be 0 (for free items)
  if (!description || quantity <= 0) {
    console.log(`[cleanLineItem] Skipping invalid item ${index}: desc="${description}", qty=${quantity}, rate=${rate}`);
    return null;
  }
  
  // Generate a simple string ID - avoid complex ID generation
  const itemId = typeof item.id === 'string' && item.id.length > 0 
    ? item.id 
    : `item_${index}_${Date.now()}`;
  
  // Return a plain object with ONLY primitive values
  // This ensures no hidden properties, getters, or prototypes
  return {
    id: String(itemId),
    description: String(description),
    quantity: Number(quantity),
    rate: Number(rate),
    total: Number(total)
  };
};

/**
 * Parse and clean line items from any format (array, JSON string, etc.)
 * Always returns a valid array (may be empty)
 */
const parseLineItems = (items: any): LineItem[] => {
  console.log('[parseLineItems] Input type:', typeof items);
  
  // Handle null/undefined/empty - return empty array
  if (items === null || items === undefined || items === '') {
    console.log('[parseLineItems] Empty input, returning []');
    return [];
  }
  
  let rawItems: any[] = [];
  
  // If it's already an array, use it directly
  if (Array.isArray(items)) {
    rawItems = items;
    console.log('[parseLineItems] Input is array with', rawItems.length, 'items');
  }
  // If it's a string, try to parse as JSON
  else if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) {
        rawItems = parsed;
        console.log('[parseLineItems] Parsed JSON array with', rawItems.length, 'items');
      } else {
        console.warn('[parseLineItems] Parsed JSON is not an array, returning []');
        return [];
      }
    } catch (e) {
      console.error('[parseLineItems] Failed to parse JSON string:', e);
      return [];
    }
  } else {
    console.warn('[parseLineItems] Unknown input type:', typeof items);
    return [];
  }
  
  // Clean each item and filter out nulls (invalid items)
  const cleanedItems: object[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const cleaned = cleanLineItem(rawItems[i], i);
    if (cleaned !== null) {
      cleanedItems.push(cleaned);
    }
  }
  
  console.log('[parseLineItems] Cleaned', rawItems.length, 'raw items to', cleanedItems.length, 'valid items');
  return cleanedItems as LineItem[];
};

/**
 * Format line items for database storage
 * Returns a clean array that is guaranteed to be valid for JSONB storage
 * Uses JSON round-trip to ensure complete serialization safety
 */
const formatLineItemsForDb = (items: any): object[] => {
  const parsed = parseLineItems(items);
  
  // If no valid items, return empty array (which is valid JSONB)
  if (parsed.length === 0) {
    console.log('[formatLineItemsForDb] No valid items, returning []');
    return [];
  }
  
  // CRITICAL: Do a JSON round-trip to ensure the data is completely clean
  // This strips any hidden properties, prototypes, getters, symbols, etc.
  // and ensures the data is exactly what PostgreSQL will receive
  try {
    const jsonString = JSON.stringify(parsed);
    const roundTripped = JSON.parse(jsonString);
    
    // Verify it's still an array after round-trip
    if (!Array.isArray(roundTripped)) {
      console.error('[formatLineItemsForDb] Round-trip produced non-array');
      return [];
    }
    
    console.log('[formatLineItemsForDb] JSON round-trip successful, items:', roundTripped.length);
    console.log('[formatLineItemsForDb] Final JSON:', jsonString);
    
    return roundTripped;
  } catch (e) {
    console.error('[formatLineItemsForDb] JSON round-trip failed:', e);
    return [];
  }
};








const mapDbToEstimate = (e: any): Estimate => ({
  id: e.id, 
  clientName: e.client_name || '', 
  clientEmail: e.client_email || '', 
  clientPhone: e.client_phone || '',
  projectName: e.project_name || '',
  lineItems: parseLineItems(e.line_items),
  taxRate: safeNumber(e.tax_rate), 
  deposit: safeNumber(e.deposit), 
  total: safeNumber(e.total),
  status: e.status || 'draft', 
  createdAt: e.created_at || '', 
  sentAt: e.sent_at, 
  readAt: e.read_at,
  signedAt: e.signed_at, 
  signedByName: e.signed_by_name, 
  signedByEmail: e.signed_by_email, 
  viewToken: e.view_token
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]); 
  const [clients, setClients] = useState<Client[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]); 
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const [estRes, cliRes, jobRes] = await Promise.all([
        supabase.from('estimates').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('jobs').select('*').eq('user_id', user.id)
      ]);
      if (estRes.data) setEstimates(estRes.data.map(mapDbToEstimate));
      if (cliRes.data) setClients(cliRes.data.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, totalJobs: c.total_jobs, totalValue: c.total_value })));
      if (jobRes.data) setJobs(jobRes.data.map(j => ({ id: j.id, clientName: j.client_name, projectType: j.project_type, status: j.status, total: j.total, date: j.date })));
    } catch (err) { console.error('Load error:', err); } finally { setLoading(false); }
  };

  const refreshEstimates = async () => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { data } = await supabase.from('estimates').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setEstimates(data.map(mapDbToEstimate));
  };

  const addEstimate = async (est: Omit<Estimate, 'id' | 'createdAt'>): Promise<{ id: string; viewToken: string }> => {
    // Get user first
    const { data: { user }, error: userError } = await supabase.auth.getUser(); 
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error('Authentication error: ' + userError.message);
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('Not authenticated - please log in again');
    }
    
    // Generate view token - MUST be a valid UUID format for the database column
    // Use existing token if editing, otherwise generate a new UUID
    // IMPORTANT: Check for both undefined AND empty string
    const existingToken = est.viewToken;
    const vt = (existingToken && existingToken.trim() !== '') ? existingToken : crypto.randomUUID();
    
    console.log('[addEstimate] Using viewToken (UUID):', vt);
    
    // Format line items - this is critical for JSONB storage
    const formattedItems = formatLineItemsForDb(est.lineItems);
    
    // If no line items, use empty array (not null, not undefined)
    const safeLineItems = formattedItems.length > 0 ? formattedItems : [];
    
    console.log('[addEstimate] Formatted line items:', JSON.stringify(safeLineItems));
    
    // Build the insert payload with all values as proper types - NO undefined, NO NaN
    const insertPayload = {
      user_id: user.id, 
      client_name: safeString(est.clientName).trim() || 'Unnamed Client', 
      client_email: safeString(est.clientEmail).trim(),
      client_phone: safeString(est.clientPhone).trim(), 
      project_name: safeString(est.projectName).trim() || 'Unnamed Project', 
      line_items: safeLineItems,
      tax_rate: safeNumber(est.taxRate), 
      deposit: safeNumber(est.deposit), 
      total: safeNumber(est.total),
      status: safeString(est.status || 'draft'), 
      view_token: vt
    };
    
    console.log('[addEstimate] Insert payload:', JSON.stringify(insertPayload, null, 2));
    
    // Validate the payload is valid JSON - this is a critical safety check
    try {
      const jsonString = JSON.stringify(insertPayload);
      JSON.parse(jsonString);
      console.log('[addEstimate] Payload validation: PASSED');
      console.log('[addEstimate] Payload JSON length:', jsonString.length);
    } catch (validationError) {
      console.error('[addEstimate] Payload validation: FAILED', validationError);
      throw new Error('Failed to create valid JSON payload for estimate');
    }
    
    const { data, error } = await supabase
      .from('estimates')
      .insert(insertPayload)
      .select()
      .single();

    
    if (error) {
      console.error('[addEstimate] Database error:', error);
      console.error('[addEstimate] Error code:', error.code);
      console.error('[addEstimate] Error message:', error.message);
      console.error('[addEstimate] Error details:', error.details);
      console.error('[addEstimate] Error hint:', error.hint);
      
      // Provide more helpful error message
      if (error.message?.includes('invalid input syntax for type json')) {
        throw new Error('Invalid data format. Please check your line items and try again.');
      }
      if (error.message?.includes('invalid input syntax for type uuid')) {
        throw new Error('Invalid estimate ID format. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to save estimate');
    }
    
    if (!data) {
      throw new Error('No data returned from database');
    }
    
    console.log('[addEstimate] Estimate saved successfully with ID:', data.id);
    console.log('[addEstimate] Saved view_token:', data.view_token);
    
    // ============================================================
    // AUTO-CREATE A JOB ENTRY FOR THIS ESTIMATE
    // This ensures the estimate appears in Dashboard and Jobs section
    // ============================================================

    try {
      const jobStatus = est.status === 'approved' ? 'approved' : 
                        est.status === 'sent' ? 'sent' : 'draft';
      
      const jobPayload: any = {
        user_id: user.id,
        client_name: safeString(est.clientName).trim() || 'Unnamed Client',
        project_type: safeString(est.projectName).trim() || 'Unnamed Project',
        status: jobStatus,
        total: safeNumber(est.total),
        date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
      };
      
      console.log('[addEstimate] Creating linked job:', JSON.stringify(jobPayload));
      
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert(jobPayload)
        .select()
        .single();
      
      if (jobError) {
        // Log but don't fail - the estimate was saved successfully
        console.warn('[addEstimate] Failed to create linked job:', jobError.message);
      } else if (jobData) {
        console.log('[addEstimate] Linked job created with ID:', jobData.id);
        // Update local jobs state
        setJobs(prev => [...prev, {
          id: jobData.id,
          clientName: jobPayload.client_name,
          projectType: jobPayload.project_type,
          status: jobPayload.status as Job['status'],
          total: jobPayload.total,
          date: jobPayload.date
        }]);
      }
    } catch (jobErr) {
      console.warn('[addEstimate] Error creating linked job:', jobErr);
      // Don't throw - estimate was saved successfully
    }
    // ============================================================

    
    await refreshEstimates(); 
    toast({ title: 'Estimate saved' }); 
    
    // CRITICAL: Return the ACTUAL viewToken that was saved to the database
    // This ensures the email link matches what's in the database
    return { id: data.id, viewToken: data.view_token };
  };








  const updateEstimate = async (id: string, u: Partial<Estimate>) => {
    const db: any = {};
    
    if (u.clientName !== undefined && u.clientName !== null) {
      db.client_name = safeString(u.clientName).trim();
    }
    if (u.clientEmail !== undefined && u.clientEmail !== null) {
      db.client_email = safeString(u.clientEmail).trim();
    }
    if (u.clientPhone !== undefined) {
      db.client_phone = safeString(u.clientPhone).trim();
    }
    if (u.projectName !== undefined && u.projectName !== null) {
      db.project_name = safeString(u.projectName).trim();
    }
    
    // Handle line_items with proper formatting
    if (u.lineItems !== undefined && u.lineItems !== null && Array.isArray(u.lineItems)) {
      db.line_items = formatLineItemsForDb(u.lineItems);
      console.log('[updateEstimate] Formatted line_items:', JSON.stringify(db.line_items));
    }
    
    if (u.taxRate !== undefined && u.taxRate !== null) {
      db.tax_rate = safeNumber(u.taxRate);
    }
    if (u.deposit !== undefined && u.deposit !== null) {
      db.deposit = safeNumber(u.deposit);
    }
    if (u.total !== undefined && u.total !== null) {
      db.total = safeNumber(u.total);
    }
    if (u.status !== undefined && u.status !== null) {
      db.status = safeString(u.status);
    }
    if (u.sentAt !== undefined && u.sentAt !== null) {
      db.sent_at = u.sentAt;
    }
    
    if (Object.keys(db).length === 0) {
      console.log('[updateEstimate] No fields to update');
      return;
    }
    
    console.log('[updateEstimate] Update payload:', JSON.stringify(db, null, 2));
    
    // Validate the payload is valid JSON
    try {
      JSON.parse(JSON.stringify(db));
      console.log('[updateEstimate] Payload validation: PASSED');
    } catch (validationError) {
      console.error('[updateEstimate] Payload validation: FAILED', validationError);
      throw new Error('Failed to create valid JSON payload for estimate update');
    }
    
    const { error } = await supabase.from('estimates').update(db).eq('id', id);
    
    if (error) {
      console.error('[updateEstimate] Database error:', error);
      console.error('[updateEstimate] Error code:', error.code);
      console.error('[updateEstimate] Error message:', error.message);
      throw new Error(error.message || 'Failed to update estimate');
    }
    
    await refreshEstimates(); 
    toast({ title: 'Estimate updated' });
  };

  const deleteEstimate = async (id: string) => { 
    await supabase.from('estimates').delete().eq('id', id); 
    setEstimates(p => p.filter(e => e.id !== id)); 
    toast({ title: 'Deleted' }); 
  };
  
  const addClient = async (c: Omit<Client, 'id'>) => { 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return; 
    const { data } = await supabase.from('clients').insert({ 
      user_id: user.id, 
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      total_jobs: c.totalJobs, 
      total_value: c.totalValue 
    }).select().single(); 
    if (data) setClients(p => [...p, { ...c, id: data.id }]); 
  };
  
  const updateClient = async (id: string, u: Partial<Client>) => { 
    const db: any = {};
    if (u.name !== undefined) db.name = u.name;
    if (u.email !== undefined) db.email = u.email;
    if (u.phone !== undefined) db.phone = u.phone;
    if (u.address !== undefined) db.address = u.address;
    if (u.totalJobs !== undefined) db.total_jobs = u.totalJobs;
    if (u.totalValue !== undefined) db.total_value = u.totalValue;
    await supabase.from('clients').update(db).eq('id', id); 
    setClients(p => p.map(c => c.id === id ? { ...c, ...u } : c)); 
  };
  
  const deleteClient = async (id: string) => { 
    await supabase.from('clients').delete().eq('id', id); 
    setClients(p => p.filter(c => c.id !== id)); 
  };
  
  const addJob = async (j: Omit<Job, 'id'>) => { 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return; 
    const { data } = await supabase.from('jobs').insert({ 
      user_id: user.id, 
      client_name: j.clientName, 
      project_type: j.projectType, 
      status: j.status, 
      total: j.total, 
      date: j.date 
    }).select().single(); 
    if (data) setJobs(p => [...p, { ...j, id: data.id }]); 
  };
  
  const updateJob = async (id: string, u: Partial<Job>) => { 
    const db: any = {}; 
    if (u.clientName) db.client_name = u.clientName; 
    if (u.projectType) db.project_type = u.projectType; 
    if (u.status) db.status = u.status; 
    if (u.total !== undefined) db.total = u.total; 
    if (u.date) db.date = u.date; 
    await supabase.from('jobs').update(db).eq('id', id); 
    setJobs(p => p.map(j => j.id === id ? { ...j, ...u } : j)); 
  };
  
  const deleteJob = async (id: string) => { 
    await supabase.from('jobs').delete().eq('id', id); 
    setJobs(p => p.filter(j => j.id !== id)); 
  };

  return (
    <DataContext.Provider value={{ 
      jobs, clients, estimates, loading, 
      addJob, updateJob, deleteJob, 
      addClient, updateClient, deleteClient, 
      addEstimate, updateEstimate, deleteEstimate, 
      refreshEstimates 
    }}>
      {children}
    </DataContext.Provider>
  );
};
