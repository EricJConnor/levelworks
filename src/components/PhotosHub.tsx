import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabase';
import { Camera, FileText, ChevronRight, Send, Clock, Search, Plus, ExternalLink } from 'lucide-react';
import { CreateUpdateModal } from './CreateUpdateModal';
import { useT } from '@/i18n';

interface PhotosHubProps {
  onOpenEstimate: (estimate: any) => void;
}

export const PhotosHub: React.FC<PhotosHubProps> = ({ onOpenEstimate }) => {
  const { estimates } = useData();
  const t = useT();
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
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <style>{`
        .ph-acts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
        @media (max-width: 640px) { .ph-acts { grid-template-columns: 1fr; } }
        .ph-act {
          display: flex; align-items: center; gap: 14px; text-align: left; width: 100%;
          padding: 16px; cursor: pointer; background: var(--lv-surface);
          border: 1px solid var(--lv-line); border-radius: var(--lv-r-lg);
          box-shadow: var(--lv-shadow-sm); font: inherit; color: inherit;
          transition: border-color var(--lv-t) var(--lv-ease), box-shadow var(--lv-t) var(--lv-ease);
        }
        .ph-act:hover { border-color: var(--lv-line-2); box-shadow: var(--lv-shadow); }
        .ph-act.on { border-color: var(--lv-blue); box-shadow: 0 0 0 3px rgba(37, 99, 235, .12); }
        .ph-act-ic {
          width: 40px; height: 40px; flex-shrink: 0; border-radius: var(--lv-r);
          background: var(--lv-blue-soft); color: var(--lv-blue);
          display: grid; place-items: center;
        }
        .ph-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ph-picker { margin-bottom: 18px; }
        .ph-pick-list { max-height: 300px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .ph-when { display: inline-flex; align-items: center; gap: 5px; margin-top: 3px; }
        .ph-link { flex-shrink: 0; text-decoration: none; }
      `}</style>

      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">{t('nav.photos')}</h1>
          <p className="lv-sub">{t('lst.photosSub')}</p>
        </div>
        <button className="lv-btn pri" onClick={() => setShowCreateUpdate(true)}><Plus size={16} /> {t('lst.newUpdate')}</button>
      </div>

      <div className="ph-acts">
        <button
          className={`ph-act ${showEstimatePicker ? 'on' : ''}`}
          onClick={() => { setShowEstimatePicker(!showEstimatePicker); setSearch(''); }}
          aria-expanded={showEstimatePicker}
        >
          <span className="ph-act-ic"><Camera size={19} /></span>
          <span style={{ minWidth: 0 }}>
            <span className="lv-h3" style={{ display: 'block' }}>{t('lst.uploadPhotos')}</span>
            <span className="lv-small" style={{ display: 'block', marginTop: 2 }}>{t('lst.uploadPhotosBody')}</span>
          </span>
        </button>

        <button className="ph-act" onClick={() => setShowCreateUpdate(true)}>
          <span className="ph-act-ic"><Send size={18} /></span>
          <span style={{ minWidth: 0 }}>
            <span className="lv-h3" style={{ display: 'block' }}>{t('lst.createUpdate')}</span>
            <span className="lv-small" style={{ display: 'block', marginTop: 2 }}>{t('lst.createUpdateBody')}</span>
          </span>
        </button>
      </div>

      {showEstimatePicker && (
        <div className="lv-card ph-picker">
          <div className="lv-card-head" style={{ display: 'block' }}>
            <span className="lv-eyebrow">{t('lst.chooseEstimate')}</span>
            <div className="lv-search" style={{ marginTop: 8 }}>
              <Search size={16} />
              <input
                className="lv-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('lst.searchByClientOrProject')}
                autoFocus
              />
            </div>
          </div>
          <div className="ph-pick-list">
            {filtered.length === 0 ? (
              <p className="lv-small" style={{ padding: '24px 18px', textAlign: 'center' }}>{t('lst.noEstimatesMatch')}</p>
            ) : (
              filtered.map(est => (
                <button
                  className="lv-row"
                  key={est.id}
                  onClick={() => { onOpenEstimate(est); setShowEstimatePicker(false); }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span className="lv-row-t ph-clip" style={{ display: 'block' }}>{est.projectName || t('lst.unnamedProject')}</span>
                    <span className="lv-row-s ph-clip" style={{ display: 'block' }}>{est.clientName}</span>
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--lv-faint)', flexShrink: 0 }} />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {updates.length > 0 ? (
        <div className="lv-card">
          <div className="lv-card-head">
            <h2 className="lv-h2">{t('lst.sentUpdates')}</h2>
            <span className="lv-small lv-num">{updates.length}</span>
          </div>
          {updates.map(u => (
            <div className="lv-row" key={u.id}>
              <div style={{ minWidth: 0 }}>
                <div className="lv-row-t ph-clip">{u.name}</div>
                {u.description && <div className="lv-row-s ph-clip">{u.description}</div>}
                <div className="lv-row-s ph-when">
                  <Clock size={12} />
                  {u.sent_at
                    ? t('lst.sentOn', { date: new Date(u.sent_at).toLocaleDateString() })
                    : t('lst.createdOn', { date: new Date(u.created_at).toLocaleDateString() })}
                </div>
              </div>
              {u.view_token && (
                <a
                  className="lv-btn sec sm ph-link"
                  href={`/view-update/${u.view_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={14} /> {t('lst.viewLink')}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : !showEstimatePicker && (
        <div className="lv-empty">
          <FileText size={30} />
          <h3>{t('lst.noUpdatesYet')}</h3>
          <p>{t('lst.noUpdatesBody')}</p>
          <button className="lv-btn pri" onClick={() => setShowCreateUpdate(true)}><Plus size={16} /> {t('lst.createAnUpdate')}</button>
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
