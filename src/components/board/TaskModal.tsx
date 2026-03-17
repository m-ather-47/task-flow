"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ActivityFeed } from "./ActivityFeed";
import { CommentForm } from "./CommentForm";
import { CollaborativeInput } from "@/components/collaborative/CollaborativeInput";
import { CollaborativeTextarea } from "@/components/collaborative/CollaborativeTextarea";
import { subscribeToActivity } from "@/lib/firestore";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCollaborativeTask } from "@/hooks/useCollaborativeTask";
import { formatDate } from "@/lib/utils";
import type { Task, Board, Activity, Priority } from "@/types";

interface TaskModalProps {
  task: Task | null;
  board: Board;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string, title: string) => Promise<void>;
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function TaskModal({ task, board, onClose, onUpdate, onDelete }: TaskModalProps) {
  const { user } = useAuthContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deleting, setDeleting] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Collaborative editing hook
  const {
    titleText,
    descText,
    remoteUsers,
    updateCursor,
    clearCursor,
  } = useCollaborativeTask({
    boardId: board.id,
    taskId: task?.id || "",
    user,
    initialData: {
      title: task?.title || "",
      description: task?.description || "",
    },
    onUpdate: (field, value) => {
      // Debounce saves to Firestore
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (task) {
          if (field === "title" && value.trim()) {
            onUpdate(task.id, { title: value.trim() });
          } else if (field === "description") {
            onUpdate(task.id, { description: value });
          }
        }
      }, 1000);
    },
  });

  // Subscribe to activity for this task
  useEffect(() => {
    if (!task) return;
    const unsub = subscribeToActivity(task.boardId, (acts) => {
      setActivities(acts);
    });
    return unsub;
  }, [task]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      clearCursor();
    };
  }, [clearCursor]);

  // Immediate saves for non-collaborative fields
  const handleAssigneeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!task) return;
      const val = e.target.value;
      onUpdate(task.id, { assigneeId: val || null });
    },
    [task, onUpdate]
  );

  const handlePriorityChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!task) return;
      onUpdate(task.id, { priority: e.target.value as Priority });
    },
    [task, onUpdate]
  );

  const handleDueDateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!task) return;
      const value = e.target.value;
      onUpdate(task.id, {
        dueDate: value ? new Date(value) : null,
      });
    },
    [task, onUpdate]
  );

  const handleLabelsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!task) return;
      const labels = e.target.value
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      onUpdate(task.id, { labels });
    },
    [task, onUpdate]
  );

  const handleDelete = useCallback(async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await onDelete(task.id, task.title);
      onClose();
    } finally {
      setDeleting(false);
    }
  }, [task, onDelete, onClose]);

  const handleCursorChange = useCallback(
    (field: string, index: number, length: number) => {
      updateCursor(field, index, length);
    },
    [updateCursor]
  );

  if (!task) return null;

  const memberEntries = Object.values(board.members);
  const currentColumn = board.columns.find((c) => c.id === task.columnId);

  const dueDateValue = task.dueDate
    ? formatDate(task.dueDate).toISOString().split("T")[0]
    : "";

  // Get users currently editing this task
  const activeEditors = remoteUsers.filter((u) => u.cursor !== null);

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      title=""
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Active editors indicator */}
        {activeEditors.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex -space-x-1">
              {activeEditors.slice(0, 3).map((editor) => (
                <div
                  key={editor.odId}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                  style={{ backgroundColor: editor.color }}
                  title={editor.odName}
                >
                  {editor.odName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span>
              {activeEditors.map((e) => e.odName).join(", ")}{" "}
              {activeEditors.length === 1 ? "is" : "are"} editing
            </span>
          </div>
        )}

        {/* Column badge */}
        {currentColumn && (
          <Badge color={currentColumn.color}>{currentColumn.title}</Badge>
        )}

        {/* Title - Collaborative */}
        <div className="pt-2">
          <CollaborativeInput
            yText={titleText}
            field="title"
            placeholder="Task title"
            remoteUsers={remoteUsers}
            onCursorChange={handleCursorChange}
            onBlur={clearCursor}
          />
        </div>

        {/* Description - Collaborative */}
        <div className="pt-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Description
          </label>
          <CollaborativeTextarea
            yText={descText}
            field="description"
            placeholder="Add a description..."
            rows={3}
            remoteUsers={remoteUsers}
            onCursorChange={handleCursorChange}
            onBlur={clearCursor}
          />
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Assignee */}
          <Select
            label="Assignee"
            value={task.assigneeId ?? ""}
            onChange={handleAssigneeChange}
          >
            <option value="">Unassigned</option>
            {memberEntries.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.displayName}
              </option>
            ))}
          </Select>

          {/* Priority */}
          <Select
            label="Priority"
            value={task.priority}
            onChange={handlePriorityChange}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          {/* Due date */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDateValue}
              onChange={handleDueDateChange}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Labels */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Labels
            </label>
            <input
              type="text"
              defaultValue={task.labels.join(", ")}
              onBlur={handleLabelsChange}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="bug, feature, design"
            />
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Activity / Comments */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Activity</h4>

          {user && (
            <CommentForm
              boardId={task.boardId}
              taskId={task.id}
              user={user}
            />
          )}

          <div className="mt-4">
            <ActivityFeed activities={activities} taskId={task.id} />
          </div>
        </div>

        {/* Delete */}
        <div className="flex justify-end pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Task"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
TaskModal.displayName = "TaskModal";

export { TaskModal };
