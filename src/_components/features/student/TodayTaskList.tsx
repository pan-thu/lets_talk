import { TodayTaskItem } from "./TodayTaskItem";

interface Task {
  taskName: string;
  // isCompleted?: boolean; // For future use
}

interface TodayTaskListProps {
  tasks: Task[];
}

export function TodayTaskList({ tasks }: TodayTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-center text-sm text-gray-600">
          No tasks scheduled for today. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {tasks.map((task, index) => (
        <TodayTaskItem key={index} taskName={task.taskName} />
      ))}
    </div>
  );
}
