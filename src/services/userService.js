import { supabase } from './supabaseClient';

/**
 * Create a new user profile in Supabase
 * @param {Object} userData - User profile data
 * @param {string} userData.firebase_uid - Supabase Auth user ID
 * @param {string} userData.name - User's full name
 * @param {string} userData.city - User's city
 * @returns {Promise<Object|null>} Created user profile or null
 */
export const createUserProfile = async (userData) => {
    try {
        const { data, error} = await supabase
            .from('users')
            .insert([
                {
                    firebase_uid: userData.firebase_uid,
                    name: userData.name,
                    city: userData.city
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Create user profile error:', error.message);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('❌ Unexpected error creating user profile:', error);
        throw error;
    }
};

/**
 * Get user profile by Supabase Auth user ID (firebase_uid)
 * @param {string} authUserId - Supabase Auth user ID
 * @returns {Promise<Object|null>} User profile or null
 */
export const getUserProfile = async (authUserId) => {
    try {
        if (!authUserId) return null;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', authUserId)
            .single();

        if (error) {
            // Not found is not an error for this use case
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Get user profile error:', error.message || error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error fetching user profile:', error);
        return null;
    }
};

/**
 * Update user profile
 * @param {string} userId - User's database ID (UUID)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated user profile or null
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Update user profile error:', error.message);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error updating user profile:', error);
        throw error;
    }
};

/**
 * Fetch a single user by ID from Supabase
 * @param {string} userId - The user's UUID
 * @returns {Promise<Object|null>} User object or null
 */
export const fetchUserById = async (userId) => {
    try {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('users')
            .select('id, name, city, reputation, profile_photo_url, is_admin')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Supabase user fetch error:', error.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error fetching user:', error);
        return null;
    }
};

/**
 * Fetch multiple users by IDs from Supabase
 * @param {Array<string>} userIds - Array of user UUIDs
 * @returns {Promise<Object>} Map of userId to user object
 */
export const fetchUsersByIds = async (userIds) => {
    try {
        if (!userIds || userIds.length === 0) return {};

        const { data, error } = await supabase
            .from('users')
            .select('id, name, city, reputation, profile_photo_url, is_admin')
            .in('id', userIds);

        if (error) {
            console.error('Supabase users fetch error:', error.message);
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
