import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const CommunityPage = () => {
    const { user } = useAuth();
    const [hoveredCard, setHoveredCard] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, name, city, reputation, profile_photo_url')
                    .order('reputation', { ascending: false });

                if (error) {
                    console.error('Error fetching users:', error);
                    setUsers([]);
                } else {
                    setUsers(data || []);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Filter out current user
    const otherUsers = users.filter(u => u.id !== user?.id);

    const getCardStyle = (userId) => ({
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hoveredCard === userId ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hoveredCard === userId ? '0 8px 16px rgba(0,0,0,0.12)' : undefined
    });

    if (loading) {
        return (
            <div className="container">
                <h1>Community</h1>
                <p className="text-muted">Loading community members...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Community</h1>
            <p className="text-muted" style={{ marginBottom: '24px' }}>Connect with book lovers in your area</p>
            {otherUsers.length === 0 ? (
                <div className="text-center" style={{ padding: '32px 0', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                    <p>No community members found yet.</p>
                </div>
            ) : (
                <div className="user-list">
                    {otherUsers.map(u => (
                        <Link
                            to={`/user/${u.id}`}
                            key={u.id}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                            onMouseEnter={() => setHoveredCard(u.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div className="card" style={getCardStyle(u.id)}>
                                {u.profile_photo_url ? (
                                    <img src={u.profile_photo_url} alt={u.name} style={{ width: '48px', height: '48px', borderRadius: '50%', marginRight: '16px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', marginRight: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: '600' }}>
                                        {u.name[0]}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0 }}>{u.name}</h3>
                                    <p className="text-muted text-sm" style={{ margin: '4px 0 0 0' }}>
                                        {u.city}
                                        {u.reputation && (
                                            <span style={{ marginLeft: '8px' }}>
                                                <span style={{ color: '#fbbf24' }}>★</span> {u.reputation}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommunityPage;
