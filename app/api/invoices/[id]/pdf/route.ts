import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { type Company, EMPTY_COMPANY, getInvoice } from "@/lib/invoices/data";
import type { ClientInput } from "@/lib/invoices/validate";
import { renderInvoicePdf } from "@/lib/invoices/pdf";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.active || profile.role !== "cxo") {
    return NextResponse.json({ error: "not allowed" }, { status: 403 });
  }
  const { id } = await params;
  const found = await getInvoice(id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { invoice, items } = found;

  const admin = createAdminClient();
  // issued invoices print the details frozen at issue time; drafts use the current ones
  const blankClient: ClientInput = { name: "", address: "", country: "", pincode: "", state_code: "", gstin: "", email: "", default_currency: invoice.currency };
  let company: Company = invoice.company_snapshot ? { ...EMPTY_COMPANY, ...invoice.company_snapshot } : EMPTY_COMPANY;
  let client: ClientInput = invoice.client_snapshot ? { ...blankClient, ...invoice.client_snapshot } : blankClient;
  if (invoice.status === "draft" || !invoice.company_snapshot || !invoice.client_snapshot) {
    const [{ data: co }, { data: cl }] = await Promise.all([
      admin.from("company_profile").select("*").eq("id", 1).maybeSingle(),
      invoice.client_id
        ? admin.from("clients").select("*").eq("id", invoice.client_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    company = { ...EMPTY_COMPANY, ...(co ?? {}) };
    client = { ...blankClient, ...(cl ?? {}) };
  }

  let logo: { bytes: Uint8Array; type: "png" | "jpg" } | null = null;
  if (company.logo_path && /\.(png|jpe?g)$/i.test(company.logo_path)) {
    const { data } = await admin.storage.from("branding").download(company.logo_path);
    if (data) logo = { bytes: new Uint8Array(await data.arrayBuffer()), type: /\.png$/i.test(company.logo_path) ? "png" : "jpg" };
  }

  const pdf = await renderInvoicePdf({
    status: invoice.status,
    number: invoice.number,
    currency: invoice.currency,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    payment_terms: invoice.payment_terms,
    place_of_supply: invoice.place_of_supply,
    notes: invoice.notes,
    company,
    client,
    items,
    logo,
  });

  const name = `${(invoice.number ?? `draft-${invoice.id.slice(0, 8)}`).replace(/[^\w.-]+/g, "-")}.pdf`;
  const download = new URL(req.url).searchParams.has("download");
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
