import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Clock, Save } from 'lucide-react';
import { CandidateNote } from '../hooks/useSavedCandidates';

interface CandidateNotesProps {
  notes: CandidateNote[];
  onAddNote: (content: string) => void;
  onUpdateNote: (noteId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export function CandidateNotes({ notes, onAddNote, onUpdateNote, onDeleteNote }: CandidateNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  const handleStartEdit = (note: CandidateNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      onUpdateNote(editingId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Ajouter une note..."
          className="w-full p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-purple-500 resize-none"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">
            Aucune note pour ce candidat
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg"
            >
              {editingId === note.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                    >
                      <Save className="w-3 h-3" />
                      Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      {formatDate(note.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1 text-[var(--text-secondary)] hover:text-purple-400 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CandidateNotes;
