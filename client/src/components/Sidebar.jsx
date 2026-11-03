import { useMemo } from 'react';
import {
  Inbox,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Plus,
  Sparkles,
  Moon,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import { useAppDispatch, useAppSelector, selectStats, selectUi } from '../store/selectors.js';
import { setView, setPriority, toggleTheme, setSidebar, pushToast } from '../store/uiSlice.js';
import { clearCompleted } from '../store/tasksSlice.js';

const PRIORITIES = [
  { value: 'all', label: 'Any', dot: 'bg-muted/50' },
  { value: 'high', label: 'High', dot: 'bg-danger' },
  { value: 'medium', label: 'Medium', dot: 'bg-warn' },
  { value: 'low', label: 'Low', dot: 'bg-ok' },
];

export default function Sidebar({ onNewTask }) {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectStats);
  const ui = useAppSelector(selectUi);

  const items = useMemo(
    () => [
      { value: 'all', label: 'All tasks', icon: Inbox, count: stats.active },
      { value: 'today', label: 'Today', icon: CalendarDays, count: stats.today + stats.overdue },
      { value: 'upcoming', label: 'Upcoming', icon: CalendarClock, count: stats.upcoming },
      { value: 'completed', label: 'Completed', icon: CheckCircle2, count: stats.completed },
    ],
    [stats],
  );

  const handleView = (view) => {
    dispatch(setView(view));
    dispatch(setSidebar(false));
  };

  return (
    <>
      <div
        onClick={() => dispatch(setSidebar(false))}
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          ui.sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[278px] flex-col gap-6 border-r border-line/70 bg-surface/90 p-5 backdrop-blur-2xl transition-transform duration-300 lg:static lg:z-0 lg:translate-x-0 lg:bg-surface/50 ${
          ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-glow"
              style={{ backgroundImage: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))' }}
            >
              <Sparkles size={17} strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Focus</p>
              <p className="text-[11px] text-muted">Todo workspace</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn lg:hidden"
            onClick={() => dispatch(setSidebar(false))}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <button type="button" className="btn-primary w-full" onClick={onNewTask}>
          <Plus size={16} strokeWidth={2.6} />
          New task
          <kbd className="ml-auto rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">N</kbd>
        </button>

        <nav className="flex flex-col gap-1">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
            Smart views
          </p>
          {items.map(({ value, label, icon: Icon, count }) => {
            const active = ui.view === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleView(value)}
                className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition ${
                  active
                    ? 'bg-accent/10 font-semibold text-accent'
                    : 'text-muted hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                {label}
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active ? 'bg-accent/15 text-accent' : 'bg-ink/[0.05] text-muted dark:bg-white/[0.07]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <div>
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
            Priority
          </p>
          <div className="flex flex-wrap gap-1.5 px-1">
            {PRIORITIES.map((option) => {
              const active = ui.priority === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => dispatch(setPriority(active && option.value !== 'all' ? 'all' : option.value))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-line/80 text-muted hover:border-line hover:text-ink'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="card flex items-center gap-3 p-3.5">
            <ProgressRing value={stats.progress} size={64} stroke={6} />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                {stats.completed} of {stats.total} done
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {stats.overdue > 0 ? `${stats.overdue} overdue · ` : ''}
                {stats.high} high priority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="btn-ghost flex-1 justify-start border border-line/70"
              aria-label="Toggle color theme"
            >
              {ui.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {ui.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              type="button"
              disabled={stats.completed === 0}
              onClick={async () => {
                const result = await dispatch(clearCompleted());
                if (clearCompleted.fulfilled.match(result)) {
                  dispatch(
                    pushToast({
                      message: `Cleared ${result.payload.deletedCount} completed task${
                        result.payload.deletedCount === 1 ? '' : 's'
                      }`,
                    }),
                  );
                }
              }}
              className="icon-btn border border-line/70 disabled:opacity-40"
              aria-label="Clear completed tasks"
              title="Clear completed"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
