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
  requested_phone := regexp_replace(COALESCE(p_phone, ''), '\\D', '', 'g');

  IF requested_phone = '' THEN
    RAISE EXCEPTION 'A valid member phone number is required.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE regexp_replace(m.phone::text, '\\D', '', 'g') = requested_phone
      AND (m.auth_id = auth.uid() OR public.is_admin())
  ) INTO allowed;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Not authorized to view this member balance.';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(c.amount)
      FROM public.contributions c
      WHERE regexp_replace(c.member_phone::text, '\\D', '', 'g') = requested_phone
    ), 0)::numeric AS contributions,
    COALESCE((
      SELECT SUM(w.amount)
      FROM public.withdrawals w
      WHERE regexp_replace(w.member_phone::text, '\\D', '', 'g') = requested_phone
    ), 0)::numeric AS withdrawals,
    GREATEST(
      COALESCE((
        SELECT SUM(c.amount)
        FROM public.contributions c
        WHERE regexp_replace(c.member_phone::text, '\\D', '', 'g') = requested_phone
      ), 0)
      -
      COALESCE((
        SELECT SUM(w.amount)
        FROM public.withdrawals w
        WHERE regexp_replace(w.member_phone::text, '\\D', '', 'g') = requested_phone
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
  requested_phone := regexp_replace(COALESCE(p_phone, ''), '\\D', '', 'g');

  IF requested_phone = '' THEN
    RAISE EXCEPTION 'A valid member phone number is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE regexp_replace(m.phone::text, '\\D', '', 'g') = requested_phone
      AND (m.auth_id = auth.uid() OR public.is_admin())
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
          WHERE regexp_replace(c.member_phone::text, '\\D', '', 'g') = regexp_replace(m.phone::text, '\\D', '', 'g')
        ), 0)
        -
        COALESCE((
          SELECT SUM(w.amount)
          FROM public.withdrawals w
          WHERE regexp_replace(w.member_phone::text, '\\D', '', 'g') = regexp_replace(m.phone::text, '\\D', '', 'g')
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
  WHERE regexp_replace(phone, '\\D', '', 'g') = requested_phone;

  RETURN result_rank;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_finance_leaderboard()
RETURNS TABLE(
  member_name text,
  member_phone text,
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
      GREATEST(
        COALESCE((
          SELECT SUM(c.amount)
          FROM public.contributions c
          WHERE regexp_replace(c.member_phone::text, '\\D', '', 'g') = regexp_replace(m.phone::text, '\\D', '', 'g')
        ), 0)
        -
        COALESCE((
          SELECT SUM(w.amount)
          FROM public.withdrawals w
          WHERE regexp_replace(w.member_phone::text, '\\D', '', 'g') = regexp_replace(m.phone::text, '\\D', '', 'g')
        ), 0),
        0
      )::numeric AS net_savings
    FROM public.members m
  )
  SELECT
    member_name,
    phone::text AS member_phone,
    net_savings,
    RANK() OVER (ORDER BY net_savings DESC) AS member_rank
  FROM member_totals
  ORDER BY member_rank;
$$;

REVOKE ALL ON FUNCTION public.get_member_finance(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_group_finance() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_member_rank(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_finance_leaderboard() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_member_finance(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_finance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_rank(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_finance_leaderboard() TO authenticated;

COMMIT;
