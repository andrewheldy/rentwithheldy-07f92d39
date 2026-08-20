-- Versioned agreements and electronic signatures.
-- Public signers never query these tables directly; Vercel Functions validate
-- one-way token hashes with the server-only Supabase client.

CREATE TYPE public.agreement_status AS ENUM (
  'draft', 'sent', 'partially_signed', 'executed', 'voided', 'expired'
);

CREATE TYPE public.agreement_signer_status AS ENUM ('pending', 'signed', 'declined');
CREATE TYPE public.agreement_signature_method AS ENUM ('drawn', 'typed');

CREATE SEQUENCE public.agreement_number_seq START WITH 1;

CREATE TABLE public.agreement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  name text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'retired')),
  template_definition jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_key, version)
);

CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_number text NOT NULL UNIQUE,
  template_id uuid NOT NULL REFERENCES public.agreement_templates(id),
  status public.agreement_status NOT NULL DEFAULT 'draft',
  current_version_id uuid,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  executed_at timestamptz,
  voided_at timestamptz,
  expires_at timestamptz,
  final_pdf_path text,
  completion_email_sent_at timestamptz,
  CHECK ((status <> 'executed') OR (executed_at IS NOT NULL))
);

CREATE TABLE public.agreement_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.agreement_templates(id),
  version_number integer NOT NULL CHECK (version_number > 0),
  agreement_data jsonb NOT NULL,
  rendered_content jsonb,
  document_hash text CHECK (document_hash IS NULL OR document_hash ~ '^[a-f0-9]{64}$'),
  frozen_at timestamptz,
  invalidated_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agreement_id, version_number),
  CHECK (
    (frozen_at IS NULL AND rendered_content IS NULL AND document_hash IS NULL)
    OR (frozen_at IS NOT NULL AND rendered_content IS NOT NULL AND document_hash IS NOT NULL)
  )
);

ALTER TABLE public.agreements
  ADD CONSTRAINT agreements_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.agreement_versions(id);

CREATE TABLE public.agreement_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  agreement_version_id uuid NOT NULL REFERENCES public.agreement_versions(id) ON DELETE CASCADE,
  signer_name text NOT NULL CHECK (char_length(signer_name) BETWEEN 1 AND 160),
  signer_email text NOT NULL CHECK (char_length(signer_email) BETWEEN 5 AND 254),
  signer_phone text,
  signer_address text,
  signer_role text NOT NULL CHECK (char_length(signer_role) BETWEEN 1 AND 100),
  signing_order integer,
  required boolean NOT NULL DEFAULT true,
  status public.agreement_signer_status NOT NULL DEFAULT 'pending',
  invite_sent_at timestamptz,
  last_reminder_at timestamptz,
  reminder_count integer NOT NULL DEFAULT 0 CHECK (reminder_count >= 0),
  viewed_at timestamptz,
  signed_at timestamptz,
  signature_method public.agreement_signature_method,
  signature_artifact_path text,
  typed_signature text,
  consent_version text,
  consented_at timestamptz,
  document_hash text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status <> 'signed') OR (
      signed_at IS NOT NULL
      AND signature_method IS NOT NULL
      AND consent_version IS NOT NULL
      AND consented_at IS NOT NULL
      AND document_hash IS NOT NULL
      AND (
        (signature_method = 'drawn' AND signature_artifact_path IS NOT NULL)
        OR (signature_method = 'typed' AND typed_signature IS NOT NULL)
      )
    )
  )
);

CREATE TABLE public.agreement_signing_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  agreement_version_id uuid NOT NULL REFERENCES public.agreement_versions(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL REFERENCES public.agreement_signers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  purpose text NOT NULL DEFAULT 'signing' CHECK (purpose IN ('signing', 'download')),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agreement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  agreement_version_id uuid REFERENCES public.agreement_versions(id),
  signer_id uuid REFERENCES public.agreement_signers(id),
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  actor_type text NOT NULL DEFAULT 'system' CHECK (actor_type IN ('admin', 'signer', 'system')),
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agreement_templates_status_idx ON public.agreement_templates (status, name);
CREATE INDEX agreements_status_activity_idx ON public.agreements (status, updated_at DESC);
CREATE INDEX agreements_template_idx ON public.agreements (template_id, created_at DESC);
CREATE INDEX agreement_versions_agreement_idx ON public.agreement_versions (agreement_id, version_number DESC);
CREATE INDEX agreement_signers_agreement_idx ON public.agreement_signers (agreement_id, agreement_version_id);
CREATE INDEX agreement_signers_email_idx ON public.agreement_signers (lower(signer_email));
CREATE INDEX agreement_tokens_signer_idx ON public.agreement_signing_tokens (signer_id, revoked_at, expires_at);
CREATE INDEX agreement_events_timeline_idx ON public.agreement_events (agreement_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.generate_agreement_number(template_code text DEFAULT 'AGR')
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  safe_code text;
BEGIN
  safe_code := upper(regexp_replace(template_code, '[^A-Z0-9]', '', 'g'));
  IF safe_code = '' THEN safe_code := 'AGR'; END IF;
  RETURN format(
    'RWH-%s-%s-%s',
    safe_code,
    extract(year FROM now())::integer,
    lpad(nextval('public.agreement_number_seq')::text, 3, '0')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_frozen_agreement_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.frozen_at IS NOT NULL AND (
    NEW.template_id IS DISTINCT FROM OLD.template_id
    OR NEW.version_number IS DISTINCT FROM OLD.version_number
    OR NEW.agreement_data IS DISTINCT FROM OLD.agreement_data
    OR NEW.rendered_content IS DISTINCT FROM OLD.rendered_content
    OR NEW.document_hash IS DISTINCT FROM OLD.document_hash
    OR NEW.frozen_at IS DISTINCT FROM OLD.frozen_at
  ) THEN
    RAISE EXCEPTION 'Frozen agreement versions are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_frozen_agreement_version
  BEFORE UPDATE ON public.agreement_versions
  FOR EACH ROW EXECUTE FUNCTION public.protect_frozen_agreement_version();

CREATE OR REPLACE FUNCTION public.protect_frozen_signer_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  is_frozen boolean;
BEGIN
  SELECT frozen_at IS NOT NULL INTO is_frozen
  FROM public.agreement_versions
  WHERE id = OLD.agreement_version_id;

  IF is_frozen AND (
    NEW.signer_name IS DISTINCT FROM OLD.signer_name
    OR NEW.signer_email IS DISTINCT FROM OLD.signer_email
    OR NEW.signer_phone IS DISTINCT FROM OLD.signer_phone
    OR NEW.signer_address IS DISTINCT FROM OLD.signer_address
    OR NEW.signer_role IS DISTINCT FROM OLD.signer_role
    OR NEW.signing_order IS DISTINCT FROM OLD.signing_order
    OR NEW.required IS DISTINCT FROM OLD.required
    OR NEW.agreement_version_id IS DISTINCT FROM OLD.agreement_version_id
  ) THEN
    RAISE EXCEPTION 'Signer identity is immutable after the agreement is frozen';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_frozen_signer_identity
  BEFORE UPDATE ON public.agreement_signers
  FOR EACH ROW EXECUTE FUNCTION public.protect_frozen_signer_identity();

CREATE OR REPLACE FUNCTION public.prevent_agreement_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Agreement events are append-only';
END;
$$;

CREATE TRIGGER prevent_agreement_event_update
  BEFORE UPDATE OR DELETE ON public.agreement_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_agreement_event_mutation();

CREATE TRIGGER agreement_templates_updated_at
  BEFORE UPDATE ON public.agreement_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agreements_updated_at
  BEFORE UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agreement_versions_updated_at
  BEFORE UPDATE ON public.agreement_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agreement_signers_updated_at
  BEFORE UPDATE ON public.agreement_signers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic send/freeze operation. Only the server-only service role may call it.
CREATE OR REPLACE FUNCTION public.send_agreement_version(
  p_agreement_id uuid,
  p_rendered_content jsonb,
  p_document_hash text,
  p_tokens jsonb,
  p_sent_by uuid
)
RETURNS public.agreements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.agreements;
  current_version public.agreement_versions;
  signer_count integer;
  required_count integer;
  inserted_token_count integer;
BEGIN
  SELECT * INTO target FROM public.agreements WHERE id = p_agreement_id FOR UPDATE;
  IF target.id IS NULL OR target.status <> 'draft' THEN
    RAISE EXCEPTION 'Agreement is not a sendable draft';
  END IF;
  IF target.created_by <> p_sent_by AND NOT public.has_role(p_sent_by, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO current_version
  FROM public.agreement_versions
  WHERE id = target.current_version_id AND agreement_id = target.id
  FOR UPDATE;
  IF current_version.id IS NULL OR current_version.frozen_at IS NOT NULL THEN
    RAISE EXCEPTION 'Agreement version is not sendable';
  END IF;
  IF p_document_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid document hash';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE required)
  INTO signer_count, required_count
  FROM public.agreement_signers
  WHERE agreement_version_id = current_version.id;
  IF signer_count = 0 OR required_count = 0 THEN
    RAISE EXCEPTION 'At least one required signer is needed';
  END IF;
  IF jsonb_array_length(p_tokens) <> signer_count THEN
    RAISE EXCEPTION 'Every signer requires a signing token';
  END IF;
  IF (
    SELECT count(DISTINCT (item->>'signer_id')::uuid)
    FROM jsonb_array_elements(p_tokens) AS item
    WHERE EXISTS (
      SELECT 1 FROM public.agreement_signers s
      WHERE s.id = (item->>'signer_id')::uuid
        AND s.agreement_version_id = current_version.id
    )
  ) <> signer_count THEN
    RAISE EXCEPTION 'Signing token signer set is invalid';
  END IF;

  UPDATE public.agreement_versions
  SET rendered_content = p_rendered_content,
      document_hash = p_document_hash,
      frozen_at = now()
  WHERE id = current_version.id;

  INSERT INTO public.agreement_signing_tokens (
    agreement_id, agreement_version_id, signer_id, token_hash, expires_at
  )
  SELECT target.id,
         current_version.id,
         (item->>'signer_id')::uuid,
         item->>'token_hash',
         (item->>'expires_at')::timestamptz
  FROM jsonb_array_elements(p_tokens) AS item
  WHERE EXISTS (
    SELECT 1 FROM public.agreement_signers s
    WHERE s.id = (item->>'signer_id')::uuid
      AND s.agreement_version_id = current_version.id
  );

  GET DIAGNOSTICS inserted_token_count = ROW_COUNT;
  IF inserted_token_count <> signer_count THEN
    RAISE EXCEPTION 'Signing tokens could not be created';
  END IF;

  UPDATE public.agreements
  SET status = 'sent', sent_at = now(), expires_at = (
    SELECT min(expires_at) FROM public.agreement_signing_tokens
    WHERE agreement_id = target.id AND agreement_version_id = current_version.id
  )
  WHERE id = target.id
  RETURNING * INTO target;

  INSERT INTO public.agreement_events (
    agreement_id, agreement_version_id, event_type, actor_user_id, actor_type, message,
    metadata
  ) VALUES (
    target.id, current_version.id, 'agreement_sent', p_sent_by, 'admin',
    'Agreement frozen and sent for signature',
    jsonb_build_object('document_hash', p_document_hash, 'version', current_version.version_number)
  );
  RETURN target;
END;
$$;

-- Atomic public signature operation. The caller passes only the token hash;
-- raw signing credentials are never stored.
CREATE OR REPLACE FUNCTION public.complete_agreement_signature(
  p_token_hash text,
  p_signature_method public.agreement_signature_method,
  p_signature_artifact_path text,
  p_typed_signature text,
  p_consent_version text,
  p_ip_address inet,
  p_user_agent text
)
RETURNS TABLE (
  agreement_id uuid,
  agreement_version_id uuid,
  signer_id uuid,
  agreement_status public.agreement_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_row public.agreement_signing_tokens;
  signer_row public.agreement_signers;
  version_row public.agreement_versions;
  agreement_row public.agreements;
  remaining_required integer;
  next_status public.agreement_status;
BEGIN
  SELECT * INTO token_row
  FROM public.agreement_signing_tokens
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF token_row.id IS NULL OR token_row.revoked_at IS NOT NULL OR token_row.purpose <> 'signing' THEN
    RAISE EXCEPTION 'invalid_signing_token';
  END IF;
  IF token_row.expires_at <= now() THEN
    RAISE EXCEPTION 'expired_signing_token';
  END IF;

  SELECT * INTO signer_row FROM public.agreement_signers
  WHERE id = token_row.signer_id FOR UPDATE;
  SELECT * INTO version_row FROM public.agreement_versions
  WHERE id = token_row.agreement_version_id FOR UPDATE;
  SELECT * INTO agreement_row FROM public.agreements
  WHERE id = token_row.agreement_id FOR UPDATE;

  IF signer_row.status = 'signed' THEN RAISE EXCEPTION 'already_signed'; END IF;
  IF agreement_row.status = 'voided' THEN RAISE EXCEPTION 'agreement_voided'; END IF;
  IF agreement_row.status NOT IN ('sent', 'partially_signed')
    OR agreement_row.current_version_id <> version_row.id
    OR version_row.frozen_at IS NULL
    OR version_row.invalidated_at IS NOT NULL THEN
    RAISE EXCEPTION 'agreement_not_signable';
  END IF;
  IF p_consent_version IS NULL OR char_length(p_consent_version) = 0 THEN
    RAISE EXCEPTION 'consent_required';
  END IF;
  IF p_signature_method = 'drawn' AND p_signature_artifact_path IS NULL THEN
    RAISE EXCEPTION 'signature_required';
  END IF;
  IF p_signature_method = 'typed' AND (
    p_typed_signature IS NULL OR lower(trim(p_typed_signature)) <> lower(trim(signer_row.signer_name))
  ) THEN
    RAISE EXCEPTION 'typed_signature_must_match';
  END IF;

  UPDATE public.agreement_signers
  SET status = 'signed',
      signed_at = now(),
      signature_method = p_signature_method,
      signature_artifact_path = p_signature_artifact_path,
      typed_signature = CASE WHEN p_signature_method = 'typed' THEN trim(p_typed_signature) ELSE NULL END,
      consent_version = p_consent_version,
      consented_at = now(),
      document_hash = version_row.document_hash,
      ip_address = p_ip_address,
      user_agent = left(p_user_agent, 1000)
  WHERE id = signer_row.id;

  UPDATE public.agreement_signing_tokens
  SET revoked_at = now(), last_used_at = now()
  WHERE signer_id = signer_row.id AND revoked_at IS NULL;

  SELECT count(*) INTO remaining_required
  FROM public.agreement_signers
  WHERE agreement_version_id = version_row.id
    AND required
    AND status <> 'signed';

  next_status := CASE WHEN remaining_required = 0 THEN 'executed' ELSE 'partially_signed' END;
  UPDATE public.agreements
  SET status = next_status,
      executed_at = CASE WHEN next_status = 'executed' THEN now() ELSE executed_at END
  WHERE id = agreement_row.id;

  INSERT INTO public.agreement_events (
    agreement_id, agreement_version_id, signer_id, event_type, actor_type, message,
    metadata
  ) VALUES (
    agreement_row.id, version_row.id, signer_row.id, 'signer_signed', 'signer',
    signer_row.signer_name || ' signed the agreement',
    jsonb_build_object(
      'signature_method', p_signature_method,
      'document_hash', version_row.document_hash,
      'consent_version', p_consent_version
    )
  );

  IF next_status = 'executed' THEN
    INSERT INTO public.agreement_events (
      agreement_id, agreement_version_id, event_type, actor_type, message,
      metadata
    ) VALUES (
      agreement_row.id, version_row.id, 'agreement_executed', 'system',
      'All required parties signed the agreement',
      jsonb_build_object('document_hash', version_row.document_hash)
    );
  END IF;

  RETURN QUERY SELECT agreement_row.id, version_row.id, signer_row.id, next_status;
END;
$$;

-- Supersede an active frozen version without mutating its content or signature
-- history. The replacement begins as a draft and requires fresh signatures.
CREATE OR REPLACE FUNCTION public.revise_agreement_version(
  p_agreement_id uuid,
  p_created_by uuid
)
RETURNS public.agreements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.agreements;
  previous_version public.agreement_versions;
  replacement_version_id uuid;
  replacement_version_number integer;
BEGIN
  SELECT * INTO target FROM public.agreements WHERE id = p_agreement_id FOR UPDATE;
  IF target.id IS NULL OR target.status NOT IN ('sent', 'partially_signed') THEN
    RAISE EXCEPTION 'Only an active agreement can be revised';
  END IF;
  IF target.created_by <> p_created_by AND NOT public.has_role(p_created_by, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO previous_version
  FROM public.agreement_versions
  WHERE id = target.current_version_id AND agreement_id = target.id
  FOR UPDATE;
  IF previous_version.id IS NULL OR previous_version.frozen_at IS NULL THEN
    RAISE EXCEPTION 'The current agreement version is not frozen';
  END IF;

  SELECT coalesce(max(version_number), 0) + 1
  INTO replacement_version_number
  FROM public.agreement_versions
  WHERE agreement_id = target.id;

  INSERT INTO public.agreement_versions (
    agreement_id, template_id, version_number, agreement_data, created_by
  ) VALUES (
    target.id,
    previous_version.template_id,
    replacement_version_number,
    previous_version.agreement_data,
    p_created_by
  )
  RETURNING id INTO replacement_version_id;

  INSERT INTO public.agreement_signers (
    agreement_id, agreement_version_id, signer_name, signer_email,
    signer_phone, signer_address, signer_role, signing_order, required
  )
  SELECT
    agreement_id, replacement_version_id, signer_name, signer_email,
    signer_phone, signer_address, signer_role, signing_order, required
  FROM public.agreement_signers
  WHERE agreement_version_id = previous_version.id
  ORDER BY signing_order NULLS LAST, created_at;

  UPDATE public.agreement_versions
  SET invalidated_at = now()
  WHERE id = previous_version.id;

  UPDATE public.agreement_signing_tokens
  SET revoked_at = now()
  WHERE agreement_version_id = previous_version.id AND revoked_at IS NULL;

  UPDATE public.agreements
  SET status = 'draft',
      current_version_id = replacement_version_id,
      sent_at = NULL,
      executed_at = NULL,
      voided_at = NULL,
      expires_at = NULL,
      final_pdf_path = NULL,
      completion_email_sent_at = NULL
  WHERE id = target.id
  RETURNING * INTO target;

  INSERT INTO public.agreement_events (
    agreement_id, agreement_version_id, event_type, actor_user_id, actor_type,
    message, metadata
  ) VALUES (
    target.id, replacement_version_id, 'agreement_revision_created', p_created_by,
    'admin', 'A new draft version was created; prior signing links were revoked',
    jsonb_build_object(
      'previous_version', previous_version.version_number,
      'new_version', replacement_version_number
    )
  );

  RETURN target;
END;
$$;

-- Draft content and its signer rows change together or not at all.
CREATE OR REPLACE FUNCTION public.update_agreement_draft(
  p_agreement_id uuid,
  p_agreement_data jsonb,
  p_signers jsonb,
  p_updated_by uuid
)
RETURNS public.agreements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.agreements;
  current_version public.agreement_versions;
BEGIN
  SELECT * INTO target FROM public.agreements WHERE id = p_agreement_id FOR UPDATE;
  IF target.id IS NULL OR target.status <> 'draft' THEN
    RAISE EXCEPTION 'Only a draft agreement can be updated';
  END IF;
  IF target.created_by <> p_updated_by AND NOT public.has_role(p_updated_by, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF jsonb_typeof(p_signers) <> 'array' OR jsonb_array_length(p_signers) = 0 THEN
    RAISE EXCEPTION 'At least one signer is required';
  END IF;

  SELECT * INTO current_version
  FROM public.agreement_versions
  WHERE id = target.current_version_id AND agreement_id = target.id
  FOR UPDATE;
  IF current_version.id IS NULL OR current_version.frozen_at IS NOT NULL THEN
    RAISE EXCEPTION 'The current agreement version cannot be edited';
  END IF;

  UPDATE public.agreement_versions
  SET agreement_data = p_agreement_data
  WHERE id = current_version.id;

  DELETE FROM public.agreement_signers
  WHERE agreement_version_id = current_version.id;

  INSERT INTO public.agreement_signers (
    agreement_id, agreement_version_id, signer_name, signer_email,
    signer_phone, signer_address, signer_role, signing_order, required
  )
  SELECT
    target.id,
    current_version.id,
    signer_name,
    signer_email,
    nullif(signer_phone, ''),
    nullif(signer_address, ''),
    signer_role,
    signing_order,
    required
  FROM jsonb_to_recordset(p_signers) AS signer(
    signer_name text,
    signer_email text,
    signer_phone text,
    signer_address text,
    signer_role text,
    signing_order integer,
    required boolean
  );

  UPDATE public.agreements
  SET updated_at = now()
  WHERE id = target.id
  RETURNING * INTO target;

  INSERT INTO public.agreement_events (
    agreement_id, agreement_version_id, event_type, actor_user_id, actor_type, message
  ) VALUES (
    target.id, current_version.id, 'agreement_edited', p_updated_by,
    'admin', 'Draft agreement details updated'
  );

  RETURN target;
END;
$$;

REVOKE ALL ON FUNCTION public.send_agreement_version(uuid, jsonb, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_agreement_signature(text, public.agreement_signature_method, text, text, text, inet, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revise_agreement_version(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_agreement_draft(uuid, jsonb, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_agreement_number(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_agreement_version(uuid, jsonb, text, jsonb, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_agreement_signature(text, public.agreement_signature_method, text, text, text, inet, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.revise_agreement_version(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_agreement_draft(uuid, jsonb, jsonb, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_agreement_number(text) TO service_role;

ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_signing_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.agreement_templates, public.agreements, public.agreement_versions,
  public.agreement_signers, public.agreement_signing_tokens, public.agreement_events FROM anon;
REVOKE ALL ON public.agreement_signing_tokens FROM authenticated;
GRANT SELECT ON public.agreement_templates, public.agreements, public.agreement_versions,
  public.agreement_signers, public.agreement_events TO authenticated;
GRANT ALL ON public.agreement_templates, public.agreements, public.agreement_versions,
  public.agreement_signers, public.agreement_signing_tokens, public.agreement_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.agreement_number_seq TO service_role;

CREATE POLICY "Admins can view agreement templates"
  ON public.agreement_templates FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Admins can view agreements"
  ON public.agreements FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Admins can view agreement versions"
  ON public.agreement_versions FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Admins can view agreement signers"
  ON public.agreement_signers FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Admins can view agreement events"
  ON public.agreement_events FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::public.app_role));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agreements', 'agreements', false, 10485760,
  ARRAY['application/pdf', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Admins can read private agreement files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agreements'
    AND public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

-- The contract language below is the canonical Google Doc supplied for this
-- implementation, represented as structured sections and typed dynamic blocks.
INSERT INTO public.agreement_templates (
  template_key, name, version, status, template_definition
) VALUES (
  'vehicle_consignment_management',
  'Vehicle Consignment & Rental Management Agreement',
  1,
  'active',
  $template$
  {
    "schema_version": 1,
    "agreement_code": "VAN",
    "sections": [
      {"number": 1, "title": "Purpose", "blocks": [
        {"type": "paragraph", "text": "The Vehicle Owner wishes to make certain vehicle(s) available to Rent With Heldy for rental to qualified customers, and Rent With Heldy wishes to market, manage, and operate the vehicle(s) as part of its rental business."},
        {"type": "paragraph", "text": "The Parties agree that this arrangement will begin as a three-month trial period so that both Parties can evaluate vehicle utilization, rental revenue, operating expenses, workload, maintenance requirements, cleaning, deliveries, marketing costs, and overall performance."}
      ]},
      {"number": 2, "title": "Vehicles", "blocks": [{"type": "vehicles"}, {"type": "paragraph", "text": "Additional vehicles may be added by written agreement of the Parties."}]},
      {"number": 3, "title": "Ownership", "blocks": [
        {"type": "paragraph", "text": "The Vehicle Owner retains legal ownership of each vehicle covered by this Agreement. Nothing in this Agreement transfers ownership or title to Rent With Heldy."},
        {"type": "paragraph", "text": "The Vehicle Owner authorizes Rent With Heldy to possess, advertise, market, photograph, list, deliver, manage, and rent the vehicle to customers during the term of this Agreement."}
      ]},
      {"number": 4, "title": "Revenue Share", "blocks": [
        {"type": "paragraph", "text": "During the initial three-month trial period, rental revenue shall be divided as follows:"},
        {"type": "revenue_split"},
        {"type": "paragraph", "text": "The revenue split is intended to compensate Rent With Heldy for customer acquisition, marketing, rental management, customer service, cleaning, vehicle deliveries and pickups, reservation administration, pricing and utilization management, and claims administration."},
        {"type": "paragraph", "text": "The Vehicle Owner's share compensates the Vehicle Owner for providing the vehicle and assuming the ownership, depreciation, insurance, and general maintenance responsibilities described in this Agreement."}
      ]},
      {"number": 5, "title": "Definition of Rental Revenue", "blocks": [
        {"type": "paragraph", "text": "For purposes of the revenue split, “Rental Revenue” means amounts actually collected from customers for use of the vehicle, less amounts that are not properly considered rental income, including sales or rental taxes, refunded amounts, chargebacks, tolls and toll reimbursements, fuel reimbursements, damage reimbursements, insurance or claims proceeds, security deposits, fines, citations, penalties, and other pass-through reimbursements."},
        {"type": "paragraph", "text": "Unless otherwise agreed in writing, optional services or charges provided directly by Rent With Heldy, including delivery charges or other separately provided services, may be retained by Rent With Heldy to compensate for the associated service and expense."}
      ]},
      {"number": 6, "title": "Payment to Vehicle Owner", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy will maintain reasonable records of completed rentals and revenue received. The Vehicle Owner's share will be calculated from Rental Revenue as defined above."},
        {"type": "payment_schedule"},
        {"type": "paragraph", "text": "Quarterly performance reports will be provided. Revenue will be considered earned for revenue-sharing purposes only after the applicable customer payment has been successfully collected."}
      ]},
      {"number": 7, "title": "Rent With Heldy Responsibilities", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy will be primarily responsible for the day-to-day rental operation of the vehicles, including customer acquisition; advertising and marketing; rental listings; pricing and revenue management; reservations; customer communication; renter screening; rental agreements; payment collection; scheduling; ordinary cleaning and preparation between rentals; reasonable deliveries and pickups; check-in/check-out; vehicle-condition documentation; customer service; and management and administration of rental-related damage and insurance claims."},
        {"type": "paragraph", "text": "Rent With Heldy will use commercially reasonable efforts to market and rent the vehicles but does not guarantee any minimum number of rentals, utilization rate, revenue, or income."}
      ]},
      {"number": 8, "title": "Vehicle Owner Responsibilities", "blocks": [
        {"type": "paragraph", "text": "The Vehicle Owner will be responsible for maintaining legal ownership and registration; maintaining insurance appropriate for the agreed rental use; paying required insurance premiums; general and preventive maintenance; oil changes and fluid services; tires; brakes; mechanical repairs; manufacturer-recommended services; ordinary wear-and-tear repairs; keeping the vehicle safe and roadworthy; promptly addressing mechanical or safety issues; and providing current registration, insurance, and other reasonably required documentation."}
      ]},
      {"number": 9, "title": "Insurance", "blocks": [
        {"type": "paragraph", "text": "The Vehicle Owner is responsible for maintaining insurance coverage required for the vehicle and its agreed commercial/rental use. Before a vehicle is made available for rental, the Parties will confirm that the applicable insurance arrangement permits the contemplated rental activity."},
        {"type": "paragraph", "text": "The Vehicle Owner will provide proof of applicable insurance coverage and promptly notify Rent With Heldy of any cancellation, lapse, material change, or restriction. Neither Party may knowingly allow a vehicle to be rented if required insurance coverage is not in effect."}
      ]},
      {"number": 10, "title": "Damage, Accidents, and Claims", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy will be responsible for administration and handling of rental-related damage and insurance claims, including collecting incident information and documentation, communicating with renters, reporting incidents to the appropriate insurer, submitting available documentation, coordinating the claims process, and communicating with the Vehicle Owner regarding claim status."},
        {"type": "paragraph", "text": "Claims administration does not mean Rent With Heldy personally guarantees payment of a claim or assumes responsibility for losses properly covered by insurance, recoverable from a renter, or otherwise allocated under this Agreement."},
        {"type": "paragraph", "text": "Any deductible, uninsured loss, loss-of-use issue, or damage not recoverable from the renter or applicable insurance will be reviewed by the Parties based on the circumstances and applicable coverage."}
      ]},
      {"number": 11, "title": "Maintenance and Vehicle Downtime", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy will notify the Vehicle Owner of known mechanical problems or maintenance needs. The Vehicle Owner will arrange required maintenance and repairs within a commercially reasonable period."},
        {"type": "paragraph", "text": "Rent With Heldy may temporarily remove a vehicle from availability if it reasonably believes the vehicle is unsafe, required maintenance is overdue, a mechanical problem could affect a renter, registration or insurance is not current, or continued operation could cause additional damage."},
        {"type": "paragraph", "text": "Rent With Heldy will not be responsible for lost rental revenue caused by ordinary maintenance, mechanical failure, owner-requested downtime, or repair delays outside Rent With Heldy's reasonable control."}
      ]},
      {"number": 12, "title": "Cleaning and Delivery", "blocks": [
        {"type": "paragraph", "text": "During the initial trial period, Rent With Heldy will manage ordinary rental cleaning and vehicle deliveries/pickups as part of the rental operation."},
        {"type": "paragraph", "text": "The Parties acknowledge that the actual labor and expense associated with cleaning, delivery, pickup, repositioning, and rental turnover is not yet fully known. These operational requirements will be specifically evaluated during the three-month review."},
        {"type": "paragraph", "text": "Extraordinary customer-caused cleaning expenses may be charged to or recovered from the responsible renter when permitted by the applicable rental agreement."}
      ]},
      {"number": 13, "title": "Marketing and Pricing", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy will have reasonable discretion to determine advertising channels, marketing strategy, rental pricing, discounts, minimum rental periods, promotional offers, availability, and customer acquisition strategy."},
        {"type": "paragraph", "text": "Rent With Heldy may adjust pricing based on demand, seasonality, utilization, local events, rental duration, market conditions, and other commercially reasonable factors."}
      ]},
      {"number": 14, "title": "Vehicle Availability", "blocks": [
        {"type": "paragraph", "text": "The Vehicle Owner agrees to communicate dates when a vehicle will not be available. Rent With Heldy will not knowingly accept a reservation during a properly communicated owner blackout period."},
        {"type": "paragraph", "text": "Once a confirmed customer reservation has been accepted, the Vehicle Owner will make reasonable efforts to honor the vehicle's availability for that reservation."}
      ]},
      {"number": 15, "title": "Three-Month Trial Period", "blocks": [
        {"type": "trial_period"},
        {"type": "paragraph", "text": "The purpose of the trial period is to determine the actual economics and operational requirements of the arrangement."},
        {"type": "paragraph", "text": "At or near the end of the trial period, the Parties will review vehicle utilization; gross and net rental revenue; average daily rental rate; revenue per available day; customer acquisition costs; advertising and marketing workload; cleaning frequency and cost; delivery and pickup frequency; delivery distances and costs; customer service workload; claims activity; vehicle wear and tear; maintenance frequency; administrative workload; and overall profitability to each Party."},
        {"type": "paragraph", "text": "The Parties expressly acknowledge that the initial revenue split is a trial-period arrangement."},
        {"type": "paragraph", "text": "Following the review, the Parties may mutually agree to modify revenue-sharing percentages, responsibility for cleaning, delivery fees or expenses, marketing expenses, insurance-related expenses, maintenance responsibilities, minimum pricing, vehicle availability requirements, or other operating terms."},
        {"type": "paragraph", "text": "Any material modification must be agreed to in writing by both Parties. If the Parties cannot agree on revised terms following the trial period, either Party may elect not to continue the arrangement, subject to completion or resolution of already-confirmed reservations."}
      ]},
      {"number": 16, "title": "Records and Performance Review", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy will maintain reasonable business records sufficient to evaluate vehicle performance. The Parties may use trial-period data to evaluate utilization, revenue per vehicle, revenue per rental day, owner distributions, Rent With Heldy's operating margin, cleaning and delivery workload, customer acquisition performance, maintenance, and downtime."}
      ]},
      {"number": 17, "title": "No Guaranteed Revenue", "blocks": [
        {"type": "paragraph", "text": "The Vehicle Owner understands that rental demand fluctuates. Rent With Heldy makes no representation or guarantee concerning minimum monthly or annual revenue, utilization, rental rates, number of reservations, or future vehicle value. Projections, if provided, are estimates only."}
      ]},
      {"number": 18, "title": "Depreciation and Normal Wear", "blocks": [
        {"type": "paragraph", "text": "The Vehicle Owner acknowledges that commercial rental use will result in mileage accumulation, depreciation, and ordinary wear and tear. These are normal consequences of participation and remain the Vehicle Owner's responsibility."},
        {"type": "paragraph", "text": "This does not include renter-caused damage that may properly be pursued through a renter, insurance policy, protection plan, or other applicable recovery process."}
      ]},
      {"number": 19, "title": "Fines, Tolls, and Violations", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy will use commercially reasonable efforts to identify and collect customer-responsible tolls, parking charges, traffic citations, towing charges, and similar expenses arising during a rental. The Parties will cooperate in providing documentation needed to transfer or contest customer-responsible violations where legally permitted."}
      ]},
      {"number": 20, "title": "Independent Parties", "blocks": [
        {"type": "paragraph", "text": "Nothing in this Agreement creates an employment relationship, partnership, joint venture, franchise, or ownership interest between the Parties. Rent With Heldy operates as an independent business managing the rental activity contemplated by this Agreement, and the Vehicle Owner remains the owner of the vehicle."}
      ]},
      {"number": 21, "title": "Term and Termination", "blocks": [
        {"type": "paragraph", "text": "Following the initial three-month trial period, this Agreement will continue month-to-month unless the Parties enter into a replacement agreement."},
        {"type": "paragraph", "text": "After the trial period, either Party may terminate the Agreement by providing 30 days' written notice. During the initial trial period, either Party may terminate for material breach, failure to maintain required insurance, unsafe vehicle condition, nonpayment, illegal activity, or another material violation."},
        {"type": "paragraph", "text": "Unless safety, insurance, or legal concerns require otherwise, confirmed reservations existing when notice is provided should be honored or otherwise resolved by mutual agreement."},
        {"type": "paragraph", "text": "Upon termination and completion or resolution of outstanding reservations, claims, payments, and other obligations, Rent With Heldy will return the vehicle to the Vehicle Owner."}
      ]},
      {"number": 22, "title": "Indemnification and Cooperation", "blocks": [
        {"type": "paragraph", "text": "Each Party agrees to be responsible for its own acts, omissions, negligence, and obligations under this Agreement to the extent permitted by applicable law. The Parties will reasonably cooperate regarding insurance claims, customer disputes, accidents, legal requests, and other matters arising from rental activity."}
      ]},
      {"number": 23, "title": "Compliance With Law", "blocks": [
        {"type": "paragraph", "text": "The Parties agree to operate under this Agreement in accordance with applicable federal, Florida, and local laws and regulations. If a provision conflicts with applicable law or insurance requirements, the Parties will cooperate in good faith to modify the affected provision while preserving the intended business arrangement as closely as reasonably possible."}
      ]},
      {"number": 24, "title": "Governing Law", "blocks": [
        {"type": "paragraph", "text": "This Agreement will be governed by the laws of the State of Florida. Venue for disputes arising under this Agreement will lie in a court of competent jurisdiction in Broward County, Florida, unless otherwise required by law."}
      ]},
      {"number": 25, "title": "Entire Agreement and Modifications", "blocks": [
        {"type": "paragraph", "text": "This Agreement represents the understanding between the Parties concerning the vehicles covered by it and supersedes prior oral discussions concerning the same subject matter."},
        {"type": "paragraph", "text": "Any material amendment, including a change to the revenue-sharing percentage, must be made in writing and agreed to by both Parties. Electronic signatures and electronically executed copies may be treated as originals to the extent permitted by applicable law."}
      ]},
      {"number": 26, "title": "Signatures", "blocks": [
        {"type": "paragraph", "text": "By signing, the Parties acknowledge that they have read, understood, and voluntarily agreed to the terms of this Agreement."},
        {"type": "signatures"}
      ]}
    ]
  }
  $template$::jsonb
);
