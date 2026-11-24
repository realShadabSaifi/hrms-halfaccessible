import { notFound } from "next/navigation";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { InvoiceView } from "@/components/invoices/InvoiceView";
import { localDateKey } from "@/lib/attendance/day";
import { getClients, getCompany, getInvoice } from "@/lib/invoices/data";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ issued?: string }>;
}) {
  const { id } = await params;
  const { issued } = await searchParams;
  const found = await getInvoice(id);
  if (!found) notFound();
  const { invoice, items } = found;

  if (invoice.status !== "draft") {
    return <InvoiceView invoice={invoice} items={items} justIssued={issued === "1"} today={localDateKey(new Date().toISOString())} />;
  }

  const [clients, company] = await Promise.all([getClients(true), getCompany()]);
  // keep an archived client selectable on an old draft
  const usable = clients.filter((c) => !c.archived || c.id === invoice.client_id);
  return (
    <InvoiceEditor
      key={invoice.id}
      id={invoice.id}
      initial={{
        client_id: invoice.client_id ?? "",
        currency: invoice.currency,
        fx_rate: invoice.fx_rate,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        payment_terms: invoice.payment_terms,
        place_of_supply: invoice.place_of_supply,
        notes: invoice.notes,
      }}
      initialItems={items}
      clients={usable}
      company={company}
    />
  );
}
