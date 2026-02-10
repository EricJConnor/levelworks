import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignatureCanvas, SignatureCanvasRef } from '@/components/SignatureCanvas';
import { PhotoGallery } from '@/components/PhotoGallery';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImageIcon, CheckCircle, FileText, User, Mail, Phone, Calendar } from 'lucide-react';

interface Photo { id: string; fileUrl: string; caption?: string; }

function EstimatePhotos({ estimateId }: { estimateId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    supabase.from('project_photos').select('id, file_url, caption').eq('estimate_id', estimateId)
      .then(({ data }) => setPhotos(data?.map(p => ({ id: p.id, fileUrl: p.file_url, caption: p.caption })) || []));
  }, [estimateId]);

  if (photos.length === 0) return null;

  return (
    <div>
      <button onClick={() => setShow(!show)} className="flex items-center gap-2 text-blue-600 hover:underline py-2">
        <ImageIcon className="w-4 h-4" /> View {photos.length} Project Photos
      </button>
      {show && <div className="mt-3"><PhotoGallery photos={photos} readOnly /></div>}
    </div>
  );
}

export default function PublicEstimateView() {
  const { token } = useParams();
  const { toast } = useToast();
  const signatureRef = useRef<SignatureCanvasRef>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signedByName, setSignedByName] = useState('');
  const [signedByEmail, setSignedByEmail] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadEstimate(); }, [token]);

  const loadEstimate = async () => {
    setError(null);
    if (!token) {
      setError('No estimate token provided');
      setLoading(false);
      return;
    }
    
    try {
      const fetchUrl = `${SUPABASE_URL}/rest/v1/estimates?view_token=eq.${encodeURIComponent(token)}&select=*`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        setError('Unable to load estimate. Please try again.');
        return;
      }
      
      const results = await response.json();
      if (!results || results.length === 0) {
        setError('Estimate not found. The link may have expired or is invalid.');
        return;
      }
      
      setEstimate(results[0]);
    } catch (err: any) {
      setError('An unexpected error occurred');
    } finally { 
      setLoading(false); 
    }
  };

  const handleSign = async () => {
    let finalSignature = signatureData;
    if (!finalSignature && signatureRef.current?.hasSignature()) {
      finalSignature = signatureRef.current.getSignature() || '';
    }

    if (!signedByName.trim()) {
      toast({ title: 'Name Required', description: 'Please enter your full name', variant: 'destructive' });
      return;
    }
    if (!signedByEmail.trim()) {
      toast({ title: 'Email Required', description: 'Please enter your email address', variant: 'destructive' });
      return;
    }
    if (!finalSignature) {
      toast({ title: 'Signature Required', description: 'Please draw your signature in the box above', variant: 'destructive' });
      return;
    }

    setSigning(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-signature', {
        body: {
          estimateId: estimate.id,
          signedByName: signedByName.trim(),
          signedByEmail: signedByEmail.trim(),
          signatureData: finalSignature
        }
      });
      
      if (error) throw error;
      
      toast({ title: 'Success!', description: 'Estimate signed and approved successfully.' });
      await loadEstimate();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to sign estimate.', variant: 'destructive' });
    } finally { setSigning(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading estimate...</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Estimate Not Found</h2>
        <p className="text-gray-500 text-center max-w-md">{error}</p>
      </div>
    );
  }

  const parseLineItems = (items: any) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try { return JSON.parse(items); } catch { return []; }
    }
    return [];
  };

  const lineItems = parseLineItems(estimate.line_items);
  const total = Number(estimate.total) || 0;
  const isSigned = !!estimate.signed_at;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Level Works</h1>
        </div>

        <Card className="p-4 md:p-8 shadow-lg">
          {isSigned && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <p className="text-green-800 font-semibold">Estimate Approved</p>
            </div>
          )}

          <div className="border-b pb-6 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{estimate.project_name || 'Project Estimate'}</h2>
          </div>

          <EstimatePhotos estimateId={estimate.id} />

          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              {lineItems.map((item: any, idx: number) => (
                <div key={idx} className="p-3 border-b border-gray-200 last:border-0">
                  <p className="font-medium text-gray-800">{item.description}</p>
                  <p className="text-right font-semibold">${Number(item.total || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>Total:</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>

          {!isSigned && (
            <div className="mt-8 border-t pt-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Approve This Estimate</h3>
              <input 
                value={signedByName} 
                onChange={(e) => setSignedByName(e.target.value)} 
                className="w-full border-2 rounded-lg px-4 py-3" 
                placeholder="Your Full Name"
              />
              <input 
                type="email" 
                value={signedByEmail} 
                onChange={(e) => setSignedByEmail(e.target.value)} 
                className="w-full border-2 rounded-lg px-4 py-3" 
                placeholder="Your Email"
              />
              <SignatureCanvas ref={signatureRef} onChange={setSignatureData} showButtons={true} onSave={setSignatureData} />
              <Button onClick={handleSign} disabled={signing} className="w-full py-4 bg-green-600 hover:bg-green-700" size="lg">
                {signing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                {signing ? 'Processing...' : 'Sign and Approve'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
