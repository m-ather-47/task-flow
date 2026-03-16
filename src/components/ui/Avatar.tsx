"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function Avatar({ src, name, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700 shrink-0 overflow-hidden",
        sizeMap[size],
        className
      )}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
Avatar.displayName = "Avatar";

export { Avatar };
