-- Fix auto_log_changes trigger to handle different table structures
-- Issue: Trigger tries to access fields that don't exist on all tables

CREATE OR REPLACE FUNCTION public.auto_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_name TEXT;
BEGIN
  -- Determine entity name based on table structure
  -- Use JSON extraction to safely check if fields exist
  IF TG_TABLE_NAME = 'listings' THEN
    v_entity_name := COALESCE((to_jsonb(NEW)->>'name')::TEXT, 'New Listing');
  ELSIF TG_TABLE_NAME = 'guests' THEN
    v_entity_name := COALESCE(
      (to_jsonb(NEW)->>'first_name')::TEXT || ' ' || (to_jsonb(NEW)->>'last_name')::TEXT,
      'New Guest'
    );
  ELSIF TG_TABLE_NAME IN ('tv_devices') THEN
    v_entity_name := COALESCE((to_jsonb(NEW)->>'device_name')::TEXT, 'New TV Device');
  ELSIF TG_TABLE_NAME = 'qr_codes' THEN
    v_entity_name := COALESCE((to_jsonb(NEW)->>'qr_name')::TEXT, 'New QR Code');
  ELSIF TG_TABLE_NAME = 'pms_connections' THEN
    v_entity_name := COALESCE((to_jsonb(NEW)->>'provider')::TEXT || ' Connection', 'New PMS Connection');
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    v_entity_name := COALESCE((to_jsonb(NEW)->>'full_name')::TEXT, (to_jsonb(NEW)->>'email')::TEXT, 'New Profile');
  ELSE
    v_entity_name := 'New ' || TG_TABLE_NAME;
  END IF;

  -- Log INSERT
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.log_activity(
      'create',
      TG_TABLE_NAME,
      NEW.id,
      v_entity_name,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;

  -- Log UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Recalculate entity name for UPDATE using OLD record
    IF TG_TABLE_NAME = 'listings' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'name')::TEXT, 'Listing');
    ELSIF TG_TABLE_NAME = 'guests' THEN
      v_entity_name := COALESCE(
        (to_jsonb(OLD)->>'first_name')::TEXT || ' ' || (to_jsonb(OLD)->>'last_name')::TEXT,
        'Guest'
      );
    ELSIF TG_TABLE_NAME IN ('tv_devices') THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'device_name')::TEXT, 'TV Device');
    ELSIF TG_TABLE_NAME = 'qr_codes' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'qr_name')::TEXT, 'QR Code');
    ELSIF TG_TABLE_NAME = 'pms_connections' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'provider')::TEXT || ' Connection', 'PMS Connection');
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'full_name')::TEXT, (to_jsonb(OLD)->>'email')::TEXT, 'Profile');
    ELSE
      v_entity_name := TG_TABLE_NAME;
    END IF;

    PERFORM public.log_activity(
      'update',
      TG_TABLE_NAME,
      NEW.id,
      v_entity_name,
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW),
        'changes', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE value IS DISTINCT FROM (to_jsonb(OLD) -> key)
        )
      )
    );
    RETURN NEW;
  END IF;

  -- Log DELETE
  IF (TG_OP = 'DELETE') THEN
    IF TG_TABLE_NAME = 'listings' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'name')::TEXT, 'Deleted Listing');
    ELSIF TG_TABLE_NAME = 'guests' THEN
      v_entity_name := COALESCE(
        (to_jsonb(OLD)->>'first_name')::TEXT || ' ' || (to_jsonb(OLD)->>'last_name')::TEXT,
        'Deleted Guest'
      );
    ELSIF TG_TABLE_NAME IN ('tv_devices') THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'device_name')::TEXT, 'Deleted TV Device');
    ELSIF TG_TABLE_NAME = 'qr_codes' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'qr_name')::TEXT, 'Deleted QR Code');
    ELSIF TG_TABLE_NAME = 'pms_connections' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'provider')::TEXT || ' Connection', 'Deleted PMS Connection');
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      v_entity_name := COALESCE((to_jsonb(OLD)->>'full_name')::TEXT, (to_jsonb(OLD)->>'email')::TEXT, 'Deleted Profile');
    ELSE
      v_entity_name := 'Deleted ' || TG_TABLE_NAME;
    END IF;

    PERFORM public.log_activity(
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      v_entity_name,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
