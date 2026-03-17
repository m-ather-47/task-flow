export type MemberRole = "owner" | "admin" | "member" | "viewer";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
}

export interface BoardMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: MemberRole;
  joinedAt: Date;
}

export interface Column {
  id: string;
  title: string;
  color: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  columns: Column[];
  members: Record<string, BoardMember>;
  memberIds: string[];
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  order: number;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: Priority;
  dueDate: Date | null;
  labels: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface Activity {
  id: string;
  boardId: string;
  taskId: string | null;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  type:
    | "comment"
    | "status_change"
    | "assignment"
    | "task_created"
    | "task_deleted"
    | "member_joined";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface CursorPosition {
  odId: string;
  odName: string;
  odPhoto: string | null;
  x: number;
  y: number;
  color: string;
  lastUpdated: number;
}
