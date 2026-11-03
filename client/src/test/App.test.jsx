import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App.jsx';
import tasksReducer from '../store/tasksSlice.js';
import uiReducer from '../store/uiSlice.js';
import api from '../api/client.js';

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const baseTask = {
  id: '1',
  title: 'Write the launch post',
  notes: 'Draft in Notion',
  completed: false,
  priority: 'high',
  dueDate: null,
  tags: ['writing'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderApp() {
  const store = configureStore({ reducer: { tasks: tasksReducer, ui: uiReducer } });
  return { store, ...render(<Provider store={store}><App /></Provider>) };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { tasks: [baseTask] } });
});

describe('App', () => {
  it('renders tasks loaded from the API', async () => {
    renderApp();
    expect(await screen.findByText('Write the launch post')).toBeInTheDocument();
  });

  it('completes a task through the API', async () => {
    api.patch.mockResolvedValue({ data: { task: { ...baseTask, completed: true } } });
    renderApp();
    await screen.findByText('Write the launch post');

    await userEvent.click(screen.getByRole('button', { name: /Complete "Write the launch post"/ }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/tasks/1', { completed: true }));
  });

  it('creates a new task from the composer', async () => {
    api.post.mockResolvedValue({ data: { task: { ...baseTask, id: '2', title: 'Ship it' } } });
    renderApp();
    await screen.findByText('Write the launch post');

    await userEvent.type(screen.getByLabelText('New task title'), 'Ship it');
    await userEvent.click(screen.getByRole('button', { name: /Add/ }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/tasks', expect.objectContaining({ title: 'Ship it' })),
    );
    expect(await screen.findByText('Ship it')).toBeInTheDocument();
  });

  it('deletes a task and offers an undo toast', async () => {
    api.delete.mockResolvedValue({ data: {} });
    renderApp();
    await screen.findByText('Write the launch post');

    await userEvent.click(screen.getByRole('button', { name: /Delete "Write the launch post"/ }));

    expect(await screen.findByText('Task deleted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Undo/ })).toBeInTheDocument();
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/tasks/1'));
  });
});
