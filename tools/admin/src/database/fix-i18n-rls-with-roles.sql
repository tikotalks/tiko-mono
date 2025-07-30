-- Alternative fix: Create a function to check user roles without recursion
-- This approach maintains role-based access control

-- Create a security definer function to check user roles
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    -- Return true for service role
    IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
        RETURN true;
    END IF;
    
    -- Get the user's role directly without RLS
    SELECT role INTO user_role
    FROM user_profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Check if user has one of the required roles
    RETURN user_role = ANY(required_roles);
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error (like missing user_profiles entry), deny access
        RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_role(text[]) TO authenticated;

-- Now recreate the policies using this function

-- First drop the simple policies we just created
DROP POLICY IF EXISTS "Languages are writable by authenticated users" ON i18n_languages;
DROP POLICY IF EXISTS "Translation keys are writable by authenticated users" ON i18n_keys;
DROP POLICY IF EXISTS "All translations are readable by authenticated users" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are writable by authenticated users" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are updatable by authenticated users" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are deletable by authenticated users" ON i18n_translations;

-- Recreate with role-based access

-- Languages: Everyone can read, only admins can modify
CREATE POLICY "Languages are writable by admins" 
ON i18n_languages FOR ALL 
USING (public.check_user_role(ARRAY['admin']));

-- Translation keys: Everyone can read, editors and admins can create/modify
CREATE POLICY "Translation keys are writable by editors and admins" 
ON i18n_keys FOR ALL 
USING (public.check_user_role(ARRAY['admin', 'editor']));

-- Translations: Everyone can read published, editors and admins can read/write all
CREATE POLICY "All translations are readable by editors and admins" 
ON i18n_translations FOR SELECT 
USING (
    is_published = true 
    OR public.check_user_role(ARRAY['admin', 'editor'])
);

CREATE POLICY "Translations are writable by editors and admins" 
ON i18n_translations FOR INSERT 
WITH CHECK (public.check_user_role(ARRAY['admin', 'editor']));

CREATE POLICY "Translations are updatable by editors and admins" 
ON i18n_translations FOR UPDATE 
USING (public.check_user_role(ARRAY['admin', 'editor']))
WITH CHECK (public.check_user_role(ARRAY['admin', 'editor']));

CREATE POLICY "Translations are deletable by editors and admins" 
ON i18n_translations FOR DELETE 
USING (public.check_user_role(ARRAY['admin', 'editor']));

-- Recreate the auto-publish function and trigger
CREATE OR REPLACE FUNCTION auto_publish_admin_translations()
RETURNS TRIGGER AS $$
BEGIN
    -- If created by an admin, auto-publish
    IF public.check_user_role(ARRAY['admin']) THEN
        NEW.is_published = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_publish_admin_translations
    BEFORE INSERT ON i18n_translations
    FOR EACH ROW
    EXECUTE FUNCTION auto_publish_admin_translations();