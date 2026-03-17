import { v4 as uuidv4 } from "uuid";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Board, Task, Activity, Column, BoardMember, MemberRole } from "@/types";
import { generateInviteCode } from "./utils";

// ---- BOARDS ----

export async function createBoard(
  name: string,
  description: string,
  owner: BoardMember
): Promise<string> {
  const defaultColumns: Column[] = [
    { id: uuidv4(), title: "To Do", color: "#6366f1" },
    { id: uuidv4(), title: "In Progress", color: "#f59e0b" },
    { id: uuidv4(), title: "Review", color: "#8b5cf6" },
    { id: uuidv4(), title: "Done", color: "#22c55e" },
  ];

  const boardRef = await addDoc(collection(db, "boards"), {
    name,
    description,
    ownerId: owner.uid,
    columns: defaultColumns,
    members: {
      [owner.uid]: { ...owner, role: "owner", joinedAt: serverTimestamp() },
    },
    memberIds: [owner.uid],
    inviteCode: generateInviteCode(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return boardRef.id;
}

export function subscribeToBoardsForUser(
  userId: string,
  callback: (boards: Board[]) => void
): () => void {
  const q = query(
    collection(db, "boards"),
    where("memberIds", "array-contains", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const boards = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Board[];
    callback(boards);
  });
}

export async function updateBoard(
  boardId: string,
  updates: Partial<Pick<Board, "name" | "description" | "columns">>
): Promise<void> {
  await updateDoc(doc(db, "boards", boardId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBoard(boardId: string): Promise<void> {
  await deleteDoc(doc(db, "boards", boardId));
}

// ---- TASKS ----

export async function createTask(
  boardId: string,
  task: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "boards", boardId, "tasks"), {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToTasks(
  boardId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(
    collection(db, "boards", boardId, "tasks"),
    orderBy("order", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Task[];
    callback(tasks);
  });
}

export async function updateTask(
  boardId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const { id, ...rest } = updates as Task & { id?: string };
  await updateDoc(doc(db, "boards", boardId, "tasks", taskId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(
  boardId: string,
  taskId: string
): Promise<void> {
  await deleteDoc(doc(db, "boards", boardId, "tasks", taskId));
}

export async function batchUpdateTaskOrders(
  boardId: string,
  updates: Array<{ taskId: string; order: number; columnId?: string }>
): Promise<void> {
  const batch = writeBatch(db);
  for (const update of updates) {
    const ref = doc(db, "boards", boardId, "tasks", update.taskId);
    const data: Record<string, unknown> = {
      order: update.order,
      updatedAt: serverTimestamp(),
    };
    if (update.columnId !== undefined) data.columnId = update.columnId;
    batch.update(ref, data);
  }
  await batch.commit();
}

// ---- MEMBERS ----

export async function joinBoardByInviteCode(
  inviteCode: string,
  member: Omit<BoardMember, "role" | "joinedAt">
): Promise<string | null> {
  const q = query(
    collection(db, "boards"),
    where("inviteCode", "==", inviteCode)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const boardDoc = snapshot.docs[0];
  const boardId = boardDoc.id;

  await updateDoc(doc(db, "boards", boardId), {
    [`members.${member.uid}`]: {
      ...member,
      role: "member",
      joinedAt: serverTimestamp(),
    },
    memberIds: arrayUnion(member.uid),
  });

  return boardId;
}

export async function updateMemberRole(
  boardId: string,
  targetUid: string,
  newRole: MemberRole
): Promise<void> {
  await updateDoc(doc(db, "boards", boardId), {
    [`members.${targetUid}.role`]: newRole,
  });
}

export async function removeMember(
  boardId: string,
  targetUid: string
): Promise<void> {
  await updateDoc(doc(db, "boards", boardId), {
    [`members.${targetUid}`]: deleteField(),
    memberIds: arrayRemove(targetUid),
  });
}

// ---- ACTIVITY ----

export async function addActivity(
  boardId: string,
  activity: Omit<Activity, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, "boards", boardId, "activity"), {
    ...activity,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToActivity(
  boardId: string,
  callback: (activities: Activity[]) => void,
  limitCount: number = 50
): () => void {
  const q = query(
    collection(db, "boards", boardId, "activity"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Activity[];
    callback(activities);
  });
}
