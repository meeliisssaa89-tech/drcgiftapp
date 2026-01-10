-- Update admin emails list to include the new admin email
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['admin@crystalspin.app', 'admin@example.com', 'drakcode@system.money'];
  new_user_email TEXT;
BEGIN
  new_user_email := LOWER(NEW.email);
  
  -- Check if user email is in admin list
  IF new_user_email = ANY(admin_emails) THEN
    -- Insert admin role directly
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;