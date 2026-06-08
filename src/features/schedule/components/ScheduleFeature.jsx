import { useEffect, useMemo, useState } from 'react';
import { loadSchedule, saveSchedule } from '../utils/scheduleStorage';
import '../styles/schedule.css';

const weekDays = [
  { key: 'saturday', label: 'شنبه' },
  { key: 'sunday', label: 'یک‌شنبه' },
  { key: 'monday', label: 'دوشنبه' },
  { key: 'tuesday', label: 'سه‌شنبه' },
  { key: 'wednesday', label: 'چهارشنبه' },
  { key: 'thursday', label: 'پنج‌شنبه' },
  { key: 'friday', label: 'جمعه' },
];

const calendarWeekLabels = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const persianDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const persianMonthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
});

const persianDayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric',
});

function cloneDate(dateValue) {
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
}

function getPersianDateParts(dateValue) {
  const parts = persianDateFormatter.formatToParts(dateValue);
  const year = Number(parts.find((item) => item.type === 'year')?.value || 0);
  const month = Number(parts.find((item) => item.type === 'month')?.value || 0);
  const day = Number(parts.find((item) => item.type === 'day')?.value || 0);

  return { year, month, day };
}

function toPersianDateKey(dateValue) {
  const { year, month, day } = getPersianDateParts(dateValue);
  const monthValue = String(month).padStart(2, '0');
  const dayValue = String(day).padStart(2, '0');
  return `${year}-${monthValue}-${dayValue}`;
}

function formatPersianMonth(dateValue) {
  return persianMonthFormatter.format(dateValue);
}

function formatDateKeyForUi(dateKey) {
  if (!dateKey) {
    return '';
  }

  const [year, month, day] = String(dateKey).split('-');

  if (!year || !month || !day) {
    return dateKey;
  }

  const toFaNumber = (value) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(Number(value));

  return `${toFaNumber(year)}/${toFaNumber(month)}/${toFaNumber(day)}`;
}

function findPersianMonthStart(baseDate) {
  const dateValue = cloneDate(baseDate);

  while (getPersianDateParts(dateValue).day !== 1) {
    dateValue.setDate(dateValue.getDate() - 1);
  }

  return dateValue;
}

function getNextPersianMonthStart(currentMonthStart) {
  const probeDate = cloneDate(currentMonthStart);
  probeDate.setDate(probeDate.getDate() + 32);
  return findPersianMonthStart(probeDate);
}

function getPreviousPersianMonthStart(currentMonthStart) {
  const probeDate = cloneDate(currentMonthStart);
  probeDate.setDate(probeDate.getDate() - 1);
  return findPersianMonthStart(probeDate);
}

function buildCalendarDays(monthStartDate) {
  const startOffset = (monthStartDate.getDay() + 1) % 7;
  const calendarDays = [];

  for (let index = 0; index < startOffset; index += 1) {
    calendarDays.push(null);
  }

  const monthStartParts = getPersianDateParts(monthStartDate);
  const cursorDate = cloneDate(monthStartDate);

  while (true) {
    const cursorParts = getPersianDateParts(cursorDate);

    if (cursorParts.year !== monthStartParts.year || cursorParts.month !== monthStartParts.month) {
      break;
    }

    calendarDays.push(cloneDate(cursorDate));
    cursorDate.setDate(cursorDate.getDate() + 1);
  }

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  return calendarDays;
}

function parseTimeToSortValue(timeText) {
  if (!timeText) {
    return Number.MAX_SAFE_INTEGER;
  }

  const ampmMatch = String(timeText).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (ampmMatch) {
    const hour12 = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2]);
    const period = ampmMatch[3].toUpperCase();

    if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) {
      return Number.MAX_SAFE_INTEGER;
    }

    let hour24 = hour12 % 12;

    if (period === 'PM') {
      hour24 += 12;
    }

    return hour24 * 60 + minute;
  }

  const hhmmMatch = String(timeText).trim().match(/^(\d{1,2}):(\d{2})$/);

  if (hhmmMatch) {
    const hour = Number(hhmmMatch[1]);
    const minute = Number(hhmmMatch[2]);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return Number.MAX_SAFE_INTEGER;
    }

    return hour * 60 + minute;
  }

  return Number.MAX_SAFE_INTEGER;
}

function compareDateAndTime(first, second) {
  const dateCompare = String(first.date || '').localeCompare(String(second.date || ''));

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return parseTimeToSortValue(first.time) - parseTimeToSortValue(second.time);
}

function buildTimeLabel(hourValue, minuteValue, periodValue) {
  const hour = String(hourValue || '').padStart(2, '0');
  const minute = String(minuteValue || '').padStart(2, '0');
  const period = periodValue === 'PM' ? 'PM' : 'AM';

  return `${hour}:${minute} ${period}`;
}

function sanitizeHour(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return '';
  }

  const safe = Math.max(1, Math.min(12, parsed));
  return String(safe).padStart(2, '0');
}

function sanitizeMinute(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return '';
  }

  const safe = Math.max(0, Math.min(59, parsed));
  return String(safe).padStart(2, '0');
}

function ScheduleFeature() {
  const initialSchedule = useMemo(() => loadSchedule(), []);
  const [schedule, setSchedule] = useState(initialSchedule);

  const [selectedDay, setSelectedDay] = useState('saturday');
  const [className, setClassName] = useState('');
  const [classHour, setClassHour] = useState('08');
  const [classMinute, setClassMinute] = useState('00');
  const [classPeriod, setClassPeriod] = useState('AM');

  const [eventTitle, setEventTitle] = useState('');
  const [eventHour, setEventHour] = useState('08');
  const [eventMinute, setEventMinute] = useState('00');
  const [eventPeriod, setEventPeriod] = useState('AM');

  const today = useMemo(() => new Date(), []);
  const [calendarMonthStart, setCalendarMonthStart] = useState(findPersianMonthStart(today));
  const [selectedDateKey, setSelectedDateKey] = useState(toPersianDateKey(today));

  useEffect(() => {
    saveSchedule(schedule);
  }, [schedule]);

  function handleAddClass(event) {
    event.preventDefault();

    const cleanName = className.trim();
    const timeLabel = buildTimeLabel(classHour, classMinute, classPeriod);

    if (!cleanName || !classHour || !classMinute) {
      return;
    }

    const newClass = {
      id: Date.now(),
      title: cleanName,
      time: timeLabel,
    };

    setSchedule((previousSchedule) => ({
      ...previousSchedule,
      weeklyClasses: {
        ...previousSchedule.weeklyClasses,
        [selectedDay]: [...previousSchedule.weeklyClasses[selectedDay], newClass].sort(
          (first, second) => parseTimeToSortValue(first.time) - parseTimeToSortValue(second.time)
        ),
      },
    }));

    setClassName('');
  }

  function handleDeleteClass(classId) {
    setSchedule((previousSchedule) => ({
      ...previousSchedule,
      weeklyClasses: {
        ...previousSchedule.weeklyClasses,
        [selectedDay]: previousSchedule.weeklyClasses[selectedDay].filter(
          (item) => item.id !== classId
        ),
      },
    }));
  }

  function handleAddDateEvent(event) {
    event.preventDefault();

    const cleanTitle = eventTitle.trim();
    const timeLabel = buildTimeLabel(eventHour, eventMinute, eventPeriod);

    if (!cleanTitle || !selectedDateKey || !eventHour || !eventMinute) {
      return;
    }

    const newEvent = {
      id: Date.now(),
      title: cleanTitle,
      date: selectedDateKey,
      time: timeLabel,
    };

    setSchedule((previousSchedule) => ({
      ...previousSchedule,
      dateSchedules: [...previousSchedule.dateSchedules, newEvent].sort(compareDateAndTime),
    }));

    setEventTitle('');
  }

  function handleDeleteDateEvent(eventId) {
    setSchedule((previousSchedule) => ({
      ...previousSchedule,
      dateSchedules: previousSchedule.dateSchedules.filter((item) => item.id !== eventId),
    }));
  }

  function goToPreviousMonth() {
    setCalendarMonthStart((previousMonthStart) => getPreviousPersianMonthStart(previousMonthStart));
  }

  function goToNextMonth() {
    setCalendarMonthStart((previousMonthStart) => getNextPersianMonthStart(previousMonthStart));
  }

  const selectedClasses = useMemo(
    () =>
      (schedule.weeklyClasses[selectedDay] || [])
        .slice()
        .sort((first, second) => parseTimeToSortValue(first.time) - parseTimeToSortValue(second.time)),
    [schedule.weeklyClasses, selectedDay]
  );

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonthStart), [calendarMonthStart]);

  const selectedDateEvents = useMemo(
    () =>
      (schedule.dateSchedules || [])
        .filter((item) => item.date === selectedDateKey)
        .sort((first, second) => parseTimeToSortValue(first.time) - parseTimeToSortValue(second.time)),
    [schedule.dateSchedules, selectedDateKey]
  );

  return (
    <section className="schedule-layout">
      <section className="schedule-card">
        <h3 className="schedule-section-title">ردیاب کلاس هفتگی</h3>

        <div className="schedule-day-tabs">
          {weekDays.map((day) => (
            <button
              key={day.key}
              type="button"
              className={selectedDay === day.key ? 'day-tab day-tab-active' : 'day-tab'}
              onClick={() => setSelectedDay(day.key)}
            >
              {day.label}
            </button>
          ))}
        </div>

        <form className="schedule-form" onSubmit={handleAddClass}>
          <label htmlFor="className">نام کلاس</label>
          <input
            id="className"
            type="text"
            placeholder="ریاضی"
            value={className}
            onChange={(event) => setClassName(event.target.value)}
          />

          <label>ساعت کلاس</label>
          <div className="time-picker-row">
            <input
              type="number"
              min="1"
              max="12"
              placeholder="ساعت"
              value={classHour}
              onChange={(event) => setClassHour(sanitizeHour(event.target.value))}
            />
            <span className="time-separator">:</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="دقیقه"
              value={classMinute}
              onChange={(event) => setClassMinute(sanitizeMinute(event.target.value))}
            />
            <div className="ampm-toggle">
              <button
                type="button"
                className={classPeriod === 'AM' ? 'ampm-button ampm-button-active' : 'ampm-button'}
                onClick={() => setClassPeriod('AM')}
              >
                AM
              </button>
              <button
                type="button"
                className={classPeriod === 'PM' ? 'ampm-button ampm-button-active' : 'ampm-button'}
                onClick={() => setClassPeriod('PM')}
              >
                PM
              </button>
            </div>
          </div>

          <button type="submit" className="schedule-add-button">
            افزودن کلاس هفتگی
          </button>
        </form>

        {selectedClasses.length === 0 ? (
          <p className="schedule-empty">برای این روز هنوز کلاسی ثبت نشده است.</p>
        ) : (
          <ul className="schedule-list">
            {selectedClasses.map((item) => (
              <li key={item.id} className="schedule-item">
                <div>
                  <p className="task-time">{item.time}</p>
                  <p className="task-subject">{item.title}</p>
                </div>

                <div className="schedule-actions">
                  <button
                    type="button"
                    className="schedule-action-button schedule-delete-button"
                    onClick={() => handleDeleteClass(item.id)}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="schedule-card">
        <h3 className="schedule-section-title">تقویم برنامه‌های تاریخ‌دار (ایرانی)</h3>

        <div className="calendar-header">
          <button type="button" className="calendar-nav-btn" onClick={goToPreviousMonth}>
            ماه قبل
          </button>
          <p className="calendar-month-label">{formatPersianMonth(calendarMonthStart)}</p>
          <button type="button" className="calendar-nav-btn" onClick={goToNextMonth}>
            ماه بعد
          </button>
        </div>

        <div className="calendar-grid-labels">
          {calendarWeekLabels.map((item) => (
            <span key={item} className="calendar-week-label">
              {item}
            </span>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((dayValue, index) => {
            if (!dayValue) {
              return <div key={`blank-${index}`} className="calendar-cell calendar-cell-empty" />;
            }

            const dateKey = toPersianDateKey(dayValue);
            const isSelected = selectedDateKey === dateKey;
            const hasEvents = (schedule.dateSchedules || []).some((item) => item.date === dateKey);

            return (
              <button
                key={dateKey}
                type="button"
                className={
                  isSelected ? 'calendar-cell calendar-cell-selected' : 'calendar-cell'
                }
                onClick={() => setSelectedDateKey(dateKey)}
              >
                <span>{persianDayFormatter.format(dayValue)}</span>
                {hasEvents ? <span className="calendar-dot" /> : null}
              </button>
            );
          })}
        </div>

        <form className="schedule-form" onSubmit={handleAddDateEvent}>
          <label htmlFor="eventTitle">عنوان برنامه برای تاریخ انتخاب‌شده</label>
          <input
            id="eventTitle"
            type="text"
            placeholder="امتحان میان‌ترم"
            value={eventTitle}
            onChange={(event) => setEventTitle(event.target.value)}
          />

          <label>ساعت</label>
          <div className="time-picker-row">
            <input
              type="number"
              min="1"
              max="12"
              placeholder="ساعت"
              value={eventHour}
              onChange={(event) => setEventHour(sanitizeHour(event.target.value))}
            />
            <span className="time-separator">:</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="دقیقه"
              value={eventMinute}
              onChange={(event) => setEventMinute(sanitizeMinute(event.target.value))}
            />
            <div className="ampm-toggle">
              <button
                type="button"
                className={eventPeriod === 'AM' ? 'ampm-button ampm-button-active' : 'ampm-button'}
                onClick={() => setEventPeriod('AM')}
              >
                AM
              </button>
              <button
                type="button"
                className={eventPeriod === 'PM' ? 'ampm-button ampm-button-active' : 'ampm-button'}
                onClick={() => setEventPeriod('PM')}
              >
                PM
              </button>
            </div>
          </div>

          <button type="submit" className="schedule-add-button">
            افزودن برنامه تاریخ‌دار
          </button>
        </form>

        {selectedDateEvents.length === 0 ? (
          <p className="schedule-empty">برای این تاریخ برنامه‌ای ثبت نشده است.</p>
        ) : (
          <ul className="schedule-list">
            {selectedDateEvents.map((item) => (
              <li key={item.id} className="schedule-item">
                <div>
                  <p className="task-time">
                    {formatDateKeyForUi(item.date)} - {item.time}
                  </p>
                  <p className="task-subject">{item.title}</p>
                </div>

                <div className="schedule-actions">
                  <button
                    type="button"
                    className="schedule-action-button schedule-delete-button"
                    onClick={() => handleDeleteDateEvent(item.id)}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

export default ScheduleFeature;
