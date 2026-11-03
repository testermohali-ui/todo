import { useEffect, useMemo, useRef } from 'react';
import { AlertCircle, RefreshCw, Keyboard } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import TaskComposer from './components/TaskComposer.jsx';
import TaskList from './components/TaskList.jsx';
import Toasts from './components/Toasts.jsx';
import {
  useAppDispatch,
  useAppSelector,
  selectVisibleTasks,
  selectAllTasks,
  selectTasksStatus,
  selectTasksError,
  selectUi,
} from './store/selectors.js';
import { fetchTasks, clearError } from './store/tasksSlice.js';

const IGNORED_TARGETS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export default function App() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectVisibleTasks);
  const allTasks = useAppSelector(selectAllTasks);
  const status = useAppSelector(selectTasksStatus);
  const error = useAppSelector(selectTasksError);
  const ui = useAppSelector(selectUi);

  const composerRef = useRef(null);
  const searchRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      dispatch(fetchTasks());
    }
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', ui.theme === 'dark');
    try {
      localStorage.setItem('focus-theme', ui.theme);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ui.theme === 'dark' ? '#0b1020' : '#f6f7fc');
    } catch {
      /* storage can be unavailable in private mode */
    }
  }, [ui.theme]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const typing = IGNORED_TARGETS.has(target.tagName) || target.isContentEditable;
      if (typing) return;

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        composerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeCount = useMemo(() => allTasks.filter((task) => !task.completed).length, [allTasks]);

  return (
    <div className="flex min-h-screen">
      <Sidebar onNewTask={() => composerRef.current?.focus()} />

      <main className="scrollbar-slim h-screen flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <Topbar ref={searchRef} />

          <TaskComposer ref={composerRef} />

          {error ? (
            <div className="flex items-center gap-3 rounded-xl border border-danger/25 bg-danger/[0.07] px-3.5 py-2.5 text-[12.5px] text-danger">
              <AlertCircle size={16} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => {
                  dispatch(clearError());
                  dispatch(fetchTasks());
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold hover:bg-danger/10"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between px-1">
            <p className="text-[12px] text-muted">
              <span className="font-semibold text-ink">{tasks.length}</span> shown
              <span className="mx-1.5 text-muted/50">·</span>
              <span className="font-semibold text-ink">{activeCount}</span> active
            </p>
            <p className="hidden items-center gap-1.5 text-[11px] text-muted/80 sm:flex">
              <Keyboard size={13} />
              <kbd className="rounded border border-line/80 px-1 py-0.5 font-sans text-[10px]">N</kbd> new
              <kbd className="rounded border border-line/80 px-1 py-0.5 font-sans text-[10px]">/</kbd> search
            </p>
          </div>

          <TaskList tasks={tasks} view={ui.view} status={status} query={ui.query} />
        </div>
      </main>

      <Toasts />
    </div>
  );
}
