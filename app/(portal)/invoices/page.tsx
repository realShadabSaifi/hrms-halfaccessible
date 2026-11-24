import { InvoiceList } from "@/components/invoices/InvoiceList";
import { localDateKey } from "@/lib/attendance/day";
import { getCompany, getInvoices } from "@/lib/invoices/data";

export default async function InvoicesPage() {
  const [rows, company] = await Promise.all([getInvoices(), getCompany()]);
  return (
    <InvoiceList
      rows={rows}
      today={localDateKey(new Date().toISOString())}
      companyReady={Boolean(company.name && company.state_code)}
    />
  );
}
