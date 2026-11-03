import { CalendarCheck2, Coffee, SearchX, Sparkles } from 'lucide-react';
import TaskItem from './TaskItem.jsx';
import { groupTasks } from '../lib/date.js';

function Skeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl border border-line/50 bg-surface/40 p-3.5">
          <div className="h-[22px] w-[22px] shrink-0 animate-pulse rounded-full bg-line/80" />
          <div className="flex-1 space-y-2">
            <div
              className="h-3 animate-pulse rounded-full bg-line/80"
              style={{ width: `${55 + index * 7}%` }}
            />
            <div className="h-2.5 w-24 animate-pulse rounded-full bg-line/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ view, query }) {
  if (query) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 px-6 py-14 text-center">
        <SearchX size={26} className="text-muted" />
        <p className="mt-3 text-sm font-semibold">No matches for “{query}”</p>
        <p className="mt-1 text-[12.5px] text-muted">Try a different word or clear the search.</p>
      </div>
    );
  }

  const copy = {
    all: { icon: Sparkles, title: 'Your day is clear', body: 'Add your first task above — small steps count.' },
    today: { icon: CalendarCheck2, title: 'Nothing due today', body: 'Enjoy the breathing room, or plan something small.' },
    upcoming: { icon: Coffee, title: 'No upcoming tasks', body: 'Anything scheduled ahead will show up here.' },
    completed: { icon: CalendarCheck2, title: 'Nothing completed yet', body: 'Tick a task off and it will land here.' },
  }[view] || {};

  const Icon = copy.icon || Sparkles;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 px-6 py-16 text-center animate-fade-up">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-sm font-semibold">{copy.title}</p>
      <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted">{copy.body}</p>
    </div>
  );
}

export default function TaskList({ tasks, view, status, query }) {
  if (status === 'loading' && tasks.length === 0) return <Skeleton />;
  if (tasks.length === 0) return <EmptyState view={view} query={query} />;

  const groups = groupTasks(tasks, view);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} className="animate-fade-up">
          <div className="mb-2 flex items-baseline gap-2 px-1">
            <h2 className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${group.tone || 'text-muted'}`}>
              {group.label}
            </h2>
            <span className="text-[11px] font-medium text-muted/70">{group.tasks.length}</span>
          </div>
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
