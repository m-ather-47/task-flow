"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { addActivity } from "@/lib/firestore";
import type { User } from "@/types";

interface CommentFormProps {
  boardId: string;
  taskId: string;
  user: User;
}

function CommentForm({ boardId, taskId, user }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await addActivity(boardId, {
        boardId,
        taskId,
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        type: "comment",
        content: trimmed,
      });
      setContent("");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <Avatar
        src={user.photoURL}
        name={user.displayName}
        size="sm"
        className="mt-1 shrink-0"
      />
      <div className="flex flex-1 items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment..."
          className="block flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          disabled={submitting}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || submitting}
        >
          {submitting ? "..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
CommentForm.displayName = "CommentForm";

export { CommentForm };
