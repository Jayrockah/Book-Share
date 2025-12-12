import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
    const { signUp, signIn, loading, logout } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        city: 'Lagos'
    });
    const [submitting, setSubmitting] = useState(false);

    // Clear any stuck sessions on mount
    const handleClearSession = async () => {
        try {
            await logout();
            localStorage.clear();
            sessionStorage.clear();
            addToast('Session cleared. Please try logging in again.', 'success');
            setSubmitting(false);
        } catch (error) {
            console.error('Error clearing session:', error);
            addToast('Session cleared. Please refresh the page.', 'info');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isSignUp) {
                // Sign up flow
                if (!formData.name || !formData.city) {
                    addToast('Please fill in all required fields', 'error');
                    setSubmitting(false);
                    return;
                }

                const result = await signUp(formData.email, formData.password, {
                    name: formData.name,
                    city: formData.city
                });

                if (result.success) {
                    if (result.requiresEmailConfirmation) {
                        // Email confirmation required
                        addToast(result.message || 'Please check your email to confirm your account.', 'info');
                        setIsSignUp(false); // Switch to sign in mode
                    } else {
                        // Signed up and profile created successfully
                        addToast(`Welcome to Book Share, ${formData.name.split(' ')[0]}!`, 'success');
                        navigate('/home');
                    }
                } else {
                    addToast(result.error || 'Signup failed', 'error');
                }
            } else {
                // Sign in flow
                const result = await signIn(formData.email, formData.password);

                if (result.success) {
                    addToast(`Welcome back, ${result.user.name.split(' ')[0]}!`, 'success');
                    navigate('/home');
                } else {
                    addToast(result.error || 'Login failed', 'error');
                }
            }
        } catch {
            addToast('An error occurred. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', textAlign: 'center', padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #667eea',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
                <h2>Loading...</h2>
                <p className="text-muted" style={{ marginTop: '12px', maxWidth: '400px' }}>
                    Connecting to Book Share...
                </p>
                <p className="text-sm text-muted" style={{ marginTop: '20px', fontSize: '0.85rem' }}>
                    Taking too long? Check your internet connection or refresh the page.
                </p>
            </div>
        );
    }

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', maxWidth: '450px', margin: '0 auto' }}>
            <div className="card" style={{ padding: '32px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Book Share</h1>
                <p className="text-muted" style={{ textAlign: 'center', marginBottom: '32px' }}>
                    {isSignUp ? 'Create your account' : 'Welcome back'}
                </p>

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>
                                    City *
                                </label>
                                <select
                                    name="city"
                                    className="input"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="Lagos">Lagos</option>
                                    <option value="Abuja">Abuja</option>
                                    <option value="Port Harcourt">Port Harcourt</option>
                                    <option value="Ibadan">Ibadan</option>
                                    <option value="Kano">Kano</option>
                                    <option value="Enugu">Enugu</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="input"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>
                            Password *
                        </label>
                        <input
                            type="password"
                            name="password"
                            className="input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            minLength="6"
                        />
                        {isSignUp && (
                            <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
                                Must be at least 6 characters
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginBottom: '16px' }}
                        disabled={submitting}
                    >
                        {submitting ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>

                    {submitting && (
                        <div>
                            <button
                                type="button"
                                className="btn btn-outline"
                                style={{ width: '100%', marginBottom: '8px' }}
                                onClick={() => {
                                    setSubmitting(false);
                                    addToast('Operation cancelled. Please try again.', 'info');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                style={{ width: '100%', marginBottom: '16px', fontSize: '0.85rem' }}
                                onClick={handleClearSession}
                            >
                                Clear Session & Retry
                            </button>
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <button
                            type="button"
                            className="btn-link"
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </form>

                {isSignUp && (
                    <div style={{ marginTop: '24px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                        <p className="text-sm text-muted" style={{ margin: 0 }}>
                            💡 <strong>Next steps after signup:</strong> Complete your profile → Add your first book → Start discovering books from others!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
