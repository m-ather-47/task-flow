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
