"use client";

import { useState, useTransition } from "react";
import { saveClient, setClientArchived } from "@/app/(portal)/invoices/actions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import type { Client } from "@/lib/invoices/data";
import { OUTSIDE_INDIA, placeOfSupplyLabel } from "@/lib/invoices/reference";
import type { ClientInput } from "@/lib/invoices/validate";
import { AddressBook } from "@phosphor-icons/react";
import { CurrencyOptions, Panel, SelectField, StateOptions } from "./fields";

const BLANK: ClientInput = {
  name: "",
  address: "",
  country: "India",
  pincode: "",
  state_code: "",
  gstin: "",
  email: "",
  default_currency: "INR",
};

export function ClientForm({
  initial,
  id,
  onDone,
  onCancel,
}: {
  initial: ClientInput;
  id: string | null;
  onDone: (msg: string, newId?: string) => void;
  onCancel?: () => void;
}) {
  const [c, setC] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof ClientInput) => (e: { target: { value: string } }) => setC({ ...c, [k]: e.target.value });
  const abroad = c.state_code === OUTSIDE_INDIA;
  const p = id ?? "new";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveClient(id, c);
          if (!r.ok) setError(r.error);
          else onDone(id ? "client updated." : "client added.", r.id);
        })
      }}
      className="grid gap-3 md:grid-cols-2"
    >
      <TextField id={`${p}-name`} label="client name" value={c.name} onChange={set("name")} required className="md:col-span-2" />
      <TextArea id={`${p}-address`} label="address" value={c.address} onChange={set("address")} rows={2} className="md:col-span-2" />
      <SelectField
        id={`${p}-state`}
        label="place of supply"
        value={c.state_code}
        onChange={(e) => {
          const v = e.target.value;
          setC({
            ...c,
            state_code: v,
            country: v === OUTSIDE_INDIA ? (c.country === "India" ? "" : c.country) : "India",
            default_currency: v === OUTSIDE_INDIA ? c.default_currency : "INR",
          });
        }}
        required
        hint="the client's state, or 'Outside India'"
      >
        <StateOptions />
      </SelectField>
      <SelectField id={`${p}-currency`} label="usual currency" value={c.default_currency} onChange={set("default_currency")}>
        <CurrencyOptions />
      </SelectField>
      <TextField id={`${p}-country`} label="country" value={c.country} onChange={set("country")} required={abroad} />
      <TextField id={`${p}-pin`} label={abroad ? "postal / zip code" : "PIN code"} value={c.pincode} onChange={set("pincode")} />
      {!abroad ? (
        <TextField id={`${p}-gstin`} label="client GSTIN (optional)" value={c.gstin} onChange={set("gstin")} placeholder="07ABCDE1234F1Z5" />
      ) : null}
      <TextField id={`${p}-email`} label="billing email (optional)" value={c.email} onChange={set("email")} type="email" />
      {error ? (
        <p role="alert" className="text-[13px] font-semibold text-ha-danger md:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" pending={pending}>
          {id ? "save client" : "add client"}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function ClientsManager({ clients }: { clients: Client[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const list = clients.filter((c) => showArchived || !c.archived);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
      <Panel title="clients" sub="saved once, picked on every invoice. edits don't change invoices already issued.">
        {list.length === 0 ? (
          <EmptyState icon={<AddressBook size={28} />} title="no clients yet" body="add your first client with the form." />
        ) : (
          <ul className="divide-y divide-ha-line">
            {list.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold">
                      {c.name}
                      {c.archived ? <span className="ml-2 text-xs font-semibold text-ha-muted">(archived)</span> : null}
                    </div>
                    <div className="text-xs text-ha-muted">
                      {[placeOfSupplyLabel(c.state_code), c.default_currency, c.gstin].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setEditing(editing === c.id ? null : c.id)}>
                    {editing === c.id ? "close" : "edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const r = await setClientArchived(c.id, !c.archived);
                      setToast(r.ok ? (c.archived ? "client restored." : "client archived.") : r.error);
                    }}
                  >
                    {c.archived ? "restore" : "archive"}
                  </Button>
                </div>
                {editing === c.id ? (
                  <div className="mt-3 rounded-ha-md border border-ha-line bg-ha-bg p-4">
                    <ClientForm
                      id={c.id}
                      initial={c}
                      onDone={(m) => {
                        setEditing(null);
                        setToast(m);
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {clients.some((c) => c.archived) ? (
          <label className="mt-3 flex items-center gap-2 text-[13px] text-ha-muted">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            show archived clients
          </label>
        ) : null}
      </Panel>
      <Panel title="add a client">
        <ClientForm key={clients.length} id={null} initial={BLANK} onDone={(m) => setToast(m)} />
      </Panel>
      <Toast message={toast} />
    </div>
  );
}
