import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/components/ui/use-toast';
import { X, Send, Camera, Upload, Loader2, Copy, Check, Trash2, Mail, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface Photo {
  id: string;
  fileUrl: string;
  caption: string;
}

type SendStep = 'compose' | 'choose' | 'email' | 'text';

export const CreateUpdateModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { profile } = useProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<SendStep>('compose');
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const ensureUpdateRecord = async (): Promise<{ id: string; token: string }> => {
    const newToken = crypto.randomUUID();
    if (updateId && viewToken) {
      // Update name/description in case they changed since photos were uploaded
      await supabase.from('job_updates').update({
        name: name.trim() || 'Project Update',
        description: description.trim() || null,
        view_token: newToken,
        sent_at: new Date().toISOString(),
      }).eq('id', updateId);
      setViewToken(newToken);
      return { id: updateId, token: newToken };
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('job_updates')
      .insert({
        user_id: user.id,
        name: name.trim() || 'Project Update',
        description: description.trim() || null,
        view_token: newToken,
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    setUpdateId(data.id);
    setViewToken(newToken);
    return { id: data.id, token: newToken };
  };

  const ensureUpdateRecordForUpload = async (): Promise<string> => {
    if (updateId) return updateId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('job_updates')
      .insert({ user_id: user.id, name: name.trim() || 'Project Update', description: description.trim() || null })
      .select('id')
      .single();
    if (error) throw error;
    setUpdateId(data.id);
    return data.id;
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const uid = await ensureUpdateRecordForUpload();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('project-photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(fileName);
      const { data, error } = await supabase.from('project_photos').insert({ user_id: user.id, update_id: uid, file_path: fileName, file_url: publicUrl }).select().single();
      if (error) throw error;
      const p = { id: data.id, fileUrl: publicUrl, caption: '' };
      setPhotos(prev => [...prev, p]);
      setCaptions(prev => ({ ...prev, [p.id]: '' }));
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => uploadPhoto(file));
    e.target.value = '';
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase.from('project_photos').delete().eq('id', photoId);
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setCaptions(prev => { const n = { ...prev }; delete n[photoId]; return n; });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleCaptionSave = async (photoId: string, caption: string) => {
    try { await supabase.from('project_photos').update({ caption }).eq('id', photoId); }
    catch (e) { console.error(e); }
  };

  const handleProceedToSend = () => {
    if (!name.trim()) {
      toast({ title: 'Add a name', description: 'Give this update a title before sending.', variant: 'destructive' });
      return;
    }
    setStep('choose');
  };

  const handleSendEmail = async () => {
    if (!clientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const { token } = await ensureUpdateRecord();
      const updateUrl = `${window.location.origin}/view-update/${token}`;
      const contractorName = profile?.full_name || profile?.company_name || 'Your Contractor';
      const { data: result, error } = await supabase.functions.invoke('send-update-email', {
        body: { to: clientEmail.trim(), contractorName, updateName: name.trim(), message: description.trim() || null, updateUrl },
      });
      if (error || result?.success === false) {
        const msg = error?.message || result?.error || 'Failed to send email';
        setSendError(msg);
        toast({ title: 'Failed to send', description: msg, variant: 'destructive' });
        return;
      }
      setSendSuccess(true);
      toast({ title: 'Update Sent!', description: `Email sent to ${clientEmail.trim()}` });
    } catch (e: any) {
      const msg = e.message || 'An unexpected error occurred';
      setSendError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const { token } = await ensureUpdateRecord();
      const url = `${window.location.origin}/view-update/${token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({ title: 'Link Copied!', description: 'Open your texts and paste it to your client.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-3">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[92vh] overflow-auto shadow-2xl">
        <div className="text-white p-4 flex justify-between items-center rounded-t-xl" style={{ background: '#1c1c1e' }}>
          <h2 className="text-lg font-bold flex items-center gap-2"><Send className="w-5 h-5" /> Create Update</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg" disabled={sending}>
            <X size={22} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* STEP: compose */}
          {step === 'compose' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Update Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Week 2 Progress, Final Walkthrough..."
                  className="w-full border-2 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Message to Client <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Demo is complete and rough-in is done. Here's a look at where things stand."
                  className="w-full border-2 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Photos</label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFile} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
                <div className="flex gap-2 mb-3">
                  <button onClick={() => cameraInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Camera
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Gallery
                  </button>
                </div>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map(photo => (
                      <div key={photo.id} className="space-y-1.5">
                        <div className="relative aspect-square group">
                          <img src={photo.fileUrl} alt={captions[photo.id] || 'Photo'} className="w-full h-full object-cover rounded-lg border border-gray-100" />
                          <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          value={captions[photo.id] || ''}
                          onChange={e => setCaptions(prev => ({ ...prev, [photo.id]: e.target.value }))}
                          onBlur={e => handleCaptionSave(photo.id, e.target.value)}
                          placeholder="Add a label..."
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 bg-gray-50"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-5 bg-gray-50 rounded-xl">No photos yet — tap Camera or Gallery above to add some.</p>
                )}
              </div>

              <Button onClick={handleProceedToSend} disabled={!name.trim()} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-base">
                <Send className="w-5 h-5 mr-2" /> Send Update
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">Cancel</Button>
            </>
          )}

          {/* STEP: choose email or text */}
          {step === 'choose' && (
            <>
              <p className="text-center text-gray-600 font-medium">How would you like to send this?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep('email')}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
                >
                  <Mail size={32} className="text-green-600" />
                  <span className="font-bold text-gray-800">Email</span>
                  <span className="text-xs text-gray-500 text-center">We'll send it directly to your client</span>
                </button>
                <button
                  onClick={() => setStep('text')}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <MessageSquare size={32} className="text-blue-600" />
                  <span className="font-bold text-gray-800">Text Message</span>
                  <span className="text-xs text-gray-500 text-center">Copy the link and paste into your texts</span>
                </button>
              </div>
              <Button onClick={() => setStep('compose')} variant="outline" className="w-full">← Back</Button>
            </>
          )}

          {/* STEP: email */}
          {step === 'email' && !sendSuccess && (
            <>
              <button onClick={() => setStep('choose')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
              {sendError && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span className="text-sm">{sendError}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Client's Email Address</label>
                <input
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full border-2 rounded-xl px-4 py-4 text-base focus:border-green-500 focus:outline-none"
                  type="email"
                  placeholder="client@email.com"
                  disabled={sending}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep('choose')} disabled={sending} className="px-4 py-4 border-2 rounded-xl hover:bg-gray-50 font-semibold text-base text-gray-700 disabled:opacity-50">Cancel</button>
                <button onClick={handleSendEmail} disabled={sending} className="px-4 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold text-base flex items-center justify-center gap-2">
                  {sending ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : 'Send Update'}
                </button>
              </div>
            </>
          )}

          {/* Email success */}
          {step === 'email' && sendSuccess && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-3" />
              <p className="font-bold text-xl text-gray-900">Update Sent!</p>
              <p className="text-gray-500 mt-1">Your client will receive it shortly.</p>
              <Button onClick={onCreated} className="mt-4 w-full py-4 bg-green-600 hover:bg-green-700 text-base">Done</Button>
            </div>
          )}

          {/* STEP: text / copy link */}
          {step === 'text' && (
            <>
              <button onClick={() => setStep('choose')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
              <div className="bg-blue-50 rounded-xl p-5 text-center space-y-4">
                <MessageSquare size={40} className="text-blue-600 mx-auto" />
                <div>
                  <p className="font-bold text-gray-900 text-lg">Send via Text</p>
                  <p className="text-gray-600 text-sm mt-1">Tap the button below to copy the update link, then open your text app and paste it to your client.</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  disabled={sending}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-base flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : linkCopied ? <><Check size={20} /> Link Copied!</> : <><Copy size={20} /> Copy Update Link</>}
                </button>
                {linkCopied && <p className="text-green-600 font-semibold text-sm">Now open your texts and paste the link!</p>}
              </div>
              <Button onClick={linkCopied ? onCreated : () => setStep('choose')} variant="outline" className="w-full">
                {linkCopied ? 'Done' : 'Cancel'}
              </Button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
