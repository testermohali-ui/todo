import { forwardRef, useState } from 'react';
import { Plus, Calendar, Tag, Flag, Loader2, ChevronUp } from 'lucide-react';
import { useAppDispatch, useAppSelector, selectSaving } from '../store/selectors.js';
import { addTask } from '../store/tasksSlice.js';
import { PRIORITY_META, dayjs } from '../lib/date.js';

const todayValue = () => dayjs().format('YYYY-MM-DD');
const tomorrowValue = () => dayjs().add(1, 'day').format('YYYY-MM-DD');

const TaskComposer = forwardRef(function TaskComposer(_props, ref) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector(selectSaving);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [expanded, setExpanded] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const clean = title.trim();
    if (!clean || saving) return;

    const result = await dispatch(
      addTask({
        title: clean,
        priority,
        dueDate: dueDate || null,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    );

    if (addTask.fulfilled.match(result)) {
      setTitle('');
      setDueDate('');
      setTags('');
      setPriority('medium');
      setExpanded(false);
      if (ref?.current) ref.current.focus();
    }
  };

  return (
    <form onSubmit={submit} className="card overflow-hidden">
      <div className="flex items-center gap-2 p-2 pl-3">
        <Plus size={18} className="shrink-0 text-accent" strokeWidth={2.6} />
        <input
          ref={ref}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="What needs doing?"
          maxLength={160}
          aria-label="New task title"
          className="h-11 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-muted/80"
        />
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="icon-btn"
          aria-label={expanded ? 'Hide options' : 'Show options'}
          aria-expanded={expanded}
        >
          <ChevronUp size={17} className={`transition-transform ${expanded ? '' : 'rotate-180'}`} />
        </button>
        <button type="submit" className="btn-primary" disabled={!title.trim() || saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.8} />}
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      <div
        className={`grid border-t border-line/70 transition-all duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="flex items-center gap-1 rounded-xl border border-line/80 bg-raised/60 p-1">
              <Flag size={14} className="ml-1 text-muted" />
              {Object.entries(PRIORITY_META).map(([value, meta]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriority(value)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    priority === value ? 'bg-ink/[0.06] text-ink dark:bg-white/10' : 'text-muted hover:text-ink'
                  }`}
                >
                  <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-line/80 bg-raised/60 px-2.5 py-2">
              <Calendar size={14} className="text-muted" />
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                aria-label="Due date"
                className="w-[122px] bg-transparent text-[12px] text-ink outline-none"
              />
            </label>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setDueDate(todayValue())}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                  dueDate === todayValue() ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-ink/[0.05]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDueDate(tomorrowValue())}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                  dueDate === tomorrowValue() ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-ink/[0.05]'
                }`}
              >
                Tomorrow
              </button>
            </div>

            <label className="flex flex-1 items-center gap-2 rounded-xl border border-line/80 bg-raised/60 px-2.5 py-2">
              <Tag size={14} className="shrink-0 text-muted" />
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="tags, comma separated"
                aria-label="Tags"
                className="min-w-[120px] flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/70"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
});

export default TaskComposer;
