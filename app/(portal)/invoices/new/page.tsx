import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { getClients, getCompany } from "@/lib/invoices/data";

export default async function NewInvoicePage() {
  const [clients, company] = await Promise.all([getClients(), getCompany()]);
  return <InvoiceEditor id={null} initial={null} initialItems={[]} clients={clients} company={company} />;
}
