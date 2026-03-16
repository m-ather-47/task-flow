"use client";

import {
  createTask,
  batchUpdateTaskOrders,
  addActivity,
  updateTask as updateTaskFirestore,
  deleteTask as deleteTaskFirestore,
} from "@/lib/firestore";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Task } from "@/types";

export function useTasks(boardId: string) {
  const { user } = useAuthContext();

  const addTask = async (
    columnId: string,
    title: string,
    extras?: Partial<Task>
  ) => {
    if (!user) return;
    const taskId = await createTask(boardId, {
      boardId,
      columnId,
      order: Date.now(),
      title,
      description: extras?.description ?? "",
      assigneeId: extras?.assigneeId ?? null,
      priority: extras?.priority ?? "medium",
      dueDate: extras?.dueDate ?? null,
      labels: extras?.labels ?? [],
      createdBy: user.uid,
      completedAt: null,
    });

    await addActivity(boardId, {
      boardId,
      taskId,
      userId: user.uid,
      userName: user.displayName,
      userPhotoURL: user.photoURL,
      type: "task_created",
      content: `created task "${title}"`,
    });
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    await updateTaskFirestore(boardId, taskId, updates);
  };

  const removeTask = async (taskId: string, title: string) => {
    if (!user) return;
    await deleteTaskFirestore(boardId, taskId);
    await addActivity(boardId, {
      boardId,
      taskId,
      userId: user.uid,
      userName: user.displayName,
      userPhotoURL: user.photoURL,
      type: "task_deleted",
      content: `deleted task "${title}"`,
    });
  };

  const reorderTasks = async (
    updates: Array<{ taskId: string; order: number; columnId?: string }>
  ) => {
    await batchUpdateTaskOrders(boardId, updates);
  };

  return { addTask, updateTask, removeTask, reorderTasks };
}
