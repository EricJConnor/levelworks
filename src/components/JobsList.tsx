import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';
import { PhotoGallery } from './PhotoGallery';
import { SendJobUpdateModal } from './SendJobUpdateModal';
import { ImageIcon, ChevronDown, ChevronUp, Send, Plus, Hammer } from 'lucide-react';

interface Job {
  id: string;
  clientName: string;
  projectType: string;
  status: 'draft' | 'sent' | 'approved' | 'in-progress' | 'completed';
  total: number;
  date: string;
}

interface Photo {
  id: string;
  fileUrl: string;
  caption?: string;
}

interface JobsListProps {
  jobs: Job[];
  onCreateEstimate: (job?: Job) => void;
  onViewJob: (job: Job) => void;
}

const STATUSES: { key: Job['status']; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'approved', label: 'Approved' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

export const JobsList: React.FC<JobsListProps> = ({ jobs, onCreateEstimate, onViewJob }) => {
  const { updateJob, deleteJob } = useData();
  const [showActions, setShowActions] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobPhotos, setJobPhotos] = useState<Record<string, Photo[]>>({});
  const [sendUpdateJob, setSendUpdateJob] = useState<Job | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '';
      case 'sent': return 'blue';
      case 'approved': return 'green';
      case 'in-progress': return 'amber';
      case 'completed': return 'jl-done';
      default: return '';
    }
  };

  const statusLabel = (status: string) => STATUSES.find(s => s.key === status)?.label || status;

  const loadJobPhotos = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_photos')
        .select('id, file_url, caption')
        .eq('job_id', jobId);
      if (error) throw error;
      setJobPhotos(prev => ({
        ...prev,
        [jobId]: data?.map(p => ({ id: p.id, fileUrl: p.file_url, caption: p.caption })) || []
      }));
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleExpandJob = (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
      if (!jobPhotos[jobId]) loadJobPhotos(jobId);
    }
  };

  const handlePhotoUploaded = (jobId: string, photo: Photo) => {
    setJobPhotos(prev => ({
      ...prev,
      [jobId]: [...(prev[jobId] || []), photo]
    }));
  };

  const handlePhotoDeleted = (jobId: string, photoId: string) => {
    setJobPhotos(prev => ({
      ...prev,
      [jobId]: (prev[jobId] || []).filter(p => p.id !== photoId)
    }));
  };

  const handleStatusChange = (jobId: string, newStatus: Job['status']) => {
    updateJob(jobId, { status: newStatus });
    toast({ title: 'Success', description: 'Job status updated!' });
    setShowActions(null);
  };

  const handleDelete = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteJob(jobId);
      toast({ title: 'Success', description: 'Job deleted!' });
    }
  };

  // Close the status menu when the click lands anywhere else.
  useEffect(() => {
    if (!showActions) return;
    const onDown = () => setShowActions(null);
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [showActions]);

  return (
    <div>
      <style>{`
        .jl-item { border-bottom: 1px solid var(--lv-line); }
        .jl-item:last-child { border-bottom: 0; }
        .jl-head { display: flex; align-items: center; gap: 10px; padding: 0 14px 0 18px; }
        .jl-open {
          flex: 1; min-width: 0; padding: 14px 0; background: none; border: 0;
          text-align: left; font: inherit; color: inherit; cursor: pointer;
        }
        .jl-open:focus-visible { outline: 2px solid var(--lv-blue); outline-offset: -2px; }
        .jl-head:hover { background: var(--lv-surface-2); }
        .jl-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .jl-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .jl-menu { position: relative; }
        .jl-status { border: 0; cursor: pointer; font-family: var(--lv-font); min-height: 28px; }
        .jl-status:focus-visible { outline: 2px solid var(--lv-blue); outline-offset: 2px; }
        .jl-status.jl-done { background: var(--lv-navy); color: #fff; }
        .jl-pop { left: auto; right: 0; width: 180px; }
        .jl-pop .jl-del { color: var(--lv-red); border-top: 1px solid var(--lv-line); margin-top: 4px; padding-top: 9px; border-radius: 0 0 var(--lv-r-sm) var(--lv-r-sm); }
        .jl-photos { padding: 0 18px 14px; }
        .jl-toggle {
          display: inline-flex; align-items: center; gap: 8px; min-height: 40px;
          background: none; border: 0; padding: 0; cursor: pointer;
          font: 600 13.5px var(--lv-font); color: var(--lv-mute);
        }
        .jl-toggle:hover { color: var(--lv-blue); }
        .jl-open-body { padding-top: 4px; }
        @media (max-width: 520px) {
          .jl-head { flex-wrap: wrap; padding: 0 14px; }
          .jl-open { flex: 1 0 100%; padding-bottom: 8px; }
          .jl-right { padding-bottom: 12px; }
        }
      `}</style>

      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">Jobs</h1>
          <p className="lv-sub">Where each job stands, and the photos from site.</p>
        </div>
        <button className="lv-btn pri" onClick={() => onCreateEstimate()}><Plus size={16} /> New estimate</button>
      </div>

      {jobs.length === 0 ? (
        <div className="lv-empty">
          <Hammer size={30} />
          <h3>No jobs yet</h3>
          <p>Write an estimate to start a job. Once it is running, its site photos live here.</p>
          <button className="lv-btn pri" onClick={() => onCreateEstimate()}><Plus size={16} /> New estimate</button>
        </div>
      ) : (
        <div className="lv-card">
          {jobs.map(job => {
            const photos = jobPhotos[job.id] || [];
            const expanded = expandedJob === job.id;
            return (
              <div className="jl-item" key={job.id}>
                <div className="jl-head">
                  <button className="jl-open" onClick={() => onViewJob(job)}>
                    <div className="lv-row-t jl-clip">{job.clientName}</div>
                    <div className="lv-row-s jl-clip">{job.projectType} · {job.date}</div>
                  </button>
                  <div className="jl-right">
                    <span className="lv-row-r">${job.total.toLocaleString()}</span>
                    <div className="jl-menu">
                      <button
                        className={`lv-pill jl-status ${getStatusColor(job.status)}`}
                        onClick={(e) => { e.stopPropagation(); setShowActions(showActions === job.id ? null : job.id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        aria-haspopup="menu"
                        aria-expanded={showActions === job.id}
                      >
                        {statusLabel(job.status)} <ChevronDown size={13} />
                      </button>
                      {showActions === job.id && (
                        <div className="lv-pop jl-pop" onPointerDown={(e) => e.stopPropagation()}>
                          {STATUSES.map(s => (
                            <button key={s.key} onClick={() => handleStatusChange(job.id, s.key)}>{s.label}</button>
                          ))}
                          <button className="jl-del" onClick={() => handleDelete(job.id)}>Delete job</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="jl-photos">
                  <button className="jl-toggle" onClick={() => handleExpandJob(job.id)} aria-expanded={expanded}>
                    <ImageIcon size={15} />
                    Photos ({photos.length})
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {expanded && (
                    <div className="jl-open-body lv-stack">
                      <div className="lv-inline">
                        <PhotoUpload jobId={job.id} onPhotoUploaded={(photo) => handlePhotoUploaded(job.id, photo)} />
                        {photos.length > 0 && (
                          <button className="lv-btn sec sm" onClick={() => setSendUpdateJob(job)}>
                            <Send size={15} /> Send photo update
                          </button>
                        )}
                      </div>
                      {photos.length > 0 ? (
                        <PhotoGallery photos={photos} onPhotoDeleted={(photoId) => handlePhotoDeleted(job.id, photoId)} />
                      ) : (
                        <p className="lv-small">No photos on this job yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sendUpdateJob && (
        <SendJobUpdateModal
          jobId={sendUpdateJob.id}
          clientName={sendUpdateJob.clientName}
          photoCount={jobPhotos[sendUpdateJob.id]?.length || 0}
          onClose={() => setSendUpdateJob(null)}
        />
      )}
    </div>
  );
};
