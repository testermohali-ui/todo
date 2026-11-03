import { useEffect } from 'react';
import { X, Undo2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector, selectUi } from '../store/selectors.js';
import { dismissToast, pushToast } from '../store/uiSlice.js';
import { addTask } from '../store/tasksSlice.js';

const TONES = {
  default: { icon: CheckCircle2, accent: 'text-ok' },
  danger: { icon: AlertTriangle, accent: 'text-danger' },
};

function Toast({ toast }) {
  const dispatch = useAppDispatch();
  const tone = TONES[toast.tone] || TONES.default;
  const Icon = tone.icon;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 6000);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  const undo = async () => {
    if (!toast.undo) return;
    const { title, notes, priority, dueDate, tags } = toast.undo;
    dispatch(dismissToast(toast.id));
    const result = await dispatch(addTask({ title, notes, priority, dueDate, tags }));
    if (addTask.fulfilled.match(result)) {
      dispatch(pushToast({ message: 'Task restored' }));
    }
  };

  return (
    <div className="card flex w-[min(92vw,340px)] animate-toast-in items-center gap-2.5 p-3 pl-3.5">
      <Icon size={17} className={`shrink-0 ${tone.accent}`} />
      <p className="flex-1 text-[12.5px] font-medium leading-snug">{toast.message}</p>
      {toast.undo ? (
        <button type="button" onClick={undo} className="btn-ghost !px-2 !py-1 !text-[11.5px] !text-accent">
          <Undo2 size={13} /> Undo
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded-md p-1 text-muted transition hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toasts() {
  const { toasts } = useAppSelector(selectUi);

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2 sm:right-6">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
