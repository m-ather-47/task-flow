"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Board, Task, Activity } from "@/types";
import { subscribeToTasks, subscribeToActivity } from "@/lib/firestore";

export function useBoard(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubBoard = onSnapshot(doc(db, "boards", boardId), (snap) => {
      if (snap.exists()) {
        setBoard({ id: snap.id, ...snap.data() } as Board);
      }
      setLoading(false);
    });

    const unsubTasks = subscribeToTasks(boardId, setTasks);
    const unsubActivity = subscribeToActivity(boardId, setActivity);

    return () => {
      unsubBoard();
      unsubTasks();
      unsubActivity();
    };
  }, [boardId]);

  const tasksByColumn = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.columnId]) acc[task.columnId] = [];
    acc[task.columnId].push(task);
    return acc;
  }, {});

  return { board, tasks, tasksByColumn, activity, loading };
}
