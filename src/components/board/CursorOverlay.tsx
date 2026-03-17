"use client";

import type { CursorPosition } from "@/types";

interface CursorOverlayProps {
  cursors: Record<string, CursorPosition>;
}

export function CursorOverlay({ cursors }: CursorOverlayProps) {
  const cursorList = Object.values(cursors);

  if (cursorList.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {cursorList.map((cursor) => (
        <div
          key={cursor.odId}
          className="absolute transition-all duration-75 ease-out"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
          >
            <path
              d="M5.5 3.21V20.79a.5.5 0 00.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* Name label */}
          <div
            className="absolute left-4 top-4 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.odName}
          </div>
        </div>
      ))}
    </div>
  );
}
