import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/MockDatabase';
import { useToast } from '../context/ToastContext';

const AdminPage = () => {
    const { user } = useAuth();
    const { banUser, unbanUser } = useData();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);

    // Refs for scrolling to sections
    const overdueSectionRef = useRef(null);
    const userManagementRef = useRef(null);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        // Redirect if not admin
        if (!user || !user.isAdmin) {
            navigate('/home');
            return;
        }

        // Load statistics and users
        try {
            const statistics = db.getUserStatistics();
            setStats(statistics);
            setUsers(db.getUsers());
        } catch (error) {
            console.error('Error loading admin data:', error);
            addToast('Failed to load admin dashboard data', 'error');
        }
    }, [user, navigate, addToast]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleBan = (userId) => {
        const result = banUser(userId);
        addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            try {
                setUsers(db.getUsers());
            } catch (error) {
                console.error('Error refreshing users:', error);
            }
        }
    };

    const handleUnban = (userId) => {
        const result = unbanUser(userId);
        addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            try {
                setUsers(db.getUsers());
            } catch (error) {
                console.error('Error refreshing users:', error);
            }
        }
    };

    const scrollToSection = (ref) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (!user || !user.isAdmin) {
        return null;
    }

    const statCardStyle = {
        textAlign: 'center',
        padding: '16px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
    };

    return (
        <div className="container">
            <header>
                <h1>⚡ Admin Dashboard</h1>
                <p className="text-muted">System overview and user management</p>
            </header>

            {/* Statistics */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    <div
                        className="card"
                        style={statCardStyle}
                        onClick={() => scrollToSection(userManagementRef)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#0284c7' }}>{stats.totalUsers}</div>
                        <div className="text-sm text-muted">Total Users</div>
                    </div>
                    <div
                        className="card"
                        style={statCardStyle}
                        onClick={() => navigate('/home')}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#16a34a' }}>{stats.totalBooks}</div>
                        <div className="text-sm text-muted">Total Books</div>
                    </div>
                    <div
                        className="card"
                        style={statCardStyle}
                        onClick={() => scrollToSection(overdueSectionRef)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#f59e0b' }}>{stats.activeBorrows}</div>
                        <div className="text-sm text-muted">Active Borrows</div>
                    </div>
                    <div
                        className="card"
                        style={{ ...statCardStyle, opacity: stats.overdueCount === 0 ? 0.5 : 1 }}
                        onClick={() => stats.overdueCount > 0 && scrollToSection(overdueSectionRef)}
                        onMouseEnter={(e) => stats.overdueCount > 0 && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#dc2626' }}>{stats.overdueCount}</div>
                        <div className="text-sm text-muted">Overdue Books</div>
                    </div>
                </div>
            )}

            {/* Overdue Books */}
            {stats && stats.overdueBooks?.length > 0 && (
                <>
                    <h3 ref={overdueSectionRef}>Overdue Books</h3>
                    <div className="section">
                        {stats.overdueBooks.map(({ request, book, borrower, owner }) => {
                            const dueDate = book?.dueDate ? new Date(book.dueDate) : null;
                            const daysOverdue = dueDate ? Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24)) : 0;

                            return (
                                <div key={request.id} className="card" style={{ borderLeft: '4px solid #dc2626' }}>
                                    <h4>{book?.title}</h4>
                                    <p className="text-sm text-muted">
                                        Borrower: <strong>{borrower?.name}</strong> ({borrower?.city})
                                    </p>
                                    <p className="text-sm text-muted">
                                        Owner: <strong>{owner?.name}</strong>
                                    </p>
                                    <p className="text-sm" style={{ color: '#dc2626', marginTop: '4px' }}>
                                        ⚠️ {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                                    </p>
                                    {request.returnRequested && (
                                        <div className="badge" style={{ background: '#fee2e2', color: '#dc2626', marginTop: '8px', display: 'inline-block' }}>
                                            Return Requested by Owner
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* User Management */}
            <h3 ref={userManagementRef} style={{ marginTop: '32px' }}>User Management</h3>
            <div className="section">
                {users.filter(u => !u.isAdmin).map(u => {
                    const activeBorrows = db.getUserActiveBorrows(u.id);

                    return (
                        <div key={u.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <h4>{u.name}</h4>
                                    <p className="text-sm text-muted">{u.city}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ color: '#fbbf24', marginRight: '4px' }}>★</span>
                                            <span className="text-sm">{u.reputation}</span>
                                        </div>
                                        <span className="text-sm text-muted">
                                            Borrowing {activeBorrows}/{u.borrowLimit} books
                                        </span>
                                        {u.isBanned && (
                                            <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                                Banned
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    {u.isBanned ? (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleUnban(u.id)}
                                        >
                                            Unban
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-outline btn-sm"
                                            style={{ borderColor: '#dc2626', color: '#dc2626' }}
                                            onClick={() => handleBan(u.id)}
                                        >
                                            Ban User
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminPage;
