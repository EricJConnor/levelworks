import React, { useState, useEffect } from 'react';
import { useData, Estimate } from '@/contexts/DataContext';
import { useInvoices } from '@/contexts/InvoiceContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SendEstimateModal } from './SendEstimateModal';
import { useToast } from '@/hooks/use-toast';
import { FileText, ImageIcon, ChevronDown, ChevronUp, Edit, Eye, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';
import { PhotoGallery } from './PhotoGallery';
import { EstimateBuilder } from './EstimateBuilder';

interface Photo { id: string; fileUrl: string; caption?: string; }

export const EstimatesList: React.FC = () => {
  const { estimates, deleteEstimate } = useData();
  const { addInvoice } = useInvoices();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [resendEstimate, setResendEstimate] = useState<Estimate | null>(null);
  const [editEstimate, setEditEstimate] = useState<Estimate | null>(null);
  const [expandedEstimate, setExpandedEstimate] = useState<string | null>(null);
  const [estimatePhotos, setEstimatePhotos] = useState<Record<string, Photo[]>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPhotos = async (estimateId: string) => {
    try {
      const { data, error } = await supabase.from('project_photos').select('id, file_url, caption').eq('estimate_id', estimateId);
      if (error) throw error;
      setEstimatePhotos(prev => ({ ...prev, [estimateId]: data?.map(p => ({ id: p.id, fileUrl: p.file_url, caption: p.caption })) || [] }));
    } catch (error) { console.error('Error loading photos:', error); }
  };

  const handleExpand = (id: string) => {
    if (expandedEstimate === id) { setExpandedEstimate(null); }
    else { setExpandedEstimate(id); if (!estimatePhotos[id]) loadPhotos(id); }
  };

  const handlePhotoUploaded = (estimateId: string, photo: Photo) => {
    setEstimatePhotos(prev => ({ ...prev, [estimateId]: [...(prev[estimateId] || []), photo] }));
  };

  const handlePhotoDeleted = (estimateId: string, photoId: string) => {
    setEstimatePhotos(prev => ({ ...prev, [estimateId]: (prev[estimateId] || []).filter(p => p.id !== photoId) }));
  };

  const handleConvertToInvoice = async (estimate: Estimate) => {
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await addInvoice({
        estimateId: estimate.id, invoiceNumber,
        clientName: estimate.clientName,
        clientEmail: estimate.clientEmail,
        clientPhone: estimate.clientPhone,
        projectName: estimate.projectName,
        lineItems: estimate.lineItems,
        taxRate: estimate.taxRate, total: estimate.total,
        amountPaid: 0, paymentHistory: [], status: 'unpaid',
        issueDate: new Date().toISOString(),
        notes: `Converted from estimate EST-${estimate.id.slice(-6)}`
      });
      toast({ title: 'Invoice created successfully!' });
    } catch (error: any) {
      toast({ title: 'Error creating invoice', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredEstimates = estimates
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'amount-desc') return b.total - a.total;
      if (sortBy === 'amount-asc') return a.total - b.total;
      return 0;
    });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this estimate?')) {
      deleteEstimate(id);
      toast({ title: 'Estimate deleted successfully' });
    }
  };

  // View estimate in new tab
  const handleViewEstimate = (estimate: Estimate) => {
    if (!estimate.viewToken) {
      toast({ 
        title: 'Cannot view estimate', 
        description: 'This estimate does not have a view link yet. Try sending it first.', 
        variant: 'destructive' 
      });
      return;
    }
    const url = `${window.location.origin}/view-estimate/${estimate.viewToken}`;
    window.open(url, '_blank');
  };

  // Copy estimate link to clipboard
  const handleCopyLink = (estimate: Estimate) => {
    if (!estimate.viewToken) {
      toast({ 
        title: 'Cannot copy link', 
        description: 'This estimate does not have a view link yet. Try sending it first.', 
        variant: 'destructive' 
      });
      return;
    }
    const url = `${window.location.origin}/view-estimate/${estimate.viewToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(estimate.id);
    toast({ title: 'Link copied!', description: 'Estimate link copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Estimates</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-32 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest</SelectItem>
              <SelectItem value="date-asc">Oldest</SelectItem>
              <SelectItem value="amount-desc">Highest</SelectItem>
              <SelectItem value="amount-asc">Lowest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEstimates.length === 0 ? (
        <Card className="p-6 md:p-8 text-center text-gray-500 text-sm">No estimates found.</Card>
      ) : (
        <div className="space-y-3">
          {filteredEstimates.map((estimate) => (
            <Card key={estimate.id} className="p-3 md:p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base md:text-lg font-semibold">EST-{estimate.id.slice(-6)}</h3>
                  <Badge className={`${getStatusColor(estimate.status)} text-xs`}>{estimate.status.toUpperCase()}</Badge>
                  {estimate.signedAt && <Badge className="bg-green-500 text-xs">Signed</Badge>}
                  {estimate.viewToken && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Has Link
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                  <div><span className="text-gray-500">Client:</span> {estimate.clientName}</div>
                  <div><span className="text-gray-500">Amount:</span> ${estimate.total.toLocaleString()}</div>
                  <div><span className="text-gray-500">Project:</span> {estimate.projectName}</div>
                  <div><span className="text-gray-500">Created:</span> {new Date(estimate.createdAt).toLocaleDateString()}</div>
                </div>
                
                <div className="pt-2 border-t">
                  <button onClick={() => handleExpand(estimate.id)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                    <ImageIcon className="w-4 h-4" />Photos ({estimatePhotos[estimate.id]?.length || 0})
                    {expandedEstimate === estimate.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedEstimate === estimate.id && (
                    <div className="mt-3 space-y-3">
                      <PhotoUpload estimateId={estimate.id} onPhotoUploaded={(photo) => handlePhotoUploaded(estimate.id, photo)} />
                      {estimatePhotos[estimate.id]?.length > 0 && (
                        <PhotoGallery photos={estimatePhotos[estimate.id]} onPhotoDeleted={(photoId) => handlePhotoDeleted(estimate.id, photoId)} />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {/* View Estimate Button - Opens in new tab */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-8 text-blue-600 border-blue-300 hover:bg-blue-50" 
                    onClick={() => handleViewEstimate(estimate)}
                    disabled={!estimate.viewToken}
                  >
                    <Eye className="h-3 w-3 mr-1" />View
                  </Button>
                  
                  {/* Copy Link Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-8" 
                    onClick={() => handleCopyLink(estimate)}
                    disabled={!estimate.viewToken}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedId === estimate.id ? 'Copied!' : 'Copy Link'}
                  </Button>
                  
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setEditEstimate(estimate)}>
                    <Edit className="h-3 w-3 mr-1" />Edit
                  </Button>
                  {estimate.status === 'approved' && (
                    <Button size="sm" className="text-xs h-8" onClick={() => handleConvertToInvoice(estimate)}>
                      <FileText className="h-3 w-3 mr-1" />Invoice
                    </Button>
                  )}
                  {(estimate.status === 'sent' || estimate.status === 'draft') && (
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setResendEstimate(estimate)}>
                      {estimate.status === 'draft' ? 'Send' : 'Resend'}
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" className="text-xs h-8" onClick={() => handleDelete(estimate.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {resendEstimate && <SendEstimateModal estimate={resendEstimate} onClose={() => setResendEstimate(null)} onSuccess={() => setResendEstimate(null)} />}
      {editEstimate && <EstimateBuilder existingEstimate={editEstimate} onClose={() => setEditEstimate(null)} />}
    </div>
  );
};

