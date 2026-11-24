import { Badge } from "@/components/ui/Badge";
import type { InvoiceStatus } from "@/lib/invoices/data";

export function isOverdue(status: InvoiceStatus, dueDate: string, today: string): boolean {
  return status === "issued" && dueDate < today;
}

export function InvoiceBadge({ status, overdue }: { status: InvoiceStatus; overdue?: boolean }) {
  if (overdue) return <Badge status="Emergency">overdue</Badge>;
  switch (status) {
    case "draft":
      return <Badge status="Voting">draft</Badge>;
    case "issued":
      return <Badge status="Pending">unpaid</Badge>;
    case "paid":
      return <Badge status="Approved">paid</Badge>;
    case "cancelled":
      return <Badge status="Rejected">cancelled</Badge>;
  }
}
