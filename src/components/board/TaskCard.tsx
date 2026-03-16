"use client";

import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { Task, Priority } from "@/types";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  urgent: { color: "#ef4444", label: "Urgent" },
  high: { color: "#f97316", label: "High" },
  medium: { color: "#eab308", label: "Medium" },
  low: { color: "#22c55e", label: "Low" },
};

function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority];

  const formattedDueDate = task.dueDate
    ? formatDate(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue =
    task.dueDate && !task.completedAt && formatDate(task.dueDate) < new Date();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={cn(
            "group cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
            snapshot.isDragging && "shadow-lg ring-2 ring-indigo-500/20"
          )}
        >
          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <Badge key={label} variant="subtle" className="text-[10px]">
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <p className="text-sm font-medium text-gray-900">{task.title}</p>

          {/* Description (truncated) */}
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {task.description}
            </p>
          )}

          {/* Footer: priority, assignee, due date */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Priority indicator */}
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: priority.color }}
                title={priority.label}
              />

              {/* Due date */}
              {formattedDueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formattedDueDate}
                </span>
              )}
            </div>

            {/* Assignee avatar */}
            {task.assigneeId && (
              <Avatar
                name={task.assigneeId}
                size="sm"
              />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
TaskCard.displayName = "TaskCard";

export { TaskCard };
