import {
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { supabase } from '../config/supabase';

/**
 * Auth Service - Handles Firebase Authentication and Supabase User Sync
 */

// Initialize reCAPTCHA verifier for phone auth
export const initializeRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            size: 'invisible',
            callback: () => {
                console.log('reCAPTCHA verified');
            },
            'expired-callback': () => {
                console.log('reCAPTCHA expired');
            }
        });
    }
    return window.recaptchaVerifier;
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +2348012345678)
 * @returns {Promise<object>} Confirmation result for OTP verification
 */
export const sendOTP = async (phoneNumber) => {
    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return { success: true, confirmationResult };
    } catch (error) {
        console.error('Error sending OTP:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify OTP and complete sign in
 * @param {object} confirmationResult - Result from sendOTP
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<object>} User credential
 */
export const verifyOTP = async (confirmationResult, code) => {
    try {
        const result = await confirmationResult.confirm(code);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get or create user in Supabase after Firebase auth
 * @param {object} firebaseUser - Firebase user object
 * @param {object} additionalData - Additional user data (name, city, etc.)
 * @returns {Promise<object>} Supabase user object
 */
export const syncUserToSupabase = async (firebaseUser, additionalData = {}) => {
    try {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', firebaseUser.uid)
            .single();

        if (existingUser) {
            return { success: true, user: existingUser };
        }

        // Create new user if doesn't exist
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                firebase_uid: firebaseUser.uid,
                phone_number: firebaseUser.phoneNumber,
                name: additionalData.name || 'New User',
                city: additionalData.city || '',
                profile_photo_url: additionalData.profilePhoto || null,
                reputation: 0,
                borrow_limit: 3,
                is_admin: false,
                is_banned: false
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating user in Supabase:', insertError);
            return { success: false, error: insertError.message };
        }

        return { success: true, user: newUser };
    } catch (error) {
        console.error('Error syncing user to Supabase:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get current user from Supabase by Firebase UID
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<object>} Supabase user object
 */
export const getSupabaseUser = async (firebaseUid) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (error) throw error;
        return { success: true, user: data };
    } catch (error) {
        console.error('Error fetching user from Supabase:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update user profile in Supabase
 * @param {string} userId - Supabase user ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated user object
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, user: data };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Listen to Firebase auth state changes
 * @param {function} callback - Callback function to handle auth state changes
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};
