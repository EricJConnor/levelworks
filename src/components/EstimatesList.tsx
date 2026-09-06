import React, { useState } from 'react';
import { useData, Estimate } from '@/contexts/DataContext';
import { useInvoices } from '@/contexts/InvoiceContext';
import { SendEstimateModal } from './SendEstimateModal';
import { useToast } from '@/hooks/use-toast';
import { FileText, ImageIcon, ChevronDown, ChevronUp, Pencil, Eye, Copy, Check, Plus, Search, Send, Receipt, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';
import { PhotoGallery } from './PhotoGallery';
import { EstimateBuilder } from './EstimateBuilder';

interface Photo { id: string; fileUrl: string; caption?: string; }

interface EstimatesListProps { initialStatusFilter?: string; }

const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_TONE: Record<string, string> = { draft: '', sent: 'blue', approved: 'green', rejected: 'red' };
const STATUS_LABEL: Record<string, string> = { draft: 'Draft', sent: 'Sent', approved: 'Approved', rejected: 'Rejected' };

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

/* Scoped to the `el-` prefix so nothing here can reach another screen. */
const styles = `
.el-tools { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.el-segwrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin: -3px; padding: 3px; }
.el-segwrap::-webkit-scrollbar { display: none; }
.el-find { display: flex; gap: 10px; min-width: 0; }
.el-find .lv-search { flex: 1; min-width: 0; }
.el-sort { width: auto; flex: 0 0 auto; min-width: 128px; }
@media (min-width: 900px) {
  .el-tools { flex-direction: row; align-items: center; justify-content: space-between; }
  .el-find { flex: 0 1 460px; }
}
.el-list { overflow: hidden; }
.el-item + .el-item { border-top: 1px solid var(--lv-line); }
.el-row { align-items: flex-start; border-bottom: 0; padding-bottom: 10px; }
.el-main { min-width: 0; flex: 1; }
.el-titleline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.el-sub { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.el-amt { flex-shrink: 0; text-align: right; }
.el-amt .lv-small { margin-top: 2px; }
.el-acts { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px 14px; }
.el-del { margin-left: auto; }
.el-photos { padding: 2px 18px 18px; }
.el-photos > * + * { margin-top: 12px; }
@media (max-width: 520px) {
  .el-row { padding-left: 14px; padding-right: 14px; }
  .el-acts { padding: 0 14px 14px; }
  .el-photos { padding: 2px 14px 16px; }
  .el-del { margin-left: 0; }
}
`;

export const EstimatesList: React.FC<EstimatesListProps> = ({ initialStatusFilter }) => {
  const { estimates, deleteEstimate } = useData();
  const { addInvoice } = useInvoices();
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [query, setQuery] = useState('');
  const [resendEstimate, setResendEstimate] = useState<Estimate | null>(null);
  const [editEstimate, setEditEstimate] = useState<Estimate | null>(null);
  const [newEstimate, setNewEstimate] = useState(false);
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
      toast({ title: 'Invoice created' });
    } catch (error: any) {
      toast({ title: 'Could not create the invoice', description: error.message, variant: 'destructive' });
    }
  };

  const statusPill = (status: string) => (
    <span className={`lv-pill ${STATUS_TONE[status] ?? ''}`}>{STATUS_LABEL[status] || status}</span>
  );

  const term = query.trim().toLowerCase();
  const filteredEstimates = estimates
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => !term
      || (e.clientName || '').toLowerCase().includes(term)
      || (e.projectName || '').toLowerCase().includes(term)
      || `est-${e.id.slice(-6)}`.toLowerCase().includes(term))
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
      toast({ title: 'Estimate deleted' });
    }
  };

  // Open the estimate in the builder
  const handleViewEstimate = (estimate: Estimate) => {
    setEditEstimate(estimate);
  };

  // Copy estimate link to clipboard
  const handleCopyLink = (estimate: Estimate) => {
    if (!estimate.viewToken) {
      toast({
        title: 'No link yet',
        description: 'Send this estimate first and a client link is created for it.',
        variant: 'destructive'
      });
      return;
    }
    const url = `${window.location.origin}/view-estimate/${estimate.viewToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(estimate.id);
    toast({ title: 'Link copied', description: 'The client link is on your clipboard.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isFiltered = statusFilter !== 'all' || term.length > 0;

  return (
    <div>
      <style>{styles}</style>

      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">Estimates</h1>
          <p className="lv-sub">Everything you have quoted, and where each one stands.</p>
        </div>
        <button className="lv-btn pri" onClick={() => setNewEstimate(true)}>
          <Plus size={16} /> New estimate
        </button>
      </div>

      {estimates.length > 0 && (
      <div className="el-tools">
        <div className="el-segwrap">
          <div className="lv-seg" role="group" aria-label="Filter by status">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={statusFilter === f.key ? 'on' : ''}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="el-find">
          <div className="lv-search">
            <Search size={16} />
            <input
              className="lv-input"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, project or number"
              aria-label="Search estimates"
            />
          </div>
          <select
            className="lv-select el-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort estimates"
          >
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="amount-desc">Highest</option>
            <option value="amount-asc">Lowest</option>
          </select>
        </div>
      </div>
      )}

      {filteredEstimates.length === 0 ? (
        <div className="lv-empty">
          <FileText size={30} />
          <h3>{isFiltered ? 'Nothing matches that' : 'No estimates yet'}</h3>
          <p>
            {isFiltered
              ? 'Try another status, or clear the search box.'
              : 'Write your first estimate and send it to the client from your phone.'}
          </p>
          {isFiltered ? (
            <button className="lv-btn sec" onClick={() => { setStatusFilter('all'); setQuery(''); }}>Clear filters</button>
          ) : (
            <button className="lv-btn pri" onClick={() => setNewEstimate(true)}><Plus size={16} /> New estimate</button>
          )}
        </div>
      ) : (
        <div className="lv-card el-list">
          {filteredEstimates.map((estimate) => (
            <div className="el-item" key={estimate.id}>
              <div className="lv-row el-row">
                <div className="el-main">
                  <div className="el-titleline">
                    <span className="lv-row-t lv-num">EST-{estimate.id.slice(-6)}</span>
                    {statusPill(estimate.status)}
                    {estimate.signedAt && <span className="lv-pill green">Signed</span>}
                  </div>
                  <span className="lv-row-s el-sub">
                    {estimate.clientName || 'No client'} · {estimate.projectName || 'Untitled project'}
                  </span>
                </div>
                <div className="el-amt">
                  <div className="lv-row-r lv-num">{money(estimate.total)}</div>
                  <div className="lv-small lv-num">{new Date(estimate.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="el-acts">
                <button className="lv-btn sec sm" onClick={() => handleViewEstimate(estimate)} disabled={!estimate.viewToken}>
                  <Eye size={14} /> View
                </button>
                <button className="lv-btn sec sm" onClick={() => setEditEstimate(estimate)}>
                  <Pencil size={14} /> Edit
                </button>
                {(estimate.status === 'sent' || estimate.status === 'draft') && (
                  <button className="lv-btn pri sm" onClick={() => setResendEstimate(estimate)}>
                    <Send size={14} /> {estimate.status === 'draft' ? 'Send' : 'Resend'}
                  </button>
                )}
                {estimate.status === 'approved' && (
                  <button className="lv-btn sec sm" onClick={() => handleConvertToInvoice(estimate)}>
                    <Receipt size={14} /> Make invoice
                  </button>
                )}
                <button className="lv-btn quiet sm" onClick={() => handleCopyLink(estimate)} disabled={!estimate.viewToken}>
                  {copiedId === estimate.id ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === estimate.id ? 'Copied' : 'Copy link'}
                </button>
                <button
                  className="lv-btn quiet sm"
                  onClick={() => handleExpand(estimate.id)}
                  aria-expanded={expandedEstimate === estimate.id}
                >
                  <ImageIcon size={14} /> Photos ({estimatePhotos[estimate.id]?.length || 0})
                  {expandedEstimate === estimate.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button className="lv-btn danger sm el-del" onClick={() => handleDelete(estimate.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              {expandedEstimate === estimate.id && (
                <div className="el-photos">
                  <PhotoUpload estimateId={estimate.id} onPhotoUploaded={(photo) => handlePhotoUploaded(estimate.id, photo)} />
                  {estimatePhotos[estimate.id]?.length > 0 && (
                    <PhotoGallery photos={estimatePhotos[estimate.id]} onPhotoDeleted={(photoId) => handlePhotoDeleted(estimate.id, photoId)} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {resendEstimate && <SendEstimateModal estimate={resendEstimate} onClose={() => setResendEstimate(null)} onSuccess={() => setResendEstimate(null)} />}
      {editEstimate && <EstimateBuilder existingEstimate={editEstimate} onClose={() => setEditEstimate(null)} />}
      {newEstimate && <EstimateBuilder onClose={() => setNewEstimate(false)} />}
    </div>
  );
};
