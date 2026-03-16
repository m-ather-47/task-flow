"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useBoard } from "@/hooks/useBoard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Spinner } from "@/components/ui/Spinner";

export default function AnalyticsPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { board, tasks, activity, loading } = useBoard(boardId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Board not found
          </h2>
          <p className="text-gray-500 mt-2">
            This board may have been deleted or you don&apos;t have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/board/${boardId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Board
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {board.name} — Analytics
        </h1>
        <p className="text-gray-500 mt-1">
          Track your project progress and team performance
        </p>
      </div>
      <AnalyticsDashboard board={board} tasks={tasks} activity={activity} />
    </div>
  );
}
