"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { Board } from "@/types";

interface BoardHeaderProps {
  board: Board;
  onOpenSettings?: () => void;
}

function BoardHeader({ board, onOpenSettings }: BoardHeaderProps) {
  const memberList = Object.values(board.members);
  const displayedMembers = memberList.slice(0, 5);
  const overflowCount = memberList.length - displayedMembers.length;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
      {/* Left side: back arrow + name + description */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Back to all boards"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900">
            {board.name}
          </h1>
          {board.description && (
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {board.description}
            </p>
          )}
        </div>
      </div>

      {/* Right side: members, invite, analytics, settings */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Member avatars */}
        <div className="flex items-center -space-x-2">
          {displayedMembers.map((member) => (
            <Avatar
              key={member.uid}
              src={member.photoURL}
              name={member.displayName}
              size="sm"
              className="ring-2 ring-white"
            />
          ))}
          {overflowCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 ring-2 ring-white">
              +{overflowCount}
            </span>
          )}
        </div>

        {/* Invite button */}
        {onOpenSettings && (
          <Button variant="secondary" size="sm" onClick={onOpenSettings}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Invite
          </Button>
        )}

        {/* Analytics link */}
        <Link href={`/analytics/${board.id}`}>
          <Button variant="ghost" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Analytics
          </Button>
        </Link>
      </div>
    </div>
  );
}
BoardHeader.displayName = "BoardHeader";

export { BoardHeader };
