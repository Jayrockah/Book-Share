import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Combined: auth user + profile data
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let initialAuthComplete = false;

        // Safety timeout - guarantee loading ends within 5 seconds
        const safetyTimeout = setTimeout(() => {
            if (mounted && !initialAuthComplete) {
                console.error('⏱️ Auth init timeout - possible RLS or network issue');
                setLoading(false);
            }
        }, 5000);

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Handle SIGNED_OUT
            if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                    initialAuthComplete = true;
                }
                return;
            }

            // Handle INITIAL_SESSION (fired on mount if session exists)
            if (event === 'INITIAL_SESSION') {
                if (!session) {
                    if (mounted) {
                        setUser(null);
                        setLoading(false);
                        initialAuthComplete = true;
                        clearTimeout(safetyTimeout);
                    }
                    return;
                }

                // Fetch profile for initial session
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (mounted) {
                    if (error) {
                        console.error('Profile error:', error);
                        setUser(null);
                    } else if (profile) {
                        setUser({ ...session.user, profile });
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                    initialAuthComplete = true;
                    clearTimeout(safetyTimeout);
                }
                return;
            }

            // Handle SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session?.user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (mounted) {
                        if (error) {
                            console.error('Profile error:', error);
                            setUser(null);
                        } else if (profile) {
                            setUser({ ...session.user, profile });
                        } else {
                            setUser(null);
                        }

                        if (!initialAuthComplete) {
                            setLoading(false);
                            initialAuthComplete = true;
                            clearTimeout(safetyTimeout);
                        }
                    }
                } else {
                    if (mounted) {
                        setUser(null);
                        if (!initialAuthComplete) {
                            setLoading(false);
                            initialAuthComplete = true;
                            clearTimeout(safetyTimeout);
                        }
                    }
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription?.unsubscribe();
        };
    }, []);

    /**
     * Sign up with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {object} profileData - Additional profile data (name, city)
     */
    const signUp = async (email, password, profileData) => {
        try {
            console.log('📝 Signing up...');

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // This metadata is passed to the trigger
                    data: {
                        name: profileData.name || 'New User',
                        city: profileData.city || ''
                    }
                }
            });

            if (error) {
                console.error('Signup error:', error);
                return { success: false, error: error.message };
            }

            if (!data.user) {
                return { success: false, error: 'Signup failed - no user returned' };
            }

            // Check if email confirmation is required
            if (!data.session) {
                return {
                    success: true,
                    requiresEmailConfirmation: true,
                    message: 'Please check your email to confirm your account.'
                };
            }

            // Profile was created by trigger, fetch it
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            setUser({
                ...data.user,
                profile
            });

            console.log('✅ Signup complete!');
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message || 'Signup failed' };
        }
    };

    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     */
    const signIn = async (email, password) => {
        try {
            console.log('🔑 Signing in...');

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Sign in error:', error);
                return { success: false, error: error.message };
            }

            if (!data.user) {
                return { success: false, error: 'Sign in failed - no user returned' };
            }

            // Fetch profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.error('Profile error:', profileError);
                console.error('⚠️ Your account exists but has no profile in the database.');
                console.error('This happens for accounts created before the rebuild.');
                console.error('Solution: Run create-profile-for-existing-user.sql OR sign up with a new account.');
                // Sign them out since they can't use the app without a profile
                await supabase.auth.signOut();
                return { success: false, error: 'Could not load user profile. Your account needs to be migrated. Please contact support or create a new account.' };
            }

            setUser({
                ...data.user,
                profile
            });

            console.log('✅ Sign in complete!');
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message || 'Sign in failed' };
        }
    };

    /**
     * Sign out current user
     */
    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Refresh user profile data
     */
    const refreshUserProfile = async () => {
        if (user?.id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUser({
                    ...user,
                    profile
                });
            }
        }
    };

    /**
     * Update user profile
     * @param {object} updates - Fields to update
     */
    const updateProfile = async (updates) => {
        if (!user?.id) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) {
                console.error('Update profile error:', error);
                return { success: false, error: error.message };
            }

            setUser({
                ...user,
                profile: data
            });

            return { success: true, profile: data };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signUp,
            signIn,
            logout,
            refreshUserProfile,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
