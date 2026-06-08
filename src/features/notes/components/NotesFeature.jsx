import { useEffect, useMemo, useState } from 'react';
import { loadNotes, saveNotes } from '../utils/notesStorage';
import '../styles/notes.css';

function NotesFeature() {
  const initialNotes = useMemo(() => loadNotes(), []);
  const [notes, setNotes] = useState(initialNotes);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  function handleSubmit(event) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      return;
    }

    const newNote = {
      id: Date.now(),
      title: cleanTitle,
      content: cleanContent,
      createdAt: new Date().toISOString(),
    };

    setNotes((previousNotes) => [newNote, ...previousNotes]);
    setTitle('');
    setContent('');
  }

  function deleteNote(noteId) {
    setNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId));
  }

  function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('fa-IR');
  }

  return (
    <section className="notes-card">
      <form className="notes-form" onSubmit={handleSubmit}>
        <label htmlFor="noteTitle">عنوان یادداشت</label>
        <input
          id="noteTitle"
          type="text"
          placeholder="فرمول‌های فیزیک"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <label htmlFor="noteContent">متن یادداشت</label>
        <textarea
          id="noteContent"
          placeholder="نکته‌های مهم را اینجا بنویس..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows="5"
        />

        <button type="submit" className="note-add-button">
          افزودن یادداشت
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="notes-empty">هنوز یادداشتی ثبت نشده است.</p>
      ) : (
        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note.id} className="note-item">
              <div>
                <p className="note-title">{note.title}</p>
                <p className="note-date">تاریخ ثبت: {formatDate(note.createdAt)}</p>
                <p className="note-content">{note.content}</p>
              </div>

              <button
                type="button"
                className="note-delete-button"
                onClick={() => deleteNote(note.id)}
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default NotesFeature;
