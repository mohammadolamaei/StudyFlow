const STORAGE_KEY = 'studyflow_goals';

function loadGoals() {
  try {
    const storedGoals = localStorage.getItem(STORAGE_KEY);

    if (!storedGoals) {
      return [];
    }

    const parsedGoals = JSON.parse(storedGoals);

    return Array.isArray(parsedGoals) ? parsedGoals : [];
  } catch (error) {
    return [];
  }
}

function saveGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export { loadGoals, saveGoals };
