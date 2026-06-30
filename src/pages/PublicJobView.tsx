import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Loader2, FileText, Camera } from 'lucide-react';

interface JobDetails { client_name?: string; project_type?: string; update_summary?: string; update_sent_at?: string; date?: string; }
interface Branding { company_name?: string; profile_photo_url?: string; }
interface Photo { id: string; fileUrl: string; caption?: string; }

export default function PublicJobView() {
  const { token } = useParams();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadJob(); }, [token]);

  const fetchJson = async (path: string) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) return null;
    return res.json();
  };

  const loadJob = async () => {
    if (!token) { setError('No link provided'); setLoading(false); return; }
    try {
      const rows = await fetchJson(`public_job_details?view_token=eq.${encodeURIComponent(token)}&select=*`);
      if (!rows || rows.length === 0) {
        setError('Update not found. The link may have expired or is invalid.');
        setLoading(false);
        return;
      }
      setJob(rows[0]);

      const brandingRows = await fetchJson(`public_job_branding?view_token=eq.${encodeURIComponent(token)}&select=company_name,profile_photo_url`);
      if (brandingRows && brandingRows.length > 0) setBranding(brandingRows[0]);

      const photoRows = await fetchJson(`public_job_photos?view_token=eq.${encodeURIComponent(token)}&select=id,file_url,caption`);
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

  if (!job) {
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
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2"><Camera className="w-5 h-5 text-blue-600" /> Project Update</h2>
                <p className="text-sm text-gray-500">{job.project_type || 'Project Update'}</p>
                {branding?.company_name && <p className="text-sm font-medium text-gray-700 mt-1">{branding.company_name}</p>}
              </div>
            </div>
          </div>

          {job.update_summary && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-800 whitespace-pre-wrap">{job.update_summary}</p>
            </div>
          )}

          {photos.length > 0 ? (
            <PhotoGallery photos={photos} readOnly />
          ) : (
            <p className="text-gray-500 text-center py-6">No photos yet.</p>
          )}
        </Card>
        <p className="text-center text-xs text-gray-400 mt-4">Powered by levelworks.org</p>
      </div>
    </div>
  );
}
