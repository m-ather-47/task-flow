import * as Y from "yjs";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { Awareness } from "y-protocols/awareness";
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
  private odId: string;
  private unsubscribeDoc: (() => void) | null = null;
  private unsubscribeAwareness: (() => void) | null = null;
  private isDestroyed = false;
  private isSyncing = false;
  private lastSavedState = "";
  private pendingSave: ReturnType<typeof setTimeout> | null = null;

  constructor(
    docPath: string,
    doc: Y.Doc,
    odId: string,
    userInfo: { displayName: string; photoURL: string | null; color: string }
  ) {
    this.doc = doc;
    this.docPath = docPath;
    this.odId = odId;
    this.awareness = new Awareness(doc);

    // Set local awareness state
    this.awareness.setLocalState({
      odId: odId,
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

    let isFirstLoad = true;

    this.unsubscribeDoc = onValue(docRef, (snapshot) => {
      if (this.isDestroyed) return;

      const data = snapshot.val();
      if (data?.update && data?.state) {
        // Skip if this is our own update
        if (data.state === this.lastSavedState) {
          return;
        }

        try {
          this.isSyncing = true;
          const update = Uint8Array.from(atob(data.update), (c) => c.charCodeAt(0));
          Y.applyUpdate(this.doc, update, "firebase");
        } catch (e) {
          console.error("Error applying update:", e);
        } finally {
          this.isSyncing = false;
        }
      }

      isFirstLoad = false;
    });

    // Listen to local document changes and broadcast (debounced)
    this.doc.on("update", this.handleDocUpdate);

    // Subscribe to awareness from Firebase
    const awarenessRef = ref(rtdb, `awareness/${this.docPath}`);
    this.unsubscribeAwareness = onValue(awarenessRef, (snapshot) => {
      if (this.isDestroyed) return;

      const data = snapshot.val();
      if (!data) return;

      // Store remote states for getRemoteStates()
      this._remoteStates = new Map();
      for (const [odId, state] of Object.entries(data)) {
        if (odId === this.odId) continue;
        const s = state as AwarenessState & { lastUpdated?: number };
        // Only include recent states (within 30 seconds)
        if (s.lastUpdated && Date.now() - s.lastUpdated < 30000) {
          this._remoteStates.set(odId, s);
        }
      }
    });

    // Broadcast awareness changes
    this.awareness.on("change", this.handleAwarenessChange);

    // Setup onDisconnect to clean up awareness
    const userAwarenessRef = ref(rtdb, `awareness/${this.docPath}/${this.odId}`);
    onDisconnect(userAwarenessRef).remove();
  }

  private _remoteStates: Map<string, AwarenessState> = new Map();

  private handleDocUpdate = (update: Uint8Array, origin: string) => {
    // Skip if destroyed, syncing from Firebase, or is initialization
    if (this.isDestroyed || this.isSyncing || origin === "firebase" || origin === "init") {
      return;
    }

    // Debounce saves to reduce Firebase writes
    if (this.pendingSave) {
      clearTimeout(this.pendingSave);
    }

    this.pendingSave = setTimeout(() => {
      if (this.isDestroyed) return;

      // Encode entire doc state and save to Firebase
      const state = Y.encodeStateAsUpdate(this.doc);
      const base64 = btoa(String.fromCharCode(...state));

      // Create a unique state identifier to detect our own updates
      const stateHash = base64.substring(0, 50) + base64.length;
      this.lastSavedState = stateHash;

      const docRef = ref(rtdb, `docs/${this.docPath}`);
      set(docRef, {
        update: base64,
        state: stateHash,
        lastModified: Date.now(),
        modifiedBy: this.odId,
      }).catch((err) => {
        console.error("Error saving to Firebase:", err);
      });
    }, 100);
  };

  private handleAwarenessChange = () => {
    if (this.isDestroyed) return;

    const localState = this.awareness.getLocalState() as AwarenessState | null;
    if (!localState) return;

    const userAwarenessRef = ref(rtdb, `awareness/${this.docPath}/${this.odId}`);
    set(userAwarenessRef, {
      ...localState,
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
    return this._remoteStates;
  }

  destroy() {
    this.isDestroyed = true;

    if (this.pendingSave) {
      clearTimeout(this.pendingSave);
    }

    // Remove awareness
    const userAwarenessRef = ref(rtdb, `awareness/${this.docPath}/${this.odId}`);
    set(userAwarenessRef, null);

    // Unsubscribe
    if (this.unsubscribeDoc) this.unsubscribeDoc();
    if (this.unsubscribeAwareness) this.unsubscribeAwareness();

    this.doc.off("update", this.handleDocUpdate);
    this.awareness.off("change", this.handleAwarenessChange);
    this.awareness.destroy();
  }
}
