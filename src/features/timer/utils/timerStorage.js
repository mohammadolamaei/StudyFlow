const STORAGE_KEY = 'studyflow_timer_state';

const defaultTimerState = {
  studyMinutes: 25,
  studySeconds: 0,
  breakMinutes: 5,
  breakSeconds: 0,
  mode: 'study',
  timeLeft: 25 * 60,
  completedStudySessions: 0,
  dailyStudySeconds: {},
  isRunning: false,
  endTimestamp: null,
  sessionStartSeconds: null,
};

function getTodayPersianDateKey() {
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((item) => item.type === 'year')?.value;
  const month = parts.find((item) => item.type === 'month')?.value;
  const day = parts.find((item) => item.type === 'day')?.value;

  if (!year || !month || !day) {
    return '';
  }

  return `${year}-${month}-${day}`;
}

function loadTimerState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return defaultTimerState;
    }

    const parsedState = JSON.parse(savedState);

    return {
      ...defaultTimerState,
      ...parsedState,
      studySeconds: Number(parsedState.studySeconds) || 0,
      breakSeconds: Number(parsedState.breakSeconds) || 0,
      dailyStudySeconds: parsedState.dailyStudySeconds || {},
      sessionStartSeconds: parsedState.sessionStartSeconds || null,
    };
  } catch (error) {
    return defaultTimerState;
  }
}

function saveTimerState(timerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
}

export { defaultTimerState, getTodayPersianDateKey, loadTimerState, saveTimerState };
