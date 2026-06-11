-- Bind upsert_form_fields to the authenticated caller (prevent IDOR via spoofed p_user_id).

CREATE OR REPLACE FUNCTION public.upsert_form_fields(
  p_form_id UUID,
  p_user_id UUID,
  p_fields JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  field JSONB;
  keep_ids UUID[] := ARRAY[]::UUID[];
  fid UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Forbidden: caller does not match user_id';
  END IF;

  IF NOT user_owns_form(p_form_id, p_user_id) THEN
    RAISE EXCEPTION 'Forbidden: user does not own this form';
  END IF;

  FOR field IN SELECT * FROM jsonb_array_elements(COALESCE(p_fields, '[]'::jsonb))
  LOOP
    IF COALESCE(field->>'id', '') <> '' THEN
      fid := (field->>'id')::uuid;
      keep_ids := array_append(keep_ids, fid);

      INSERT INTO form_fields (id, form_id, type, label, placeholder, required, options, order_index, settings)
      VALUES (
        fid,
        p_form_id,
        field->>'type',
        field->>'label',
        COALESCE(field->>'placeholder', ''),
        COALESCE((field->>'required')::boolean, false),
        COALESCE(field->'options', '[]'::jsonb),
        COALESCE((field->>'order_index')::integer, 0),
        COALESCE(field->'settings', '{}'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        label = EXCLUDED.label,
        placeholder = EXCLUDED.placeholder,
        required = EXCLUDED.required,
        options = EXCLUDED.options,
        order_index = EXCLUDED.order_index,
        settings = EXCLUDED.settings;
    ELSE
      INSERT INTO form_fields (form_id, type, label, placeholder, required, options, order_index, settings)
      VALUES (
        p_form_id,
        field->>'type',
        field->>'label',
        COALESCE(field->>'placeholder', ''),
        COALESCE((field->>'required')::boolean, false),
        COALESCE(field->'options', '[]'::jsonb),
        COALESCE((field->>'order_index')::integer, 0),
        COALESCE(field->'settings', '{}'::jsonb)
      );
    END IF;
  END LOOP;

  DELETE FROM form_fields
  WHERE form_id = p_form_id
    AND (cardinality(keep_ids) = 0 OR id <> ALL(keep_ids));
END;
$$;
