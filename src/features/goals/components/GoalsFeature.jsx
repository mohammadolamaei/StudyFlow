import { useEffect, useMemo, useState } from 'react';
import { loadGoals, saveGoals } from '../utils/goalsStorage';
import '../styles/goals.css';

function getTodayPersianParts() {
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());

  return {
    year: parts.find((item) => item.type === 'year')?.value || '',
    month: parts.find((item) => item.type === 'month')?.value || '',
    day: parts.find((item) => item.type === 'day')?.value || '',
  };
}

function toPersianDateKey(year, month, day) {
  if (!year || !month || !day) {
    return '';
  }

  const safeYear = String(year).slice(0, 4);
  const safeMonth = String(month).padStart(2, '0').slice(0, 2);
  const safeDay = String(day).padStart(2, '0').slice(0, 2);

  return `${safeYear}-${safeMonth}-${safeDay}`;
}

function formatDateKeyForUi(dateKey) {
  if (!dateKey) {
    return 'بدون تاریخ هدف';
  }

  const [year, month, day] = String(dateKey).split('-');

  if (!year || !month || !day) {
    return `تاریخ هدف: ${dateKey}`;
  }

  const toFaNumber = (value) => new Intl.NumberFormat('fa-IR').format(Number(value));

  return `تاریخ هدف: ${toFaNumber(year)}/${toFaNumber(month)}/${toFaNumber(day)}`;
}

function GoalsFeature() {
  const initialGoals = useMemo(() => loadGoals(), []);
  const todayPersian = useMemo(() => getTodayPersianParts(), []);

  const [goals, setGoals] = useState(initialGoals);
  const [title, setTitle] = useState('');
  const [targetYear, setTargetYear] = useState(todayPersian.year);
  const [targetMonth, setTargetMonth] = useState(todayPersian.month);
  const [targetDay, setTargetDay] = useState(todayPersian.day);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  function sanitizeYear(value) {
    const numeric = String(value).replace(/\D/g, '').slice(0, 4);
    return numeric;
  }

  function sanitizeMonth(value) {
    const numeric = Number(String(value).replace(/\D/g, ''));

    if (!numeric) {
      return '';
    }

    return String(Math.max(1, Math.min(12, numeric))).padStart(2, '0');
  }

  function sanitizeDay(value) {
    const numeric = Number(String(value).replace(/\D/g, ''));

    if (!numeric) {
      return '';
    }

    return String(Math.max(1, Math.min(31, numeric))).padStart(2, '0');
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    const targetDate = toPersianDateKey(targetYear, targetMonth, targetDay);

    const newGoal = {
      id: Date.now(),
      title: cleanTitle,
      targetDate,
      isDone: false,
    };

    setGoals((previousGoals) => [newGoal, ...previousGoals]);
    setTitle('');
  }

  function setTodayDate() {
    const today = getTodayPersianParts();
    setTargetYear(today.year);
    setTargetMonth(today.month);
    setTargetDay(today.day);
  }

  function toggleGoal(goalId) {
    setGoals((previousGoals) =>
      previousGoals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }

        return {
          ...goal,
          isDone: !goal.isDone,
        };
      })
    );
  }

  function deleteGoal(goalId) {
    setGoals((previousGoals) => previousGoals.filter((goal) => goal.id !== goalId));
  }

  const completedCount = goals.filter((goal) => goal.isDone).length;

  return (
    <section className="goals-card">
      <form className="goals-form" onSubmit={handleSubmit}>
        <label htmlFor="goalTitle">عنوان هدف</label>
        <input
          id="goalTitle"
          type="text"
          placeholder="تمرین‌های فصل ۴ را کامل کنم"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <label>تاریخ هدف (تقویم ایرانی)</label>
        <div className="goals-date-inputs">
          <input
            type="number"
            placeholder="سال"
            value={targetYear}
            onChange={(event) => setTargetYear(sanitizeYear(event.target.value))}
          />
          <input
            type="number"
            placeholder="ماه"
            min="1"
            max="12"
            value={targetMonth}
            onChange={(event) => setTargetMonth(sanitizeMonth(event.target.value))}
          />
          <input
            type="number"
            placeholder="روز"
            min="1"
            max="31"
            value={targetDay}
            onChange={(event) => setTargetDay(sanitizeDay(event.target.value))}
          />
          <button type="button" className="goal-action-button" onClick={setTodayDate}>
            امروز
          </button>
        </div>

        <button type="submit" className="goal-add-button">
          افزودن هدف
        </button>
      </form>

      <div className="goals-summary">
        <p>کل اهداف: {goals.length}</p>
        <p>انجام‌شده: {completedCount}</p>
      </div>

      {goals.length === 0 ? (
        <p className="goals-empty">هنوز هدفی ثبت نشده است.</p>
      ) : (
        <ul className="goals-list">
          {goals.map((goal) => (
            <li key={goal.id} className="goal-item">
              <div>
                <p className={goal.isDone ? 'goal-title goal-title-done' : 'goal-title'}>
                  {goal.title}
                </p>
                <p className="goal-date">{formatDateKeyForUi(goal.targetDate)}</p>
              </div>

              <div className="goal-actions">
                <button
                  type="button"
                  className="goal-action-button"
                  onClick={() => toggleGoal(goal.id)}
                >
                  {goal.isDone ? 'بازگردانی' : 'انجام شد'}
                </button>
                <button
                  type="button"
                  className="goal-action-button goal-delete-button"
                  onClick={() => deleteGoal(goal.id)}
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default GoalsFeature;
