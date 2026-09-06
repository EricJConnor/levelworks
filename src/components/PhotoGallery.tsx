import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { X, Trash2, Expand, ChevronLeft, ChevronRight } from 'lucide-react';

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
      <div className="pg-grid">
        {photos.map((photo, index) => (
          <div key={photo.id} className="pg-cell">
            <img src={photo.fileUrl} alt={photo.caption || 'Project photo'} onClick={() => setLightboxIndex(index)} />
            <button className="pg-zoom" onClick={() => setLightboxIndex(index)} aria-label="View larger"><Expand size={14} /></button>
            {!readOnly && (
              <button className="pg-del" onClick={() => handleDelete(photo.id)} disabled={deleting === photo.id} aria-label="Delete photo">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .pg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 10px; }
        .pg-cell { position: relative; aspect-ratio: 1; }
        .pg-cell img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--lv-r); border: 1px solid var(--lv-line); cursor: pointer; display: block; }
        .pg-zoom, .pg-del {
          position: absolute; width: 26px; height: 26px; border: 0; border-radius: 50%;
          display: grid; place-items: center; cursor: pointer; color: #fff;
          background: rgba(11,18,32,.62); opacity: 0; transition: opacity .18s var(--lv-ease), background .18s var(--lv-ease);
        }
        .pg-zoom { bottom: 6px; right: 6px; }
        .pg-del { top: 6px; right: 6px; }
        .pg-del:hover { background: var(--lv-red); }
        .pg-cell:hover .pg-zoom, .pg-cell:hover .pg-del, .pg-cell:focus-within .pg-zoom, .pg-cell:focus-within .pg-del { opacity: 1; }
        @media (hover: none) { .pg-zoom, .pg-del { opacity: 1; } }
      `}</style>

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
