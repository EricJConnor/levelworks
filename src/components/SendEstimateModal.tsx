import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, MessageSquare, Loader2, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';

interface Props {
  estimateData?: any;
  estimate?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

type SendMethod = null | 'email' | 'text';

export const SendEstimateModal: React.FC<Props> = ({ estimateData, estimate, onClose, onSuccess }) => {
  const data = estimateData || estimate;
  const { refreshEstimates } = useData();
  const { profile } = useProfile();
  const [sendMethod, setSendMethod] = useState<SendMethod>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
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
  const estimateUrl = viewToken ? `${window.location.origin}/view-estimate/${viewToken}` : '';

  const handleCopyLink = async () => {
    if (!estimateUrl) return;
    try {
      await navigator.clipboard.writeText(estimateUrl);
      setLinkCopied(true);
      toast({ title: 'Link Copied!', description: 'Paste it into your text message app.' });
      if (estimateId) {
        await supabase
          .from('estimates')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', estimateId);
        refreshEstimates().catch(() => {});
      }
      setTimeout(() => { if (isMountedRef.current) setLinkCopied(false); }, 3000);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not copy link. Please try again.', variant: 'destructive' });
    }
  };

  const handleSendEmail = async () => {
    if (!clientEmail.trim()) {
      toast({ title: 'Error', description: 'Please enter the client\'s email address', variant: 'destructive' });
      return;
    }
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

    const contractorName = profile?.full_name || profile?.company_name || 'Your Contractor';

    try {
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: clientEmail.trim(),
          templateType: 'estimate_sent',
          data: { clientName, projectName, amount: totalAmount.toFixed(2), estimateUrl, contractorName }
        }
      });

      if (!isMountedRef.current) return;

      if (error || result?.success === false) {
        const errorMsg = error?.message || result?.error || 'Failed to send email';
        setErrorMessage(errorMsg);
        setSendStatus('error');
        setIsSending(false);
        toast({ title: 'Failed to Send', description: errorMsg, variant: 'destructive' });
        return;
      }

      setSendStatus('success');
      setIsSending(false);
      toast({ title: 'Estimate Sent!', description: `Email sent to ${clientEmail.trim()}`, duration: 5000 });

      if (estimateId) {
        await supabase
          .from('estimates')
          .update({ status: 'sent', sent_at: new Date().toISOString(), client_email: clientEmail.trim() })
          .eq('id', estimateId);
        refreshEstimates().catch(() => {});
      }

      onSuccess?.();
      setTimeout(() => { if (isMountedRef.current) onClose(); }, 1500);

    } catch (err: any) {
      if (!isMountedRef.current) return;
      setIsSending(false);
      const errorMsg = err?.message || 'An unexpected error occurred.';
      setErrorMessage(errorMsg);
      setSendStatus('error');
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
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

        <div className="p-5 space-y-4">

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Project</p>
            <p className="font-bold text-gray-900 text-lg">{projectName}</p>
            <p className="text-sm text-gray-500 mt-2 mb-1">Client</p>
            <p className="font-semibold text-gray-700">{clientName}</p>
          </div>

          {isGeneratingToken && (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-700">
              <Loader2 size={20} className="animate-spin" />
              <span>Preparing estimate link...</span>
            </div>
          )}

          {!sendMethod && !isGeneratingToken && (
            <>
              <p className="text-center text-gray-600 font-medium">How would you like to send this?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSendMethod('email')}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
                >
                  <Mail size={32} className="text-green-600" />
                  <span className="font-bold text-gray-800">Email</span>
                  <span className="text-xs text-gray-500 text-center">We'll send it directly to your client</span>
                </button>
                <button
                  onClick={() => setSendMethod('text')}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <MessageSquare size={32} className="text-blue-600" />
                  <span className="font-bold text-gray-800">Text Message</span>
                  <span className="text-xs text-gray-500 text-center">Copy the link and paste into your texts</span>
                </button>
              </div>
            </>
          )}

          {sendMethod === 'email' && sendStatus !== 'success' && (
            <>
              <button onClick={() => setSendMethod(null)} className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>

              {sendStatus === 'error' && errorMessage && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Client's Email Address</label>
                <input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full border-2 rounded-xl px-4 py-4 text-base focus:border-green-500 focus:outline-none"
                  type="email"
                  placeholder="client@email.com"
                  disabled={isSending}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setSendMethod(null)}
                  disabled={isSending}
                  className="px-4 py-4 border-2 rounded-xl hover:bg-gray-50 font-semibold text-base text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || !viewToken || isGeneratingToken}
                  className="px-4 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold text-base flex items-center justify-center gap-2"
                >
                  {isSending ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : 'Send Estimate'}
                </button>
              </div>
            </>
          )}

          {sendStatus === 'success' && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-3" />
              <p className="font-bold text-xl text-gray-900">Estimate Sent!</p>
              <p className="text-gray-500 mt-1">Your client will receive it shortly.</p>
              <button onClick={onClose} className="mt-4 w-full px-4 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-base">
                Done
              </button>
            </div>
          )}

          {sendMethod === 'text' && (
            <>
              <button onClick={() => setSendMethod(null)} className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>

              <div className="bg-blue-50 rounded-xl p-5 text-center space-y-4">
                <MessageSquare size={40} className="text-blue-600 mx-auto" />
                <div>
                  <p className="font-bold text-gray-900 text-lg">Send via Text</p>
                  <p className="text-gray-600 text-sm mt-1">Tap the button below to copy the estimate link, then open your text message app and paste it to your client.</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  disabled={!viewToken || isGeneratingToken}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-base flex items-center justify-center gap-2"
                >
                  {linkCopied ? <><Check size={20} /> Link Copied!</> : <><Copy size={20} /> Copy Estimate Link</>}
                </button>
                {linkCopied && (
                  <p className="text-green-600 font-semibold text-sm">Now open your texts and paste the link!</p>
                )}
              </div>

              <button onClick={onClose} className="w-full px-4 py-3 border-2 rounded-xl hover:bg-gray-50 font-semibold text-base text-gray-700">
                Done
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
