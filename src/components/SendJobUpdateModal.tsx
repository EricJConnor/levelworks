import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { X, Camera, Loader2, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  jobId: string;
  clientName: string;
  photoCount: number;
  onClose: () => void;
}

export const SendJobUpdateModal: React.FC<Props> = ({ jobId, clientName, photoCount, onClose }) => {
  const [summary, setSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  const handleGenerateAndCopy = async () => {
    setGenerating(true);
    try {
      const newToken = crypto.randomUUID();
      const { error } = await supabase
        .from('jobs')
        .update({ view_token: newToken, update_summary: summary.trim() || null, update_sent_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;

      const url = `${window.location.origin}/view-job/${newToken}`;
      setUpdateUrl(url);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({ title: 'Link Copied!', description: 'Paste it into a text or email to your client.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not create the update link.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-3">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        <div className="text-white p-4 flex justify-between items-center rounded-t-xl" style={{ background: '#1c1c1e' }}>
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><Camera className="w-5 h-5" /> Send Photo Update</h2>
          <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-lg" disabled={generating}>
            <X size={24} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Client</p>
            <p className="font-semibold text-gray-700">{clientName}</p>
            <p className="text-sm text-gray-500 mt-2">{photoCount} photo{photoCount === 1 ? '' : 's'} will be included</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Message to Client (optional)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border-2 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
              rows={4}
              placeholder="e.g. Demo and rough-in are complete. Here's a look at progress so far."
              disabled={generating}
            />
          </div>

          {updateUrl ? (
            <div className="bg-blue-50 rounded-xl p-4 text-center space-y-2">
              <Check className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="font-semibold text-gray-900">Link copied!</p>
              <p className="text-sm text-gray-600">Now open your texts or email and paste it to your client.</p>
            </div>
          ) : (
            <Button onClick={handleGenerateAndCopy} disabled={generating} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-base">
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Preparing...</> : <><Copy className="w-5 h-5 mr-2" /> Generate & Copy Link</>}
            </Button>
          )}

          <Button onClick={onClose} variant="outline" className="w-full">Done</Button>
        </div>
      </div>
    </div>
  );
};
