"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";

interface AddTaskFormProps {
  columnId: string;
  onAdd: (columnId: string, title: string) => Promise<void>;
}

function AddTaskForm({ columnId, onAdd }: AddTaskFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(columnId, trimmed);
      setTitle("");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setTitle("");
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add a task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title..."
        className="mb-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        disabled={submitting}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!title.trim() || submitting}>
          {submitting ? "Adding..." : "Add"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
AddTaskForm.displayName = "AddTaskForm";

export { AddTaskForm };
