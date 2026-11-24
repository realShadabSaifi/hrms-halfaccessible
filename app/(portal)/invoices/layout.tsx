import { InvoicesNav } from "@/components/invoices/InvoicesNav";
import { requireRole } from "@/lib/auth";

export default async function InvoicesLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["cxo"]);
  return (
    <div className="pageEnter">
      <InvoicesNav />
      {children}
    </div>
  );
}
