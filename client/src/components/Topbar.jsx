import { forwardRef } from 'react';
import { Menu, Search, ArrowUpDown, X } from 'lucide-react';
import { useAppDispatch, useAppSelector, selectUi } from '../store/selectors.js';
import { setQuery, setSort, setSidebar } from '../store/uiSlice.js';
import { dayjs } from '../lib/date.js';

const VIEW_COPY = {
  all: { title: 'All tasks', subtitle: 'Everything on your plate' },
  today: { title: 'Today', subtitle: 'Due today and overdue' },
  upcoming: { title: 'Upcoming', subtitle: 'Planned for later' },
  completed: { title: 'Completed', subtitle: 'Done and dusted' },
};

const SORT_OPTIONS = [
  { value: 'smart', label: 'Smart' },
  { value: 'due', label: 'Due date' },
  { value: 'created', label: 'Newest' },
  { value: 'title', label: 'A–Z' },
];

const Topbar = forwardRef(function Topbar(_props, searchRef) {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(selectUi);
  const copy = VIEW_COPY[ui.view] || VIEW_COPY.all;

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="icon-btn mt-0.5 border border-line/70 lg:hidden"
          onClick={() => dispatch(setSidebar(true))}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {dayjs().format('dddd, MMMM D')}
          </p>
          <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight sm:text-[28px]">
            {copy.title}
          </h1>
          <p className="text-[13px] text-muted">{copy.subtitle}</p>
        </div>

        <div className="relative hidden w-[280px] shrink-0 sm:block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            value={ui.query}
            onChange={(event) => dispatch(setQuery(event.target.value))}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="field !py-2 !pl-9 !pr-9"
          />
          {ui.query ? (
            <button
              type="button"
              onClick={() => dispatch(setQuery(''))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line/80 px-1.5 py-0.5 text-[10px] font-semibold text-muted/80">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:hidden">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            value={ui.query}
            onChange={(event) => dispatch(setQuery(event.target.value))}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="field !py-2 !pl-9"
          />
        </div>

        <label className="ml-auto flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/60 px-2.5 py-2 text-[12px] text-muted">
          <ArrowUpDown size={13} />
          <span className="hidden xs:inline">Sort</span>
          <select
            value={ui.sortBy}
            onChange={(event) => dispatch(setSort(event.target.value))}
            aria-label="Sort tasks"
            className="cursor-pointer bg-transparent text-[12px] font-medium text-ink outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
});

export default Topbar;
