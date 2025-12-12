import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MapPin, Users } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <span style={{ fontSize: '4rem' }}>📚</span>
            </div>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Book Share
            </h1>

            <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '48px', maxWidth: '300px' }}>
                The neighborhood library that fits in your pocket. Borrow books from people nearby.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px', width: '100%' }}>
                <Feature icon={<MapPin size={24} color="var(--primary)" />} title="Local First" desc="Find books within walking distance." />
                <Feature icon={<Users size={24} color="var(--secondary)" />} title="Community" desc="Connect with readers in your area." />
                <Feature icon={<BookOpen size={24} color="#10b981" />} title="Save Money" desc="Read more, spend less." />
            </div>

            <button
                className="btn btn-primary btn-block"
                style={{ padding: '16px', fontSize: '1.1rem' }}
                onClick={() => navigate('/login')}
            >
                Get Started
            </button>
        </div>
    );
};

const Feature = ({ icon, title, desc }) => (
    <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: '16px', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '50%' }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{title}</h3>
            <p className="text-muted text-sm">{desc}</p>
        </div>
    </div>
);

export default LandingPage;
