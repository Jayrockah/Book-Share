import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, createUserProfile } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // User profile from our users table
    const [authUser, setAuthUser] = useState(null); // Supabase auth user
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety timeout to ensure loading never gets stuck
        const safetyTimeout = setTimeout(() => {
            console.warn('Auth initialization exceeded 10s - forcing loading to false');
            setLoading(false);
        }, 10000);

        // Check for existing session
        const initAuth = async () => {
            try {
                // Get session - this is usually very fast, no timeout needed
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setAuthUser(null);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    setAuthUser(session.user);
                    // Fetch user profile from our users table
                    let profile = await getUserProfile(session.user.id);

                    // If profile doesn't exist, create it with defaults
                    if (!profile) {
                        try {
                            profile = await createUserProfile({
                                firebase_uid: session.user.id,
                                name: session.user.email?.split('@')[0] || 'User',
                                city: 'Lagos'
                            });
                        } catch (createError) {
                            console.error('Failed to create profile during init:', createError);
                            // Don't sign out - just set user to null
                            setUser(null);
                            setLoading(false);
                            return;
                        }
                    }

                    setUser(profile);
                } else {
                    setAuthUser(null);
                    setUser(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                // Clear session on init error
                setAuthUser(null);
                setUser(null);
            } finally {
                // ALWAYS set loading to false, even on error or timeout
                clearTimeout(safetyTimeout);
                setLoading(false);
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
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Auth error:', error.message);
                return { success: false, error: error.message };
            }

            // Fetch user profile with retries
            let profile = null;
            let retries = 3;

            while (!profile && retries > 0) {
                try {
                    profile = await getUserProfile(data.user.id);
                    if (profile) break;
                } catch (profileError) {
                    retries--;
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                    }
                }
            }

            // If profile doesn't exist after retries, create it
            if (!profile) {
                try {
                    profile = await createUserProfile({
                        firebase_uid: data.user.id,
                        name: data.user.email?.split('@')[0] || 'User',
                        city: 'Lagos'
                    });
                } catch (createError) {
                    console.error('❌ Profile creation failed:', createError);
                    return { success: false, error: 'Failed to create user profile. Please try again.' };
                }
            }

            setAuthUser(data.user);
            setUser(profile);

            return { success: true, user: profile };
        } catch (error) {
            console.error('❌ Sign in error:', error);
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
