import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronRight, Search, StickyNote, ArrowLeft, Trash2 } from 'lucide-react';
import { useT } from '@/i18n';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const Notes: React.FC = () => {
  const { toast } = useToast();
  const t = useT();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setIsNew(true);
  };

  const handleSelect = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const noteTitle = title.trim() || content.trim().split('\n')[0].slice(0, 50) || t('lst.newNoteTitle');
      if (selectedNote) {
        const { error } = await supabase
          .from('notes')
          .update({ title: noteTitle, content: content.trim(), updated_at: new Date().toISOString() })
          .eq('id', selectedNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert({ user_id: user.id, title: noteTitle, content: content.trim() });
        if (error) throw error;
      }
      await loadNotes();
      setIsNew(false);
      setSelectedNote(null);
      setTitle('');
      setContent('');
    } catch (err: any) {
      toast({ title: t('e.somethingWrong'), description: err.message || t('lst.noteSaveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm(t('lst.confirmDeleteNote'))) return;
    try {
      await supabase.from('notes').delete().eq('id', noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setIsNew(false);
      }
    } catch (err: any) {
      toast({ title: t('e.somethingWrong'), description: t('lst.noteDeleteFailed'), variant: 'destructive' });
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showEditor = isNew || selectedNote !== null;

  return (
    <div>
      <style>{`
        .nt-shell {
          display: flex;
          overflow: hidden;
          height: calc(100dvh - 320px);
          min-height: 440px;
        }
        .nt-list {
          display: flex;
          flex-direction: column;
          width: 320px;
          flex-shrink: 0;
          border-right: 1px solid var(--lv-line);
          min-width: 0;
        }
        .nt-list-head { padding: 14px; border-bottom: 1px solid var(--lv-line); background: var(--lv-surface-2); }
        .nt-list-body { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .nt-row { display: flex; align-items: center; gap: 10px; }
        .nt-row.on { background: var(--lv-blue-soft); box-shadow: inset 3px 0 0 var(--lv-blue); }
        .nt-row.on:hover { background: var(--lv-blue-soft); }
        .nt-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nt-editor { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .nt-editor-head {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 10px 14px; border-bottom: 1px solid var(--lv-line); background: var(--lv-surface-2);
          flex-shrink: 0;
        }
        .nt-title {
          border: 0; background: none; width: 100%;
          padding: 18px 20px 4px;
          font: 700 21px var(--lv-font); letter-spacing: -.02em; color: var(--lv-ink);
        }
        .nt-title:focus { outline: none; }
        .nt-title::placeholder { color: var(--lv-faint); font-weight: 600; }
        .nt-body {
          flex: 1; border: 0; background: none; resize: none; width: 100%;
          padding: 6px 20px 20px;
          font: 400 16px var(--lv-font); line-height: 1.6; color: var(--lv-ink-2);
        }
        .nt-body:focus { outline: none; }
        .nt-body::placeholder { color: var(--lv-faint); }
        .nt-blank { flex: 1; display: grid; place-items: center; padding: 24px; }
        .nt-back { display: none; }
        @media (max-width: 767px) {
          .nt-shell { height: calc(100dvh - 300px); min-height: 380px; }
          .nt-list { width: 100%; border-right: 0; }
          .nt-list.nt-off { display: none; }
          .nt-blank { display: none; }
          .nt-back { display: inline-flex; }
        }
      `}</style>

      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">{t('nav.notes')}</h1>
          <p className="lv-sub">{t('lst.notesSub')}</p>
        </div>
        <button className="lv-btn pri" onClick={handleNew}><Plus size={16} /> {t('lst.newNote')}</button>
      </div>

      <div className="lv-card nt-shell">
        <div className={`nt-list ${showEditor ? 'nt-off' : ''}`}>
          <div className="nt-list-head">
            <div className="lv-search">
              <Search size={16} />
              <input
                className="lv-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('lst.searchNotes')}
              />
            </div>
          </div>
          <div className="nt-list-body">
            {loading ? (
              <p className="lv-small" style={{ padding: 18, textAlign: 'center' }}>{t('a.loading')}</p>
            ) : filteredNotes.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <StickyNote size={26} style={{ color: 'var(--lv-faint)', marginBottom: 10 }} />
                <p className="lv-h3" style={{ marginBottom: 6 }}>{searchQuery ? t('lst.nothingMatchesShort') : t('lst.noNotesYet')}</p>
                <p className="lv-small" style={{ marginBottom: 14 }}>
                  {searchQuery ? t('lst.tryAnotherWord') : t('lst.noNotesBody')}
                </p>
                {!searchQuery && <button className="lv-btn pri sm" onClick={handleNew}><Plus size={15} /> {t('lst.newNote')}</button>}
              </div>
            ) : (
              filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleSelect(note)}
                  className={`lv-row nt-row ${selectedNote?.id === note.id ? 'on' : ''}`}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="lv-row-t nt-clip">{note.title || t('lst.untitled')}</div>
                    <div className="lv-row-s nt-clip">{note.content || t('lst.emptyNote')}</div>
                    <div className="lv-row-s lv-num">{new Date(note.updated_at).toLocaleDateString()}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--lv-faint)', flexShrink: 0 }} />
                </button>
              ))
            )}
          </div>
        </div>

        {showEditor ? (
          <div className="nt-editor">
            <div className="nt-editor-head">
              <button
                className="lv-btn quiet sm nt-back"
                onClick={() => { setSelectedNote(null); setIsNew(false); setTitle(''); setContent(''); }}
              >
                <ArrowLeft size={15} /> {t('nav.notes')}
              </button>
              <div className="lv-inline" style={{ marginLeft: 'auto', gap: 8 }}>
                {selectedNote && (
                  <button className="lv-btn danger sm" onClick={() => handleDelete(selectedNote.id)}>
                    <Trash2 size={15} /> {t('a.delete')}
                  </button>
                )}
                <button
                  className="lv-btn pri sm"
                  onClick={handleSave}
                  disabled={saving || (!content.trim() && !title.trim())}
                >
                  {saving ? t('a.saving') : t('a.save')}
                </button>
              </div>
            </div>
            <input
              className="nt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('lst.noteTitlePlaceholder')}
            />
            <textarea
              className="nt-body"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('lst.noteBodyPlaceholder')}
              autoFocus
            />
          </div>
        ) : (
          <div className="nt-blank">
            <div style={{ textAlign: 'center' }}>
              <StickyNote size={28} style={{ color: 'var(--lv-faint)', marginBottom: 10 }} />
              <p className="lv-h3" style={{ marginBottom: 6 }}>{t('lst.nothingOpen')}</p>
              <p className="lv-small" style={{ marginBottom: 16 }}>{t('lst.nothingOpenBody')}</p>
              <button className="lv-btn pri sm" onClick={handleNew}><Plus size={15} /> {t('lst.newNote')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
