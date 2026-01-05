import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/MockDatabase';
import { useToast } from '../context/ToastContext';
import { EXCHANGE_METHODS, CONTACT_METHODS } from '../models/index';

const PublicProfilePage = () => {
    const { userId } = useParams();
    const { books, getWaitlistPosition, getWaitlistCount, createBorrowTransaction } = useData();
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();
    const [hoveredCard, setHoveredCard] = useState(null);

    // Request modal state
    const [requestModal, setRequestModal] = useState(null);
    const [requestDetails, setRequestDetails] = useState({
        method: 'IN_PERSON',
        note: '',
        contactMethod: 'WHATSAPP',
        contactValue: ''
    });

    let user = null;
    try {
        user = db.getUserById(userId);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    const userBooks = books.filter(b => b.ownerId === userId);
    const isTrustedBorrower = user && user.reputation >= 4.5;

    if (!user) return <div className="container">User not found</div>;

    const handleOpenRequestModal = (book) => {
        setRequestModal(book);
        setRequestDetails({
            method: 'IN_PERSON',
            note: '',
            contactMethod: 'WHATSAPP',
            contactValue: ''
        });
    };

    const handleSubmitRequest = () => {
        if (!requestModal) return;
        const result = createBorrowTransaction(requestModal.id, requestDetails);
        addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            setRequestModal(null);
            setRequestDetails({ method: 'IN_PERSON', note: '', contactMethod: 'WHATSAPP', contactValue: '' });
        }
    };

    const formatDueDate = (dueDate) => {
        if (!dueDate) return null;
        const date = new Date(dueDate);
        const now = new Date();
        const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return { text: 'Overdue', color: '#dc2626' };
        if (daysLeft === 0) return { text: 'Due today', color: '#ea580c' };
        if (daysLeft <= 2) return { text: `Due in ${daysLeft} days`, color: '#d97706' };
        return { text: `Due in ${daysLeft} days`, color: '#64748b' };
    };

    const getCardStyle = (bookId) => ({
        display: 'flex',
        gap: '16px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hoveredCard === bookId ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hoveredCard === bookId ? '0 8px 16px rgba(0,0,0,0.12)' : undefined
    });

    return (
        <div className="container">
            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                {user.profilePhoto ? (
                    <img src={user.profilePhoto} style={{ width: '80px', height: '80px', borderRadius: '50%', marginRight: '24px' }} alt="Avatar" />
                ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', marginRight: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: '600' }}>
                        {user.name?.[0] || '?'}
                    </div>
                )}
                <div>
                    <h1 style={{ marginBottom: '4px' }}>{user.name}</h1>
                    <p className="text-muted">{user.city}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#fbbf24', marginRight: '4px', fontSize: '1.2rem' }}>★</span>
                            <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>{user.reputation || 'New'}</span>
                        </div>
                        {isTrustedBorrower && (
                            <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: '600' }}>
                                ✓ Trusted Borrower
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Books */}
            <h3>{userBooks.length} {userBooks.length === 1 ? 'Book' : 'Books'}</h3>
            <div className="section">
                {userBooks.length === 0 ? (
                    <p className="text-muted">No books listed yet.</p>
                ) : (
                    userBooks.map(book => {
                        const waitlistPosition = getWaitlistPosition(book.id);
                        const waitlistCount = getWaitlistCount(book.id);
                        const dueInfo = book.dueDate ? formatDueDate(book.dueDate) : null;
                        const avgRating = db.getBookAverageRating(book.id);
                        const ratingCount = db.getBookRatings(book.id).length;

                        return (
                            <div
                                key={book.id}
                                className="card"
                                style={getCardStyle(book.id)}
                                onMouseEnter={() => setHoveredCard(book.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                {book.coverUrl && (
                                    <img src={book.coverUrl} alt={book.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <h4 style={{ marginBottom: '4px', wordBreak: 'break-word' }}>{book.title}</h4>
                                            <p className="text-muted text-sm">{book.author}</p>
                                        </div>
                                        <span className="badge" style={{ background: '#e0f2fe', color: '#0284c7', flexShrink: 0 }}>{book.genre}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.9rem', marginBottom: '8px' }}>
                                        <span style={{ color: book.condition === 'New' ? '#16a34a' : book.condition === 'Good' ? '#0284c7' : '#64748b' }}>
                                            📖 {book.condition}
                                        </span>
                                        <span className={book.status === 'Available' ? 'badge' : ''} style={{
                                            background: book.status === 'Available' ? '#dcfce7' : 'transparent',
                                            color: book.status === 'Available' ? '#16a34a' : '#64748b',
                                            padding: book.status === 'Available' ? '2px 8px' : '0'
                                        }}>
                                            {book.status === 'Available' ? '✓ Available' : '⏳ Borrowed'}
                                        </span>
                                    </div>

                                    {dueInfo && (
                                        <p className="text-sm" style={{ color: dueInfo.color, marginBottom: '8px', fontWeight: '500' }}>
                                            {dueInfo.text}
                                        </p>
                                    )}

                                    {avgRating && (
                                        <p className="text-sm" style={{ marginBottom: '8px' }}>
                                            <span style={{ color: '#fbbf24' }}>★</span> {avgRating} ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
                                        </p>
                                    )}

                                    {waitlistCount > 0 && (
                                        <p className="text-sm text-muted" style={{ marginBottom: '8px' }}>
                                            {waitlistPosition ? (
                                                <span style={{ color: '#0284c7', fontWeight: '500' }}>You're #{waitlistPosition} in queue</span>
                                            ) : (
                                                <span>{waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} in queue</span>
                                            )}
                                        </p>
                                    )}

                                    {currentUser && currentUser.id !== userId && book.status === 'Available' && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ marginTop: '8px' }}
                                            onClick={() => handleOpenRequestModal(book)}
                                        >
                                            Request to Borrow
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Request Modal */}
            {requestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Request to Borrow</h3>
                        <p className="text-muted" style={{ marginTop: '4px' }}>
                            "{requestModal.title}" by {requestModal.author}
                        </p>

                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Preferred Exchange Method</label>
                            <select
                                className="input"
                                value={requestDetails.method}
                                onChange={(e) => setRequestDetails({ ...requestDetails, method: e.target.value })}
                            >
                                <option value="IN_PERSON">In Person</option>
                                <option value="COURIER">Courier/Delivery</option>
                                <option value="BOOKCLUB_MEETUP">Book Club Meetup</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>How can the owner contact you?</label>
                            <select
                                className="input"
                                value={requestDetails.contactMethod}
                                onChange={(e) => setRequestDetails({ ...requestDetails, contactMethod: e.target.value })}
                            >
                                <option value="WHATSAPP">WhatsApp</option>
                                <option value="PHONE_CALL">Phone Call</option>
                                <option value="SMS">SMS</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Contact Number/Info</label>
                            <input
                                className="input"
                                type="text"
                                placeholder="e.g., +234 xxx xxx xxxx"
                                value={requestDetails.contactValue}
                                onChange={(e) => setRequestDetails({ ...requestDetails, contactValue: e.target.value })}
                            />
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Note to Owner (Optional)</label>
                            <textarea
                                className="input"
                                placeholder="Any additional info or request..."
                                value={requestDetails.note}
                                onChange={(e) => setRequestDetails({ ...requestDetails, note: e.target.value })}
                                rows="2"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRequestModal(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleSubmitRequest}
                            >
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicProfilePage;
