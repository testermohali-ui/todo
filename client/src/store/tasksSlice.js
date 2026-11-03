import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import api from '../api/client.js';

const adapter = createEntityAdapter({
  sortComparer: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
});

const initialState = adapter.getInitialState({
  status: 'idle',
  saving: false,
  error: null,
  initialized: false,
});

export const fetchTasks = createAsyncThunk('tasks/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks');
    return data.tasks;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const addTask = createAsyncThunk('tasks/add', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/tasks', payload);
    return data.task;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/tasks/${id}`, changes);
      return data.task;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const toggleTask = createAsyncThunk('tasks/toggle', async (task, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/tasks/${task.id}`, { completed: !task.completed });
    return data.task;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const removeTask = createAsyncThunk('tasks/remove', async (task, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${task.id}`);
    return task;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const clearCompleted = createAsyncThunk(
  'tasks/clearCompleted',
  async (_, { getState, rejectWithValue }) => {
    const removed = Object.values(getState().tasks.entities).filter((task) => task?.completed);
    try {
      const { data } = await api.delete('/tasks/completed');
      return { deletedCount: data.deletedCount, tasks: removed };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    restoreTask(state, action) {
      adapter.addOne(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        adapter.setAll(state, action.payload);
        state.status = 'succeeded';
        state.initialized = true;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load tasks';
      })
      .addCase(addTask.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.saving = false;
        adapter.addOne(state, action.payload);
      })
      .addCase(addTask.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        adapter.upsertOne(state, action.payload);
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(toggleTask.pending, (state, action) => {
        adapter.updateOne(state, {
          id: action.meta.arg.id,
          changes: { completed: !action.meta.arg.completed },
        });
      })
      .addCase(toggleTask.fulfilled, (state, action) => {
        adapter.upsertOne(state, action.payload);
      })
      .addCase(toggleTask.rejected, (state, action) => {
        adapter.updateOne(state, {
          id: action.meta.arg.id,
          changes: { completed: action.meta.arg.completed },
        });
        state.error = action.payload;
      })
      .addCase(removeTask.pending, (state, action) => {
        adapter.removeOne(state, action.meta.arg.id);
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        state.error = null;
        void action;
      })
      .addCase(removeTask.rejected, (state, action) => {
        adapter.addOne(state, action.meta.arg);
        state.error = action.payload;
      })
      .addCase(clearCompleted.fulfilled, (state, action) => {
        adapter.removeMany(
          state,
          action.payload.tasks.map((task) => task.id),
        );
      })
      .addCase(clearCompleted.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, restoreTask } = tasksSlice.actions;
export { adapter as tasksAdapter };
export default tasksSlice.reducer;
