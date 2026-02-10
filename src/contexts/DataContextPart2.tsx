// This file is imported by DataContext.tsx - contains CRUD operations

import { supabase } from '@/lib/supabase';
import { Estimate, LineItem } from './DataContext';

// Helper to prepare estimate for DB insert/update
export const prepareEstimateForDb = (estimate: Partial<Estimate>) => {
  const dbData: any = {};
  
  if (estimate.clientName !== undefined) dbData.client_name = String(estimate.clientName).trim();
  if (estimate.clientEmail !== undefined) dbData.client_email = String(estimate.clientEmail).trim();
  if (estimate.clientPhone !== undefined) dbData.client_phone = String(estimate.clientPhone).trim();
  if (estimate.projectName !== undefined) dbData.project_name = String(estimate.projectName).trim();
  
  if (estimate.lineItems !== undefined) {
    dbData.line_items = estimate.lineItems.map((item: LineItem) => ({
      id: String(item.id || Date.now()),
      description: String(item.description || ''),
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
      total: Number(item.total) || (Number(item.quantity) || 0) * (Number(item.rate) || 0)
    }));
  }
  
  // Store numeric values as numbers, not strings
  if (estimate.taxRate !== undefined) dbData.tax_rate = Number(estimate.taxRate) || 0;
  if (estimate.deposit !== undefined) dbData.deposit = Number(estimate.deposit) || 0;
  if (estimate.total !== undefined) dbData.total = Number(estimate.total) || 0;
  if (estimate.status) dbData.status = estimate.status;
  if (estimate.sentAt) dbData.sent_at = estimate.sentAt;
  if (estimate.viewToken) dbData.view_token = estimate.viewToken;
  
  return dbData;
};

// Generate a secure view token
export const generateViewToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
};
