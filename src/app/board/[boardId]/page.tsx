"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useBoard } from "@/hooks/useBoard";
import { useTasks } from "@/hooks/useTasks";
import { Board } from "@/components/board/Board";
import { BoardHeader } from "@/components/board/BoardHeader";
import { TaskModal } from "@/components/board/TaskModal";
import { MemberInvite } from "@/components/board/MemberInvite";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Task } from "@/types";

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { board, tasksByColumn, activity, loading } = useBoard(boardId);
  const taskActions = useTasks(boardId);
  const { user } = useAuthContext();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showMembers, setShowMembers] = useState(false);

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

  const currentUserRole = user
    ? board.members[user.uid]?.role ?? "viewer"
    : "viewer";

  return (
    <div className="flex flex-col h-full">
      <BoardHeader board={board} onOpenSettings={() => setShowMembers(true)} />
      <Board
        board={board}
        tasksByColumn={tasksByColumn}
        taskActions={taskActions}
        onTaskClick={(task) => setSelectedTask(task)}
      />

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          board={board}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (taskId, updates) => {
            await taskActions.updateTask(taskId, updates);
            setSelectedTask((prev) =>
              prev && prev.id === taskId ? { ...prev, ...updates } : prev
            );
          }}
          onDelete={async (taskId, title) => {
            await taskActions.removeTask(taskId, title);
            setSelectedTask(null);
          }}
        />
      )}

      <Modal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        title="Team Members"
      >
        <MemberInvite
          inviteCode={board.inviteCode}
          boardId={board.id}
          members={board.members}
          currentUserRole={currentUserRole}
        />
      </Modal>
    </div>
  );
}
