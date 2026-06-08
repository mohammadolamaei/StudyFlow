const STORAGE_KEY = 'studyflow_notes';

function loadNotes() {
  try {
    const storedNotes = localStorage.getItem(STORAGE_KEY);

    if (!storedNotes) {
      return [];
    }

    const parsedNotes = JSON.parse(storedNotes);

    return Array.isArray(parsedNotes) ? parsedNotes : [];
  } catch (error) {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export { loadNotes, saveNotes };
