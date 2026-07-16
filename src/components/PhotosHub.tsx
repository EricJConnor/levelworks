import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabase';
import { Camera, FileText, ChevronRight, Send, Clock } from 'lucide-react';
import { CreateUpdateModal } from './CreateUpdateModal';

interface PhotosHubProps {
  onOpenEstimate: (estimate: any) => void;
}

export const PhotosHub: React.FC<PhotosHubProps> = ({ onOpenEstimate }) => {
  const { estimates } = useData();
  const [showEstimatePicker, setShowEstimatePicker] = useState(false);
  const [showCreateUpdate, setShowCreateUpdate] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUpdates(); }, []);

  const loadUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('job_updates')
        .select('id, name, description, view_token, sent_at, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUpdates(data || []);
    } catch (e) { console.error(e); }
  };

  const filtered = estimates.filter(e => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (e.projectName || '').toLowerCase().includes(s) || (e.clientName || '').toLowerCase().includes(s);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Photos</h2>
        <p className="text-sm text-gray-500">Upload job-site photos to an estimate, or create a standalone update to send to your client.</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => { setShowEstimatePicker(!showEstimatePicker); setSearch(''); }}
          className="flex items-center gap-4 p-5 bg-white border-2 rounded-xl text-left hover:border-blue-400 transition-colors"
          style={{ borderColor: showEstimatePicker ? '#3b82f6' : '#e4e4e7' }}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Upload Photos</p>
            <p className="text-xs text-gray-500 mt-0.5">Add photos to an existing estimate</p>
          </div>
        </button>

        <button
          onClick={() => setShowCreateUpdate(true)}
          className="flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-blue-400 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Create Update</p>
            <p className="text-xs text-gray-500 mt-0.5">Build a photo update to send to a client</p>
          </div>
        </button>
      </div>

      {/* Estimate picker */}
      {showEstimatePicker && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-2">Choose an estimate to open:</p>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by client or project name..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No estimates found.</p>
            ) : (
              filtered.map(est => (
                <button
                  key={est.id}
                  onClick={() => { onOpenEstimate(est); setShowEstimatePicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{est.projectName || 'Unnamed Project'}</p>
                    <p className="text-xs text-gray-500">{est.clientName}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Past updates */}
      {updates.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">Sent Updates</h3>
          <div className="space-y-2">
            {updates.map(u => (
              <div key={u.id} className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{u.name}</p>
                    {u.description && <p className="text-xs text-gray-500 truncate">{u.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {u.sent_at ? `Sent ${new Date(u.sent_at).toLocaleDateString()}` : `Created ${new Date(u.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                {u.view_token && (
                  <a
                    href={`/view-update/${u.view_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 font-medium shrink-0 hover:underline"
                  >
                    View Link
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {updates.length === 0 && !showEstimatePicker && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <Camera className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No photo updates yet. Use the buttons above to get started.</p>
        </div>
      )}

      {showCreateUpdate && (
        <CreateUpdateModal
          onClose={() => setShowCreateUpdate(false)}
          onCreated={() => { setShowCreateUpdate(false); loadUpdates(); }}
        />
      )}
    </div>
  );
};
