-- 1. Add released/unreleased tracking to investors
ALTER TABLE public.investors
  ADD COLUMN IF NOT EXISTS prior_released_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS released_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unreleased_amount NUMERIC(20,2) NOT NULL DEFAULT 0;

-- 2. Monthly transactions table
CREATE TABLE IF NOT EXISTS public.monthly_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  method_of_payment TEXT NOT NULL, -- 'cash', 'bank_transfer', 'upi', 'other'
  utr_number TEXT,
  amount NUMERIC(20,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'paid' | 'pending'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monthly_transactions_investor
  ON public.monthly_transactions(investor_id, transaction_date DESC);

-- RLS
ALTER TABLE public.monthly_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_transactions_select_own" ON public.monthly_transactions;
CREATE POLICY "monthly_transactions_select_own" ON public.monthly_transactions
  FOR SELECT USING (auth.uid() = investor_id);

-- 3. Add status column to daily_updates for "ongoing" entries
ALTER TABLE public.daily_updates
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'; -- 'ongoing' | 'completed'
