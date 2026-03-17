"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import * as Y from "yjs";
import { FirebaseProvider } from "@/lib/yjs-firebase-provider";
import { getCursorColor } from "@/lib/utils";
import type { User, Task } from "@/types";

interface RemoteUser {
  odId: string;
  odName: string;
  odPhoto: string | null;
  color: string;
  cursor: {
    field: string;
    index: number;
    length: number;
  } | null;
}

interface UseCollaborativeTaskOptions {
  boardId: string;
  taskId: string;
  user: User | null;
  initialData: {
    title: string;
    description: string;
  };
  onUpdate: (field: "title" | "description", value: string) => void;
}

export function useCollaborativeTask({
  boardId,
  taskId,
  user,
  initialData,
  onUpdate,
}: UseCollaborativeTaskOptions) {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const providerRef = useRef<FirebaseProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const titleTextRef = useRef<Y.Text | null>(null);
  const descTextRef = useRef<Y.Text | null>(null);
  const isInitializedRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref current
  onUpdateRef.current = onUpdate;

  // Initialize Yjs document and provider
  useEffect(() => {
    if (!user || !taskId) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const titleText = doc.getText("title");
    const descText = doc.getText("description");
    titleTextRef.current = titleText;
    descTextRef.current = descText;

    // Initialize with current values if empty
    if (titleText.length === 0 && initialData.title) {
      titleText.insert(0, initialData.title);
    }
    if (descText.length === 0 && initialData.description) {
      descText.insert(0, initialData.description);
    }

    isInitializedRef.current = true;

    const provider = new FirebaseProvider(
      `${boardId}/${taskId}`,
      doc,
      user.uid,
      {
        displayName: user.displayName,
        photoURL: user.photoURL,
        color: getCursorColor(user.uid),
      }
    );
    providerRef.current = provider;

    // Listen to text changes and call onUpdate
    const handleTitleChange = () => {
      if (!isInitializedRef.current) return;
      const value = titleText.toString();
      onUpdateRef.current("title", value);
    };

    const handleDescChange = () => {
      if (!isInitializedRef.current) return;
      const value = descText.toString();
      onUpdateRef.current("description", value);
    };

    titleText.observe(handleTitleChange);
    descText.observe(handleDescChange);

    // Poll for remote awareness states
    const awarenessInterval = setInterval(() => {
      if (!provider) return;
      const states = provider.getRemoteStates();
      const users: RemoteUser[] = [];
      states.forEach((state) => {
        users.push({
          odId: state.odId,
          odName: state.odName,
          odPhoto: state.odPhoto,
          color: state.color,
          cursor: state.cursor || null,
        });
      });
      setRemoteUsers(users);
    }, 100);

    return () => {
      clearInterval(awarenessInterval);
      titleText.unobserve(handleTitleChange);
      descText.unobserve(handleDescChange);
      provider.destroy();
      doc.destroy();
      providerRef.current = null;
      docRef.current = null;
      titleTextRef.current = null;
      descTextRef.current = null;
      isInitializedRef.current = false;
    };
  }, [user, boardId, taskId, initialData.title, initialData.description]);

  // Get current text value
  const getFieldValue = useCallback((field: "title" | "description"): string => {
    if (field === "title") {
      return titleTextRef.current?.toString() || "";
    }
    return descTextRef.current?.toString() || "";
  }, []);

  // Insert text at position
  const insertText = useCallback(
    (field: "title" | "description", index: number, text: string) => {
      const yText = field === "title" ? titleTextRef.current : descTextRef.current;
      if (yText) {
        yText.insert(index, text);
      }
    },
    []
  );

  // Delete text at position
  const deleteText = useCallback(
    (field: "title" | "description", index: number, length: number) => {
      const yText = field === "title" ? titleTextRef.current : descTextRef.current;
      if (yText) {
        yText.delete(index, length);
      }
    },
    []
  );

  // Update cursor position
  const updateCursor = useCallback(
    (field: string, index: number, length: number = 0) => {
      providerRef.current?.updateCursor(field, index, length);
    },
    []
  );

  // Clear cursor
  const clearCursor = useCallback(() => {
    providerRef.current?.clearCursor();
  }, []);

  // Get remote users editing a specific field
  const getRemoteUsersInField = useCallback(
    (field: string) => {
      return remoteUsers.filter((u) => u.cursor?.field === field);
    },
    [remoteUsers]
  );

  return {
    getFieldValue,
    insertText,
    deleteText,
    updateCursor,
    clearCursor,
    remoteUsers,
    getRemoteUsersInField,
    titleText: titleTextRef.current,
    descText: descTextRef.current,
  };
}
