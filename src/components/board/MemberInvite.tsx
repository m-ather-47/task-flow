"use client";

import { useState, useCallback } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { updateMemberRole, removeMember } from "@/lib/firestore";
import type { BoardMember, MemberRole } from "@/types";

interface MemberInviteProps {
  inviteCode: string;
  boardId: string;
  members: Record<string, BoardMember>;
  currentUserRole: MemberRole;
}

const roleOptions: { value: MemberRole; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

function MemberInvite({
  inviteCode,
  boardId,
  members,
  currentUserRole,
}: MemberInviteProps) {
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: use execCommand for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silent fail
      }
      document.body.removeChild(textArea);
    });
  }, [inviteLink]);

  const handleRoleChange = useCallback(
    async (uid: string, newRole: MemberRole) => {
      await updateMemberRole(boardId, uid, newRole);
    },
    [boardId]
  );

  const handleRemoveMember = useCallback(
    async (uid: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to remove this member?"
      );
      if (!confirmed) return;
      await removeMember(boardId, uid);
    },
    [boardId]
  );

  const memberList = Object.values(members);

  return (
    <div className="space-y-6">
      {/* Invite link section */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Invite Link
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="block flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none"
          />
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Share this link to invite people to your board.
        </p>
      </div>

      {/* Member list */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Members ({memberList.length})
        </h3>
        <ul className="divide-y divide-gray-100">
          {memberList.map((member) => (
            <li
              key={member.uid}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={member.photoURL}
                  name={member.displayName}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {member.displayName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {member.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {member.role === "owner" ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                    Owner
                  </span>
                ) : canManageMembers ? (
                  <>
                    <Select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.uid,
                          e.target.value as MemberRole
                        )
                      }
                      className="w-28 text-xs"
                    >
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.uid)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      aria-label={`Remove ${member.displayName}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                    {member.role}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
MemberInvite.displayName = "MemberInvite";

export { MemberInvite };
