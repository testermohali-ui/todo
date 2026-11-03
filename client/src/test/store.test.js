import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, {
  fetchTasks,
  addTask,
  toggleTask,
  removeTask,
  updateTask,
} from '../store/tasksSlice.js';
import uiReducer from '../store/uiSlice.js';
import api from '../api/client.js';

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const makeTask = (overrides = {}) => ({
  id: 'a1',
  title: 'Write tests',
  notes: '',
  completed: false,
  priority: 'medium',
  dueDate: null,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const buildStore = () => configureStore({ reducer: { tasks: tasksReducer, ui: uiReducer } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tasks slice', () => {
  it('loads tasks from the API', async () => {
    api.get.mockResolvedValue({
      data: { tasks: [makeTask(), makeTask({ id: 'a2', title: 'Second' })] },
    });
    const store = buildStore();
    await store.dispatch(fetchTasks());
    expect(store.getState().tasks.status).toBe('succeeded');
    expect(Object.keys(store.getState().tasks.entities)).toHaveLength(2);
  });

  it('stores the error message when loading fails', async () => {
    api.get.mockRejectedValue(new Error('Network down'));
    const store = buildStore();
    await store.dispatch(fetchTasks());
    expect(store.getState().tasks.status).toBe('failed');
    expect(store.getState().tasks.error).toBe('Network down');
  });

  it('adds a task returned by the API', async () => {
    api.post.mockResolvedValue({ data: { task: makeTask({ id: 'new' }) } });
    const store = buildStore();
    await store.dispatch(addTask({ title: 'Write tests' }));
    expect(api.post).toHaveBeenCalledWith('/tasks', { title: 'Write tests' });
    expect(store.getState().tasks.entities.new.title).toBe('Write tests');
  });

  it('optimistically toggles then keeps the server version', async () => {
    api.get.mockResolvedValue({ data: { tasks: [makeTask()] } });
    api.patch.mockResolvedValue({ data: { task: makeTask({ completed: true }) } });
    const store = buildStore();
    await store.dispatch(fetchTasks());

    const pending = store.dispatch(toggleTask(store.getState().tasks.entities.a1));
    expect(store.getState().tasks.entities.a1.completed).toBe(true);
    await pending;
    expect(api.patch).toHaveBeenCalledWith('/tasks/a1', { completed: true });
    expect(store.getState().tasks.entities.a1.completed).toBe(true);
  });

  it('rolls back an optimistic toggle when the request fails', async () => {
    api.get.mockResolvedValue({ data: { tasks: [makeTask()] } });
    api.patch.mockRejectedValue(new Error('Offline'));
    const store = buildStore();
    await store.dispatch(fetchTasks());

    await store.dispatch(toggleTask(store.getState().tasks.entities.a1));
    expect(store.getState().tasks.entities.a1.completed).toBe(false);
    expect(store.getState().tasks.error).toBe('Offline');
  });

  it('restores the task when a delete fails', async () => {
    api.get.mockResolvedValue({ data: { tasks: [makeTask()] } });
    api.delete.mockRejectedValue(new Error('Nope'));
    const store = buildStore();
    await store.dispatch(fetchTasks());

    await store.dispatch(removeTask(store.getState().tasks.entities.a1));
    expect(store.getState().tasks.entities.a1.title).toBe('Write tests');
  });

  it('applies server updates for edits', async () => {
    api.get.mockResolvedValue({ data: { tasks: [makeTask()] } });
    api.patch.mockResolvedValue({ data: { task: makeTask({ title: 'Renamed' }) } });
    const store = buildStore();
    await store.dispatch(fetchTasks());

    await store.dispatch(updateTask({ id: 'a1', changes: { title: 'Renamed' } }));
    expect(store.getState().tasks.entities.a1.title).toBe('Renamed');
  });
});
