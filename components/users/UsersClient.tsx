"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { addHuman, resetAuthenticator, setActive, setManager, setRole, updateHumanDetails } from "@/app/(portal)/users/actions";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { DepartmentsCard } from "@/components/users/DepartmentsCard";
import { X } from "@phosphor-icons/react";
import { managerToast } from "@/lib/hierarchy/copy";
import { buildTree, type TreeNode } from "@/lib/hierarchy/tree";
import { validateManager } from "@/lib/hierarchy/validate";
import { initials, jobLine, roleLabel } from "@/lib/names";
import { AVATAR_SWATCHES, parseSkills } from "@/lib/profiles/details";
import { isVisiblePerson } from "@/lib/profiles/visible";
import type { Department, Profile, ProfileRole } from "@/lib/types";
import fieldStyles from "@/components/ui/TextField/TextField.module.scss";
import rosterStyles from "./UsersRoster.module.scss";

const ROLES: ProfileRole[] = ["employee", "lead", "admin", "cxo"];

type EditDraft = {
  fullName: string;
  designation: string;
  department: string;
  skillsRaw: string;
  bio: string;
  color: (typeof AVATAR_SWATCHES)[number];
};

type RosterTreeProps = {
  nodes: TreeNode<Profile>[];
  me: string;
  dragId: string | null;
  overId: string | null;
  editingId: string | null;
  draft: EditDraft | null;
  departments: Department[];
  onDragId: (id: string | null) => void;
  onOverId: (id: string | null) => void;
  onDrop: (id: string | null) => void;
  onRowKeyDown: (e: KeyboardEvent, id: string | null) => void;
  onOpenDetails: (u: Profile) => void;
  onDraft: (draft: EditDraft) => void;
  onToast: (msg: string | null) => void;
  onCloseDetails: () => void;
  people: { id: string; full_name: string }[];
  onAssignManager: (personId: string, managerId: string | null) => void;
};

function RosterTree({
  nodes,
  me,
  dragId,
  overId,
  editingId,
  draft,
  departments,
  onDragId,
  onOverId,
  onDrop,
  onRowKeyDown,
  onOpenDetails,
  onDraft,
  onToast,
  onCloseDetails,
  people,
  onAssignManager,
}: RosterTreeProps) {
  return (
    <>
      {nodes.map((n) => {
        const u = n.person;
        const over = Boolean(overId === u.id && dragId && dragId !== u.id);
        const open = editingId === u.id;
        return (
          <div key={u.id} className={rosterStyles.node}>
            <div className={rosterStyles.row}>
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  onDragId(u.id);
                }}
                onDragEnd={() => {
                  onDragId(null);
                  onOverId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  onOverId(u.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(u.id);
                }}
                onKeyDown={(e) => onRowKeyDown(e, u.id)}
                tabIndex={0}
                aria-grabbed={dragId === u.id}
                className={`${rosterStyles.card} ${over ? rosterStyles.over : ""} ${
                  dragId === u.id ? rosterStyles.dragging : ""
                } ${u.active ? "" : rosterStyles.away}`}
              >
                <span aria-hidden className={rosterStyles.handle}>
                  ⠿
                </span>
                <Avatar initials={initials(u.full_name)} color={u.avatar_color} size="sm" />
                <span className={rosterStyles.copy}>
                  <span className={rosterStyles.name}>
                    {u.full_name}
                    {u.id === me ? <span className={rosterStyles.pill}>you</span> : null}
                    {u.active ? null : <span className={rosterStyles.pill}>away</span>}
                  </span>
                  <span className={rosterStyles.title} style={{ color: u.avatar_color }}>
                    {jobLine(u.designation, u.department)}
                  </span>
                </span>
              </div>
              <Button variant="ghost" onClick={() => onOpenDetails(u)}>
                {open ? "close" : "manage"}
              </Button>
            </div>
            {open && draft ? (
              <div className={rosterStyles.panel}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ha-muted">
                  portal role
                </div>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {ROLES.map((r) => (
                    <Chip key={r} active={u.role === r} onClick={() => setRole(u.id, r)}>
                      {roleLabel(r)}
                    </Chip>
                  ))}
                </div>
                <label className={`${fieldStyles.wrap} mb-4`} htmlFor={`manager-${u.id}`}>
                  <span className={fieldStyles.label}>reports to</span>
                  <select
                    id={`manager-${u.id}`}
                    className={fieldStyles.input}
                    value={u.manager_id ?? ""}
                    onChange={(e) => onAssignManager(u.id, e.target.value || null)}
                  >
                    <option value="">no one (top of the tree)</option>
                    {people
                      .filter((p) => p.id !== u.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name}
                        </option>
                      ))}
                  </select>
                </label>
                <div className={rosterStyles.actions}>
                  <Button variant="ghost" onClick={() => resetAuthenticator(u.id)}>
                    reset authenticator
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const r = await setActive(u.id, !u.active);
                      if (!r.ok) onToast(r.error ?? "nope");
                    }}
                  >
                    {u.active ? "deactivate" : "reactivate"}
                  </Button>
                </div>
                <TextField
                  label="full name"
                  value={draft.fullName}
                  onChange={(e) => onDraft({ ...draft, fullName: e.target.value })}
                />
                <div className="h-3" />
                <TextField
                  label="designation"
                  value={draft.designation}
                  onChange={(e) => onDraft({ ...draft, designation: e.target.value })}
                />
                <div className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-ha-muted">
                  department
                </div>
                <div className="mb-3.5 flex flex-wrap gap-1.5">
                  {departments.map((d) => (
                    <Chip
                      key={d.id}
                      active={draft.department === d.name}
                      onClick={() => onDraft({ ...draft, department: d.name })}
                    >
                      {d.name}
                    </Chip>
                  ))}
                </div>
                <TextField
                  label="skills"
                  hint="comma-separated"
                  value={draft.skillsRaw}
                  onChange={(e) => onDraft({ ...draft, skillsRaw: e.target.value })}
                />
                <div className="h-3" />
                <TextArea
                  label="bio"
                  value={draft.bio}
                  onChange={(e) => onDraft({ ...draft, bio: e.target.value })}
                  rows={3}
                />
                <div className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-ha-muted">
                  avatar color
                </div>
                <div className="mb-4 flex gap-2">
                  {AVATAR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label="pick avatar color"
                      onClick={() => onDraft({ ...draft, color: c })}
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
                      onToast(r.error ?? "nope");
                      return;
                    }
                    onCloseDetails();
                    onToast("saved.");
                  }}
                >
                  save details
                </Button>
              </div>
            ) : null}
            {n.children.length > 0 ? (
              <div className={rosterStyles.kids}>
                {n.children.map((child) => (
                  <div key={child.person.id} className={rosterStyles.child}>
                    <RosterTree
                      nodes={[child]}
                      me={me}
                      dragId={dragId}
                      overId={overId}
                      editingId={editingId}
                      draft={draft}
                      departments={departments}
                      onDragId={onDragId}
                      onOverId={onOverId}
                      onDrop={onDrop}
                      onRowKeyDown={onRowKeyDown}
                      onOpenDetails={onOpenDetails}
                      onDraft={onDraft}
                      onToast={onToast}
                      onCloseDetails={onCloseDetails}
                      people={people}
                      onAssignManager={onAssignManager}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

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
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const visible = useMemo(() => rows.filter((r) => isVisiblePerson(r.role)), [rows]);
  const tree = useMemo(() => buildTree(visible), [visible]);
  const openAdd = useCallback(() => setAdding(true), []);
  const addButton = useMemo(
    () => (
      <Button onClick={openAdd} aria-haspopup="dialog">
        add person
      </Button>
    ),
    [openAdd],
  );

  useEffect(() => {
    if (!adding) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setAdding(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [adding]);

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

  function personById(id: string) {
    return visible.find((r) => r.id === id);
  }

  async function assignManager(personId: string, targetId: string | null) {
    const err = validateManager(
      personId,
      targetId,
      visible.map((r) => ({ id: r.id, manager_id: r.manager_id })),
    );
    if (err) {
      setToast(err);
      return;
    }
    const r = await setManager(personId, targetId);
    if (!r.ok) {
      setToast(r.error ?? "nope");
      return;
    }
    const person = personById(personId);
    const manager = targetId ? personById(targetId) : null;
    if (person) setToast(managerToast(person.full_name, manager?.full_name ?? null));
  }

  async function dropOn(targetId: string | null) {
    if (!dragId) return;
    const personId = dragId;
    setDragId(null);
    setOverId(null);
    await assignManager(personId, targetId);
  }

  function onRowKeyDown(e: KeyboardEvent, id: string | null) {
    if (e.key === "Escape") {
      setDragId(null);
      setOverId(null);
      return;
    }
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (!dragId) {
      if (id) setDragId(id);
      return;
    }
    void dropOn(id);
  }

  return (
    <div className={`pageEnter grid items-start gap-5 ${canManageDepartments ? "md:grid-cols-[1.3fr_0.7fr]" : ""}`}>
      <HeaderActions>{addButton}</HeaderActions>
      <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
        <div className="font-[family-name:var(--font-display)] text-base font-bold">the roster</div>
        <p className="mb-5 text-xs text-ha-muted">
          open <strong>manage</strong> to change someone&apos;s role, who they report to, or their details. you can also
          drag a person onto their new manager. deactivating keeps their history.
        </p>
        <div className={rosterStyles.roster}>
          <div
            role="button"
            tabIndex={0}
            aria-label="drop here so they report to no one"
            onDragOver={(e) => {
              e.preventDefault();
              setOverId("unassign");
            }}
            onDrop={(e) => {
              e.preventDefault();
              void dropOn(null);
            }}
            onKeyDown={(e) => onRowKeyDown(e, null)}
            className={`${rosterStyles.drop} ${overId === "unassign" && dragId ? rosterStyles.dropHot : ""}`}
          >
            drop here so they report to no one
          </div>
          <div className={rosterStyles.forest}>
            <RosterTree
              nodes={tree}
              me={me}
              dragId={dragId}
              overId={overId}
              editingId={editingId}
              draft={draft}
              departments={departments}
              onDragId={setDragId}
              onOverId={setOverId}
              onDrop={(id) => void dropOn(id)}
              onRowKeyDown={onRowKeyDown}
              onOpenDetails={openDetails}
              onDraft={setDraft}
              onToast={setToast}
              onCloseDetails={() => {
                setEditingId(null);
                setDraft(null);
              }}
              people={visible.filter((r) => r.active)}
              onAssignManager={(personId, managerId) => void assignManager(personId, managerId)}
            />
          </div>
        </div>
      </div>
      {canManageDepartments ? (
        <div className="grid gap-5">
          <DepartmentsCard departments={departments} onToast={setToast} />
        </div>
      ) : null}
      {adding ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ha-ink/45"
          onClick={() => setAdding(false)}
        >
          <div
            className="max-h-[90vh] w-[440px] max-w-[90vw] overflow-y-auto rounded-[24px] bg-ha-surface p-8 shadow-[var(--ha-shadow-card)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-human-title"
          >
            <div className="mb-4 flex items-start gap-4">
              <div className="flex-1">
                <div
                  id="add-human-title"
                  className="font-[family-name:var(--font-display)] text-[22px] font-bold"
                >
                  add a human
                </div>
                <p className="mt-1 text-xs text-ha-muted">
                  they&apos;ll set up an authenticator on first login. no passwords, ever.
                </p>
              </div>
              <button
                type="button"
                aria-label="close add person"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ha-accent-wash text-ha-ink"
                onClick={() => setAdding(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form
              action={async (fd) => {
                const r = await addHuman({
                  email: String(fd.get("email")),
                  fullName: String(fd.get("name")),
                  designation: String(fd.get("title")),
                  department: dept,
                  role,
                });
                if (!r.ok) {
                  setToast(r.error ?? "nope");
                  return;
                }
                setAdding(false);
                setToast("human added. they still need to scan a QR.");
              }}
            >
              <TextField name="name" label="full name" placeholder="e.g. Zara Khan" />
              <div className="h-3" />
              <TextField name="email" label="email" type="email" required />
              <div className="h-3" />
              <TextField name="title" label="designation" placeholder="e.g. Chaos Coordinator" />
              <div className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-ha-muted">
                department
              </div>
              <div className="mb-3.5 flex flex-wrap gap-1.5">
                {departments.map((d) => (
                  <Chip key={d.id} active={dept === d.name} onClick={() => setDept(d.name)}>
                    {d.name}
                  </Chip>
                ))}
              </div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ha-muted">
                portal role
              </div>
              <div className="mb-4 flex gap-1.5">
                {ROLES.map((r) => (
                  <Chip key={r} active={role === r} onClick={() => setRoleState(r)}>
                    {roleLabel(r)}
                  </Chip>
                ))}
              </div>
              <Button type="submit" className="w-full">
                add person
              </Button>
            </form>
          </div>
        </div>
      ) : null}
      <Toast message={toast} />
    </div>
  );
}
