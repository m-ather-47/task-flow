"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { subscribeToBoardsForUser, createBoard, deleteBoard } from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { UserMenu } from "@/components/auth/UserMenu";
import type { Board } from "@/types";

export function Sidebar() {
  const { user } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Create board modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete board modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      setBoards([]);
      setLoadingBoards(false);
      return;
    }

    setLoadingBoards(true);
    const unsubscribe = subscribeToBoardsForUser(user.uid, (updatedBoards) => {
      setBoards(updatedBoards);
      setLoadingBoards(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleCreateBoard() {
    if (!user || !newBoardName.trim()) return;

    setCreating(true);
    try {
      await createBoard(newBoardName.trim(), newBoardDescription.trim(), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "owner",
        joinedAt: new Date(),
      });
      setNewBoardName("");
      setNewBoardDescription("");
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteBoard() {
    if (!boardToDelete) return;

    setDeleting(true);
    try {
      await deleteBoard(boardToDelete.id);
      setDeleteModalOpen(false);
      setBoardToDelete(null);
      // Navigate away if we're on the deleted board
      if (pathname === `/board/${boardToDelete.id}`) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to delete board:", error);
    } finally {
      setDeleting(false);
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-6">
        <svg
          className="h-7 w-7 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="text-lg font-bold text-gray-900">TaskFlow</span>
      </div>

      {/* Board List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 flex items-center justify-between px-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Boards
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Create board"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {loadingBoards ? (
          <div className="py-8">
            <Spinner size="sm" />
          </div>
        ) : boards.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-gray-400">
            No boards yet
          </p>
        ) : (
          <ul className="space-y-1">
            {boards.map((board) => {
              const boardPath = `/board/${board.id}`;
              const analyticsPath = `/analytics/${board.id}`;
              const isActive = pathname === boardPath;

              return (
                <li key={board.id}>
                  <div
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Link
                      href={boardPath}
                      className="flex flex-1 items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-500" : "text-gray-400"}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                      </svg>
                      <span className="truncate">{board.name}</span>
                    </Link>

                    {/* Analytics link */}
                    <Link
                      href={analyticsPath}
                      className="ml-auto hidden rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 group-hover:block"
                      aria-label={`Analytics for ${board.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </Link>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBoardToDelete(board);
                        setDeleteModalOpen(true);
                      }}
                      className="hidden rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 group-hover:block"
                      aria-label={`Delete ${board.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 px-1">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-1.5"
            onClick={() => setModalOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create Board
          </Button>
        </div>
      </nav>

      {/* User menu at bottom */}
      <div className="shrink-0 border-t border-gray-200 px-4 py-3">
        <UserMenu />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50 lg:hidden"
        aria-label="Open sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
        {sidebarContent}
      </aside>

      {/* Create Board Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!creating) {
            setModalOpen(false);
            setNewBoardName("");
            setNewBoardDescription("");
          }
        }}
        title="Create Board"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                setNewBoardName("");
                setNewBoardDescription("");
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateBoard}
              disabled={creating || !newBoardName.trim()}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Board Name"
            placeholder="e.g. Marketing Campaign"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            disabled={creating}
            autoFocus
          />
          <div className="w-full">
            <label
              htmlFor="board-description"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="board-description"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50"
              placeholder="What is this board for?"
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              disabled={creating}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Board Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setBoardToDelete(null);
          }
        }}
        title="Delete Board"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setBoardToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteBoard}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{boardToDelete?.name}</span>? This
          action cannot be undone and all tasks will be permanently removed.
        </p>
      </Modal>
    </>
  );
}
