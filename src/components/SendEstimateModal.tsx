import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  estimateData?: any;
  estimate?: any;
  onClose: () => void;
  onSuccess?: () => void;
}


export const SendEstimateModal: React.FC<Props> = ({ estimateData, estimate, onClose, onSuccess }) => {
  const data = estimateData || estimate;
  const { refreshEstimates } = useData();
  const { profile } = useProfile();
  const [clientEmail, setClientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { 
      isMountedRef.current = false;
    };
  }, []);

  const generateAndSaveViewToken = async () => {
    if (!data?.id) return;
    
    setIsGeneratingToken(true);
    try {
      const newToken = crypto.randomUUID();
      const { error } = await supabase
        .from('estimates')
        .update({ view_token: newToken })
        .eq('id', data.id);
      
      if (!error && isMountedRef.current) {
        setViewToken(newToken);
        refreshEstimates().catch(() => {});
      }
    } catch (err) {
      console.error('Token generation error:', err);
    } finally {
      if (isMountedRef.current) setIsGeneratingToken(false);
    }
  };

  useEffect(() => {
    if (data) {
      setClientEmail(data.clientEmail || data.client_email || '');
      const token = data.viewToken || data.view_token;
      if (token && typeof token === 'string' && token.trim()) {
        setViewToken(token);
      } else {
        generateAndSaveViewToken();
      }
    }
  }, [data]);

  if (!data) return null;

  const projectName = data.projectName || data.project_name || 'Project';
  const clientName = data.clientName || data.client_name || 'Client';
  const totalAmount = Number(data.total) || 0;
  const estimateId = data.id;

  const handleSend = async () => {
    if (!clientEmail.trim()) { 
      toast({ title: 'Error', description: 'Email address is required', variant: 'destructive' }); 
      return; 
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      toast({ title: 'Error', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    if (!viewToken) {
      toast({ title: 'Error', description: 'Unable to generate estimate link. Please try again.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    setSendStatus('sending');
    setErrorMessage(null);

    // Generate the estimate URL
    const estimateUrl = `${window.location.origin}/estimate/${viewToken}`;
    const contractorName = profile?.full_name || profile?.company_name || 'Your Contractor';

    try {
      // Prepare the request body for send-email edge function
      const requestBody = {
        to: clientEmail.trim(),
        templateType: 'estimate_sent',
        data: {
          clientName: clientName,
          projectName: projectName,
          amount: totalAmount.toFixed(2),
          estimateUrl: estimateUrl,
          contractorName: contractorName
        }
      };

      console.log('[SendEstimate] Sending request via supabase.functions.invoke:', requestBody);

      // Use supabase.functions.invoke instead of fetch
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: requestBody
      });

      console.log('[SendEstimate] Response:', { result, error });

      if (!isMountedRef.current) return;

      // Check for errors
      if (error) {
        const errorMsg = error.message || 'Failed to send email';
        console.error('[SendEstimate] Edge function error:', errorMsg);
        setErrorMessage(errorMsg);
        setSendStatus('error');
        setIsSending(false);
        toast({ 
          title: 'Failed to Send', 
          description: errorMsg, 
          variant: 'destructive' 
        });
        return;
      }

      if (result?.success === false || result?.error) {
        const errorMsg = result?.error || 'Email sending failed';
        console.error('[SendEstimate] Edge function returned error:', errorMsg);
        setErrorMessage(errorMsg);
        setSendStatus('error');
        setIsSending(false);
        toast({ 
          title: 'Failed to Send', 
          description: errorMsg, 
          variant: 'destructive' 
        });
        return;
      }

      // Success!
      console.log('[SendEstimate] Email sent successfully!', result);
      setSendStatus('success');
      setIsSending(false);
      
      toast({ 
        title: 'Estimate Sent!', 
        description: `Email sent to ${clientEmail.trim()}`,
        duration: 5000
      });

      // Update estimate status in database
      if (estimateId) {
        try {
          await supabase
            .from('estimates')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString(), 
              client_email: clientEmail.trim() 
            })
            .eq('id', estimateId);
          
          refreshEstimates().catch(() => {});
        } catch (updateErr) {
          console.error('[SendEstimate] Failed to update estimate status:', updateErr);
        }
      }

      onSuccess?.();
      
      // Close modal after a short delay to show success state
      setTimeout(() => {
        if (isMountedRef.current) {
          onClose();
        }
      }, 1000);
      
    } catch (err: any) {
      console.error('[SendEstimate] Exception:', err);
      
      if (!isMountedRef.current) return;
      
      setIsSending(false);

      const errorMsg = err?.message || 'An unexpected error occurred.';
      setErrorMessage(errorMsg);
      setSendStatus('error');
      toast({ 
        title: 'Error', 
        description: errorMsg, 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-3">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        <div className="bg-green-600 text-white p-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-lg md:text-xl font-bold">Send Estimate</h2>
          <button onClick={onClose} className="p-2 hover:bg-green-700 rounded-lg" disabled={isSending}>
            <X size={24} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {isGeneratingToken && (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-700">
              <Loader2 size={20} className="animate-spin" />
              <span>Preparing estimate...</span>
            </div>
          )}
          
          {sendStatus === 'success' && (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-50 text-green-700 border border-green-200">
              <CheckCircle size={22} />
              <span className="font-semibold">Email sent successfully!</span>
            </div>
          )}
          
          {sendStatus === 'error' && errorMessage && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
              <AlertCircle size={22} className="flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Failed to send email</span>
                <span className="text-sm">{errorMessage}</span>
              </div>
            </div>
          )}
          
          {sendStatus !== 'success' && (
            <>
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-green-500 bg-green-50 text-green-700">
                <Mail size={22} /><span className="font-semibold">Send via Email</span>
              </div>
              
              <div>
                <label htmlFor="clientEmail" className="block text-sm font-semibold mb-2 text-gray-700">Client Email *</label>
                <input 
                  id="clientEmail"
                  value={clientEmail} 
                  onChange={(e) => setClientEmail(e.target.value)} 
                  className="w-full border-2 rounded-xl px-4 py-4 text-base focus:border-green-500 focus:outline-none" 
                  type="email" 
                  placeholder="client@email.com"
                  disabled={isSending}
                />
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Project</p>
                <p className="font-bold text-lg text-gray-900 mb-3">{projectName}</p>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-blue-600">${totalAmount.toFixed(2)}</p>
              </div>
              
              {!viewToken && !isGeneratingToken && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm">
                  Warning: Unable to generate estimate link. Please close and try again.
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose} 
                  disabled={isSending} 
                  className="px-4 py-4 border-2 rounded-xl hover:bg-gray-50 font-semibold text-base text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSend} 
                  disabled={isSending || !viewToken || isGeneratingToken} 
                  className="px-4 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold text-base flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> 
                      Sending...
                    </>
                  ) : (
                    'Send Estimate'
                  )}
                </button>
              </div>
            </>
          )}
          
          {sendStatus === 'success' && (
            <div className="pt-2">
              <button 
                type="button"
                onClick={onClose} 
                className="w-full px-4 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-base"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
