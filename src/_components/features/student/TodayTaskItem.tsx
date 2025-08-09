interface TodayTaskItemProps {
  taskName: string;
  // isCompleted?: boolean; // For future use
}

export function TodayTaskItem({ taskName }: TodayTaskItemProps) {
  return (
    <div className="flex h-14 items-center justify-center rounded-full border border-gray-400 bg-[var(--color-white)] px-4 py-2 text-center text-sm text-[var(--color-dark-text)]">
      {taskName}
    </div>
  );
}
