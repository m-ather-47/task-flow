"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as Y from "yjs";
import { FirebaseProvider } from "@/lib/yjs-firebase-provider";
import { getCursorColor } from "@/lib/utils";
import type { User } from "@/types";

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
  const [titleText, setTitleText] = useState<Y.Text | null>(null);
  const [descText, setDescText] = useState<Y.Text | null>(null);
  const providerRef = useRef<FirebaseProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const lastSyncedRef = useRef<{ title: string; description: string }>({
    title: "",
    description: "",
  });

  // Keep onUpdate ref current
  onUpdateRef.current = onUpdate;

  // Initialize Yjs document and provider
  useEffect(() => {
    if (!user || !taskId) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const title = doc.getText("title");
    const desc = doc.getText("description");

    // Initialize with current values if empty
    doc.transact(() => {
      if (title.length === 0 && initialData.title) {
        title.insert(0, initialData.title);
        lastSyncedRef.current.title = initialData.title;
      }
      if (desc.length === 0 && initialData.description) {
        desc.insert(0, initialData.description);
        lastSyncedRef.current.description = initialData.description;
      }
    });

    setTitleText(title);
    setDescText(desc);

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

    // Listen to text changes and call onUpdate (debounced)
    let titleTimeout: ReturnType<typeof setTimeout> | null = null;
    let descTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleTitleChange = () => {
      const value = title.toString();
      // Only update if actually changed from last synced value
      if (value !== lastSyncedRef.current.title) {
        lastSyncedRef.current.title = value;
        if (titleTimeout) clearTimeout(titleTimeout);
        titleTimeout = setTimeout(() => {
          onUpdateRef.current("title", value);
        }, 1000);
      }
    };

    const handleDescChange = () => {
      const value = desc.toString();
      // Only update if actually changed from last synced value
      if (value !== lastSyncedRef.current.description) {
        lastSyncedRef.current.description = value;
        if (descTimeout) clearTimeout(descTimeout);
        descTimeout = setTimeout(() => {
          onUpdateRef.current("description", value);
        }, 1000);
      }
    };

    title.observe(handleTitleChange);
    desc.observe(handleDescChange);

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
      if (titleTimeout) clearTimeout(titleTimeout);
      if (descTimeout) clearTimeout(descTimeout);
      title.unobserve(handleTitleChange);
      desc.unobserve(handleDescChange);
      provider.destroy();
      doc.destroy();
      providerRef.current = null;
      docRef.current = null;
      setTitleText(null);
      setDescText(null);
    };
  }, [user, boardId, taskId, initialData.title, initialData.description]);

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
    titleText,
    descText,
    updateCursor,
    clearCursor,
    remoteUsers,
    getRemoteUsersInField,
  };
}
