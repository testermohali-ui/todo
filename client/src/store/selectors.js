import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { tasksAdapter } from './tasksSlice.js';
import { isDueToday, isOverdue, isUpcoming, startOfDay } from '../lib/date.js';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

const selectAdapter = (state) => state.tasks;
export const selectAllTasks = createSelector(selectAdapter, tasksAdapter.getSelectors().selectAll);
export const selectTasksStatus = (state) => state.tasks.status;
export const selectTasksError = (state) => state.tasks.error;
export const selectSaving = (state) => state.tasks.saving;
export const selectUi = (state) => state.ui;

export const selectStats = createSelector([selectAllTasks], (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const overdue = tasks.filter(isOverdue).length;
  const today = tasks.filter(isDueToday).length;
  const upcoming = tasks.filter(isUpcoming).length;
  const high = tasks.filter((task) => !task.completed && task.priority === 'high').length;
  return {
    total,
    completed,
    active: total - completed,
    overdue,
    today,
    upcoming,
    high,
    progress: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
});

const PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 };

function matchesView(task, view) {
  switch (view) {
    case 'today':
      return !task.completed && (isDueToday(task) || isOverdue(task));
    case 'upcoming':
      return isUpcoming(task);
    case 'completed':
      return task.completed;
    default:
      return true;
  }
}

function sortTasks(tasks, sortBy) {
  const list = [...tasks];
  if (sortBy === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }
  if (sortBy === 'created') {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }
  list.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const aDue = a.dueDate ? startOfDay(a.dueDate).valueOf() : Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate ? startOfDay(b.dueDate).valueOf() : Number.MAX_SAFE_INTEGER;
    if (aDue !== bDue) return aDue - bDue;
    if (PRIORITY_WEIGHT[a.priority] !== PRIORITY_WEIGHT[b.priority]) {
      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return list;
}

export const selectVisibleTasks = createSelector(
  [selectAllTasks, selectUi],
  (tasks, ui) => {
    const query = ui.query.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (!matchesView(task, ui.view)) return false;
      if (ui.priority !== 'all' && task.priority !== ui.priority) return false;
      if (!query) return true;
      return (
        task.title.toLowerCase().includes(query) ||
        (task.notes || '').toLowerCase().includes(query) ||
        (task.tags || []).some((tag) => tag.toLowerCase().includes(query))
      );
    });
    return sortTasks(filtered, ui.sortBy);
  },
);
