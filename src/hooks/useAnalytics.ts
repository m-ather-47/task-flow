"use client";

import { useMemo } from "react";
import type { Task, Board } from "@/types";
import { differenceInHours, subDays, startOfDay, format } from "date-fns";
import { formatDate } from "@/lib/utils";

export function useAnalytics(board: Board, tasks: Task[]) {
  const tasksByStatus = useMemo(() => {
    return board.columns.map((col) => ({
      name: col.title,
      value: tasks.filter((t) => t.columnId === col.id).length,
      color: col.color,
    }));
  }, [board.columns, tasks]);

  const tasksByAssignee = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      const assignee = task.assigneeId
        ? board.members[task.assigneeId]?.displayName ?? "Unknown"
        : "Unassigned";
      counts[assignee] = (counts[assignee] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [tasks, board.members]);

  const completionRate = useMemo(() => {
    const days = 30;
    const data: Array<{ date: string; completed: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "MMM dd");
      const completed = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const completedDate = formatDate(t.completedAt);
        return format(startOfDay(completedDate), "MMM dd") === dayStr;
      }).length;
      data.push({ date: dayStr, completed });
    }
    return data;
  }, [tasks]);

  const avgTimeInColumn = useMemo(() => {
    return board.columns.map((col) => {
      const colTasks = tasks.filter((t) => t.columnId === col.id);
      if (colTasks.length === 0) return { name: col.title, hours: 0 };
      const totalHours = colTasks.reduce((sum, t) => {
        const updated = formatDate(t.updatedAt);
        return sum + differenceInHours(new Date(), updated);
      }, 0);
      return {
        name: col.title,
        hours: Math.round(totalHours / colTasks.length),
      };
    });
  }, [board.columns, tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) =>
      t.columnId ===
      board.columns[board.columns.length - 1]?.id
  ).length;

  return {
    tasksByStatus,
    tasksByAssignee,
    completionRate,
    avgTimeInColumn,
    totalTasks,
    completedTasks,
  };
}
