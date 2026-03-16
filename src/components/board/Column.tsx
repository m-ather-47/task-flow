"use client";

import { Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { AddTaskForm } from "./AddTaskForm";
import type { Column as ColumnType, Task } from "@/types";

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  boardId: string;
  onAddTask: (columnId: string, title: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

function Column({ column, tasks, boardId, onAddTask, onTaskClick }: ColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-50">
      {/* Column header with color accent */}
      <div
        className="rounded-t-xl border-t-[3px] px-3 pb-2 pt-3"
        style={{ borderTopColor: column.color }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-1 transition-colors",
              snapshot.isDraggingOver && "bg-indigo-50/50"
            )}
            style={{ minHeight: 60 }}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task form */}
      <div className="px-1 pb-2">
        <AddTaskForm columnId={column.id} onAdd={onAddTask} />
      </div>
    </div>
  );
}
Column.displayName = "Column";

export { Column };
