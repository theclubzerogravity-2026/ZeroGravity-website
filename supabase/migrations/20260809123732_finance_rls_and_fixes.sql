-- ============================================================
-- ZeroGravity Secure Admin Database
-- Migration 6: Finance RLS & Audit Log Fixes
-- ============================================================

-- ============================================================
-- 1. ADD RLS POLICIES FOR FINANCE TABLES
-- ============================================================

-- Expenses
drop policy if exists "Admins can manage expenses" on public.expenses;
create policy "Admins can manage expenses"
    on public.expenses
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Expense Settlements
drop policy if exists "Admins can manage expense settlements" on public.expense_settlements;
create policy "Admins can manage expense settlements"
    on public.expense_settlements
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Income Transactions
drop policy if exists "Admins can manage income transactions" on public.income_transactions;
create policy "Admins can manage income transactions"
    on public.income_transactions
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Sponsorships
drop policy if exists "Admins can manage sponsorships" on public.sponsorships;
create policy "Admins can manage sponsorships"
    on public.sponsorships
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Sponsor Payments
drop policy if exists "Admins can manage sponsor payments" on public.sponsor_payments;
create policy "Admins can manage sponsor payments"
    on public.sponsor_payments
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ============================================================
-- 2. RELOAD SCHEMA CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';
