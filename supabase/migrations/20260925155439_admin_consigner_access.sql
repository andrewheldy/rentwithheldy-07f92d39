-- Admin tools for giving consigners access to their vehicle's dashboard.
-- Owners sign up themselves (email or Google); an admin then picks their
-- account, a vehicle and the owner's share. That creates (or reuses) the
-- consigners row, the consignment and the consigner role in one transaction.

-- ---------------------------------------------------------------------------
-- Signed-up accounts, for the admin's "assign vehicle" picker
-- ---------------------------------------------------------------------------
-- auth.users is not readable from the browser and profiles are private to
-- their owner, so admins read accounts through this function. Non-admins get
-- no rows.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  providers text[],
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  is_admin boolean,
  is_consigner boolean,
  consigner_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    coalesce(
      ARRAY(SELECT DISTINCT i.provider FROM auth.identities i WHERE i.user_id = u.id ORDER BY i.provider),
      '{}'::text[]
    ),
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at IS NOT NULL,
    public.has_role(u.id, 'admin'),
    public.has_role(u.id, 'consigner'),
    c.id
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.consigners c ON c.user_id = u.id
  WHERE public.has_role((select auth.uid()), 'admin')
    AND u.email IS NOT NULL
    AND NOT coalesce(u.is_anonymous, false)
  ORDER BY u.created_at DESC
$$;

-- ---------------------------------------------------------------------------
-- Assign a vehicle to an account
-- ---------------------------------------------------------------------------
-- Returns the new consignment id. Reuses the consigner row already linked to
-- the account, or one an admin created earlier with the same email.
CREATE OR REPLACE FUNCTION public.admin_assign_vehicle(
  p_user_id uuid,
  p_vehicle_id uuid,
  p_owner_percent numeric,
  p_effective_from date,
  p_legal_name text,
  p_phone text DEFAULT NULL,
  p_agreement_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_legal_name text := nullif(btrim(coalesce(p_legal_name, '')), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_consigner uuid;
  v_consignment uuid;
BEGIN
  IF NOT public.has_role((select auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign vehicles.' USING ERRCODE = '42501';
  END IF;
  IF p_owner_percent IS NULL OR p_owner_percent < 0 OR p_owner_percent > 100 THEN
    RAISE EXCEPTION 'The owner''s share must be between 0 and 100 percent.' USING ERRCODE = '22023';
  END IF;
  IF p_effective_from IS NULL THEN
    RAISE EXCEPTION 'Choose the date the owner''s share starts.' USING ERRCODE = '22023';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = p_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'That account no longer exists.' USING ERRCODE = 'P0002';
  END IF;

  SELECT c.id INTO v_consigner FROM public.consigners c WHERE c.user_id = p_user_id;
  IF v_consigner IS NULL THEN
    SELECT c.id INTO v_consigner
    FROM public.consigners c
    WHERE c.user_id IS NULL AND lower(c.email) = lower(v_email);
  END IF;

  IF v_consigner IS NULL THEN
    IF v_legal_name IS NULL THEN
      RAISE EXCEPTION 'Enter the owner''s legal name.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.consigners (user_id, legal_name, email, phone, status)
    VALUES (p_user_id, v_legal_name, v_email, v_phone, 'active')
    RETURNING id INTO v_consigner;
  ELSE
    UPDATE public.consigners
    SET user_id = p_user_id,
        legal_name = coalesce(v_legal_name, legal_name),
        phone = coalesce(v_phone, phone),
        status = 'active'
    WHERE id = v_consigner;
  END IF;

  BEGIN
    INSERT INTO public.consignments (
      consigner_id, vehicle_id, agreement_id, owner_percent, operator_percent, effective_from, status
    )
    VALUES (
      v_consigner, p_vehicle_id, p_agreement_id, p_owner_percent, 100 - p_owner_percent, p_effective_from, 'active'
    )
    RETURNING id INTO v_consignment;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'This vehicle is already assigned to an owner for part of that period. End that assignment first.'
      USING ERRCODE = '23P01';
  END;

  IF p_agreement_id IS NOT NULL THEN
    UPDATE public.agreements SET consigner_id = v_consigner WHERE id = p_agreement_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'consigner')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_consignment;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_assign_vehicle(uuid, uuid, numeric, date, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_assign_vehicle(uuid, uuid, numeric, date, text, text, uuid) TO authenticated, service_role;
