import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function midpoint(a: number, b: number): number {
  return (a + b) / 2;
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function formatDate(date: Date | { toDate: () => Date } | null | undefined): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof (date as { toDate: () => Date }).toDate === "function") {
    return (date as { toDate: () => Date }).toDate();
  }
  return new Date(date as unknown as string);
}

const CURSOR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f43f5e", // rose
];

export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}
