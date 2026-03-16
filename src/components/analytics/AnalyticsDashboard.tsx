"use client";

import type { Board, Task, Activity } from "@/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CompletionRateChart } from "./CompletionRateChart";
import { TasksByStatusChart } from "./TasksByStatusChart";
import { TasksByAssigneeChart } from "./TasksByAssigneeChart";
import { AverageTimeChart } from "./AverageTimeChart";

interface Props {
  board: Board;
  tasks: Task[];
  activity: Activity[];
}

export function AnalyticsDashboard({ board, tasks, activity }: Props) {
  const {
    tasksByStatus,
    tasksByAssignee,
    completionRate,
    avgTimeInColumn,
    totalTasks,
    completedTasks,
  } = useAnalytics(board, tasks);

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const inProgressCount = tasks.filter((t) => {
    const columns = board.columns;
    if (columns.length < 3) return false;
    const firstId = columns[0]?.id;
    const lastId = columns[columns.length - 1]?.id;
    return t.columnId !== firstId && t.columnId !== lastId;
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm font-medium text-gray-500">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalTasks}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm font-medium text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {completedTasks}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm font-medium text-gray-500">Completion %</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">
            {completionPercentage}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm font-medium text-gray-500">In Progress</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {inProgressCount}
          </p>
        </div>
      </div>

      {/* 2x2 chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionRateChart data={completionRate} />
        <TasksByStatusChart data={tasksByStatus} />
        <TasksByAssigneeChart data={tasksByAssignee} />
        <AverageTimeChart data={avgTimeInColumn} />
      </div>
    </div>
  );
}
