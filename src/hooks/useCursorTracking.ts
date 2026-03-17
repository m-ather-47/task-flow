"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ref, set, onValue, remove, onDisconnect } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { getCursorColor } from "@/lib/utils";
import type { User, CursorPosition } from "@/types";

interface UseCursorTrackingOptions {
  boardId: string;
  user: User | null;
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

interface CursorData {
  odName: string;
  odPhoto: string | null;
  x: number;
  y: number;
  color: string;
  lastUpdated: number;
}

export function useCursorTracking({
  boardId,
  user,
  containerRef,
  enabled = true,
}: UseCursorTrackingOptions) {
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const lastUpdateRef = useRef<number>(0);
  const throttleMs = 50; // Update every 50ms max (20 updates/sec)

  // Broadcast cursor position
  const updateCursor = useCallback(
    (e: MouseEvent) => {
      if (!user || !containerRef.current || !enabled) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Only update if cursor is within bounds
      if (x < 0 || x > 100 || y < 0 || y > 100) return;

      const cursorRef = ref(rtdb, `cursors/${boardId}/${user.uid}`);
      const data: CursorData = {
        odName: user.displayName,
        odPhoto: user.photoURL,
        x,
        y,
        color: getCursorColor(user.uid),
        lastUpdated: now,
      };

      set(cursorRef, data).catch(() => {
        // Silently fail - cursor tracking is non-critical
      });
    },
    [boardId, user, containerRef, enabled]
  );

  // Set up mouse tracking and cleanup
  useEffect(() => {
    if (!user || !enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Set up onDisconnect to remove cursor when user leaves
    const cursorRef = ref(rtdb, `cursors/${boardId}/${user.uid}`);
    onDisconnect(cursorRef).remove();

    // Add mouse move listener
    container.addEventListener("mousemove", updateCursor);

    // Remove cursor when mouse leaves the container
    const handleMouseLeave = () => {
      remove(cursorRef).catch(() => {});
    };
    container.addEventListener("mouseleave", handleMouseLeave);

    // Cleanup on unmount
    return () => {
      container.removeEventListener("mousemove", updateCursor);
      container.removeEventListener("mouseleave", handleMouseLeave);
      remove(cursorRef).catch(() => {});
    };
  }, [boardId, user, containerRef, updateCursor, enabled]);

  // Subscribe to other users' cursors
  useEffect(() => {
    if (!user || !enabled) return;

    const cursorsRef = ref(rtdb, `cursors/${boardId}`);
    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setCursors({});
        return;
      }

      const now = Date.now();
      const staleThreshold = 10000; // 10 seconds

      const activeCursors: Record<string, CursorPosition> = {};
      for (const [odId, cursor] of Object.entries(data)) {
        // Skip own cursor and stale cursors
        if (odId === user.uid) continue;
        const c = cursor as CursorData;
        if (now - c.lastUpdated > staleThreshold) continue;

        activeCursors[odId] = {
          odId,
          odName: c.odName,
          odPhoto: c.odPhoto,
          x: c.x,
          y: c.y,
          color: c.color,
          lastUpdated: c.lastUpdated,
        };
      }

      setCursors(activeCursors);
    });

    return () => unsubscribe();
  }, [boardId, user, enabled]);

  return { cursors };
}
