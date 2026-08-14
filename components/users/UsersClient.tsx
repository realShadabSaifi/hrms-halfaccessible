"use client";

import { useEffect, useState } from "react";
import { addHuman, resetAuthenticator, setActive, setRole, updateHumanDetails } from "@/app/(portal)/users/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { DepartmentsCard } from "@/components/users/DepartmentsCard";
import { initials } from "@/lib/names";
import { AVATAR_SWATCHES, parseSkills } from "@/lib/profiles/details";
import type { Department, Profile, ProfileRole } from "@/lib/types";

const ROLES: ProfileRole[] = ["employee", "lead", "admin"];

type EditDraft = {
  fullName: string;
  designation: string;
  department: string;
  skillsRaw: string;
  bio: string;
  color: (typeof AVATAR_SWATCHES)[number];
};

function draftFrom(u: Profile, departments: Department[]): EditDraft {
  const names = departments.map((d) => d.name);
  return {
    fullName: u.full_name,
    designation: u.designation,
    department: names.includes(u.department) ? u.department : (departments[0]?.name ?? ""),
    skillsRaw: u.skills.join(", "),
    bio: u.bio,
    color: AVATAR_SWATCHES.includes(u.avatar_color as (typeof AVATAR_SWATCHES)[number])
      ? (u.avatar_color as (typeof AVATAR_SWATCHES)[number])
      : AVATAR_SWATCHES[0],
  };
}

export function UsersClient({
  rows,
  me,
  departments,
  canManageDepartments,
}: {
  rows: (Profile & { email?: string })[];
  me: string;
  departments: Department[];
  canManageDepartments: boolean;
}) {
  const [dept, setDept] = useState(departments[0]?.name ?? "");
  const [role, setRoleState] = useState<ProfileRole>("employee");
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  useEffect(() => {
    const names = new Set(departments.map((d) => d.name));
    const fallback = departments[0]?.name ?? "";
    if (dept && !names.has(dept)) setDept(fallback);
    setDraft((prev) => {
      if (!prev) return prev;
      if (names.has(prev.department)) return prev;
      const refreshed = editingId ? rows.find((r) => r.id === editingId)?.department : undefined;
      const safe = refreshed && names.has(refreshed) ? refreshed : fallback;
      return safe === prev.department ? prev : { ...prev, department: safe };
    });
  }, [departments, dept, editingId, rows]);

  function openDetails(u: Profile) {
    if (editingId === u.id) {
      setEditingId(null);
      setDraft(null);
      return;
    }
    setEditingId(u.id);
    setDraft(draftFrom(u, departments));
  }

  return (
    <div className="pageEnter grid items-start gap-5 md:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
        <div className="font-[family-name:var(--font-display)] text-base font-bold">the roster</div>
        <p className="mb-3.5 text-xs text-ha-muted">
          roles, access, authenticators. deactivating keeps their history - we don&apos;t erase people.
        </p>
        {rows.map((u) => (
          <div key={u.id} className="border-b border-ha-line" style={{ opacity: u.active ? 1 : 0.5 }}>
            <div className="flex flex-wrap items-center gap-3 py-3">
              <Avatar initials={initials(u.full_name)} color={u.avatar_color} />
              <span className="min-w-[150px] flex-1">
                <span className="block text-[13.5px] font-semibold">
                  {u.full_name} {u.id === me ? "(you)" : ""}{" "}
                  <span className="ml-1 rounded-full bg-ha-accent-wash px-2 py-0.5 text-[10.5px] font-bold">
                    {u.active ? "active" : "away"}
                  </span>
                </span>
                <span className="block text-[11.5px] text-ha-muted">
                  {u.designation} · {u.department} · joined {u.joined_at}
                </span>
              </span>
              {u.role === "super_admin" ? (
                <span className="rounded-full bg-ha-accent-wash px-2 py-0.5 text-[10.5px] font-bold">
                  super_admin
                </span>
              ) : (
                <>
                  <span className="flex gap-1 rounded-full border border-ha-line bg-ha-bg p-0.5">
                    {ROLES.map((r) => (
                      <Chip key={r} active={u.role === r} onClick={() => setRole(u.id, r)}>
                        {r}
                      </Chip>
                    ))}
                  </span>
                  <Button variant="ghost" onClick={() => openDetails(u)}>
                    {editingId === u.id ? "close details" : "edit details"}
                  </Button>
                  <Button variant="ghost" onClick={() => resetAuthenticator(u.id)}>
                    reset authenticator
                  </Button>
                  <Button variant="ghost" onClick={() => setActive(u.id, !u.active)}>
                    {u.active ? "deactivate" : "reactivate"}
                  </Button>
                </>
              )}
            </div>
            {editingId === u.id && draft ? (
              <div className="mb-3 rounded-ha-lg border border-ha-line bg-ha-bg p-4">
                <TextField
                  label="full name"
                  value={draft.fullName}
                  onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                />
                <div className="h-3" />
                <TextField
                  label="designation"
                  value={draft.designation}
                  onChange={(e) => setDraft({ ...draft, designation: e.target.value })}
                />
                <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
                  department
                </div>
                <div className="mb-3.5 flex flex-wrap gap-1.5">
                  {departments.map((d) => (
                    <Chip
                      key={d.id}
                      active={draft.department === d.name}
                      onClick={() => setDraft({ ...draft, department: d.name })}
                    >
                      {d.name}
                    </Chip>
                  ))}
                </div>
                <TextField
                  label="skills"
                  hint="comma-separated"
                  value={draft.skillsRaw}
                  onChange={(e) => setDraft({ ...draft, skillsRaw: e.target.value })}
                />
                <div className="h-3" />
                <TextArea
                  label="bio"
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  rows={3}
                />
                <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
                  avatar color
                </div>
                <div className="mb-4 flex gap-2">
                  {AVATAR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label="pick avatar color"
                      onClick={() => setDraft({ ...draft, color: c })}
                      className="h-[34px] w-[34px] rounded-full"
                      style={{
                        background: c,
                        border: draft.color === c ? "3px solid var(--ha-ink)" : "3px solid transparent",
                      }}
                    />
                  ))}
                </div>
                <Button
                  onClick={async () => {
                    const r = await updateHumanDetails(u.id, {
                      full_name: draft.fullName,
                      designation: draft.designation,
                      department: draft.department,
                      skills: parseSkills(draft.skillsRaw),
                      bio: draft.bio,
                      avatar_color: draft.color,
                    });
                    if (!r.ok) {
                      setToast(r.error ?? "nope");
                      return;
                    }
                    setEditingId(null);
                    setDraft(null);
                    setToast("saved.");
                  }}
                >
                  save details
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="grid gap-5">
        {canManageDepartments ? (
          <DepartmentsCard departments={departments} onToast={setToast} />
        ) : null}
        <form
          className="rounded-ha-lg border border-ha-line bg-ha-surface p-6 shadow-[var(--ha-shadow-card)]"
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
          <p className="mb-4 text-xs text-ha-muted">
            they&apos;ll set up an authenticator on first login. no passwords, ever.
          </p>
          <TextField name="name" label="full name" placeholder="e.g. Zara Khan" />
          <div className="h-3" />
          <TextField name="email" label="email" type="email" required />
          <div className="h-3" />
          <TextField name="title" label="designation" placeholder="e.g. Chaos Coordinator" />
          <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
            department
          </div>
          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {departments.map((d) => (
              <Chip key={d.id} active={dept === d.name} onClick={() => setDept(d.name)}>
                {d.name}
              </Chip>
            ))}
          </div>
          <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
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
      </div>
      <Toast message={toast} />
    </div>
  );
}
