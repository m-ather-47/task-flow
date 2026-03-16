"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { joinBoardByInviteCode } from "@/lib/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [boardName, setBoardName] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    async function fetchBoard() {
      try {
        const q = query(
          collection(db, "boards"),
          where("inviteCode", "==", inviteCode)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setBoardName(snapshot.docs[0].data().name);
        } else {
          setError("Invalid invite link. This board may no longer exist.");
        }
      } catch {
        setError("Failed to load board information.");
      } finally {
        setLoadingBoard(false);
      }
    }
    fetchBoard();
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!user) {
      await login();
      return;
    }

    setJoining(true);
    setError(null);
    try {
      const boardId = await joinBoardByInviteCode(inviteCode, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      if (boardId) {
        router.push(`/board/${boardId}`);
      } else {
        setError("Invalid invite link.");
      }
    } catch {
      setError("Failed to join board. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || loadingBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <svg
            className="w-12 h-12 text-indigo-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>

          {error ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Oops!
              </h2>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button variant="secondary" onClick={() => router.push("/")}>
                Go Home
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                You&apos;ve been invited!
              </h2>
              <p className="text-gray-500 mb-6">
                Join <span className="font-medium text-gray-900">{boardName}</span>{" "}
                to collaborate with the team.
              </p>
              {user ? (
                <Button onClick={handleJoin} disabled={joining} size="lg">
                  {joining ? "Joining..." : "Join Board"}
                </Button>
              ) : (
                <Button onClick={login} size="lg">
                  Sign in to Join
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
