const STORAGE_KEY = 'studyflow_schedule';

const defaultSchedule = {
  weeklyClasses: {
    saturday: [],
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  },
  dateSchedules: [],
};

function normalizeLegacySchedule(parsedSchedule) {
  if (parsedSchedule && parsedSchedule.weeklyClasses && parsedSchedule.dateSchedules) {
    return {
      weeklyClasses: {
        ...defaultSchedule.weeklyClasses,
        ...parsedSchedule.weeklyClasses,
      },
      dateSchedules: Array.isArray(parsedSchedule.dateSchedules)
        ? parsedSchedule.dateSchedules
        : [],
    };
  }

  const legacyKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const hasLegacyShape = legacyKeys.some((key) => Array.isArray(parsedSchedule?.[key]));

  if (!hasLegacyShape) {
    return defaultSchedule;
  }

  return {
    weeklyClasses: {
      saturday: parsedSchedule.saturday || [],
      sunday: parsedSchedule.sunday || [],
      monday: parsedSchedule.monday || [],
      tuesday: parsedSchedule.tuesday || [],
      wednesday: parsedSchedule.wednesday || [],
      thursday: parsedSchedule.thursday || [],
      friday: parsedSchedule.friday || [],
    },
    dateSchedules: [],
  };
}

function loadSchedule() {
  try {
    const storedSchedule = localStorage.getItem(STORAGE_KEY);

    if (!storedSchedule) {
      return defaultSchedule;
    }

    const parsedSchedule = JSON.parse(storedSchedule);
    return normalizeLegacySchedule(parsedSchedule);
  } catch (error) {
    return defaultSchedule;
  }
}

function saveSchedule(schedule) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

export { defaultSchedule, loadSchedule, saveSchedule };
