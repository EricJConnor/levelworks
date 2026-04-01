import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronRight, Search } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const Notes: React.FC = () => {
  const { toast } = useToast();
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
      const noteTitle = title.trim() || content.trim().split('\n')[0].slice(0, 50) || 'New Note';
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
      toast({ title: 'Error', description: err.message || 'Failed to save note', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
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
      toast({ title: 'Error', description: 'Failed to delete note', variant: 'destructive' });
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showEditor = isNew || selectedNote !== null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-0 bg-white rounded-lg overflow-hidden border">
      <div className={`${showEditor ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r`}>
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">Notes</h2>
            <button onClick={handleNew} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No notes yet</p>
              <button onClick={handleNew} className="text-blue-600 text-sm font-semibold">+ Create your first note</button>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => handleSelect(note)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${selectedNote?.id === note.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{note.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(note.updated_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {showEditor ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <button
              onClick={() => { setSelectedNote(null); setIsNew(false); setTitle(''); setContent(''); }}
              className="flex items-center gap-2 text-blue-600 text-sm font-semibold md:hidden"
            >
              ← Notes
            </button>
            <div className="flex gap-2 ml-auto">
              {selectedNote && (
                <button onClick={() => handleDelete(selectedNote.id)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold">
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || (!content.trim() && !title.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="px-5 pt-5 pb-2 text-xl font-bold focus:outline-none border-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing..."
            className="flex-1 px-5 py-2 text-base focus:outline-none resize-none border-none leading-relaxed"
            autoFocus
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">Select a note or create a new one</p>
            <button onClick={handleNew} className="text-blue-600 font-semibold">+ New Note</button>
          </div>
        </div>
      )}
    </div>
  );
};
