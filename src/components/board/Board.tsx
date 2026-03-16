"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { midpoint } from "@/lib/utils";
import { Column } from "./Column";
import { Button } from "@/components/ui/Button";
import type { Board as BoardType, Task } from "@/types";

interface TaskActions {
  addTask: (columnId: string, title: string, extras?: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (taskId: string, title: string) => Promise<void>;
  reorderTasks: (
    updates: Array<{ taskId: string; order: number; columnId?: string }>
  ) => Promise<void>;
}

interface BoardProps {
  board: BoardType;
  tasksByColumn: Record<string, Task[]>;
  taskActions: TaskActions;
  onTaskClick: (task: Task) => void;
}

function Board({ board, tasksByColumn, taskActions, onTaskClick }: BoardProps) {
  // Local state for optimistic updates
  const [localTasksByColumn, setLocalTasksByColumn] =
    useState<Record<string, Task[]>>(tasksByColumn);

  // Sync from props when Firestore pushes new data
  useEffect(() => {
    setLocalTasksByColumn(tasksByColumn);
  }, [tasksByColumn]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;

      // Dropped outside a droppable
      if (!destination) return;

      // Dropped in same position
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const sourceColId = source.droppableId;
      const destColId = destination.droppableId;
      const sourceTasks = [...(localTasksByColumn[sourceColId] ?? [])];
      const destTasks =
        sourceColId === destColId
          ? sourceTasks
          : [...(localTasksByColumn[destColId] ?? [])];

      // Remove from source
      const [movedTask] = sourceTasks.splice(source.index, 1);
      if (!movedTask) return;

      // Insert into destination
      destTasks.splice(destination.index, 0, movedTask);

      // Calculate new order using midpoint strategy
      const destIndex = destination.index;
      let newOrder: number;

      if (destTasks.length === 1) {
        newOrder = Date.now();
      } else if (destIndex === 0) {
        // Placed at the top
        newOrder = destTasks[1].order - 1000;
      } else if (destIndex === destTasks.length - 1) {
        // Placed at the bottom
        newOrder = destTasks[destTasks.length - 2].order + 1000;
      } else {
        // Placed between two tasks
        const before = destTasks[destIndex - 1].order;
        const after = destTasks[destIndex + 1].order;
        newOrder = midpoint(before, after);
      }

      // Update the moved task in the local array
      destTasks[destIndex] = {
        ...movedTask,
        order: newOrder,
        columnId: destColId,
      };

      // Optimistically update local state
      const updated = { ...localTasksByColumn };
      if (sourceColId === destColId) {
        updated[sourceColId] = destTasks;
      } else {
        updated[sourceColId] = sourceTasks;
        updated[destColId] = destTasks;
      }
      setLocalTasksByColumn(updated);

      // Persist to Firestore
      try {
        await taskActions.reorderTasks([
          {
            taskId: draggableId,
            order: newOrder,
            ...(sourceColId !== destColId ? { columnId: destColId } : {}),
          },
        ]);
      } catch {
        // Revert on error
        setLocalTasksByColumn(tasksByColumn);
      }
    },
    [localTasksByColumn, tasksByColumn, taskActions]
  );

  const handleAddTask = useCallback(
    async (columnId: string, title: string) => {
      await taskActions.addTask(columnId, title);
    },
    [taskActions]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={localTasksByColumn[column.id] ?? []}
            boardId={board.id}
            onAddTask={handleAddTask}
            onTaskClick={onTaskClick}
          />
        ))}

        {/* Add Column button */}
        <div className="flex shrink-0 items-start">
          <Button
            variant="ghost"
            className="flex h-auto w-72 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-8 text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Column
          </Button>
        </div>
      </div>
    </DragDropContext>
  );
}
Board.displayName = "Board";

export { Board };
