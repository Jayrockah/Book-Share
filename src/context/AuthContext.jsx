import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, createUserProfile } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // User profile from our users table
    const [authUser, setAuthUser] = useState(null); // Supabase auth user
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Absolute safety timeout - GUARANTEES loading ends within 12 seconds
        const safetyTimeout = setTimeout(() => {
            if (mounted) {
                console.warn('⏱️ Auth init timeout - forcing loading=false');
                setLoading(false);
            }
        }, 12000);

        // Check for existing session
        const initAuth = async () => {
            try {
                console.log('🔐 Starting auth init...');

                // Step 1: Get session (with generous timeout for restored projects)
                const sessionPromise = supabase.auth.getSession();
                const sessionTimeout = new Promise((resolve) =>
                    setTimeout(() => resolve({ data: { session: null }, error: { message: 'Session timeout' } }), 7000)
                );

                const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, sessionTimeout]);

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

                // Step 2: Get profile (with timeout)
                const profilePromise = getUserProfile(session.user.id);
                const profileTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));

                let profile = await Promise.race([profilePromise, profileTimeout]);

                // Step 3: Create profile if missing (with timeout)
                if (!profile) {
                    console.log('📝 Creating profile...');
                    const createPromise = createUserProfile({
                        firebase_uid: session.user.id,
                        name: session.user.email?.split('@')[0] || 'User',
                        city: 'Lagos'
                    });
                    const createTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));

                    profile = await Promise.race([createPromise, createTimeout]);
                }

                if (mounted) {
                    setUser(profile);
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                    console.log('✅ Auth init complete');
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
            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

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

            // Step 1: Auth with timeout
            const authPromise = supabase.auth.signInWithPassword({ email, password });
            const authTimeout = new Promise((resolve) =>
                setTimeout(() => resolve({ data: null, error: { message: 'Sign in timeout' } }), 7000)
            );

            const { data, error } = await Promise.race([authPromise, authTimeout]);

            if (error) {
                console.error('Auth error:', error.message);
                return { success: false, error: error.message };
            }

            if (!data?.user) {
                return { success: false, error: 'Sign in failed - no user returned' };
            }

            console.log('✅ Auth successful, fetching profile...');

            // Step 2: Fetch profile with timeout (one attempt only)
            const profilePromise = getUserProfile(data.user.id);
            const profileTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));

            let profile = await Promise.race([profilePromise, profileTimeout]);

            // Step 3: Create profile if missing
            if (!profile) {
                console.log('📝 Creating profile for sign in...');
                const createPromise = createUserProfile({
                    firebase_uid: data.user.id,
                    name: data.user.email?.split('@')[0] || 'User',
                    city: 'Lagos'
                });
                const createTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));

                profile = await Promise.race([createPromise, createTimeout]);

                if (!profile) {
                    return { success: false, error: 'Profile creation timed out. Please try again.' };
                }
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
