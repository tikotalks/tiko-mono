import { createClient } from '@supabase/supabase-js';
export default {
    async fetch(request, env, ctx) {
        // Enable CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        try {
            const url = new URL(request.url);
            const path = url.pathname;
            if (path === '/remove-user' && request.method === 'DELETE') {
                return await handleUserRemoval(request, env, corsHeaders);
            }
            if (path === '/removal-status' && request.method === 'GET') {
                return await handleRemovalStatus(request, env, corsHeaders);
            }
            return new Response('Not Found', {
                status: 404,
                headers: corsHeaders
            });
        }
        catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },
};
async function handleUserRemoval(request, env, corsHeaders) {
    try {
        const body = await request.json();
        // Verify admin key
        if (body.adminKey !== env.ADMIN_API_KEY) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        if (!body.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User ID is required'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        // Initialize Supabase client with service key for admin operations
        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_KEY);
        // Log the removal start
        await logRemovalProgress(env, body.userId, {
            step: 'initiated',
            status: 'in_progress',
            message: 'User removal process started',
            timestamp: new Date().toISOString()
        });
        // Start the removal process
        const result = await removeUserCompletely(supabase, body.userId, env);
        // Log completion
        await logRemovalProgress(env, body.userId, {
            step: 'completed',
            status: 'completed',
            message: 'User removal completed successfully',
            timestamp: new Date().toISOString()
        });
        return new Response(JSON.stringify({
            success: true,
            message: 'User account and all associated data have been removed',
            details: result
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
    catch (error) {
        console.error('User removal error:', error);
        const userId = request.body?.userId || 'unknown';
        await logRemovalProgress(env, userId, {
            step: 'failed',
            status: 'failed',
            message: `User removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString()
        });
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to remove user'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}
async function handleRemovalStatus(request, env, corsHeaders) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
        return new Response(JSON.stringify({
            success: false,
            error: 'User ID is required'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
    try {
        const log = await env.USER_REMOVAL_LOG?.get(userId);
        const progress = log ? JSON.parse(log) : null;
        return new Response(JSON.stringify({
            success: true,
            progress
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
    catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to retrieve removal status'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}
async function removeUserCompletely(supabase, userId, env) {
    const results = {
        userItems: 0,
        userMedia: 0,
        userProfiles: 0,
        userSettings: 0,
        authAccount: false
    };
    // Step 1: Remove all user items from all tables
    await logRemovalProgress(env, userId, {
        step: 'removing_items',
        status: 'in_progress',
        message: 'Removing user items and sequences...',
        timestamp: new Date().toISOString()
    });
    // Remove from items table (sequences, cards, etc.)
    const { count: itemsCount } = await supabase
        .from('items')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact', head: true });
    results.userItems = itemsCount || 0;
    // Remove from collections table
    await supabase
        .from('collections')
        .delete()
        .eq('user_id', userId);
    // Step 2: Remove all user media
    await logRemovalProgress(env, userId, {
        step: 'removing_media',
        status: 'in_progress',
        message: 'Removing user media files...',
        timestamp: new Date().toISOString()
    });
    const { count: mediaCount } = await supabase
        .from('user_media')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact', head: true });
    results.userMedia = mediaCount || 0;
    // Step 3: Remove user profile data
    await logRemovalProgress(env, userId, {
        step: 'removing_profile',
        status: 'in_progress',
        message: 'Removing user profile...',
        timestamp: new Date().toISOString()
    });
    const { count: profileCount } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact', head: true });
    results.userProfiles = profileCount || 0;
    // Step 4: Remove user settings
    await logRemovalProgress(env, userId, {
        step: 'removing_settings',
        status: 'in_progress',
        message: 'Removing user settings...',
        timestamp: new Date().toISOString()
    });
    const { count: settingsCount } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact', head: true });
    results.userSettings = settingsCount || 0;
    // Remove app-specific settings
    await supabase
        .from('app_settings')
        .delete()
        .eq('user_id', userId);
    // Step 5: Remove authentication account (most critical)
    await logRemovalProgress(env, userId, {
        step: 'removing_auth',
        status: 'in_progress',
        message: 'Removing authentication account...',
        timestamp: new Date().toISOString()
    });
    // Delete the user from Supabase Auth (requires service key)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
        throw new Error(`Failed to delete user from auth: ${authError.message}`);
    }
    results.authAccount = true;
    return results;
}
async function logRemovalProgress(env, userId, progress) {
    if (!env.USER_REMOVAL_LOG)
        return;
    try {
        const existingLog = await env.USER_REMOVAL_LOG.get(userId);
        const logs = existingLog ? JSON.parse(existingLog) : [];
        logs.push(progress);
        await env.USER_REMOVAL_LOG.put(userId, JSON.stringify(logs), {
            expirationTtl: 86400 // Keep logs for 24 hours
        });
    }
    catch (error) {
        console.error('Failed to log removal progress:', error);
    }
}
