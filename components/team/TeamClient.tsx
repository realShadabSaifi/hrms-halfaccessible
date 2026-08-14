"use client";

import { useMemo, useState } from "react";
import { saveProfile } from "@/app/(portal)/team/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { buildTree, filterTree, type TreeNode } from "@/lib/hierarchy/tree";
import { initials } from "@/lib/names";
import { AVATAR_SWATCHES, parseSkills } from "@/lib/profiles/details";
import type { Department, Profile } from "@/lib/types";
import { ArrowLeft, MagnifyingGlass, X } from "@phosphor-icons/react";
import treeStyles from "./TeamTree.module.scss";

function PersonCard({
  person,
  mine,
  onOpen,
}: {
  person: Profile;
  mine: boolean;
  onOpen: (m: Profile) => void;
}) {
  return (
    <div className={treeStyles.row}>
      <button
        type="button"
        onClick={() => onOpen(person)}
        className={`${treeStyles.card} ${mine ? treeStyles.mine : ""}`}
        aria-current={mine ? "true" : undefined}
      >
        <Avatar initials={initials(person.full_name)} color={person.avatar_color} size="sm" />
        <span className={treeStyles.copy}>
          <span className={treeStyles.name}>{person.full_name}</span>
          <span className={treeStyles.title} style={{ color: person.avatar_color }}>
            {person.designation} · {person.department}
          </span>
        </span>
      </button>
      {mine ? (
        <span className={treeStyles.here}>
          <ArrowLeft size={14} weight="bold" aria-hidden />
          you are here
        </span>
      ) : null}
    </div>
  );
}

function TreeBranch({
  nodes,
  me,
  onOpen,
}: {
  nodes: TreeNode<Profile>[];
  me: string;
  onOpen: (m: Profile) => void;
}) {
  return (
    <>
      {nodes.map((n) => (
        <div key={n.person.id} className={treeStyles.node}>
          <PersonCard person={n.person} mine={n.person.id === me} onOpen={onOpen} />
          {n.children.length > 0 ? (
            <div className={treeStyles.kids}>
              {n.children.map((child) => (
                <div key={child.person.id} className={treeStyles.child}>
                  <TreeBranch nodes={[child]} me={me} onOpen={onOpen} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}

export function TeamClient({
  members,
  me,
  departments,
}: {
  members: Profile[];
  me: string;
  departments: Department[];
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState(departments[0]?.name ?? "");
  const [skillsRaw, setSkillsRaw] = useState("");
  const [bio, setBio] = useState("");
  const [color, setColor] = useState<(typeof AVATAR_SWATCHES)[number]>(AVATAR_SWATCHES[0]);
  const [toast, setToast] = useState<string | null>(null);
  const tree = useMemo(() => filterTree(buildTree(members), q), [members, q]);

  function openProfile(m: Profile) {
    setOpen(m);
    setEditing(false);
    setFullName(m.full_name);
    setDesignation(m.designation);
    const names = departments.map((d) => d.name);
    setDepartment(names.includes(m.department) ? m.department : (departments[0]?.name ?? ""));
    setSkillsRaw(m.skills.join(", "));
    setBio(m.bio);
    setColor(
      AVATAR_SWATCHES.includes(m.avatar_color as (typeof AVATAR_SWATCHES)[number])
        ? (m.avatar_color as (typeof AVATAR_SWATCHES)[number])
        : AVATAR_SWATCHES[0],
    );
  }

  return (
    <div className="pageEnter">
      <input
        className="mb-5 min-h-11 w-full max-w-[420px] rounded-ha-md border border-ha-line bg-ha-surface px-4 text-ha-ink"
        placeholder="search by name, role, dept, or skill…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {members.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={28} />}
          title="nobody here yet"
          body="the roster is empty. ask an admin to add a human."
        />
      ) : tree.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={28} />}
          title="nobody matches that vibe"
          body='try a name, role, dept, or skill - like "figma" or "engineering"'
        />
      ) : (
        <div className={treeStyles.forest}>
          <TreeBranch nodes={tree} me={me} onOpen={openProfile} />
        </div>
      )}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ha-ink/45"
          onClick={() => setOpen(null)}
        >
          <div
            className="max-h-[90vh] w-[440px] max-w-[90vw] overflow-y-auto rounded-[24px] bg-ha-surface p-8 shadow-[var(--ha-shadow-card)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="profile"
          >
            <div className="mb-4 flex gap-4">
              <Avatar initials={initials(editing ? fullName : open.full_name)} color={editing ? color : open.avatar_color} size="lg" />
              <div className="flex-1 pt-1">
                <div className="font-[family-name:var(--font-display)] text-[22px] font-bold">
                  {editing ? fullName || open.full_name : open.full_name}
                </div>
                <div className="mt-1 text-[13.5px] font-semibold" style={{ color: editing ? color : open.avatar_color }}>
                  {editing ? `${designation} · ${department}` : `${open.designation} · ${open.department}`}
                </div>
              </div>
              <button
                type="button"
                aria-label="close profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ha-accent-wash text-ha-ink"
                onClick={() => setOpen(null)}
              >
                <X size={14} />
              </button>
            </div>
            {editing ? (
              <>
                <TextField label="full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <div className="h-3" />
                <TextField label="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
                <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
                  department
                </div>
                <div className="mb-3.5 flex flex-wrap gap-1.5">
                  {departments.map((d) => (
                    <Chip key={d.id} active={department === d.name} onClick={() => setDepartment(d.name)}>
                      {d.name}
                    </Chip>
                  ))}
                </div>
                <TextField
                  label="skills"
                  hint="comma-separated"
                  value={skillsRaw}
                  onChange={(e) => setSkillsRaw(e.target.value)}
                />
                <div className="h-3" />
                <TextArea label="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
                  avatar color
                </div>
                <div className="mb-4 flex gap-2">
                  {AVATAR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label="pick avatar color"
                      onClick={() => setColor(c)}
                      className="h-[34px] w-[34px] rounded-full"
                      style={{ background: c, border: color === c ? "3px solid var(--ha-ink)" : "3px solid transparent" }}
                    />
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={async () => {
                    const details = {
                      full_name: fullName,
                      designation,
                      department,
                      skills: parseSkills(skillsRaw),
                      bio,
                      avatar_color: color,
                    };
                    const r = await saveProfile(details);
                    if (!r.ok) {
                      setToast(r.error ?? "nope");
                      return;
                    }
                    setOpen({ ...open, ...details });
                    setEditing(false);
                    setToast("saved.");
                  }}
                >
                  save
                </Button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm leading-relaxed text-ha-ink/80">{open.bio || "no bio yet."}</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {open.skills.map((s) => (
                    <span key={s} className="rounded-full bg-ha-accent-wash px-2.5 py-1 text-[11px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center">
                  <span className="flex-1 text-xs text-ha-muted">joined {open.joined_at}</span>
                  {open.id === me ? (
                    <Button variant="ghost" onClick={() => setEditing(true)}>
                      edit my profile
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      <Toast message={toast} />
    </div>
  );
}
