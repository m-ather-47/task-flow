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
import { subscribeToActivity } from "@/lib/firestore";
import { useAuthContext } from "@/contexts/AuthContext";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deleting, setDeleting] = useState(false);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
    }
  }, [task]);

  // Subscribe to activity for this task
  useEffect(() => {
    if (!task) return;
    const unsub = subscribeToActivity(task.boardId, (acts) => {
      setActivities(acts);
    });
    return unsub;
  }, [task]);

  // Debounced title save
  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTitle(value);
      if (!task) return;

      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = setTimeout(() => {
        if (value.trim()) {
          onUpdate(task.id, { title: value.trim() });
        }
      }, 500);
    },
    [task, onUpdate]
  );

  // Debounced description save
  const handleDescriptionChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDescription(value);
      if (!task) return;

      if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
      descDebounceRef.current = setTimeout(() => {
        onUpdate(task.id, { description: value });
      }, 500);
    },
    [task, onUpdate]
  );

  // Immediate saves
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

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
    };
  }, []);

  if (!task) return null;

  const memberEntries = Object.values(board.members);
  const currentColumn = board.columns.find((c) => c.id === task.columnId);

  const dueDateValue = task.dueDate
    ? formatDate(task.dueDate).toISOString().split("T")[0]
    : "";

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      title=""
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Column badge */}
        {currentColumn && (
          <Badge color={currentColumn.color}>{currentColumn.title}</Badge>
        )}

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="block w-full border-0 bg-transparent p-0 text-xl font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          placeholder="Task title"
        />

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            placeholder="Add a description..."
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
