// Edge Functions Helper - Using supabase.functions.invoke
import { supabase } from './supabase';

export interface EdgeFunctionResult<T = any> {
  data: T | null;
  error: Error | null;
}

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Invoke edge function using supabase.functions.invoke
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  timeoutMs: number = 30000
): Promise<EdgeFunctionResult<T>> {
  console.log(`[EdgeFunction] Calling: ${functionName}`, body);
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    });

    // Create the invoke promise
    const invokePromise = supabase.functions.invoke(functionName, {
      body: body
    });

    // Race between timeout and invoke
    const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;
    
    console.log(`[EdgeFunction] Response from ${functionName}:`, { data, error });
    
    if (error) {
      console.error(`[EdgeFunction] Error from ${functionName}:`, error);
      return { data: null, error: new Error(error.message || 'Edge function error') };
    }
    
    // Check for error in response data
    if (data?.success === false) {
      return { data, error: new Error(data?.error || 'Operation failed') };
    }
    
    return { data, error: null };
    
  } catch (err: any) {
    if (err.message === 'Request timed out') {
      console.error(`[EdgeFunction] Timeout in ${functionName}`);
      return { data: null, error: new Error('Request timed out') };
    }
    
    console.error(`[EdgeFunction] Exception in ${functionName}:`, err);
    return { data: null, error: new Error(err?.message || 'Request failed') };
  }
}

/**
 * Estimate and invoice emails go through /api/send-document on Vercel, which
 * sends from "<Company> via LevelWorks" with the company name in the subject
 * and replies to the contractor. The old edge-function template was never
 * given the company name, so clients got a nameless "you have a new invoice".
 */
async function sendDocument(type: 'estimate' | 'invoice', id: string, to?: string): Promise<EdgeFunctionResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { data: null, error: new Error('Please sign in again and resend.') };
    const r = await fetch('/api/send-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type, id, to: safeString(to).trim() || undefined }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { data: d, error: new Error(d?.message || d?.error || 'The email did not go out.') };
    return { data: d, error: null };
  } catch (e: any) {
    return { data: null, error: new Error(e?.message || 'The email did not go out.') };
  }
}

export async function sendEstimateEmail(params: {
  estimateId: string;
  clientEmail: string;
  viewToken: string;
  estimateData: { clientName: string; projectName: string; total: number; items?: any[] };
  contractorName?: string;
  contractorEmail?: string;
  contractorPhone?: string;
  message?: string;
}): Promise<EdgeFunctionResult> {
  return sendDocument('estimate', params.estimateId, params.clientEmail);
}

export async function sendInvoiceEmail(params: {
  invoiceId: string;
  clientEmail: string;
  invoiceData: {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    projectName: string;
    total: number;
    amountDue: number;
    issueDate: string;
    dueDate?: string;
    notes?: string;
    viewToken?: string;
  };
  userId?: string;
}): Promise<EdgeFunctionResult> {
  return sendDocument('invoice', params.invoiceId, params.clientEmail);
}
