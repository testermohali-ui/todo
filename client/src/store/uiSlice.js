import { createSlice, nanoid } from '@reduxjs/toolkit';

function readTheme() {
  try {
    const saved = localStorage.getItem('focus-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

const initialState = {
  view: 'all',
  query: '',
  priority: 'all',
  sortBy: 'smart',
  theme: readTheme(),
  sidebarOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setView(state, action) {
      state.view = action.payload;
    },
    setQuery(state, action) {
      state.query = action.payload;
    },
    setPriority(state, action) {
      state.priority = action.payload;
    },
    setSort(state, action) {
      state.sortBy = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setSidebar(state, action) {
      state.sidebarOpen = action.payload;
    },
    pushToast: {
      reducer(state, action) {
        state.toasts = [...state.toasts.slice(-2), action.payload];
      },
      prepare({ message, tone = 'default', undo = null }) {
        return { payload: { id: nanoid(), message, tone, undo } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const {
  setView,
  setQuery,
  setPriority,
  setSort,
  toggleTheme,
  setSidebar,
  pushToast,
  dismissToast,
} = uiSlice.actions;

export default uiSlice.reducer;
