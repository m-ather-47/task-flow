import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "subtle" | "priority";
  color?: string;
  children: ReactNode;
  className?: string;
}

function Badge({ variant = "default", color, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        {
          "bg-indigo-100 text-indigo-800": variant === "default" && !color,
          "bg-gray-100 text-gray-700": variant === "subtle" && !color,
          "bg-red-100 text-red-800": variant === "priority" && !color,
        },
        className
      )}
      style={
        color
          ? {
              backgroundColor: `${color}20`,
              color,
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}
Badge.displayName = "Badge";

export { Badge };
