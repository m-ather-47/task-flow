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
  const isLocalChangeRef = useRef(false);

  // Subscribe to yText changes
  useEffect(() => {
    if (!yText) return;

    const updateValue = () => {
      // Only update if this isn't from our own local change
      if (!isLocalChangeRef.current) {
        setValue(yText.toString());
      }
    };

    // Initial value
    setValue(yText.toString());
    yText.observe(updateValue);

    return () => {
      yText.unobserve(updateValue);
    };
  }, [yText]);

  // Handle input changes
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!yText) return;

      const newValue = e.target.value;
      const oldValue = yText.toString();

      // Skip if values are the same
      if (newValue === oldValue) return;

      // Mark as local change to prevent observer feedback
      isLocalChangeRef.current = true;

      // Use Yjs transaction to batch changes
      yText.doc?.transact(() => {
        // Delete all and insert new value (simple and reliable)
        if (yText.length > 0) {
          yText.delete(0, yText.length);
        }
        if (newValue.length > 0) {
          yText.insert(0, newValue);
        }
      });

      setValue(newValue);

      // Reset flag after a microtask
      Promise.resolve().then(() => {
        isLocalChangeRef.current = false;
      });

      // Update cursor position
      const selectionStart = e.target.selectionStart || 0;
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
        onKeyUp={handleSelect}
        onBlur={onBlur}
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
