import { useMemo } from 'react';
import { loadGoals } from '../../goals/utils/goalsStorage';
import { loadNotes } from '../../notes/utils/notesStorage';
import { loadSchedule } from '../../schedule/utils/scheduleStorage';
import { loadTimerState } from '../../timer/utils/timerStorage';
import '../styles/statistics.css';

function getScheduleStats(schedule) {
  const weeklyClasses = Object.values(schedule.weeklyClasses || {}).flat();
  const dateSchedules = schedule.dateSchedules || [];

  return {
    weeklyClassesCount: weeklyClasses.length,
    dateSchedulesCount: dateSchedules.length,
  };
}

function getGoalStats(goals) {
  const doneGoals = goals.filter((goal) => goal.isDone).length;

  return {
    total: goals.length,
    done: doneGoals,
  };
}

function getPercent(done, total) {
  if (total === 0) {
    return 0;
  }

  return Math.round((done / total) * 100);
}

function StatisticsFeature() {
  const stats = useMemo(() => {
    const timer = loadTimerState();
    const goals = loadGoals();
    const notes = loadNotes();
    const schedule = loadSchedule();

    const goalStats = getGoalStats(goals);
    const scheduleStats = getScheduleStats(schedule);

    return {
      focusSessions: timer.completedStudySessions,
      notesCount: notes.length,
      goalStats,
      scheduleStats,
      goalPercent: getPercent(goalStats.done, goalStats.total),
    };
  }, []);

  return (
    <section className="stats-grid">
      <div className="stats-card">
        <h3>کل جلسه‌های تمرکز</h3>
        <p className="stats-number">{stats.focusSessions}</p>
      </div>

      <div className="stats-card">
        <h3>کل یادداشت‌ها</h3>
        <p className="stats-number">{stats.notesCount}</p>
      </div>

      <div className="stats-card">
        <h3>کل کلاس‌های هفتگی</h3>
        <p className="stats-number">{stats.scheduleStats.weeklyClassesCount}</p>
      </div>

      <div className="stats-card">
        <h3>کل برنامه‌های تاریخ‌دار</h3>
        <p className="stats-number">{stats.scheduleStats.dateSchedulesCount}</p>
      </div>

      <div className="stats-card stats-wide">
        <h3>تکمیل اهداف</h3>
        <p className="stats-label">
          {stats.goalStats.done} از {stats.goalStats.total} تکمیل شده
        </p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${stats.goalPercent}%` }} />
        </div>
        <p className="stats-percent">{stats.goalPercent}%</p>
      </div>
    </section>
  );
}

export default StatisticsFeature;
