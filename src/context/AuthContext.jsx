import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, createUserProfile } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // User profile from our users table
    const [authUser, setAuthUser] = useState(null); // Supabase auth user
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const initAuth = async () => {
            try {
                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
                );

                const sessionPromise = supabase.auth.getSession();

                // Race between session fetch and timeout
                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

                if (session?.user) {
                    setAuthUser(session.user);
                    // Fetch user profile from our users table
                    let profile = await getUserProfile(session.user.id);

                    // If profile doesn't exist, create it with defaults
                    if (!profile) {
                        console.log('No profile found during init, creating default profile...');
                        try {
                            profile = await createUserProfile({
                                firebase_uid: session.user.id,
                                name: session.user.email?.split('@')[0] || 'User',
                                city: 'Lagos'
                            });
                        } catch (createError) {
                            console.error('Failed to create profile during init:', createError);
                            // If profile creation fails, sign out to clear the session
                            await supabase.auth.signOut();
                            setAuthUser(null);
                            setUser(null);
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
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            try {
                if (session?.user) {
                    setAuthUser(session.user);
                    // Fetch user profile
                    let profile = await getUserProfile(session.user.id);

                    // If profile doesn't exist, create it with defaults
                    // This ensures consistency with the signIn flow
                    if (!profile) {
                        console.log('No profile found in auth state change, creating default profile...');
                        try {
                            profile = await createUserProfile({
                                firebase_uid: session.user.id,
                                name: session.user.email?.split('@')[0] || 'User',
                                city: 'Lagos' // Default city
                            });
                        } catch (createError) {
                            console.error('Failed to create profile in auth state change:', createError);
                            // If profile creation fails, sign out to clear the session
                            await supabase.auth.signOut();
                            setAuthUser(null);
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
                setAuthUser(null);
                setUser(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signUp = async (email, password, profileData) => {
        try {
            // Add timeout to prevent hanging on sign-up
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Sign up timeout - please check your connection and try again')), 15000)
            );

            const signUpPromise = (async () => {
                // 1. Create auth user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (authError) throw authError;

                if (!authData.user) {
                    throw new Error('Signup succeeded but no user returned');
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
                const profile = await createUserProfile({
                    firebase_uid: authData.user.id,
                    name: profileData.name,
                    city: profileData.city
                });

                setAuthUser(authData.user);
                setUser(profile);

                return { success: true, user: profile };
            })();

            // Race between sign-up and timeout
            return await Promise.race([signUpPromise, timeoutPromise]);
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    };

    const signIn = async (email, password) => {
        try {
            // Increased timeout to 30 seconds for slow networks
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => {
                    reject(new Error('Sign in is taking longer than expected. Please check your internet connection and try again.'));
                }, 30000)
            );

            const signInPromise = (async () => {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.error('❌ Supabase auth error:', error);
                    throw error;
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
                        throw new Error('Failed to create user profile. Please try again or contact support.');
                    }
                }

                setAuthUser(data.user);
                setUser(profile);

                return { success: true, user: profile };
            })();

            // Race between sign-in and timeout
            return await Promise.race([signInPromise, timeoutPromise]);
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return { success: false, error: error.message };
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
