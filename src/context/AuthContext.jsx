import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, createUserProfile } from '../services/userService';

const AuthContext = createContext();

// Helper: Add timeout to any promise
const withTimeout = (promise, timeoutMs, timeoutValue = null) => {
    return Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve(timeoutValue), timeoutMs))
    ]);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // User profile from our users table
    const [authUser, setAuthUser] = useState(null); // Supabase auth user
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Absolute safety timeout - GUARANTEES loading ends within 30 seconds
        const safetyTimeout = setTimeout(() => {
            if (mounted) {
                console.warn('⏱️ Auth init exceeded 30s - forcing loading=false');
                setLoading(false);
            }
        }, 30000);

        // Check for existing session
        const initAuth = async () => {
            try {
                console.log('🔐 Starting auth init...');

                // Step 1: Get session (10s timeout - Supabase hangs in some environments)
                const sessionResult = await withTimeout(
                    supabase.auth.getSession(),
                    10000,
                    { data: { session: null }, error: { message: 'Session check timed out' } }
                );

                const { data: { session }, error: sessionError } = sessionResult || { data: { session: null }, error: null };

                if (sessionError) {
                    console.error('Session error:', sessionError.message);
                    setAuthUser(null);
                    setUser(null);
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                    return;
                }

                if (!session?.user) {
                    console.log('ℹ️ No active session');
                    setAuthUser(null);
                    setUser(null);
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                    return;
                }

                console.log('👤 Session found, fetching profile...');
                setAuthUser(session.user);

                // Step 2: Get profile (no timeout)
                let profile = await getUserProfile(session.user.id);

                // Step 3: Create profile if missing
                if (!profile) {
                    console.log('📝 Creating profile...');
                    try {
                        profile = await createUserProfile({
                            firebase_uid: session.user.id,
                            name: session.user.email?.split('@')[0] || 'User',
                            city: 'Lagos'
                        });
                    } catch (createError) {
                        console.error('Failed to create profile during init:', createError);
                        // Profile creation failed - sign out and show login
                        await supabase.auth.signOut();
                        setAuthUser(null);
                        setUser(null);
                        setLoading(false);
                        clearTimeout(safetyTimeout);
                        return;
                    }
                }

                // Only proceed if we have a valid profile
                if (mounted && profile) {
                    setUser(profile);
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                    console.log('✅ Auth init complete');
                } else {
                    console.error('No profile available after init');
                    setAuthUser(null);
                    setUser(null);
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                if (mounted) {
                    setAuthUser(null);
                    setUser(null);
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Only process INITIAL_SESSION and SIGNED_IN events to avoid unnecessary calls
            if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') {
                if (!session?.user) {
                    setAuthUser(null);
                    setUser(null);
                }
                return;
            }

            try {
                if (session?.user) {
                    setAuthUser(session.user);

                    // Fetch user profile with retry logic
                    let profile = null;
                    let retries = 2;

                    while (!profile && retries > 0) {
                        try {
                            profile = await getUserProfile(session.user.id);
                            if (profile) break;
                        } catch (err) {
                            retries--;
                            if (retries > 0) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                    }

                    // If profile doesn't exist after retries, create it
                    if (!profile) {
                        try {
                            profile = await createUserProfile({
                                firebase_uid: session.user.id,
                                name: session.user.email?.split('@')[0] || 'User',
                                city: 'Lagos'
                            });
                        } catch (createError) {
                            console.error('Failed to create profile in auth state change:', createError);
                            // Don't sign out - just set user to null and let them try again
                            setUser(null);
                            return;
                        }
                    }

                    setUser(profile);
                } else {
                    setAuthUser(null);
                    setUser(null);
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
                // Don't clear auth, just clear user profile
                setUser(null);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription?.unsubscribe();
        };
    }, []);

    const signUp = async (email, password, profileData) => {
        try {
            // 1. Create auth user (15s timeout)
            const signUpResult = await withTimeout(
                supabase.auth.signUp({ email, password }),
                15000,
                { data: null, error: { message: 'Sign up request timed out. Please check your connection.' } }
            );

            const { data: authData, error: authError } = signUpResult || { data: null, error: { message: 'Signup failed' } };

            if (authError) {
                return { success: false, error: authError.message };
            }

            if (!authData.user) {
                return { success: false, error: 'Signup failed - no user returned' };
            }

            // 2. Check if we have an active session (required for RLS to work)
            if (!authData.session) {
                // Email confirmation is required - user needs to verify email first
                return {
                    success: true,
                    requiresEmailConfirmation: true,
                    message: 'Please check your email to confirm your account before signing in.'
                };
            }

            // 3. Create user profile in users table (session is active, auth.uid() will work)
            try {
                const profile = await createUserProfile({
                    firebase_uid: authData.user.id,
                    name: profileData.name,
                    city: profileData.city
                });

                setAuthUser(authData.user);
                setUser(profile);

                return { success: true, user: profile };
            } catch (profileError) {
                console.error('Profile creation error:', profileError);
                return { success: false, error: 'Failed to create user profile. Please try again.' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message || 'Signup failed. Please try again.' };
        }
    };

    const signIn = async (email, password) => {
        try {
            console.log('🔑 Signing in...');

            // Step 1: Auth (15s timeout - Supabase hangs in some environments)
            const authResult = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                15000,
                { data: null, error: { message: 'Sign in request timed out. Please check your connection.' } }
            );

            const { data, error } = authResult || { data: null, error: { message: 'Sign in failed' } };

            if (error) {
                console.error('Auth error:', error.message);
                return { success: false, error: error.message };
            }

            if (!data?.user) {
                return { success: false, error: 'Sign in failed - no user returned' };
            }

            console.log('✅ Auth successful, fetching profile...');

            // Step 2: Fetch profile (no timeout - let database respond naturally)
            let profile = await getUserProfile(data.user.id);

            // Step 3: Create profile if missing
            if (!profile) {
                console.log('📝 Creating profile for sign in...');
                try {
                    profile = await createUserProfile({
                        firebase_uid: data.user.id,
                        name: data.user.email?.split('@')[0] || 'User',
                        city: 'Lagos'
                    });
                } catch (createError) {
                    console.error('Profile creation failed:', createError);
                    return { success: false, error: 'Failed to create your profile. Please try again.' };
                }
            }

            // Verify we have a valid profile before proceeding
            if (!profile || !profile.id) {
                console.error('Invalid profile after sign in');
                return { success: false, error: 'Profile data is invalid. Please contact support.' };
            }

            setAuthUser(data.user);
            setUser(profile);

            console.log('✅ Sign in complete!');
            return { success: true, user: profile };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message || 'Sign in failed. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setAuthUser(null);
            setUser(null);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    };

    const refreshUserProfile = async () => {
        if (authUser) {
            const profile = await getUserProfile(authUser.id);
            setUser(profile);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            authUser,
            loading,
            signUp,
            signIn,
            logout,
            refreshUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
