-- Create RPC function to verify and fix has_children flags for a specific user and app
CREATE OR REPLACE FUNCTION verify_user_has_children_flags(
    p_user_id UUID,
    p_app_name TEXT
)
RETURNS JSON AS $$
DECLARE
    v_fixed_count INTEGER := 0;
    v_total_count INTEGER := 0;
    v_item RECORD;
    v_has_children BOOLEAN;
BEGIN
    -- Get total count of items for this user and app
    SELECT COUNT(*) INTO v_total_count
    FROM items
    WHERE user_id = p_user_id 
    AND app_name = p_app_name;

    -- Check each item
    FOR v_item IN 
        SELECT id, name, has_children
        FROM items
        WHERE user_id = p_user_id 
        AND app_name = p_app_name
    LOOP
        -- Check if item actually has children
        SELECT EXISTS(
            SELECT 1 FROM items 
            WHERE parent_id = v_item.id
        ) INTO v_has_children;
        
        -- If the flag doesn't match reality, fix it
        IF v_item.has_children IS DISTINCT FROM v_has_children THEN
            UPDATE items 
            SET has_children = v_has_children
            WHERE id = v_item.id;
            
            v_fixed_count := v_fixed_count + 1;
        END IF;
    END LOOP;

    -- Return results as JSON
    RETURN json_build_object(
        'fixed', v_fixed_count,
        'total', v_total_count,
        'success', true
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'fixed', 0,
            'total', 0,
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_user_has_children_flags(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION verify_user_has_children_flags IS 'Verifies and fixes has_children flags for all items belonging to a specific user and app';