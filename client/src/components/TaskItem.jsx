import { useEffect, useRef, useState } from 'react';
import { Check, Trash2, Pencil, Calendar, Tag, Flag, X, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../store/selectors.js';
import { toggleTask, updateTask, removeTask } from '../store/tasksSlice.js';
import { pushToast } from '../store/uiSlice.js';
import { PRIORITY_META, dueTone, formatDue, toDateInputValue } from '../lib/date.js';

export default function TaskItem({ task }) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft({
        title: task.title,
        notes: task.notes || '',
        priority: task.priority,
        dueDate: toDateInputValue(task.dueDate),
        tags: (task.tags || []).join(', '),
      });
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [editing, task]);

  const toggle = () => {
    dispatch(toggleTask(task));
  };

  const remove = () => {
    dispatch(removeTask(task));
    dispatch(
      pushToast({
        message: 'Task deleted',
        tone: 'danger',
        undo: task,
      }),
    );
  };

  const save = async (event) => {
    event.preventDefault();
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) return;

    setBusy(true);
    const result = await dispatch(
      updateTask({
        id: task.id,
        changes: {
          title,
          notes: draft.notes,
          priority: draft.priority,
          dueDate: draft.dueDate || null,
          tags: draft.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      }),
    );
    setBusy(false);

    if (updateTask.fulfilled.match(result)) {
      setEditing(false);
      dispatch(pushToast({ message: 'Task updated' }));
    }
  };

  if (editing && draft) {
    return (
      <form onSubmit={save} className="card animate-fade-up space-y-3 p-3.5">
        <input
          ref={titleRef}
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          maxLength={160}
          className="field text-[15px] font-medium"
          aria-label="Task title"
        />
        <textarea
          value={draft.notes}
          onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
          placeholder="Add notes…"
          rows={2}
          maxLength={2000}
          className="field resize-none"
          aria-label="Task notes"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-line/80 bg-raised/60 p-1">
            <Flag size={14} className="ml-1 text-muted" />
            {Object.entries(PRIORITY_META).map(([value, meta]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDraft({ ...draft, priority: value })}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  draft.priority === value
                    ? 'bg-ink/[0.06] text-ink dark:bg-white/10'
                    : 'text-muted hover:text-ink'
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
              value={draft.dueDate}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              className="w-[122px] bg-transparent text-[12px] text-ink outline-none"
              aria-label="Due date"
            />
          </label>

          <label className="flex flex-1 items-center gap-2 rounded-xl border border-line/80 bg-raised/60 px-2.5 py-2">
            <Tag size={14} className="shrink-0 text-muted" />
            <input
              value={draft.tags}
              onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
              placeholder="tags"
              className="min-w-[90px] flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/70"
              aria-label="Tags"
            />
          </label>

          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              <X size={15} /> Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !draft.title.trim()}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={3} />}
              Save
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-2xl border px-3 py-3 transition-all duration-200 ${
        task.completed
          ? 'border-transparent bg-transparent hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]'
          : 'border-line/70 bg-surface/70 shadow-soft hover:-translate-y-px hover:border-accent/30 hover:shadow-lift'
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={task.completed ? `Mark "${task.title}" as active` : `Complete "${task.title}"`}
        aria-pressed={task.completed}
        className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
          task.completed
            ? 'border-transparent text-white'
            : 'border-line hover:border-accent/70 hover:bg-accent/5'
        }`}
        style={
          task.completed
            ? { backgroundImage: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))' }
            : undefined
        }
      >
        {task.completed && <Check size={13} strokeWidth={3.4} className="animate-pop" />}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full text-left"
          title="Click to edit"
        >
          <p
            className={`break-words text-[14.5px] font-medium leading-snug transition ${
              task.completed ? 'text-muted line-through decoration-muted/50' : 'text-ink'
            }`}
          >
            {task.title}
          </p>
          {task.notes ? (
            <p
              className={`mt-1 line-clamp-2 text-[12.5px] leading-relaxed ${
                task.completed ? 'text-muted/70' : 'text-muted'
              }`}
            >
              {task.notes}
            </p>
          ) : null}
        </button>

        {(task.dueDate || (task.tags && task.tags.length > 0) || !task.completed) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {!task.completed && (
              <span className={`chip !border-transparent !bg-transparent !pl-0 ${PRIORITY_META[task.priority]?.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_META[task.priority]?.dot}`} />
                {PRIORITY_META[task.priority]?.label}
              </span>
            )}
            {task.dueDate && (
              <span className={`chip ${dueTone(task)}`}>
                <Calendar size={11} />
                {formatDue(task.dueDate)}
              </span>
            )}
            {(task.tags || []).map((tag) => (
              <span key={tag} className="chip">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="icon-btn !h-8 !w-8"
          aria-label={`Edit "${task.title}"`}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={remove}
          className="icon-btn !h-8 !w-8 hover:!bg-danger/10 hover:!text-danger"
          aria-label={`Delete "${task.title}"`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
