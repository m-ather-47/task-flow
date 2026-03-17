"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
} from "react";
import * as Y from "yjs";
import { cn } from "@/lib/utils";

interface RemoteUser {
  odId: string;
  odName: string;
  color: string;
  cursor: {
    field: string;
    index: number;
    length: number;
  } | null;
}

interface CollaborativeTextareaProps {
  yText: Y.Text | null;
  field: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  remoteUsers: RemoteUser[];
  onCursorChange: (field: string, index: number, length: number) => void;
  onBlur?: () => void;
}

export function CollaborativeTextarea({
  yText,
  field,
  placeholder,
  className,
  rows = 3,
  remoteUsers,
  onCursorChange,
  onBlur,
}: CollaborativeTextareaProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  // Subscribe to yText changes
  useEffect(() => {
    if (!yText) return;

    const updateValue = () => {
      setValue(yText.toString());
    };

    updateValue();
    yText.observe(updateValue);

    return () => {
      yText.unobserve(updateValue);
    };
  }, [yText]);

  // Handle input changes
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (!yText || isComposingRef.current) return;

      const newValue = e.target.value;
      const oldValue = yText.toString();
      const selectionStart = e.target.selectionStart || 0;

      // Calculate diff and apply to yText
      if (newValue.length > oldValue.length) {
        // Text was inserted
        const insertPos = selectionStart - (newValue.length - oldValue.length);
        const insertedText = newValue.slice(insertPos, selectionStart);
        yText.insert(insertPos, insertedText);
      } else if (newValue.length < oldValue.length) {
        // Text was deleted
        const deleteLength = oldValue.length - newValue.length;
        yText.delete(selectionStart, deleteLength);
      } else {
        // Text was replaced (same length)
        let changeStart = 0;
        while (changeStart < oldValue.length && oldValue[changeStart] === newValue[changeStart]) {
          changeStart++;
        }
        if (changeStart < oldValue.length) {
          yText.delete(changeStart, 1);
          yText.insert(changeStart, newValue[changeStart]);
        }
      }

      // Update cursor position
      onCursorChange(field, selectionStart, 0);
    },
    [yText, field, onCursorChange]
  );

  // Handle selection changes
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    onCursorChange(field, start, end - start);
  }, [field, onCursorChange]);

  // Handle key events for cursor position updates
  const handleKeyUp = useCallback(() => {
    handleSelect();
  }, [handleSelect]);

  // Get remote cursors for this field
  const remoteCursors = remoteUsers.filter((u) => u.cursor?.field === field);

  return (
    <div className="relative">
      {/* Remote user indicators */}
      {remoteCursors.length > 0 && (
        <div className="absolute -top-6 left-0 flex gap-1 z-10">
          {remoteCursors.map((user) => (
            <span
              key={user.odId}
              className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: user.color }}
            >
              {user.odName}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onSelect={handleSelect}
          onKeyUp={handleKeyUp}
          onBlur={onBlur}
          onCompositionStart={() => (isComposingRef.current = true)}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            handleChange(e as unknown as ChangeEvent<HTMLTextAreaElement>);
          }}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none",
            className
          )}
          style={
            remoteCursors.length > 0
              ? { borderColor: remoteCursors[0].color, boxShadow: `0 0 0 2px ${remoteCursors[0].color}33` }
              : undefined
          }
        />

        {/* Visual cursor indicators inside textarea - positioned relative to text */}
        {remoteCursors.map((user) => {
          if (!user.cursor || !textareaRef.current) return null;

          // Calculate approximate cursor position
          const text = value.slice(0, user.cursor.index);
          const lines = text.split("\n");
          const lineIndex = lines.length - 1;
          const charIndex = lines[lineIndex].length;

          // Rough positioning (8px per character, 20px per line)
          const left = 12 + charIndex * 8;
          const top = 8 + lineIndex * 20;

          return (
            <div
              key={user.odId}
              className="absolute w-0.5 h-5 animate-pulse pointer-events-none"
              style={{
                backgroundColor: user.color,
                left: `${Math.min(left, 300)}px`,
                top: `${top}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
