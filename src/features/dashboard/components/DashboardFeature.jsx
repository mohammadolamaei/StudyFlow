import { useEffect, useMemo, useState } from 'react';
import { loadGoals } from '../../goals/utils/goalsStorage';
import { loadNotes } from '../../notes/utils/notesStorage';
import { loadSchedule } from '../../schedule/utils/scheduleStorage';
import { getTodayPersianDateKey, loadTimerState } from '../../timer/utils/timerStorage';
import '../styles/dashboard.css';

const weekOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const dayLabelByKey = {
  saturday: 'شنبه',
  sunday: 'یک‌شنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه',
};

function getCurrentPersianYearMonth() {
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
    year: 'numeric',
    month: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());

  return {
    year: parts.find((item) => item.type === 'year')?.value || '',
    month: parts.find((item) => item.type === 'month')?.value || '',
  };
}

function formatDateKeyForUi(dateKey) {
  if (!dateKey) {
    return '';
  }

  const [year, month, day] = String(dateKey).split('-');

  if (!year || !month || !day) {
    return dateKey;
  }

  const toFaNumber = (value) => new Intl.NumberFormat('fa-IR').format(Number(value));

  return `${toFaNumber(year)}/${toFaNumber(month)}/${toFaNumber(day)}`;
}

function getElapsedSeconds(timerState) {
  if (!timerState || timerState.mode !== 'study' || !timerState.isRunning || !timerState.endTimestamp) {
    return 0;
  }

  const sessionStart = Number(timerState.sessionStartSeconds) || 0;
  if (sessionStart <= 0) {
    return 0;
  }

  const left = Math.max(0, Math.ceil((timerState.endTimestamp - Date.now()) / 1000));
  const elapsed = sessionStart - left;
  return Math.max(0, elapsed);
}

function formatStudyDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours === 0 && minutes === 0 && seconds === 0) {
    return '0 ثانیه';
  }

  if (hours === 0 && minutes === 0) {
    return `${seconds} ثانیه`;
  }

  if (hours === 0) {
    return `${minutes} دقیقه و ${seconds} ثانیه`;
  }

  return `${hours} ساعت و ${minutes} دقیقه و ${seconds} ثانیه`;
}

function DashboardFeature() {
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const dashboardData = useMemo(() => {
    const timer = loadTimerState();
    const goals = loadGoals();
    const notes = loadNotes();
    const schedule = loadSchedule();

    const completedGoals = goals.filter((goal) => goal.isDone).length;
    const todayDateKey = getTodayPersianDateKey();
    const finishedTodayStudySeconds = timer.dailyStudySeconds?.[todayDateKey] || 0;
    const currentSessionElapsedSeconds = getElapsedSeconds(timer);
    const totalTodayStudySeconds = finishedTodayStudySeconds + currentSessionElapsedSeconds;

    const recentGoals = goals.slice(0, 5);
    const recentNotes = notes.slice(0, 5);

    const { year: currentYear, month: currentMonth } = getCurrentPersianYearMonth();
    const monthPrefix = `${currentYear}-${currentMonth}`;

    const monthlyCalendarItems = (schedule.dateSchedules || [])
      .filter((item) => String(item.date || '').startsWith(monthPrefix))
      .sort((first, second) => {
        const firstValue = `${first.date}T${first.time}`;
        const secondValue = `${second.date}T${second.time}`;
        return firstValue.localeCompare(secondValue);
      })
      .slice(0, 8);

    const classTrackerBoard = weekOrder.map((dayKey) => {
      const classes = schedule.weeklyClasses?.[dayKey] || [];

      return {
        dayKey,
        dayLabel: dayLabelByKey[dayKey],
        classes: classes
          .slice()
          .sort((first, second) => first.time.localeCompare(second.time)),
      };
    });

    const summary = {
      totalStudySessions: timer.completedStudySessions,
      totalGoals: goals.length,
      completedGoals,
      totalNotes: notes.length,
      monthlyCalendarCount: monthlyCalendarItems.length,
      weeklyClassesCount: classTrackerBoard.reduce((total, day) => total + day.classes.length, 0),
      completionRate:
        goals.length === 0 ? 0 : Math.round((completedGoals / goals.length) * 100),
    };

    return {
      recentGoals,
      recentNotes,
      totalTodayStudySeconds,
      currentSessionElapsedSeconds,
      summary,
      monthlyCalendarItems,
      classTrackerBoard,
      currentYear,
      currentMonth,
    };
  }, [tick]);

  return (
    <section className="dashboard-grid">
      <div className="dashboard-card">
        <h3>تایمر مطالعه امروز</h3>
        <p className="dashboard-number dashboard-number-small">
          {formatStudyDuration(dashboardData.totalTodayStudySeconds)}
        </p>
        <p className="dashboard-hint">همراه با زمان گذشته جلسه در حال اجرا</p>
      </div>

      <div className="dashboard-card">
        <h3>زمان گذشته جلسه فعلی</h3>
        <p className="dashboard-number dashboard-number-small">
          {formatStudyDuration(dashboardData.currentSessionElapsedSeconds)}
        </p>
        <p className="dashboard-hint">در صورت اجرای تایمر، هر ثانیه آپدیت می‌شود</p>
      </div>

      <div className="dashboard-card">
        <h3>خلاصه آمار</h3>
        <ul className="dashboard-stats-list">
          <li>جلسه‌های تمرکز: {dashboardData.summary.totalStudySessions}</li>
          <li>کل اهداف: {dashboardData.summary.totalGoals}</li>
          <li>اهداف انجام‌شده: {dashboardData.summary.completedGoals}</li>
          <li>کل یادداشت‌ها: {dashboardData.summary.totalNotes}</li>
          <li>رویدادهای ماه جاری: {dashboardData.summary.monthlyCalendarCount}</li>
          <li>کلاس‌های هفتگی: {dashboardData.summary.weeklyClassesCount}</li>
          <li>نرخ انجام اهداف: {dashboardData.summary.completionRate}٪</li>
        </ul>
      </div>

      <div className="dashboard-card dashboard-wide">
        <h3>برنامه‌های تقویم ماه جاری</h3>
        <p className="dashboard-hint dashboard-hint-spaced">
          {new Intl.NumberFormat('fa-IR').format(Number(dashboardData.currentYear))}/
          {new Intl.NumberFormat('fa-IR').format(Number(dashboardData.currentMonth))}
        </p>

        {dashboardData.monthlyCalendarItems.length === 0 ? (
          <p className="dashboard-empty">برای این ماه برنامه تاریخ‌دار ثبت نشده است.</p>
        ) : (
          <ul className="dashboard-notes-list">
            {dashboardData.monthlyCalendarItems.map((item) => (
              <li key={item.id} className="dashboard-note-item">
                <p className="dashboard-note-title">{item.title}</p>
                <p className="dashboard-note-text">
                  {formatDateKeyForUi(item.date)} - {item.time}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dashboard-card dashboard-wide">
        <h3>برد ردیاب کلاس هفتگی</h3>
        <div className="dashboard-class-board">
          {dashboardData.classTrackerBoard.map((day) => (
            <div key={day.dayKey} className="dashboard-class-column">
              <p className="dashboard-class-day">{day.dayLabel}</p>
              {day.classes.length === 0 ? (
                <p className="dashboard-note-text dashboard-class-empty">بدون کلاس</p>
              ) : (
                <ul className="dashboard-class-list">
                  {day.classes.map((item) => (
                    <li key={item.id} className="dashboard-class-item">
                      <span className="dashboard-class-time">{item.time}</span>
                      <span className="dashboard-class-title">{item.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-card dashboard-wide">
        <h3>اهداف</h3>
        {dashboardData.recentGoals.length === 0 ? (
          <p className="dashboard-empty">هنوز هدفی ثبت نشده است.</p>
        ) : (
          <ul className="dashboard-notes-list">
            {dashboardData.recentGoals.map((goal) => (
              <li key={goal.id} className="dashboard-note-item">
                <p className="dashboard-note-title">{goal.title}</p>
                <p className="dashboard-note-text">
                  {goal.targetDate
                    ? `تاریخ هدف: ${formatDateKeyForUi(goal.targetDate)}${goal.isDone ? ' - انجام‌شده' : ''}`
                    : goal.isDone
                      ? 'بدون تاریخ هدف - انجام‌شده'
                      : 'بدون تاریخ هدف'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dashboard-card dashboard-wide">
        <h3>یادداشت‌ها</h3>
        {dashboardData.recentNotes.length === 0 ? (
          <p className="dashboard-empty">هنوز یادداشتی ثبت نشده است.</p>
        ) : (
          <ul className="dashboard-notes-list">
            {dashboardData.recentNotes.map((note) => (
              <li key={note.id} className="dashboard-note-item">
                <p className="dashboard-note-title">{note.title}</p>
                <p className="dashboard-note-text">{note.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default DashboardFeature;
