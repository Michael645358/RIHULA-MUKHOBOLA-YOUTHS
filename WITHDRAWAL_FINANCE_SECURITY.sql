-- RIHULA SQL NOTE (2026-08-31)
-- This file contains the finance/withdrawal function definitions that are also
-- included in RIHULA-FINANCE-FIX.sql. Use RIHULA-FINANCE-FIX.sql as the
-- canonical combined finance + withdrawal installation file. Do not run both
-- files unnecessarily; running this file after the canonical file will replace
-- the same functions with this file's definitions.
--
-- RIHULA finance/withdrawal read functions
-- Run AFTER RLS hardening has been applied.
-- These functions preserve the existing UI while preventing members
-- from downloading everybody's raw financial rows just to calculate
-- group totals and rankings.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_member_finance(p_phone text)
RETURNS TABLE(
  contributions numeric,
  withdrawals numeric,
  net_savings numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_phone text;
  allowed boolean;
BEGIN
  requested_phone := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF requested_phone LIKE '254%' THEN
    requested_phone := '0' || substring(requested_phone from 4);
  END IF;

  IF requested_phone = '' THEN
    RAISE EXCEPTION 'A valid member phone number is required.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END) = requested_phone
      AND (m.auth_id = auth.uid() OR public.is_rihula_admin())
  ) INTO allowed;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Not authorized to view this member balance.';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(c.amount)
      FROM public.contributions c
      WHERE regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') = requested_phone
    ), 0)::numeric AS contributions,
    COALESCE((
      SELECT SUM(w.amount)
      FROM public.withdrawals w
      WHERE regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') = requested_phone
    ), 0)::numeric AS withdrawals,
    GREATEST(
      COALESCE((
        SELECT SUM(c.amount)
        FROM public.contributions c
        WHERE regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') = requested_phone
      ), 0)
      -
      COALESCE((
        SELECT SUM(w.amount)
        FROM public.withdrawals w
        WHERE regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') = requested_phone
      ), 0),
      0
    )::numeric AS net_savings;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_group_finance()
RETURNS TABLE(
  contributions numeric,
  withdrawals numeric,
  net_savings numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT SUM(amount) FROM public.contributions), 0)::numeric,
    COALESCE((SELECT SUM(amount) FROM public.withdrawals), 0)::numeric,
    GREATEST(
      COALESCE((SELECT SUM(amount) FROM public.contributions), 0)
      - COALESCE((SELECT SUM(amount) FROM public.withdrawals), 0),
      0
    )::numeric;
$$;

CREATE OR REPLACE FUNCTION public.get_member_rank(p_phone text)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_phone text;
  result_rank bigint;
BEGIN
  requested_phone := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF requested_phone LIKE '254%' THEN
    requested_phone := '0' || substring(requested_phone from 4);
  END IF;

  IF requested_phone = '' THEN
    RAISE EXCEPTION 'A valid member phone number is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END) = requested_phone
      AND (m.auth_id = auth.uid() OR public.is_rihula_admin())
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this member rank.';
  END IF;

  WITH member_totals AS (
    SELECT
      m.id,
      m.phone::text AS phone,
      GREATEST(
        COALESCE((
          SELECT SUM(c.amount)
          FROM public.contributions c
          WHERE (CASE WHEN regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') END) = (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END)
        ), 0)
        -
        COALESCE((
          SELECT SUM(w.amount)
          FROM public.withdrawals w
          WHERE (CASE WHEN regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') END) = (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END)
        ), 0),
        0
      ) AS net_savings
    FROM public.members m
  ),
  ranked AS (
    SELECT
      phone,
      RANK() OVER (ORDER BY net_savings DESC) AS rank
    FROM member_totals
  )
  SELECT rank INTO result_rank
  FROM ranked
  WHERE (CASE WHEN regexp_replace(phone, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(phone, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(phone, '[^0-9]', '', 'g') END) = requested_phone;

  RETURN result_rank;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_finance_leaderboard()
RETURNS TABLE(
  member_name text,
  member_phone text,
  contributions numeric,
  withdrawals numeric,
  net_savings numeric,
  member_rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH member_totals AS (
    SELECT
      m.id,
      COALESCE(m.name, 'Member')::text AS member_name,
      m.phone::text AS phone,
      COALESCE((SELECT SUM(c.amount) FROM public.contributions c
        WHERE (CASE WHEN regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') END) = (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END)), 0)::numeric AS contributions,
      COALESCE((SELECT SUM(w.amount) FROM public.withdrawals w
        WHERE (CASE WHEN regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') END) = (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END)), 0)::numeric AS withdrawals
    FROM public.members m
  ),
  calculated AS (
    SELECT *, GREATEST(contributions - withdrawals, 0)::numeric AS net_savings
    FROM member_totals
  )
  SELECT member_name, phone::text, contributions, withdrawals, net_savings,
         RANK() OVER (ORDER BY net_savings DESC) AS member_rank
  FROM calculated
  ORDER BY member_rank, member_name;
$$;

CREATE OR REPLACE FUNCTION public.process_member_withdrawal(
  p_phone text,
  p_amount numeric,
  p_reason text DEFAULT NULL
)
RETURNS TABLE(
  withdrawal_id bigint,
  balance_before numeric,
  balance_after numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_phone text;
  available numeric;
  new_id bigint;
BEGIN
  IF NOT public.is_rihula_admin() THEN
    RAISE EXCEPTION 'Not authorized to record withdrawals.';
  END IF;

  requested_phone := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF requested_phone LIKE '254%' THEN
    requested_phone := '0' || substring(requested_phone from 4);
  END IF;
  IF requested_phone = '' THEN RAISE EXCEPTION 'A valid member phone number is required.'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Withdrawal amount must be greater than zero.'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.members m
    WHERE (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END) = requested_phone) THEN
    RAISE EXCEPTION 'Member with that phone number was not found.';
  END IF;

  -- Serialize withdrawals for this member so two admins cannot spend the same balance.
  PERFORM 1 FROM public.members m
    WHERE (CASE WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%' THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4) ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g') END) = requested_phone
    FOR UPDATE;

  SELECT GREATEST(
    COALESCE((SELECT SUM(c.amount) FROM public.contributions c
      WHERE regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') = requested_phone), 0)
    - COALESCE((SELECT SUM(w.amount) FROM public.withdrawals w
      WHERE regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') = requested_phone), 0), 0
  ) INTO available;

  IF p_amount > available THEN
    RAISE EXCEPTION 'Insufficient balance. Available: KSh %', to_char(available, 'FM999G999G999G990D00');
  END IF;

  INSERT INTO public.withdrawals(member_phone, amount, reason, created_by)
  VALUES (requested_phone, p_amount, NULLIF(trim(COALESCE(p_reason, '')), ''), auth.uid())
  RETURNING id INTO new_id;

  RETURN QUERY SELECT new_id, available, available - p_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.process_member_withdrawal(text,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_member_withdrawal(text,numeric,text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_member_finance(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_group_finance() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_member_rank(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_finance_leaderboard() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_member_finance(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_finance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_rank(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_finance_leaderboard() TO authenticated;

COMMIT;
