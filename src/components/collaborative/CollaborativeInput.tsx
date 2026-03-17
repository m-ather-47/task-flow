"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
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

interface CollaborativeInputProps {
  yText: Y.Text | null;
  field: string;
  placeholder?: string;
  className?: string;
  remoteUsers: RemoteUser[];
  onCursorChange: (field: string, index: number, length: number) => void;
  onBlur?: () => void;
}

export function CollaborativeInput({
  yText,
  field,
  placeholder,
  className,
  remoteUsers,
  onCursorChange,
  onBlur,
}: CollaborativeInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
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
    (e: ChangeEvent<HTMLInputElement>) => {
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
        // Find the changed position
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
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
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
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyUp={handleKeyUp}
        onBlur={onBlur}
        onCompositionStart={() => (isComposingRef.current = true)}
        onCompositionEnd={(e) => {
          isComposingRef.current = false;
          handleChange(e as unknown as ChangeEvent<HTMLInputElement>);
        }}
        placeholder={placeholder}
        className={cn(
          "block w-full border-0 bg-transparent p-0 text-xl font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0",
          className
        )}
      />

      {/* Remote cursor indicators */}
      {remoteCursors.length > 0 && (
        <div className="absolute -top-6 left-0 flex gap-1">
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
    </div>
  );
}
