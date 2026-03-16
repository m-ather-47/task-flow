"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { subscribeToBoardsForUser, createBoard } from "@/lib/firestore";
import type { Board, BoardMember } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToBoardsForUser(user.uid, (b) => {
      setBoards(b);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleCreateBoard = async () => {
    if (!user || !newBoardName.trim()) return;
    setCreating(true);
    const member: BoardMember = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: "owner",
      joinedAt: new Date(),
    };
    await createBoard(newBoardName.trim(), newBoardDesc.trim(), member);
    setNewBoardName("");
    setNewBoardDesc("");
    setShowCreateModal(false);
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
          <p className="text-gray-600 mt-1">
            Manage your projects and stay organized
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + New Board
        </Button>
      </div>

      {boards.length === 0 ? (
        <EmptyState
          title="No boards yet"
          description="Create your first board to start organizing tasks"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Board
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {board.name}
              </h3>
              {board.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {board.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                <span>{board.memberIds?.length || 1} member{(board.memberIds?.length || 1) !== 1 ? "s" : ""}</span>
                <span>{board.columns?.length || 0} columns</span>
              </div>
            </Link>
          ))}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-gray-400 hover:text-indigo-600 min-h-[140px]"
          >
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">New Board</span>
            </div>
          </button>
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Board"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBoard}
              disabled={creating || !newBoardName.trim()}
            >
              {creating ? "Creating..." : "Create Board"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Board Name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="e.g., Product Launch"
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newBoardDesc}
              onChange={(e) => setNewBoardDesc(e.target.value)}
              placeholder="What's this board about?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
