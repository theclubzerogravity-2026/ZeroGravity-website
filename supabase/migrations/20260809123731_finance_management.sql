-- ============================================================
-- ZeroGravity Secure Admin Database
-- Migration 5: Finance & Budget Management
-- ============================================================

-- ============================================================
-- 1. EVENT BUDGETS
-- ============================================================
create table if not exists public.event_budgets (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null unique references public.events(id) on delete cascade,
    approved_budget numeric(12,2) not null default 0 check (approved_budget >= 0),
    
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. EXPENSES
-- ============================================================
create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    event_id uuid references public.events(id) on delete set null,
    
    expense_item text not null check (char_length(trim(expense_item)) between 1 and 250),
    category text not null,
    description text check (description is null or char_length(description) <= 2000),
    
    amount numeric(12,2) not null check (amount > 0),
    expense_date date not null,
    
    paid_by_member_id uuid references public.members(id) on delete set null,
    paid_by_club boolean not null default false,
    
    payment_method text not null,
    transaction_id text,
    receipt_url text,
    
    status text not null default 'active'
        check (status in ('active', 'voided', 'cancelled')),
        
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Ensure an expense is either paid by the club OR paid by a member (not both, not neither)
alter table public.expenses add constraint check_paid_by 
    check ((paid_by_club = true and paid_by_member_id is null) or (paid_by_club = false));

-- ============================================================
-- 3. EXPENSE SETTLEMENTS (Reimbursements to members)
-- ============================================================
create table if not exists public.expense_settlements (
    id uuid primary key default gen_random_uuid(),
    expense_id uuid not null references public.expenses(id) on delete cascade,
    
    amount numeric(12,2) not null check (amount > 0),
    payment_date date not null,
    payment_method text not null,
    transaction_id text,
    proof_url text,
    
    status text not null default 'completed'
        check (status in ('completed', 'voided')),
        
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. INCOME TRANSACTIONS
-- ============================================================
create table if not exists public.income_transactions (
    id uuid primary key default gen_random_uuid(),
    
    income_type text not null,
    amount numeric(12,2) not null check (amount > 0),
    income_date date not null,
    source text not null check (char_length(trim(source)) between 1 and 250),
    
    event_id uuid references public.events(id) on delete set null,
    
    payment_method text not null,
    transaction_id text,
    receipt_url text,
    notes text check (notes is null or char_length(notes) <= 2000),
    
    status text not null default 'active'
        check (status in ('active', 'voided', 'cancelled')),
        
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. SPONSORSHIPS
-- ============================================================
create table if not exists public.sponsorships (
    id uuid primary key default gen_random_uuid(),
    sponsor_id uuid not null references public.sponsors(id) on delete cascade,
    event_id uuid not null references public.events(id) on delete cascade,
    
    tier text,
    agreed_amount numeric(12,2) not null check (agreed_amount >= 0),
    notes text check (notes is null or char_length(notes) <= 2000),
    
    status text not null default 'active'
        check (status in ('active', 'cancelled')),
        
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique(sponsor_id, event_id)
);

-- ============================================================
-- 6. SPONSOR PAYMENTS
-- ============================================================
create table if not exists public.sponsor_payments (
    id uuid primary key default gen_random_uuid(),
    sponsorship_id uuid not null references public.sponsorships(id) on delete cascade,
    
    amount numeric(12,2) not null check (amount > 0),
    payment_date date not null,
    payment_method text not null,
    transaction_id text,
    proof_url text,
    notes text check (notes is null or char_length(notes) <= 2000),
    
    status text not null default 'completed'
        check (status in ('completed', 'voided')),
        
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- RLS POLICIES & TRIGGERS
-- ============================================================

-- Enable RLS
alter table public.event_budgets enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_settlements enable row level security;
alter table public.income_transactions enable row level security;
alter table public.sponsorships enable row level security;
alter table public.sponsor_payments enable row level security;

-- Event Budgets
create policy "Admins can manage event budgets"
    on public.event_budgets
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Expenses
create policy "Admins can manage expenses"
    on public.expenses
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Expense Settlements
create policy "Admins can manage expense settlements"
    on public.expense_settlements
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Income Transactions
create policy "Admins can manage income transactions"
    on public.income_transactions
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Sponsorships
create policy "Admins can manage sponsorships"
    on public.sponsorships
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Sponsor Payments
create policy "Admins can manage sponsor payments"
    on public.sponsor_payments
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Attach force_auth_uid triggers
create trigger set_created_by_event_budgets
    before insert on public.event_budgets
    for each row execute function public.force_auth_uid();

create trigger set_created_by_expenses
    before insert on public.expenses
    for each row execute function public.force_auth_uid();

create trigger set_created_by_expense_settlements
    before insert on public.expense_settlements
    for each row execute function public.force_auth_uid();

create trigger set_created_by_income_transactions
    before insert on public.income_transactions
    for each row execute function public.force_auth_uid();

create trigger set_created_by_sponsorships
    before insert on public.sponsorships
    for each row execute function public.force_auth_uid();

create trigger set_created_by_sponsor_payments
    before insert on public.sponsor_payments
    for each row execute function public.force_auth_uid();

-- Attach set_updated_at triggers
create trigger set_updated_at_event_budgets
    before update on public.event_budgets
    for each row execute function public.set_updated_at();

create trigger set_updated_at_expenses
    before update on public.expenses
    for each row execute function public.set_updated_at();

create trigger set_updated_at_expense_settlements
    before update on public.expense_settlements
    for each row execute function public.set_updated_at();

create trigger set_updated_at_income_transactions
    before update on public.income_transactions
    for each row execute function public.set_updated_at();

create trigger set_updated_at_sponsorships
    before update on public.sponsorships
    for each row execute function public.set_updated_at();

create trigger set_updated_at_sponsor_payments
    before update on public.sponsor_payments
    for each row execute function public.set_updated_at();

-- ============================================================
-- GRANTS FOR API ACCESS
-- ============================================================
grant select, insert, update, delete on public.event_budgets to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.expense_settlements to authenticated;
grant select, insert, update, delete on public.income_transactions to authenticated;
grant select, insert, update, delete on public.sponsorships to authenticated;
grant select, insert, update, delete on public.sponsor_payments to authenticated;

-- Notify pgrst to reload schema
NOTIFY pgrst, 'reload schema';
