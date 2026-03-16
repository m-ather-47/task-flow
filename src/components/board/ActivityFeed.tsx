"use client";

import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Activity } from "@/types";

interface ActivityFeedProps {
  activities: Activity[];
  taskId?: string;
}

function getActionText(activity: Activity): string {
  switch (activity.type) {
    case "comment":
      return "commented";
    case "status_change":
      return "moved this task";
    case "assignment":
      return "changed the assignee";
    case "task_created":
      return activity.content;
    case "task_deleted":
      return activity.content;
    case "member_joined":
      return "joined the board";
    default:
      return activity.content;
  }
}

function ActivityFeed({ activities, taskId }: ActivityFeedProps) {
  const filtered = taskId
    ? activities.filter((a) => a.taskId === taskId)
    : activities;

  if (filtered.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        No activity yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {filtered.map((activity) => {
        const createdAt = formatDate(activity.createdAt);
        const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

        return (
          <li key={activity.id} className="flex gap-3">
            <Avatar
              src={activity.userPhotoURL}
              name={activity.userName}
              size="sm"
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">
                  {activity.userName}
                </span>{" "}
                {getActionText(activity)}
              </p>

              {activity.type === "comment" && activity.content && (
                <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {activity.content}
                </div>
              )}

              <p className="mt-0.5 text-xs text-gray-400" title={createdAt.toLocaleString()}>
                {timeAgo}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
ActivityFeed.displayName = "ActivityFeed";

export { ActivityFeed };
