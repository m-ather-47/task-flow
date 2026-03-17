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
  onSave: (field: "title" | "description", value: string) => void;
}

export function useCollaborativeTask({
  boardId,
  taskId,
  user,
  initialData,
  onSave,
}: UseCollaborativeTaskOptions) {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [titleText, setTitleText] = useState<Y.Text | null>(null);
  const [descText, setDescText] = useState<Y.Text | null>(null);
  const providerRef = useRef<FirebaseProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const onSaveRef = useRef(onSave);
  const initializedRef = useRef(false);
  const initialDataRef = useRef(initialData);

  // Keep refs current
  onSaveRef.current = onSave;

  // Only update initialDataRef on first mount
  if (!initializedRef.current) {
    initialDataRef.current = initialData;
  }

  // Initialize Yjs document and provider - only depends on user, boardId, taskId
  useEffect(() => {
    if (!user || !taskId) return;

    // Prevent double initialization
    if (initializedRef.current && docRef.current) return;
    initializedRef.current = true;

    const doc = new Y.Doc();
    docRef.current = doc;

    const title = doc.getText("title");
    const desc = doc.getText("description");

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

    // Wait a bit for Firebase sync, then initialize if still empty
    const initTimeout = setTimeout(() => {
      if (title.length === 0 && initialDataRef.current.title) {
        doc.transact(() => {
          title.insert(0, initialDataRef.current.title);
        }, "init");
      }
      if (desc.length === 0 && initialDataRef.current.description) {
        doc.transact(() => {
          desc.insert(0, initialDataRef.current.description);
        }, "init");
      }
    }, 500);

    // Debounced save to Firestore
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastTitle = "";
    let lastDesc = "";

    const handleTitleChange = () => {
      const value = title.toString();
      if (value !== lastTitle && value.trim()) {
        lastTitle = value;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          onSaveRef.current("title", value);
        }, 2000); // Save every 2 seconds of inactivity
      }
    };

    const handleDescChange = () => {
      const value = desc.toString();
      if (value !== lastDesc) {
        lastDesc = value;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          onSaveRef.current("description", value);
        }, 2000);
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
      clearTimeout(initTimeout);
      clearInterval(awarenessInterval);
      if (saveTimeout) clearTimeout(saveTimeout);
      title.unobserve(handleTitleChange);
      desc.unobserve(handleDescChange);
      provider.destroy();
      doc.destroy();
      providerRef.current = null;
      docRef.current = null;
      initializedRef.current = false;
      setTitleText(null);
      setDescText(null);
    };
  }, [user, boardId, taskId]); // Removed initialData from deps!

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

  return {
    titleText,
    descText,
    updateCursor,
    clearCursor,
    remoteUsers,
  };
}
