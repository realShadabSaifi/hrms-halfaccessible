import { CompanyForm } from "@/components/invoices/CompanyForm";
import { logoPublicUrl } from "@/lib/branding/settings";
import { getCompany } from "@/lib/invoices/data";

export default async function CompanyPage() {
  const company = await getCompany();
  return <CompanyForm company={company} logoUrl={logoPublicUrl(company.logo_path)} />;
}
