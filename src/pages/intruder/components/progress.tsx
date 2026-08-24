import { useProgress } from './hooks/use-progress';

export function IntruderProgress() {
  const { progress, percentage } = useProgress();

  if (!progress) {
    return null;
  }

  return (
    <div className="mt-2 p-2">
      <div className="flex items-center justify-between text-sm mb-1">
        <span>Progress</span>
        <span>
          {progress.current} / {progress.total} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export const InvokerProgress = IntruderProgress;
