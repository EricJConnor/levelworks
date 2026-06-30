import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { X, Send, Camera, Upload, Loader2, Copy, Check, Trash2 } from 'lucide-react';
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

export const CreateUpdateModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const ensureUpdateRecord = async (): Promise<string> => {
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
      const uid = await ensureUpdateRecord();

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('project-photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(fileName);
      const { data, error } = await supabase.from('project_photos').insert({
        user_id: user.id,
        update_id: uid,
        file_path: fileName,
        file_url: publicUrl,
      }).select().single();
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
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file);
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

  const handleGenerate = async () => {
    if (!name.trim()) {
      toast({ title: 'Add a name', description: 'Give this update a title before sending.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const newToken = crypto.randomUUID();
      const uid = await ensureUpdateRecord();
      const { error } = await supabase
        .from('job_updates')
        .update({ name: name.trim(), description: description.trim() || null, view_token: newToken, sent_at: new Date().toISOString() })
        .eq('id', uid);
      if (error) throw error;

      const url = `${window.location.origin}/view-update/${newToken}`;
      setUpdateUrl(url);
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied!', description: 'Paste it into a text or email to your client.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Could not create the link.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-3">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[92vh] overflow-auto shadow-2xl">
        <div className="text-white p-4 flex justify-between items-center rounded-t-xl" style={{ background: '#1c1c1e' }}>
          <h2 className="text-lg font-bold flex items-center gap-2"><Send className="w-5 h-5" /> Create Update</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg" disabled={generating}>
            <X size={22} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Update Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Week 2 Progress, Final Walkthrough..."
              className="w-full border-2 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
              disabled={generating}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Message to Client <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Demo is complete and rough-in is done. Here's a look at where things stand."
              className="w-full border-2 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              disabled={generating}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Photos</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading || generating}
                className="flex items-center gap-1.5 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || generating}
                className="flex items-center gap-1.5 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Gallery
              </button>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <div key={photo.id} className="space-y-1.5">
                    <div className="relative aspect-square group">
                      <img src={photo.fileUrl} alt={captions[photo.id] || 'Photo'} className="w-full h-full object-cover rounded-lg border border-gray-100" />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                      >
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
              <p className="text-sm text-gray-400 text-center py-5 bg-gray-50 rounded-xl">
                No photos yet — tap Camera or Gallery above to add some.
              </p>
            )}
          </div>

          {/* Generate */}
          {updateUrl ? (
            <div className="bg-blue-50 rounded-xl p-4 text-center space-y-2">
              <Check className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="font-semibold text-gray-900">Link copied!</p>
              <p className="text-sm text-gray-600">Open your texts or email and paste it to your client.</p>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={generating || !name.trim()} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-base">
              {generating
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Preparing...</>
                : <><Copy className="w-5 h-5 mr-2" /> Generate &amp; Copy Link</>}
            </Button>
          )}

          <Button onClick={updateUrl ? onCreated : onClose} variant="outline" className="w-full">
            {updateUrl ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );
};
