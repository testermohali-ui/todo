import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday.js';
import isYesterday from 'dayjs/plugin/isYesterday.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(relativeTime);

export { dayjs };

export const startOfDay = (value) => dayjs(value).startOf('day');

export const isOverdue = (task) =>
  !task.completed && !!task.dueDate && startOfDay(task.dueDate).isBefore(startOfDay(), 'day');

export const isDueToday = (task) =>
  !task.completed && !!task.dueDate && startOfDay(task.dueDate).isToday();

export const isUpcoming = (task) =>
  !task.completed && !!task.dueDate && startOfDay(task.dueDate).isAfter(startOfDay(), 'day');

export function formatDue(value) {
  if (!value) return '';
  const date = startOfDay(value);
  const diff = date.diff(startOfDay(), 'day');
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${date.fromNow(true)} overdue`;
  if (diff < 7) return date.format('ddd');
  return date.format(date.year() === dayjs().year() ? 'MMM D' : 'MMM D, YYYY');
}

export function toDateInputValue(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '';
}

export function dueTone(task) {
  if (task.completed) return 'text-muted';
  if (isOverdue(task)) return 'text-danger';
  if (isDueToday(task)) return 'text-warn';
  return 'text-muted';
}

export const PRIORITY_META = {
  high: { label: 'High', dot: 'bg-danger', text: 'text-danger', ring: 'ring-danger/25' },
  medium: { label: 'Medium', dot: 'bg-warn', text: 'text-warn', ring: 'ring-warn/25' },
  low: { label: 'Low', dot: 'bg-ok', text: 'text-ok', ring: 'ring-ok/25' },
};

/**
 * Groups a list of tasks into ordered sections for the main view.
 */
export function groupTasks(tasks, view) {
  if (view === 'completed') return [{ key: 'completed', label: 'Completed', tasks }];

  const overdue = [];
  const today = [];
  const upcoming = [];
  const later = [];
  const done = [];

  for (const task of tasks) {
    if (task.completed) done.push(task);
    else if (isOverdue(task)) overdue.push(task);
    else if (isDueToday(task)) today.push(task);
    else if (isUpcoming(task)) upcoming.push(task);
    else later.push(task);
  }

  const groups = [
    { key: 'overdue', label: 'Overdue', tasks: overdue, tone: 'text-danger' },
    { key: 'today', label: 'Today', tasks: today, tone: 'text-warn' },
    { key: 'upcoming', label: 'Upcoming', tasks: upcoming },
    { key: 'later', label: 'No date', tasks: later },
    { key: 'done', label: 'Completed', tasks: done },
  ];

  return groups.filter((group) => group.tasks.length > 0);
}
