-- Forward-only hardening for the agreements system. This migration intentionally
-- fails on inconsistent historical rows instead of silently repairing legal or
-- audit data.

-- Supabase may grant broad privileges on new public-schema tables by default.
-- Agreement writes remain server-only; authenticated admins receive read access
-- through RLS and the application performs writes with its server secret.
REVOKE ALL ON public.agreement_templates, public.agreements, public.agreement_versions,
  public.agreement_signers, public.agreement_signing_tokens, public.agreement_events
  FROM authenticated;
GRANT SELECT ON public.agreement_templates, public.agreements, public.agreement_versions,
  public.agreement_signers, public.agreement_events TO authenticated;

REVOKE ALL ON SEQUENCE public.agreement_number_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.agreement_number_seq TO service_role;

-- Enforce that every duplicated agreement/version/signer identifier describes
-- the same parent relationship. API checks remain defense in depth.
ALTER TABLE public.agreement_versions
  ADD CONSTRAINT agreement_versions_id_agreement_unique
  UNIQUE (id, agreement_id);

ALTER TABLE public.agreement_signers
  ADD CONSTRAINT agreement_signers_id_version_agreement_unique
  UNIQUE (id, agreement_version_id, agreement_id);

ALTER TABLE public.agreements
  ADD CONSTRAINT agreements_current_version_agreement_fk
  FOREIGN KEY (current_version_id, id)
  REFERENCES public.agreement_versions (id, agreement_id);

ALTER TABLE public.agreement_signers
  ADD CONSTRAINT agreement_signers_version_agreement_fk
  FOREIGN KEY (agreement_version_id, agreement_id)
  REFERENCES public.agreement_versions (id, agreement_id)
  ON DELETE CASCADE;

ALTER TABLE public.agreement_signing_tokens
  ADD CONSTRAINT agreement_tokens_version_agreement_fk
  FOREIGN KEY (agreement_version_id, agreement_id)
  REFERENCES public.agreement_versions (id, agreement_id)
  ON DELETE CASCADE,
  ADD CONSTRAINT agreement_tokens_signer_version_agreement_fk
  FOREIGN KEY (signer_id, agreement_version_id, agreement_id)
  REFERENCES public.agreement_signers (id, agreement_version_id, agreement_id)
  ON DELETE CASCADE;

ALTER TABLE public.agreement_events
  ADD CONSTRAINT agreement_events_version_agreement_fk
  FOREIGN KEY (agreement_version_id, agreement_id)
  REFERENCES public.agreement_versions (id, agreement_id),
  ADD CONSTRAINT agreement_events_signer_version_agreement_fk
  FOREIGN KEY (signer_id, agreement_version_id, agreement_id)
  REFERENCES public.agreement_signers (id, agreement_version_id, agreement_id);

ALTER TABLE public.agreement_versions
  ADD CONSTRAINT agreement_versions_invalidation_requires_freeze
  CHECK (invalidated_at IS NULL OR frozen_at IS NOT NULL) NOT VALID;
ALTER TABLE public.agreement_versions
  VALIDATE CONSTRAINT agreement_versions_invalidation_requires_freeze;

ALTER TABLE public.agreement_signers
  ADD CONSTRAINT agreement_signers_document_hash_format
  CHECK (document_hash IS NULL OR document_hash ~ '^[a-f0-9]{64}$') NOT VALID;
ALTER TABLE public.agreement_signers
  VALIDATE CONSTRAINT agreement_signers_document_hash_format;

ALTER TABLE public.agreement_signing_tokens
  ADD CONSTRAINT agreement_tokens_expire_after_creation
  CHECK (expires_at > created_at) NOT VALID;
ALTER TABLE public.agreement_signing_tokens
  VALIDATE CONSTRAINT agreement_tokens_expire_after_creation;

ALTER TABLE public.agreement_events
  ADD CONSTRAINT agreement_events_signer_requires_version
  CHECK (signer_id IS NULL OR agreement_version_id IS NOT NULL) NOT VALID;
ALTER TABLE public.agreement_events
  VALIDATE CONSTRAINT agreement_events_signer_requires_version;

-- Frozen versions retain their complete identity and content. invalidated_at may
-- move from NULL to a timestamp once when a revision supersedes the version.
CREATE OR REPLACE FUNCTION public.protect_frozen_agreement_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.frozen_at IS NOT NULL AND (
    NEW.agreement_id IS DISTINCT FROM OLD.agreement_id
    OR NEW.template_id IS DISTINCT FROM OLD.template_id
    OR NEW.version_number IS DISTINCT FROM OLD.version_number
    OR NEW.agreement_data IS DISTINCT FROM OLD.agreement_data
    OR NEW.rendered_content IS DISTINCT FROM OLD.rendered_content
    OR NEW.document_hash IS DISTINCT FROM OLD.document_hash
    OR NEW.frozen_at IS DISTINCT FROM OLD.frozen_at
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'Frozen agreement versions are immutable';
  END IF;
  IF OLD.invalidated_at IS NOT NULL
    AND NEW.invalidated_at IS DISTINCT FROM OLD.invalidated_at THEN
    RAISE EXCEPTION 'Agreement version invalidation is permanent';
  END IF;
  RETURN NEW;
END;
$$;

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
    NEW.agreement_id IS DISTINCT FROM OLD.agreement_id
    OR NEW.signer_name IS DISTINCT FROM OLD.signer_name
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

CREATE OR REPLACE FUNCTION public.protect_signed_signer_audit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'signed' AND (
    NEW.status IS DISTINCT FROM OLD.status
    OR NEW.signed_at IS DISTINCT FROM OLD.signed_at
    OR NEW.signature_method IS DISTINCT FROM OLD.signature_method
    OR NEW.signature_artifact_path IS DISTINCT FROM OLD.signature_artifact_path
    OR NEW.typed_signature IS DISTINCT FROM OLD.typed_signature
    OR NEW.consent_version IS DISTINCT FROM OLD.consent_version
    OR NEW.consented_at IS DISTINCT FROM OLD.consented_at
    OR NEW.document_hash IS DISTINCT FROM OLD.document_hash
    OR NEW.ip_address IS DISTINCT FROM OLD.ip_address
    OR NEW.user_agent IS DISTINCT FROM OLD.user_agent
  ) THEN
    RAISE EXCEPTION 'Completed signature audit data is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_signed_signer_audit
  BEFORE UPDATE ON public.agreement_signers
  FOR EACH ROW EXECUTE FUNCTION public.protect_signed_signer_audit();

CREATE OR REPLACE FUNCTION public.protect_executed_agreement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'executed' AND (
    NEW.agreement_number IS DISTINCT FROM OLD.agreement_number
    OR NEW.template_id IS DISTINCT FROM OLD.template_id
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.current_version_id IS DISTINCT FROM OLD.current_version_id
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.sent_at IS DISTINCT FROM OLD.sent_at
    OR NEW.executed_at IS DISTINCT FROM OLD.executed_at
    OR NEW.voided_at IS DISTINCT FROM OLD.voided_at
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
  ) THEN
    RAISE EXCEPTION 'Executed agreement identity and lifecycle are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_executed_agreement
  BEFORE UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.protect_executed_agreement();
