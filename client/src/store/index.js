import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './tasksSlice.js';
import uiReducer from './uiSlice.js';

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg', 'payload.undo', 'payload.tasks'],
      },
    }),
});

export default store;
