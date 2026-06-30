import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Loader2, FileText, Send } from 'lucide-react';

interface UpdateDetails { id: string; name?: string; description?: string; sent_at?: string; created_at?: string; }
interface Branding { company_name?: string; profile_photo_url?: string; }
interface Photo { id: string; fileUrl: string; caption?: string; }

export default function PublicUpdateView() {
  const { token } = useParams();
  const [update, setUpdate] = useState<UpdateDetails | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, [token]);

  const fetchJson = async (path: string) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) return null;
    return res.json();
  };

  const load = async () => {
    if (!token) { setError('No link provided'); setLoading(false); return; }
    try {
      const rows = await fetchJson(`public_update_details?view_token=eq.${encodeURIComponent(token)}&select=*`);
      if (!rows || rows.length === 0) {
        setError('Update not found. The link may have expired or is invalid.');
        setLoading(false);
        return;
      }
      setUpdate(rows[0]);

      const [brandingRows, photoRows] = await Promise.all([
        fetchJson(`public_update_branding?view_token=eq.${encodeURIComponent(token)}&select=company_name,profile_photo_url`),
        fetchJson(`public_update_photos?view_token=eq.${encodeURIComponent(token)}&select=id,file_url,caption`),
      ]);

      if (brandingRows && brandingRows.length > 0) setBranding(brandingRows[0]);
      if (photoRows) setPhotos(photoRows.map((p: any) => ({ id: p.id, fileUrl: p.file_url, caption: p.caption })));
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading update...</p>
      </div>
    );
  }

  if (!update) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Update Not Found</h2>
        <p className="text-gray-500 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-4 md:p-8 shadow-lg">
          <div className="border-b pb-6 mb-6">
            <div className="flex items-start gap-3">
              {branding?.profile_photo_url && (
                <img src={branding.profile_photo_url} alt="Logo" className="w-12 h-12 rounded-lg object-contain border bg-white shrink-0" />
              )}
              <div>
                {branding?.company_name && <p className="text-sm font-medium text-gray-500 mb-1">{branding.company_name}</p>}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{update.name || 'Project Update'}</h2>
                {update.sent_at && (
                  <p className="text-xs text-gray-400 mt-1">{new Date(update.sent_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                )}
              </div>
            </div>
          </div>

          {update.description && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{update.description}</p>
            </div>
          )}

          {photos.length > 0 ? (
            <div>
              {photos.some(p => p.caption) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="space-y-1">
                      <img src={photo.fileUrl} alt={photo.caption || 'Photo'} className="w-full aspect-square object-cover rounded-lg border border-gray-100" />
                      {photo.caption && <p className="text-xs text-gray-500 text-center">{photo.caption}</p>}
                    </div>
                  ))}
                </div>
              )}
              {!photos.some(p => p.caption) && <PhotoGallery photos={photos} readOnly />}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No photos included in this update.</p>
          )}
        </Card>
        <p className="text-center text-xs text-gray-400 mt-4">Powered by levelworks.org</p>
      </div>
    </div>
  );
}
