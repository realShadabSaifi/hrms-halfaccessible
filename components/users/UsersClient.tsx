"use client";

import { useState } from "react";
import { addHuman, resetAuthenticator, setActive, setRole } from "@/app/(portal)/users/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { initials } from "@/lib/names";
import type { Profile, ProfileRole } from "@/lib/types";

const DEPTS = ["Engineering", "Design", "Product", "HR", "Marketing"];
const ROLES: ProfileRole[] = ["employee", "lead", "admin"];

export function UsersClient({
  rows,
  me,
}: {
  rows: (Profile & { email?: string })[];
  me: string;
}) {
  const [dept, setDept] = useState("Engineering");
  const [role, setRoleState] = useState<ProfileRole>("employee");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="pageEnter grid items-start gap-5 md:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-[20px] border border-[rgba(28,28,46,0.09)] bg-white p-[22px]">
        <div className="font-[family-name:var(--font-display)] text-base font-bold">the roster</div>
        <p className="mb-3.5 text-xs text-[rgba(28,28,46,0.55)]">
          roles, access, authenticators. deactivating keeps their history - we don&apos;t erase people.
        </p>
        {rows.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-3 border-b border-[rgba(28,28,46,0.06)] py-3"
            style={{ opacity: u.active ? 1 : 0.5 }}
          >
            <Avatar initials={initials(u.full_name)} color={u.avatar_color} />
            <span className="min-w-[150px] flex-1">
              <span className="block text-[13.5px] font-semibold">
                {u.full_name} {u.id === me ? "(you)" : ""}{" "}
                <span className="ml-1 rounded-full bg-[rgba(28,28,46,0.06)] px-2 py-0.5 text-[10.5px] font-bold">
                  {u.active ? "active" : "away"}
                </span>
              </span>
              <span className="block text-[11.5px] text-[rgba(28,28,46,0.55)]">
                {u.designation} · {u.department} · joined {u.joined_at}
              </span>
            </span>
            <span className="flex gap-1 rounded-full border border-[rgba(28,28,46,0.08)] bg-[rgba(28,28,46,0.03)] p-0.5">
              {ROLES.map((r) => (
                <Chip key={r} active={u.role === r} onClick={() => setRole(u.id, r)}>
                  {r}
                </Chip>
              ))}
            </span>
            <Button variant="ghost" onClick={() => resetAuthenticator(u.id)}>
              reset authenticator
            </Button>
            <Button variant="ghost" onClick={() => setActive(u.id, !u.active)}>
              {u.active ? "deactivate" : "reactivate"}
            </Button>
          </div>
        ))}
      </div>
      <form
        className="rounded-[20px] border border-[rgba(28,28,46,0.09)] bg-white p-6"
        action={async (fd) => {
          const r = await addHuman({
            email: String(fd.get("email")),
            fullName: String(fd.get("name")),
            designation: String(fd.get("title")),
            department: dept,
            role,
          });
          setToast(r.ok ? "human added. they still need to scan a QR." : r.error ?? "nope");
        }}
      >
        <div className="font-[family-name:var(--font-display)] text-[17px] font-bold">add a human</div>
        <p className="mb-4 text-xs text-[rgba(28,28,46,0.55)]">
          they&apos;ll set up an authenticator on first login. no passwords, ever.
        </p>
        <TextField name="name" label="full name" placeholder="e.g. Zara Khan" />
        <div className="h-3" />
        <TextField name="email" label="email" type="email" required />
        <div className="h-3" />
        <TextField name="title" label="designation" placeholder="e.g. Chaos Coordinator" />
        <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-[rgba(28,28,46,0.55)]">
          department
        </div>
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {DEPTS.map((d) => (
            <Chip key={d} active={dept === d} onClick={() => setDept(d)}>
              {d}
            </Chip>
          ))}
        </div>
        <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-[rgba(28,28,46,0.55)]">
          portal role
        </div>
        <div className="mb-4 flex gap-1.5">
          {ROLES.map((r) => (
            <Chip key={r} active={role === r} onClick={() => setRoleState(r)}>
              {r}
            </Chip>
          ))}
        </div>
        <Button type="submit" className="w-full">
          add human
        </Button>
      </form>
      <Toast message={toast} />
    </div>
  );
}
