import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { db } from '../services/MockDatabase';

const OrganizationsPage = () => {
    const { organizations } = useData();
    const { user } = useAuth();
    const [cityFilter, setCityFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);

    const filteredOrganizations = organizations.filter(org =>
        (cityFilter === 'All' || org.city === cityFilter) &&
        (org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getCardStyle = (orgId) => ({
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hoveredCard === orgId ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hoveredCard === orgId ? '0 8px 16px rgba(0,0,0,0.12)' : undefined
    });

    return (
        <div className="container">
            <header>
                <h1>📚 Book Club Organizations</h1>
                <p className="text-muted">Discover and join real-world book clubs in your city</p>

                {/* Search Bar */}
                <div style={{ marginBottom: '12px', marginTop: '16px' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search organizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* City Filter */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <select
                        className="input"
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        style={{ maxWidth: '200px' }}
                    >
                        <option value="All">All Cities</option>
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Port Harcourt">Port Harcourt</option>
                        <option value="Ibadan">Ibadan</option>
                    </select>

                    <Link to="/organizations/create" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                        + Create Organization
                    </Link>
                </div>
            </header>

            {/* Organizations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredOrganizations.length === 0 ? (
                    <div className="text-center" style={{ gridColumn: '1 / -1', padding: '48px 0', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔍</span>
                        <h3>No organizations found</h3>
                        <p>Try adjusting your search or create a new organization!</p>
                    </div>
                ) : (
                    filteredOrganizations.map(org => {
                        const memberCount = db.getOrganizationMembers(org.id).length;
                        const bookCount = db.getOrganizationBooks(org.id).length;
                        const isMember = user && db.isOrganizationMember(org.id, user.id);

                        return (
                            <Link
                                key={org.id}
                                to={`/organizations/${org.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                                onMouseEnter={() => setHoveredCard(org.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className="card" style={getCardStyle(org.id)}>
                                    {/* Logo */}
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                        {org.logoUrl ? (
                                            <img
                                                src={org.logoUrl}
                                                alt={org.name}
                                                style={{ width: '48px', height: '48px', borderRadius: '50%', marginRight: '12px' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                marginRight: '12px',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                color: 'white',
                                                fontWeight: '600'
                                            }}>
                                                {org.name[0]}
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ marginBottom: '2px' }}>{org.name}</h3>
                                            <p className="text-sm text-muted">📍 {org.city}</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm" style={{ marginBottom: '12px', lineHeight: '1.5' }}>
                                        {org.description.length > 100
                                            ? `${org.description.substring(0, 100)}...`
                                            : org.description}
                                    </p>

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '0.9rem' }}>
                                        <span>👥 {memberCount} members</span>
                                        <span>📚 {bookCount} books</span>
                                    </div>

                                    {/* Member Badge */}
                                    {isMember && (
                                        <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                            ✓ Member
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default OrganizationsPage;
