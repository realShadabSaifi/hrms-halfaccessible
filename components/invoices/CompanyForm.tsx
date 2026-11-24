"use client";

import { useState, useTransition } from "react";
import { removeCompanyLogo, saveCompany, uploadCompanyLogo } from "@/app/(portal)/invoices/actions";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import type { Company } from "@/lib/invoices/data";
import { financialYear, formatInvoiceNumber } from "@/lib/invoices/money";
import { Panel, SelectField, StateOptions } from "./fields";

export function CompanyForm({ company, logoUrl }: { company: Company; logoUrl: string | null }) {
  const [c, setC] = useState(company);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof Company) => (e: { target: { value: string } }) => setC({ ...c, [k]: e.target.value });
  const preview = formatInvoiceNumber(c.invoice_prefix, financialYear(new Date().toISOString().slice(0, 10)), 1);

  return (
    <div className="grid max-w-[880px] gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const { logo_path: _l, ...input } = c;
            const r = await saveCompany(input);
            setToast(r.ok ? "company details saved." : r.error);
          });
        }}
        className="grid gap-5"
      >
        <Panel title="your company" sub="printed at the top of every invoice. issued invoices keep the details they had when issued.">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField id="co-name" label="company / your name" value={c.name} onChange={set("name")} required />
            <SelectField id="co-state" label="state" value={c.state_code} onChange={set("state_code")} required hint="decides CGST+SGST vs IGST">
              <StateOptions includeOutside={false} />
            </SelectField>
            <TextArea id="co-address" label="address" value={c.address} onChange={set("address")} rows={2} required className="md:col-span-2" />
            <TextField id="co-pan" label="PAN" value={c.pan} onChange={set("pan")} placeholder="ABCDE1234F" />
            <TextField
              id="co-gstin"
              label="GSTIN"
              value={c.gstin}
              onChange={set("gstin")}
              placeholder="09ABCDE1234F1Z5"
              hint="needed to issue INR (GST) invoices"
            />
            <TextField id="co-phone" label="phone" value={c.phone} onChange={set("phone")} type="tel" />
            <TextField id="co-email" label="email" value={c.email} onChange={set("email")} type="email" />
            <TextField id="co-web" label="website" value={c.website} onChange={set("website")} className="md:col-span-2" />
          </div>
        </Panel>
        <Panel title="bank details" sub="shown in the bank box at the bottom of the invoice.">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField id="bank-holder" label="account holder name" value={c.bank_holder} onChange={set("bank_holder")} />
            <TextField id="bank-account" label="account number" value={c.bank_account} onChange={set("bank_account")} inputMode="numeric" />
            <TextField id="bank-ifsc" label="IFSC code" value={c.bank_ifsc} onChange={set("bank_ifsc")} placeholder="HDFC0009079" />
            <TextField id="bank-name" label="bank name" value={c.bank_name} onChange={set("bank_name")} />
          </div>
        </Panel>
        <Panel title="invoice numbers and defaults">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              id="co-prefix"
              label="invoice prefix"
              value={c.invoice_prefix}
              onChange={set("invoice_prefix")}
              maxLength={12}
              hint={`numbers look like ${preview} and restart every 1 April.`}
            />
            <TextField id="co-terms" label="default payment terms" value={c.default_terms} onChange={set("default_terms")} placeholder="Immediate" />
          </div>
        </Panel>
        <div>
          <Button type="submit" pending={pending}>
            save company details
          </Button>
        </div>
      </form>

      <Panel title="logo" sub="top-left of the invoice. PNG or JPG, 1 MB max. square works best.">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="current invoice logo" className="mb-3 h-16 w-16 rounded-full object-contain" />
        ) : null}
        <form
          action={(fd) =>
            start(async () => {
              const r = await uploadCompanyLogo(fd);
              setToast(r.ok ? "logo uploaded." : r.error);
            })
          }
          className="flex flex-wrap items-center gap-2"
        >
          <label className="text-[13px]">
            <span className="sr-only">logo file</span>
            <input type="file" name="logo" accept="image/png,image/jpeg" required className="block text-[13px]" />
          </label>
          <Button type="submit" variant="ghost" pending={pending}>
            upload logo
          </Button>
          {logoUrl ? (
            <Button
              variant="ghost"
              onClick={() =>
                start(async () => {
                  const r = await removeCompanyLogo();
                  setToast(r.ok ? "logo removed." : r.error);
                })
              }
            >
              remove logo
            </Button>
          ) : null}
        </form>
      </Panel>
      <Toast message={toast} />
    </div>
  );
}
