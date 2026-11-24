-- CXO invoicing and expenses.
-- Only CXOs read these tables. Writes go through server actions (service role) after a role check.
-- Safe to re-run.

create or replace function public.is_cxo()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() = 'cxo'
$$;

grant execute on function public.is_cxo() to authenticated;

-- ---------- company details printed on every invoice (one row) ----------
create table if not exists public.company_profile (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  address text not null default '',
  state_code text not null default '',        -- GST state code, e.g. '09' for Uttar Pradesh
  pan text not null default '',
  gstin text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  bank_holder text not null default '',
  bank_account text not null default '',
  bank_ifsc text not null default '',
  bank_name text not null default '',
  logo_path text,
  invoice_prefix text not null default 'INV',
  default_terms text not null default 'Immediate',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- ---------- saved clients ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  address text not null default '',
  country text not null default 'India',
  pincode text not null default '',
  state_code text not null default '',        -- place of supply; '96' for outside India
  gstin text not null default '',
  email text not null default '',
  default_currency text not null default 'INR',
  archived boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- invoices ----------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  number text unique,                         -- set when issued, e.g. INV/2026-27/0001
  fy text,                                    -- e.g. 2026-27
  seq integer,
  client_id uuid references public.clients (id) on delete restrict,
  client_snapshot jsonb,                      -- frozen bill-to details at issue time
  company_snapshot jsonb,                     -- frozen company details at issue time
  currency text not null default 'INR',
  fx_rate numeric(14, 6) check (fx_rate is null or fx_rate > 0), -- INR per 1 unit, reports only
  invoice_date date not null default current_date,
  due_date date not null default current_date,
  payment_terms text not null default 'Immediate',
  place_of_supply text not null default '',   -- GST state code
  notes text not null default '',
  subtotal numeric(14, 2) not null default 0,
  cgst numeric(14, 2) not null default 0,
  sgst numeric(14, 2) not null default 0,
  igst numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  issued_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  check (due_date >= invoice_date),
  check (status = 'draft' or number is not null)
);

create index if not exists invoices_status_date on public.invoices (status, invoice_date desc);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  position integer not null default 0,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  hsn_sac text not null default '',
  qty numeric(12, 3) not null default 1 check (qty > 0),
  rate numeric(14, 2) not null default 0 check (rate >= 0),
  gst_rate numeric(5, 2) not null default 18 check (gst_rate >= 0 and gst_rate <= 100),
  amount numeric(14, 2) not null default 0
);

create index if not exists invoice_items_invoice on public.invoice_items (invoice_id, position);

-- one running number per financial year
create table if not exists public.invoice_counters (
  fy text primary key,
  last_seq integer not null default 0
);

-- ---------- expenses (INR) ----------
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  sort integer not null default 0
);

insert into public.expense_categories (name, sort) values
  ('Travel', 1), ('Software', 2), ('Office', 3), ('Food', 4), ('Salaries', 5), ('Other', 99)
on conflict (name) do nothing;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  amount numeric(14, 2) not null check (amount > 0),
  category_id uuid not null references public.expense_categories (id) on delete restrict,
  vendor text not null default '',
  note text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_spent_on on public.expenses (spent_on desc);

-- ---------- row level security: CXOs read, nobody writes directly ----------
do $$
declare t text;
begin
  foreach t in array array['company_profile', 'clients', 'invoices', 'invoice_items', 'invoice_counters',
                           'expense_categories', 'expenses'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_cxo_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_cxo())',
                   t || '_cxo_select', t);
  end loop;
end $$;

-- ---------- issuing: atomically take the next number for the invoice's financial year ----------
create or replace function public.issue_invoice(p_invoice_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invoices%rowtype;
  y integer;
  fy_label text;
  prefix text;
  next_seq integer;
  num text;
begin
  select * into inv from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'invoice not found';
  end if;
  if inv.status <> 'draft' then
    raise exception 'only drafts can be issued';
  end if;

  y := extract(year from inv.invoice_date)::integer;
  if extract(month from inv.invoice_date) < 4 then
    y := y - 1;
  end if;
  fy_label := y::text || '-' || lpad(((y + 1) % 100)::text, 2, '0');

  select coalesce(nullif(trim(invoice_prefix), ''), 'INV') into prefix from public.company_profile where id = 1;
  prefix := coalesce(prefix, 'INV');

  insert into public.invoice_counters (fy, last_seq) values (fy_label, 1)
  on conflict (fy) do update set last_seq = public.invoice_counters.last_seq + 1
  returning last_seq into next_seq;

  num := prefix || '/' || fy_label || '/' || lpad(next_seq::text, 4, '0');

  update public.invoices
  set status = 'issued', number = num, fy = fy_label, seq = next_seq, issued_at = now(), updated_at = now()
  where id = p_invoice_id;

  return num;
end;
$$;

revoke all on function public.issue_invoice(uuid) from public, anon, authenticated;
grant execute on function public.issue_invoice(uuid) to service_role;
