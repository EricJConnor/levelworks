import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface PhotoUploadProps {
  estimateId?: string;
  jobId?: string;
  onPhotoUploaded: (photo: { id: string; fileUrl: string; caption?: string }) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ estimateId, jobId, onPhotoUploaded }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      const { data, error } = await supabase.from('project_photos').insert({
        user_id: user.id,
        estimate_id: estimateId || null,
        job_id: jobId || null,
        file_path: fileName,
        file_url: publicUrl
      }).select().single();

      if (error) throw error;

      onPhotoUploaded({ id: data.id, fileUrl: publicUrl, caption: data.caption });
      toast({ title: 'Photo uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file);
    e.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
      
      <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        <span className="hidden sm:inline">Camera</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <span className="hidden sm:inline">Gallery</span>
      </Button>
    </div>
  );
};
