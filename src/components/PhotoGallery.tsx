import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { X, Trash2, Expand, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface Photo {
  id: string;
  fileUrl: string;
  caption?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoDeleted?: (photoId: string) => void;
  readOnly?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onPhotoDeleted, readOnly = false }) => {
  const { toast } = useToast();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    setDeleting(photoId);
    try {
      const { error } = await supabase.from('project_photos').delete().eq('id', photoId);
      if (error) throw error;
      onPhotoDeleted?.(photoId);
      toast({ title: 'Photo deleted' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return;
    if (direction === 'prev') setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1);
    else setLightboxIndex(lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0);
  };

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative aspect-square group">
            <img src={photo.fileUrl} alt={photo.caption || 'Project photo'} 
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              onClick={() => setLightboxIndex(index)} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button variant="ghost" size="sm" className="text-white bg-black/50 p-1 h-auto" onClick={() => setLightboxIndex(index)}>
                <Expand className="w-4 h-4" />
              </Button>
            </div>
            {!readOnly && (
              <button onClick={() => handleDelete(photo.id)} disabled={deleting === photo.id}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightboxIndex(null)}><X className="w-8 h-8" /></button>
          <button className="absolute left-4 text-white p-2" onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}><ChevronLeft className="w-10 h-10" /></button>
          <img src={photos[lightboxIndex].fileUrl} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 text-white p-2" onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}><ChevronRight className="w-10 h-10" /></button>
          <div className="absolute bottom-4 text-white text-sm">{lightboxIndex + 1} / {photos.length}</div>
        </div>
      )}
    </>
  );
};
