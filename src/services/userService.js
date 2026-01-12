import { supabase } from './supabaseClient';

/**
 * Get user profile by auth user ID
 * @param {string} userId - Auth user ID (UUID)
 * @returns {Promise<Object|null>} User profile or null
 */
export const getUserProfile = async (userId) => {
    try {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            // PGRST116 = not found (profile doesn't exist yet)
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Get profile error:', error.message || error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        return null;
    }
};

/**
 * Update user profile
 * @param {string} userId - User's ID (UUID)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated user profile or null
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Update profile error:', error.message);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error updating profile:', error);
        throw error;
    }
};

/**
 * Fetch a single user profile by ID
 * @param {string} userId - The user's UUID
 * @returns {Promise<Object|null>} User profile or null
 */
export const fetchUserById = async (userId) => {
    try {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, city, reputation, is_admin, profile_photo_url')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Fetch user error:', error.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error fetching user:', error);
        return null;
    }
};

/**
 * Fetch multiple user profiles by IDs
 * @param {Array<string>} userIds - Array of user UUIDs
 * @returns {Promise<Object>} Map of userId to user profile
 */
export const fetchUsersByIds = async (userIds) => {
    try {
        if (!userIds || userIds.length === 0) return {};

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, city, reputation, is_admin, profile_photo_url')
            .in('id', userIds);

        if (error) {
            console.error('Fetch users error:', error.message);
            return {};
        }

        // Convert array to map for easy lookup
        const usersMap = {};
        data?.forEach(user => {
            usersMap[user.id] = user;
        });

        return usersMap;
    } catch (error) {
        console.error('Unexpected error fetching users:', error);
        return {};
    }
};

/**
 * Fetch all users (for community page)
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of users to fetch
 * @param {string} options.orderBy - Field to order by
 * @returns {Promise<Array>} Array of user profiles
 */
export const fetchAllUsers = async (options = {}) => {
    try {
        const { limit = 50, orderBy = 'created_at' } = options;

        let query = supabase
            .from('profiles')
            .select('id, name, city, reputation, is_admin, profile_photo_url, created_at')
            .order(orderBy, { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Fetch all users error:', error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching all users:', error);
        return [];
    }
};

/**
 * Search users by name or city
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching user profiles
 */
export const searchUsers = async (searchTerm) => {
    try {
        if (!searchTerm) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, city, reputation, is_admin, profile_photo_url')
            .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
            .limit(20);

        if (error) {
            console.error('Search users error:', error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error searching users:', error);
        return [];
    }
};
