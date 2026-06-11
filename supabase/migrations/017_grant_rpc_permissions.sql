-- Allow client roles to call RPC functions used by the app.

GRANT EXECUTE ON FUNCTION public.resolve_form_recipient(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_next_rotation_index(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_form_fields(UUID, UUID, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_owns_form(UUID, UUID) TO authenticated, service_role;
