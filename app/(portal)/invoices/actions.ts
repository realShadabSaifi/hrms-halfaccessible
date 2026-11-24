"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { computeTotals } from "@/lib/invoices/money";
import {
  type ClientInput,
  type CompanyInput,
  type DraftInput,
  issueBlocker,
  validateClient,
  validateCompany,
  validateDraft,
} from "@/lib/invoices/validate";
import { logoExtension, validateLogoFile } from "@/lib/branding/validate";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });

const cxo = () => requireRole(["cxo"]);

const up = (s: string) => s.trim().toUpperCase();

function revalidateInvoices(id?: string) {
  revalidatePath("/invoices");
  if (id) revalidatePath(`/invoices/${id}`);
}

// ---------------- company ----------------

export async function saveCompany(input: CompanyInput): Promise<Result> {
  const me = await cxo();
  const err = validateCompany(input);
  if (err) return fail(err);
  const admin = createAdminClient();
  const { error } = await admin.from("company_profile").upsert({
    id: 1,
    name: input.name.trim(),
    address: input.address.trim(),
    state_code: input.state_code,
    pan: up(input.pan),
    gstin: up(input.gstin),
    email: input.email.trim(),
    phone: input.phone.trim(),
    website: input.website.trim(),
    bank_holder: input.bank_holder.trim(),
    bank_account: input.bank_account.trim(),
    bank_ifsc: up(input.bank_ifsc),
    bank_name: input.bank_name.trim(),
    invoice_prefix: input.invoice_prefix.trim() || "INV",
    default_terms: input.default_terms.trim() || "Immediate",
    updated_at: new Date().toISOString(),
    updated_by: me.id,
  });
  if (error) return fail(error.message);
  revalidatePath("/invoices", "layout");
  return { ok: true };
}

export async function uploadCompanyLogo(formData: FormData): Promise<Result> {
  await cxo();
  const file = formData.get("logo");
  if (!(file instanceof File)) return fail("pick an image");
  // the PDF can embed PNG and JPEG only
  if (file.type !== "image/png" && file.type !== "image/jpeg") return fail("use a PNG or JPG for the invoice logo");
  const err = validateLogoFile({ type: file.type, size: file.size });
  if (err) return fail(err);
  const admin = createAdminClient();
  const path = `invoice-logo-${randomBytes(8).toString("hex")}.${logoExtension(file.type)}`;
  const { error: upErr } = await admin.storage.from("branding").upload(path, file, { contentType: file.type });
  if (upErr) return fail(upErr.message);
  const { data: current } = await admin.from("company_profile").select("logo_path").eq("id", 1).maybeSingle();
  const { error } = await admin.from("company_profile").upsert({ id: 1, logo_path: path, updated_at: new Date().toISOString() });
  if (error) return fail(error.message);
  // old logo stays if an issued invoice still points at it; only remove it when no snapshot uses it
  if (current?.logo_path) {
    const { count } = await admin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("company_snapshot->>logo_path", current.logo_path);
    if (!count) await admin.storage.from("branding").remove([current.logo_path]);
  }
  revalidatePath("/invoices", "layout");
  return { ok: true };
}

export async function removeCompanyLogo(): Promise<Result> {
  await cxo();
  const admin = createAdminClient();
  const { error } = await admin.from("company_profile").upsert({ id: 1, logo_path: null, updated_at: new Date().toISOString() });
  if (error) return fail(error.message);
  revalidatePath("/invoices", "layout");
  return { ok: true };
}

// ---------------- clients ----------------

export async function saveClient(id: string | null, input: ClientInput): Promise<Result & { id?: string }> {
  const me = await cxo();
  const err = validateClient(input);
  if (err) return fail(err);
  const row = {
    name: input.name.trim(),
    address: input.address.trim(),
    country: input.country.trim() || (input.state_code === "96" ? "" : "India"),
    pincode: input.pincode.trim(),
    state_code: input.state_code,
    gstin: up(input.gstin),
    email: input.email.trim(),
    default_currency: input.default_currency,
  };
  const admin = createAdminClient();
  const q = id
    ? admin.from("clients").update(row).eq("id", id).select("id").single()
    : admin.from("clients").insert({ ...row, created_by: me.id }).select("id").single();
  const { data, error } = await q;
  if (error) return fail(error.message);
  revalidatePath("/invoices", "layout");
  return { ok: true, id: data.id };
}

export async function setClientArchived(id: string, archived: boolean): Promise<Result> {
  await cxo();
  const admin = createAdminClient();
  const { error } = await admin.from("clients").update({ archived }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/invoices", "layout");
  return { ok: true };
}

// ---------------- invoices ----------------

async function loadDraftContext(admin: ReturnType<typeof createAdminClient>, clientId: string) {
  const [{ data: company }, { data: client }] = await Promise.all([
    admin.from("company_profile").select("*").eq("id", 1).maybeSingle(),
    admin.from("clients").select("*").eq("id", clientId).maybeSingle(),
  ]);
  return { company, client };
}

/** Create or update a draft. Totals are always recomputed on the server. */
export async function saveDraft(id: string | null, input: DraftInput): Promise<Result & { id?: string }> {
  const me = await cxo();
  const err = validateDraft(input);
  if (err) return fail(err);
  const admin = createAdminClient();
  if (id) {
    const { data: existing } = await admin.from("invoices").select("status").eq("id", id).maybeSingle();
    if (!existing) return fail("invoice not found");
    if (existing.status !== "draft") return fail("issued invoices can't be edited");
  }
  const { company, client } = await loadDraftContext(admin, input.client_id);
  if (!client) return fail("client not found");
  const t = computeTotals(input.items, {
    currency: input.currency,
    companyState: company?.state_code ?? "",
    placeOfSupply: input.place_of_supply,
  });
  const row = {
    client_id: input.client_id,
    currency: input.currency,
    fx_rate: input.currency === "INR" ? null : input.fx_rate,
    invoice_date: input.invoice_date,
    due_date: input.due_date,
    payment_terms: input.payment_terms.trim() || "Immediate",
    place_of_supply: input.place_of_supply,
    notes: input.notes.trim(),
    subtotal: t.subtotal,
    cgst: t.cgst,
    sgst: t.sgst,
    igst: t.igst,
    total: t.total,
    updated_at: new Date().toISOString(),
  };
  let invoiceId = id;
  if (invoiceId) {
    const { error } = await admin.from("invoices").update(row).eq("id", invoiceId).eq("status", "draft");
    if (error) return fail(error.message);
    const { error: delErr } = await admin.from("invoice_items").delete().eq("invoice_id", invoiceId);
    if (delErr) return fail(delErr.message);
  } else {
    const { data, error } = await admin
      .from("invoices")
      .insert({ ...row, status: "draft", created_by: me.id })
      .select("id")
      .single();
    if (error) return fail(error.message);
    invoiceId = data.id;
  }
  const { error: itemsErr } = await admin.from("invoice_items").insert(
    input.items.map((it, i) => ({
      invoice_id: invoiceId,
      position: i,
      name: it.name.trim(),
      description: it.description.trim(),
      hsn_sac: it.hsn_sac.trim(),
      qty: it.qty,
      rate: it.rate,
      gst_rate: input.currency === "INR" ? it.gst_rate : 0,
      amount: t.lines[i].amount,
    })),
  );
  if (itemsErr) return fail(itemsErr.message);
  revalidateInvoices(invoiceId!);
  return { ok: true, id: invoiceId! };
}

/** Lock the draft: freeze company + client details, then take the next number. */
export async function issueInvoice(id: string): Promise<Result & { number?: string }> {
  await cxo();
  const admin = createAdminClient();
  const { data: inv } = await admin.from("invoices").select("status, client_id, currency").eq("id", id).maybeSingle();
  if (!inv) return fail("invoice not found");
  if (inv.status !== "draft") return fail("this invoice is already issued");
  const { count } = await admin.from("invoice_items").select("id", { count: "exact", head: true }).eq("invoice_id", id);
  if (!count) return fail("add at least one item");
  const { company, client } = await loadDraftContext(admin, inv.client_id);
  const blocker = issueBlocker(company, inv.currency);
  if (blocker) return fail(blocker);
  if (!client) return fail("client not found");
  const { id: _cid, created_by: _a, created_at: _b, archived: _c, ...clientSnap } = client;
  const { id: _pid, updated_at: _d, updated_by: _e, ...companySnap } = company!;
  const { error: snapErr } = await admin
    .from("invoices")
    .update({ client_snapshot: clientSnap, company_snapshot: companySnap })
    .eq("id", id)
    .eq("status", "draft");
  if (snapErr) return fail(snapErr.message);
  const { data: number, error } = await admin.rpc("issue_invoice", { p_invoice_id: id });
  if (error) return fail(error.message);
  revalidateInvoices(id);
  return { ok: true, number: number as string };
}

export async function markPaid(id: string, paid: boolean): Promise<Result> {
  await cxo();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invoices")
    .update(
      paid
        ? { status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : { status: "issued", paid_at: null, updated_at: new Date().toISOString() },
    )
    .eq("id", id)
    .eq("status", paid ? "issued" : "paid")
    .select("id");
  if (error) return fail(error.message);
  if (!data?.length) return fail(paid ? "only issued invoices can be marked paid" : "invoice isn't marked paid");
  revalidateInvoices(id);
  return { ok: true };
}

export async function cancelInvoice(id: string): Promise<Result> {
  await cxo();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invoices")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["issued", "paid"])
    .select("id");
  if (error) return fail(error.message);
  if (!data?.length) return fail("only issued invoices can be cancelled; delete drafts instead");
  revalidateInvoices(id);
  return { ok: true };
}

export async function deleteDraft(id: string): Promise<Result> {
  await cxo();
  const admin = createAdminClient();
  const { data, error } = await admin.from("invoices").delete().eq("id", id).eq("status", "draft").select("id");
  if (error) return fail(error.message);
  if (!data?.length) return fail("only drafts can be deleted");
  revalidateInvoices();
  return { ok: true };
}

/** New draft copying another invoice's client and items (handy for monthly billing). */
export async function duplicateInvoice(id: string): Promise<Result & { id?: string }> {
  const me = await cxo();
  const admin = createAdminClient();
  const [{ data: inv }, { data: items }] = await Promise.all([
    admin.from("invoices").select("*").eq("id", id).maybeSingle(),
    admin.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
  ]);
  if (!inv) return fail("invoice not found");
  const today = new Date().toISOString().slice(0, 10);
  const { data: copy, error } = await admin
    .from("invoices")
    .insert({
      status: "draft",
      client_id: inv.client_id,
      currency: inv.currency,
      fx_rate: inv.fx_rate,
      invoice_date: today,
      due_date: today,
      payment_terms: inv.payment_terms,
      place_of_supply: inv.place_of_supply,
      notes: inv.notes,
      subtotal: inv.subtotal,
      cgst: inv.cgst,
      sgst: inv.sgst,
      igst: inv.igst,
      total: inv.total,
      created_by: me.id,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);
  if (items?.length) {
    const { error: e2 } = await admin.from("invoice_items").insert(
      items.map(({ id: _i, invoice_id: _v, ...rest }) => ({ ...rest, invoice_id: copy.id })),
    );
    if (e2) return fail(e2.message);
  }
  revalidateInvoices();
  return { ok: true, id: copy.id };
}
