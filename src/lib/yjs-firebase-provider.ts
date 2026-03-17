import * as Y from "yjs";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";
import { rtdb } from "./firebase";

interface AwarenessState {
  odId: string;
  odName: string;
  odPhoto: string | null;
  color: string;
  cursor?: {
    field: string;
    index: number;
    length: number;
  } | null;
}

export class FirebaseProvider {
  doc: Y.Doc;
  awareness: Awareness;
  private docPath: string;
  private userId: string;
  private unsubscribeDoc: (() => void) | null = null;
  private unsubscribeAwareness: (() => void) | null = null;
  private isDestroyed = false;
  private isSyncing = false;

  constructor(
    docPath: string,
    doc: Y.Doc,
    userId: string,
    userInfo: { displayName: string; photoURL: string | null; color: string }
  ) {
    this.doc = doc;
    this.docPath = docPath;
    this.userId = userId;
    this.awareness = new Awareness(doc);

    // Set local awareness state
    this.awareness.setLocalState({
      odId: userId,
      odName: userInfo.displayName,
      odPhoto: userInfo.photoURL,
      color: userInfo.color,
      cursor: null,
    } as AwarenessState);

    this.init();
  }

  private async init() {
    // Subscribe to document changes from Firebase
    const docRef = ref(rtdb, `docs/${this.docPath}`);
    this.unsubscribeDoc = onValue(docRef, (snapshot) => {
      if (this.isDestroyed || this.isSyncing) return;

      const data = snapshot.val();
      if (data?.update) {
        try {
          const update = Uint8Array.from(atob(data.update), (c) => c.charCodeAt(0));
          Y.applyUpdate(this.doc, update, "firebase");
        } catch (e) {
          console.error("Error applying update:", e);
        }
      }
    });

    // Listen to local document changes and broadcast
    this.doc.on("update", this.handleDocUpdate);

    // Subscribe to awareness from Firebase
    const awarenessRef = ref(rtdb, `awareness/${this.docPath}`);
    this.unsubscribeAwareness = onValue(awarenessRef, (snapshot) => {
      if (this.isDestroyed) return;

      const data = snapshot.val();
      if (!data) return;

      // Apply each user's awareness state
      for (const [odId, state] of Object.entries(data)) {
        if (odId === this.userId) continue;
        try {
          const awarenessState = state as AwarenessState & { clientId?: number };
          if (awarenessState.clientId) {
            // Manually set the state for the remote client
            this.awareness.setLocalStateField("remote", { [odId]: awarenessState });
          }
        } catch (e) {
          // Ignore errors
        }
      }
    });

    // Broadcast awareness changes
    this.awareness.on("change", this.handleAwarenessChange);

    // Setup onDisconnect to clean up awareness
    const userAwarenessRef = ref(rtdb, `awareness/${this.docPath}/${this.userId}`);
    onDisconnect(userAwarenessRef).remove();
  }

  private handleDocUpdate = (update: Uint8Array, origin: string) => {
    if (this.isDestroyed || origin === "firebase") return;

    this.isSyncing = true;

    // Encode entire doc state and save to Firebase
    const state = Y.encodeStateAsUpdate(this.doc);
    const base64 = btoa(String.fromCharCode(...state));

    const docRef = ref(rtdb, `docs/${this.docPath}`);
    set(docRef, {
      update: base64,
      lastModified: Date.now(),
    }).finally(() => {
      this.isSyncing = false;
    });
  };

  private handleAwarenessChange = () => {
    if (this.isDestroyed) return;

    const localState = this.awareness.getLocalState() as AwarenessState | null;
    if (!localState) return;

    const userAwarenessRef = ref(rtdb, `awareness/${this.docPath}/${this.userId}`);
    set(userAwarenessRef, {
      ...localState,
      clientId: this.awareness.clientID,
      lastUpdated: Date.now(),
    });
  };

  updateCursor(field: string, index: number, length: number = 0) {
    this.awareness.setLocalStateField("cursor", { field, index, length });
  }

  clearCursor() {
    this.awareness.setLocalStateField("cursor", null);
  }

  getRemoteStates(): Map<string, AwarenessState> {
    const states = new Map<string, AwarenessState>();
    this.awareness.getStates().forEach((state, clientId) => {
      if (clientId !== this.awareness.clientID && state.odId) {
        states.set(state.odId as string, state as AwarenessState);
      }
    });
    return states;
  }

  destroy() {
    this.isDestroyed = true;

    // Remove awareness
    const userAwarenessRef = ref(rtdb, `awareness/${this.docPath}/${this.userId}`);
    set(userAwarenessRef, null);

    // Unsubscribe
    if (this.unsubscribeDoc) this.unsubscribeDoc();
    if (this.unsubscribeAwareness) this.unsubscribeAwareness();

    this.doc.off("update", this.handleDocUpdate);
    this.awareness.off("change", this.handleAwarenessChange);
    this.awareness.destroy();
  }
}
