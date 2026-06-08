import { useEffect, useMemo, useState } from 'react';
import '../styles/timer.css';
import { getTodayPersianDateKey, loadTimerState, saveTimerState } from '../utils/timerStorage';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getSecondsLeft(endTimestamp) {
  return Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
}

function toDurationSeconds(minutes, seconds) {
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  const safeSeconds = Math.max(0, Math.min(59, Number(seconds) || 0));
  const totalSeconds = safeMinutes * 60 + safeSeconds;

  return totalSeconds > 0 ? totalSeconds : 1;
}

function TimerFeature() {
  const initialState = useMemo(() => loadTimerState(), []);
  const [studyMinutes, setStudyMinutes] = useState(initialState.studyMinutes);
  const [studySeconds, setStudySeconds] = useState(initialState.studySeconds || 0);
  const [breakMinutes, setBreakMinutes] = useState(initialState.breakMinutes);
  const [breakSeconds, setBreakSeconds] = useState(initialState.breakSeconds || 0);
  const [mode, setMode] = useState(initialState.mode);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [completedStudySessions, setCompletedStudySessions] = useState(
    initialState.completedStudySessions
  );
  const [dailyStudySeconds, setDailyStudySeconds] = useState(initialState.dailyStudySeconds || {});
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [endTimestamp, setEndTimestamp] = useState(initialState.endTimestamp);
  const [sessionStartSeconds, setSessionStartSeconds] = useState(initialState.sessionStartSeconds);

  function getStudyDurationSeconds() {
    return toDurationSeconds(studyMinutes, studySeconds);
  }

  function getBreakDurationSeconds() {
    return toDurationSeconds(breakMinutes, breakSeconds);
  }

  function recordCompletedStudySession(durationSeconds) {
    const todayKey = getTodayPersianDateKey();
    const safeDuration = Math.max(0, Number(durationSeconds) || 0);

    setCompletedStudySessions((previousCount) => previousCount + 1);

    if (!todayKey || safeDuration === 0) {
      return;
    }

    setDailyStudySeconds((previousMap) => ({
      ...previousMap,
      [todayKey]: (previousMap[todayKey] || 0) + safeDuration,
    }));
  }

  useEffect(() => {
    if (!initialState.isRunning || !initialState.endTimestamp) {
      return;
    }

    const restoredSeconds = getSecondsLeft(initialState.endTimestamp);

    if (restoredSeconds === 0) {
      setIsRunning(false);
      setEndTimestamp(null);
      setSessionStartSeconds(null);
      if (initialState.mode === 'study') {
        recordCompletedStudySession(
          initialState.sessionStartSeconds || toDurationSeconds(initialState.studyMinutes, initialState.studySeconds)
        );
        setMode('break');
        setTimeLeft(toDurationSeconds(initialState.breakMinutes, initialState.breakSeconds));
      } else {
        setMode('study');
        setTimeLeft(toDurationSeconds(initialState.studyMinutes, initialState.studySeconds));
      }
      return;
    }

    setTimeLeft(restoredSeconds);
  }, [initialState]);

  useEffect(() => {
    if (!isRunning || !endTimestamp) {
      return;
    }

    const timerId = setInterval(() => {
      const nextTimeLeft = getSecondsLeft(endTimestamp);
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft === 0) {
        setIsRunning(false);
        setEndTimestamp(null);

        if (mode === 'study') {
          recordCompletedStudySession(sessionStartSeconds || getStudyDurationSeconds());
          setSessionStartSeconds(null);
          setMode('break');
          setTimeLeft(getBreakDurationSeconds());
        } else {
          setSessionStartSeconds(null);
          setMode('study');
          setTimeLeft(getStudyDurationSeconds());
        }
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [isRunning, endTimestamp, mode, sessionStartSeconds, studyMinutes, studySeconds, breakMinutes, breakSeconds]);

  useEffect(() => {
    saveTimerState({
      studyMinutes,
      studySeconds,
      breakMinutes,
      breakSeconds,
      mode,
      timeLeft,
      completedStudySessions,
      dailyStudySeconds,
      isRunning,
      endTimestamp,
      sessionStartSeconds,
    });
  }, [
    studyMinutes,
    studySeconds,
    breakMinutes,
    breakSeconds,
    mode,
    timeLeft,
    completedStudySessions,
    dailyStudySeconds,
    isRunning,
    endTimestamp,
    sessionStartSeconds,
  ]);

  function handleModeChange(nextMode) {
    setIsRunning(false);
    setEndTimestamp(null);
    setSessionStartSeconds(null);
    setMode(nextMode);
    setTimeLeft(nextMode === 'study' ? getStudyDurationSeconds() : getBreakDurationSeconds());
  }

  function sanitizeMinuteValue(rawValue) {
    const parsedValue = Number(rawValue);
    if (Number.isNaN(parsedValue)) {
      return 0;
    }
    return Math.max(0, Math.min(120, parsedValue));
  }

  function sanitizeSecondValue(rawValue) {
    const parsedValue = Number(rawValue);
    if (Number.isNaN(parsedValue)) {
      return 0;
    }
    return Math.max(0, Math.min(59, parsedValue));
  }

  function handleStudyMinutesChange(event) {
    const safeValue = sanitizeMinuteValue(event.target.value);
    setStudyMinutes(safeValue);

    if (mode === 'study' && !isRunning) {
      setTimeLeft(toDurationSeconds(safeValue, studySeconds));
    }
  }

  function handleStudySecondsChange(event) {
    const safeValue = sanitizeSecondValue(event.target.value);
    setStudySeconds(safeValue);

    if (mode === 'study' && !isRunning) {
      setTimeLeft(toDurationSeconds(studyMinutes, safeValue));
    }
  }

  function handleBreakMinutesChange(event) {
    const safeValue = sanitizeMinuteValue(event.target.value);
    setBreakMinutes(safeValue);

    if (mode === 'break' && !isRunning) {
      setTimeLeft(toDurationSeconds(safeValue, breakSeconds));
    }
  }

  function handleBreakSecondsChange(event) {
    const safeValue = sanitizeSecondValue(event.target.value);
    setBreakSeconds(safeValue);

    if (mode === 'break' && !isRunning) {
      setTimeLeft(toDurationSeconds(breakMinutes, safeValue));
    }
  }

  function handleStart() {
    if (isRunning || timeLeft <= 0) {
      return;
    }

    setIsRunning(true);
    setSessionStartSeconds(timeLeft);
    setEndTimestamp(Date.now() + timeLeft * 1000);
  }

  function handlePause() {
    if (!isRunning || !endTimestamp) {
      return;
    }

    setTimeLeft(getSecondsLeft(endTimestamp));
    setIsRunning(false);
    setEndTimestamp(null);
    setSessionStartSeconds(null);
  }

  function handleReset() {
    setIsRunning(false);
    setEndTimestamp(null);
    setSessionStartSeconds(null);
    setTimeLeft(mode === 'study' ? getStudyDurationSeconds() : getBreakDurationSeconds());
  }

  function handleSkip() {
    const nextMode = mode === 'study' ? 'break' : 'study';
    setIsRunning(false);
    setEndTimestamp(null);
    setSessionStartSeconds(null);
    setMode(nextMode);
    setTimeLeft(nextMode === 'study' ? getStudyDurationSeconds() : getBreakDurationSeconds());
  }

  return (
    <section className="timer-card">
      <div className="timer-modes">
        <button
          type="button"
          className={mode === 'study' ? 'mode-button mode-button-active' : 'mode-button'}
          onClick={() => handleModeChange('study')}
        >
          مطالعه
        </button>
        <button
          type="button"
          className={mode === 'break' ? 'mode-button mode-button-active' : 'mode-button'}
          onClick={() => handleModeChange('break')}
        >
          استراحت
        </button>
      </div>

      <p className="timer-label">{mode === 'study' ? 'جلسه تمرکز' : 'جلسه استراحت'}</p>
      <p className="timer-display">{formatTime(timeLeft)}</p>

      <div className="timer-actions">
        <button type="button" className="timer-action-button" onClick={handleStart} disabled={isRunning}>
          شروع
        </button>
        <button type="button" className="timer-action-button" onClick={handlePause} disabled={!isRunning}>
          توقف
        </button>
        <button type="button" className="timer-action-button" onClick={handleReset}>
          ریست
        </button>
        <button type="button" className="timer-action-button" onClick={handleSkip}>
          رد کردن
        </button>
      </div>

      <div className="timer-inputs">
        <label className="timer-input-group" htmlFor="studyMinutes">
          دقیقه مطالعه
          <input
            id="studyMinutes"
            type="number"
            min="0"
            max="120"
            value={studyMinutes}
            onChange={handleStudyMinutesChange}
          />
        </label>

        <label className="timer-input-group" htmlFor="studySeconds">
          ثانیه مطالعه
          <input
            id="studySeconds"
            type="number"
            min="0"
            max="59"
            value={studySeconds}
            onChange={handleStudySecondsChange}
          />
        </label>

        <label className="timer-input-group" htmlFor="breakMinutes">
          دقیقه استراحت
          <input
            id="breakMinutes"
            type="number"
            min="0"
            max="120"
            value={breakMinutes}
            onChange={handleBreakMinutesChange}
          />
        </label>

        <label className="timer-input-group" htmlFor="breakSeconds">
          ثانیه استراحت
          <input
            id="breakSeconds"
            type="number"
            min="0"
            max="59"
            value={breakSeconds}
            onChange={handleBreakSecondsChange}
          />
        </label>
      </div>

      <p className="timer-summary">تعداد جلسه‌های تمرکز کامل‌شده: {completedStudySessions}</p>
    </section>
  );
}

export default TimerFeature;
