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
  const baseUrl = window.location.origin;
  const estimateUrl = `${baseUrl}/estimate/${safeString(params.viewToken)}`;
  
  console.log('[sendEstimateEmail] Preparing to send:', {
    to: params.clientEmail,
    estimateUrl
  });
  
  // Call send-email directly with the estimate template
  return invokeEdgeFunction('send-email', {
    to: safeString(params.clientEmail).trim(),
    templateType: 'estimate_sent',
    data: {
      clientName: safeString(params.estimateData?.clientName || 'Valued Customer'),
      projectName: safeString(params.estimateData?.projectName || 'Project'),
      amount: safeNumber(params.estimateData?.total).toFixed(2),
      estimateUrl: estimateUrl,
      contractorName: safeString(params.contractorName || 'Your Contractor')
    }
  });
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
  const baseUrl = window.location.origin;
  const invoiceUrl = params.invoiceData?.viewToken 
    ? `${baseUrl}/invoice/${safeString(params.invoiceData.viewToken)}`
    : '';
  
  console.log('[sendInvoiceEmail] Preparing to send:', {
    to: params.clientEmail,
    invoiceUrl
  });
  
  // Call send-email directly with the invoice template
  return invokeEdgeFunction('send-email', {
    to: safeString(params.clientEmail).trim(),
    templateType: 'invoice_sent',
    data: {
      clientName: safeString(params.invoiceData?.clientName || 'Client'),
      projectName: safeString(params.invoiceData?.projectName || 'Project'),
      amount: safeNumber(params.invoiceData?.amountDue).toFixed(2),
      invoiceNumber: safeString(params.invoiceData?.invoiceNumber),
      invoiceUrl: invoiceUrl,
      dueDate: params.invoiceData?.dueDate || ''
    }
  });
}
