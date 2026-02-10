import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';
import { PhotoGallery } from './PhotoGallery';
import { ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

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

export const JobsList: React.FC<JobsListProps> = ({ jobs, onCreateEstimate, onViewJob }) => {
  const { updateJob, deleteJob } = useData();
  const [showActions, setShowActions] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobPhotos, setJobPhotos] = useState<Record<string, Photo[]>>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-200 text-gray-800';
      case 'sent': return 'bg-blue-200 text-blue-800';
      case 'approved': return 'bg-green-200 text-green-800';
      case 'in-progress': return 'bg-orange-200 text-orange-800';
      case 'completed': return 'bg-purple-200 text-purple-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Jobs</h2>
        <Button onClick={() => onCreateEstimate()} size="sm" className="w-full sm:w-auto">+ New Estimate</Button>
      </div>
      
      {jobs.length === 0 ? (
        <Card className="p-6 md:p-8 text-center text-gray-500">
          <p>No jobs yet. Create your first estimate to get started!</p>
        </Card>
      ) : (
        jobs.map(job => (
          <Card key={job.id} className="p-3 md:p-4 hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="flex-1 cursor-pointer w-full" onClick={() => onViewJob(job)}>
                <h3 className="font-semibold text-base md:text-lg">{job.clientName}</h3>
                <p className="text-sm text-gray-600">{job.projectType}</p>
                <p className="text-xs text-gray-500 mt-1">{job.date}</p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                <div className="text-lg md:text-xl font-bold">${job.total.toLocaleString()}</div>
                <div className="relative">
                  <Badge className={`${getStatusColor(job.status)} cursor-pointer text-xs`} onClick={() => setShowActions(showActions === job.id ? null : job.id)}>
                    {job.status}
                  </Badge>
                  {showActions === job.id && (
                    <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg p-2 z-10 w-36 md:w-40">
                      <button onClick={() => handleStatusChange(job.id, 'draft')} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded text-xs md:text-sm">Draft</button>
                      <button onClick={() => handleStatusChange(job.id, 'sent')} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded text-xs md:text-sm">Sent</button>
                      <button onClick={() => handleStatusChange(job.id, 'approved')} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded text-xs md:text-sm">Approved</button>
                      <button onClick={() => handleStatusChange(job.id, 'in-progress')} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded text-xs md:text-sm">In Progress</button>
                      <button onClick={() => handleStatusChange(job.id, 'completed')} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded text-xs md:text-sm">Completed</button>
                      <hr className="my-1" />
                      <button onClick={() => handleDelete(job.id)} className="block w-full text-left px-2 py-1.5 hover:bg-red-100 rounded text-xs md:text-sm text-red-600">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Photo Section Toggle */}
            <div className="mt-3 pt-3 border-t">
              <button onClick={() => handleExpandJob(job.id)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                <ImageIcon className="w-4 h-4" />
                Photos ({jobPhotos[job.id]?.length || 0})
                {expandedJob === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {expandedJob === job.id && (
                <div className="mt-3 space-y-3">
                  <PhotoUpload jobId={job.id} onPhotoUploaded={(photo) => handlePhotoUploaded(job.id, photo)} />
                  {jobPhotos[job.id] && jobPhotos[job.id].length > 0 && (
                    <PhotoGallery photos={jobPhotos[job.id]} onPhotoDeleted={(photoId) => handlePhotoDeleted(job.id, photoId)} />
                  )}
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
