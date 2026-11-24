import { ClientsManager } from "@/components/invoices/ClientsManager";
import { getClients } from "@/lib/invoices/data";

export default async function ClientsPage() {
  return <ClientsManager clients={await getClients(true)} />;
}
