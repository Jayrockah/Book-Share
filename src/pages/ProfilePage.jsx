import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/MockDatabase';
import { useToast } from '../context/ToastContext';
import { TRANSACTION_STATUS, getTransactionPhase } from '../models/index';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const {
        books, requests, transactions,
        approveRequest, rejectRequest, returnBook, confirmReturn,
        addBookRating, rateUser, requestReturn, confirmBorrowerReceipt,
        getUserOrganizations,
        approveAndSchedulePickup, confirmPickup, initiateReturn,
        scheduleReturn, confirmTransactionReturn, cancelTransaction
    } = useData();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const SHOW_LEGACY_UI = false;

    const [ratingModalBook, setRatingModalBook] = useState(null);
    const [bookRating, setBookRating] = useState(5);
    const [bookReview, setBookReview] = useState('');

    const [mutualRatingModal, setMutualRatingModal] = useState(null);
    const [userRating, setUserRating] = useState(5);

    // Transaction modal state
    const [schedulePickupModal, setSchedulePickupModal] = useState(null);
    const [scheduleReturnModal, setScheduleReturnModal] = useState(null);
    const [pickupDetails, setPickupDetails] = useState({ method: 'IN_PERSON', locationText: '', scheduledAt: '', note: '' });
    const [returnDetails, setReturnDetails] = useState({ method: 'IN_PERSON', locationText: '', scheduledAt: '', note: '' });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const myBooks = books.filter(b => b.ownerId === user.id);
    const activeBorrows = db.getUserActiveBorrows(user.id);
    const isTrustedBorrower = user.reputation >= 4.5;

    // Books I am borrowing
    const myBorrowRequests = requests.filter(r => r.requesterId === user.id && (r.status === 'Approved' || r.status === 'ReturnedAndPendingConfirm'));

    // Pending receipt confirmations (I need to confirm I received the book)
    const pendingReceipts = requests.filter(r => r.requesterId === user.id && r.status === 'PendingBorrowerConfirmation');

    // Books I have lent out (currently borrowed by others)
    const lentBooks = requests.filter(r => r.ownerId === user.id && (r.status === 'Approved' || r.status === 'ReturnedAndPendingConfirm'));

    // Return requests I've received (as borrower)
    const returnRequests = requests.filter(r => r.requesterId === user.id && r.status === 'Approved' && r.returnRequested);

    // Requests for my books
    const incomingRequests = requests.filter(r => r.ownerId === user.id && r.status === 'Pending');
    const returnConfirmations = requests.filter(r => r.ownerId === user.id && r.status === 'ReturnedAndPendingConfirm');

    const handleRateBook = () => {
        if (!ratingModalBook) return;
        const result = addBookRating(ratingModalBook.id, bookRating, bookReview);
        addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            setRatingModalBook(null);
            setBookRating(5);
            setBookReview('');
        }
    };

    const handleConfirmReturn = (requestId) => {
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        const result = confirmReturn(requestId);
        addToast(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            // Show mutual rating modal
            setMutualRatingModal({
                requestId: request.id,
                otherUserId: request.requesterId,
                otherUserName: db.getUserById(request.requesterId)?.name,
                isOwner: true
            });
        }
    };

    const handleReturnBook = (bookId) => {
        const request = requests.find(r => r.bookId === bookId && r.status === 'Approved');
        if (!request) return;

        const result = returnBook(bookId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    const handleApprove = (requestId) => {
        const result = approveRequest(requestId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    const handleReject = (requestId) => {
        const result = rejectRequest(requestId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    const handleSubmitUserRating = () => {
        if (!mutualRatingModal) return;

        const result = rateUser(mutualRatingModal.otherUserId, userRating, mutualRatingModal.requestId);
        addToast(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setMutualRatingModal(null);
            setUserRating(5);
        }
    };

    const handleRequestReturn = (requestId) => {
        const result = requestReturn(requestId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    const handleConfirmReceipt = (requestId) => {
        const result = confirmBorrowerReceipt(requestId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    // === Transaction handlers ===
    const handleApproveAndSchedulePickup = () => {
        if (!schedulePickupModal) return;
        const result = approveAndSchedulePickup(schedulePickupModal.id, pickupDetails);
        addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            setSchedulePickupModal(null);
            setPickupDetails({ method: 'IN_PERSON', locationText: '', scheduledAt: '', note: '' });
        }
    };

    const handleConfirmPickup = (transactionId) => {
        const result = confirmPickup(transactionId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    const handleInitiateReturn = (transactionId) => {
        const result = initiateReturn(transactionId, { method: 'IN_PERSON' });
        addToast(result.message, result.success ? 'success' : 'error');
    };

    const handleScheduleReturn = () => {
        if (!scheduleReturnModal) return;
        const result = scheduleReturn(scheduleReturnModal.id, returnDetails);
        addToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            setScheduleReturnModal(null);
            setReturnDetails({ method: 'IN_PERSON', locationText: '', scheduledAt: '', note: '' });
        }
    };

    const handleConfirmTransactionReturn = (transactionId) => {
        const result = confirmTransactionReturn(transactionId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    const handleCancelTransaction = (transactionId) => {
        if (!confirm('Are you sure you want to cancel this transaction?')) return;
        const result = cancelTransaction(transactionId);
        addToast(result.message, result.success ? 'success' : 'error');
    };

    // Filter transactions by role
    const activeTransactions = (transactions || []).filter(
        t => ![TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.CANCELLED].includes(t.status)
    );

    return (
        <div className="container">
            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                {user.profilePhoto ? (
                    <img src={user.profilePhoto} style={{ width: '64px', height: '64px', borderRadius: '50%', marginRight: '16px' }} alt="Avatar" />
                ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', marginRight: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: '600' }}>
                        {user.name[0]}
                    </div>
                )}
                <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: '4px' }}>{user.name}</h2>
                    <p className="text-muted">{user.city}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#fbbf24', marginRight: '4px', fontSize: '1.1rem' }}>★</span>
                            <span style={{ fontWeight: '600' }}>{user.reputation || 'New'}</span>
                        </div>
                        {user.isAdmin && (
                            <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: '600' }}>
                                ⚡ Admin
                            </span>
                        )}
                        {isTrustedBorrower && (
                            <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: '600' }}>
                                ✓ Trusted Borrower
                            </span>
                        )}
                        <span className="text-sm text-muted">
                            Borrowing {activeBorrows}/{user.borrowLimit} books
                        </span>
                    </div>
                </div>
            </div>

            <button className="btn btn-outline btn-block" style={{ marginBottom: '24px' }} onClick={handleLogout}>Logout</button>

            {/* Active Transactions (New System) */}
            {activeTransactions.length > 0 && (
                <>
                    <h3>Active Transactions</h3>
                    <div className="section">
                        {activeTransactions.map(tx => {
                            const book = books.find(b => b.id === tx.bookId);
                            const isBorrower = tx.borrowerId === user.id;
                            const otherUser = db.getUserById(isBorrower ? tx.ownerId : tx.borrowerId);
                            const phase = getTransactionPhase(tx.status);

                            return (
                                <div key={tx.id} className="card" style={{ borderLeft: `4px solid ${phase.color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{book?.title}</h4>
                                            <p className="text-sm text-muted">{book?.author}</p>
                                        </div>
                                        <span className="badge" style={{ background: `${phase.color}20`, color: phase.color, fontWeight: '600' }}>
                                            {phase.label}
                                        </span>
                                    </div>
                                    <p className="text-sm" style={{ marginBottom: '8px' }}>
                                        {isBorrower ? (
                                            <>Owner: <Link to={`/user/${tx.ownerId}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>{otherUser?.name}</Link></>
                                        ) : (
                                            <>Borrower: <Link to={`/user/${tx.borrowerId}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>{otherUser?.name}</Link></>
                                        )}
                                    </p>

                                    {tx.status === TRANSACTION_STATUS.REQUESTED && !isBorrower && (
                                        <div style={{ marginTop: '12px' }}>
                                            <p className="text-sm text-muted" style={{ marginBottom: '8px' }}>{otherUser?.name} wants to borrow this book</p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => setSchedulePickupModal(tx)}>Approve & Schedule Pickup</button>
                                                <button className="btn btn-outline btn-sm" onClick={() => handleCancelTransaction(tx.id)}>Decline</button>
                                            </div>
                                        </div>
                                    )}

                                    {tx.status === TRANSACTION_STATUS.REQUESTED && isBorrower && (
                                        <div style={{ marginTop: '8px' }}>
                                            <p className="text-sm text-muted">Your request is pending owner approval</p>
                                            <button className="btn btn-outline btn-sm" style={{ marginTop: '8px' }} onClick={() => handleCancelTransaction(tx.id)}>Cancel Request</button>
                                        </div>
                                    )}

                                    {tx.status === TRANSACTION_STATUS.PICKUP_SCHEDULED && (
                                        <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <p className="text-sm"><strong>Location:</strong> {tx.pickupExchange.locationText || 'TBD'}</p>
                                            {tx.pickupExchange.scheduledAt && <p className="text-sm"><strong>When:</strong> {new Date(tx.pickupExchange.scheduledAt).toLocaleString()}</p>}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                                {isBorrower && !tx.pickupExchange.borrowerConfirmed && <button className="btn btn-primary btn-sm" onClick={() => handleConfirmPickup(tx.id)}>Confirm Pickup</button>}
                                                {!isBorrower && !tx.pickupExchange.ownerConfirmed && <button className="btn btn-primary btn-sm" onClick={() => handleConfirmPickup(tx.id)}>Confirm Handover</button>}
                                                {tx.pickupExchange.borrowerConfirmed && <span className="text-sm" style={{ color: '#16a34a' }}>✓ Borrower confirmed</span>}
                                                {tx.pickupExchange.ownerConfirmed && <span className="text-sm" style={{ color: '#16a34a' }}>✓ Owner confirmed</span>}
                                            </div>
                                        </div>
                                    )}

                                    {(tx.status === TRANSACTION_STATUS.BORROWING || tx.status === TRANSACTION_STATUS.OVERDUE) && (
                                        <div style={{ marginTop: '12px' }}>
                                            <p className="text-sm" style={{ marginBottom: '8px' }}>
                                                {isBorrower ? 'You are currently borrowing this book' : `${otherUser?.name} is currently borrowing this book`}
                                            </p>
                                            {tx.dueDate && (
                                                <p className="text-sm" style={{ color: tx.status === TRANSACTION_STATUS.OVERDUE ? '#dc2626' : '#64748b' }}>
                                                    Due: {new Date(tx.dueDate).toLocaleDateString()}
                                                    {tx.status === TRANSACTION_STATUS.OVERDUE && <span style={{ fontWeight: '600', marginLeft: '8px' }}>⚠️ OVERDUE</span>}
                                                </p>
                                            )}
                                            {isBorrower && <button className="btn btn-outline btn-sm" style={{ marginTop: '8px' }} onClick={() => handleInitiateReturn(tx.id)}>Initiate Return</button>}
                                            {!isBorrower && tx.returnExchange.method && !tx.returnExchange.scheduledAt && <button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }} onClick={() => setScheduleReturnModal(tx)}>Schedule Return</button>}
                                        </div>
                                    )}

                                    {tx.status === TRANSACTION_STATUS.RETURN_SCHEDULED && (
                                        <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <p className="text-sm"><strong>Location:</strong> {tx.returnExchange.locationText || 'TBD'}</p>
                                            {tx.returnExchange.scheduledAt && <p className="text-sm"><strong>When:</strong> {new Date(tx.returnExchange.scheduledAt).toLocaleString()}</p>}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                                {isBorrower && !tx.returnExchange.borrowerConfirmed && <button className="btn btn-primary btn-sm" onClick={() => handleConfirmTransactionReturn(tx.id)}>Confirm Return</button>}
                                                {!isBorrower && !tx.returnExchange.ownerConfirmed && <button className="btn btn-primary btn-sm" onClick={() => handleConfirmTransactionReturn(tx.id)}>Confirm Receipt</button>}
                                                {tx.returnExchange.borrowerConfirmed && <span className="text-sm" style={{ color: '#16a34a' }}>✓ Borrower confirmed</span>}
                                                {tx.returnExchange.ownerConfirmed && <span className="text-sm" style={{ color: '#16a34a' }}>✓ Owner confirmed</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ===== LEGACY REQUEST UI - TODO: Remove once transactions are fully migrated ===== */}
            {SHOW_LEGACY_UI && (
                <>
            {/* Pending Receipt Confirmations */}
            {pendingReceipts.length > 0 && (
                <>
                    <h3>Confirm Receipt</h3>
                    <div className="section">
                        {pendingReceipts.map(req => {
                            const book = books.find(b => b.id === req.bookId);
                            const owner = db.getUserById(req.ownerId);

                            return (
                                <div key={req.id} className="card" style={{ borderLeft: '4px solid #0284c7' }}>
                                    <p><strong>{owner?.name}</strong> has approved your request for <strong>{book?.title}</strong>.</p>
                                    <p className="text-sm text-muted" style={{ marginTop: '4px' }}>Please confirm that you have received the book.</p>
                                    <button className="btn btn-primary btn-block" style={{ marginTop: '8px' }} onClick={() => handleConfirmReceipt(req.id)}>
                                        Confirm I Received the Book
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Return Requests (from owners) */}
            {returnRequests.length > 0 && (
                <>
                    <h3>Return Requests</h3>
                    <div className="section">
                        {returnRequests.map(req => {
                            const book = books.find(b => b.id === req.bookId);
                            const owner = db.getUserById(req.ownerId);
                            const dueDate = book?.dueDate ? new Date(book.dueDate) : null;
                            const isOverdue = dueDate && dueDate < new Date();

                            return (
                                <div key={req.id} className="card" style={{ borderLeft: '4px solid #dc2626' }}>
                                    <p><strong>{owner?.name}</strong> has requested the return of <strong>{book?.title}</strong>.</p>
                                    {isOverdue && (
                                        <p className="text-sm" style={{ color: '#dc2626', marginTop: '4px' }}>
                                            ⚠️ This book is overdue
                                        </p>
                                    )}
                                    <p className="text-sm text-muted" style={{ marginTop: '8px' }}>
                                        Please return the book as soon as possible.
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Return Confirmations */}
            {returnConfirmations.length > 0 && (
                <>
                    <h3>Confirm Returns</h3>
                    <div className="section">
                        {returnConfirmations.map(req => {
                            const book = books.find(b => b.id === req.bookId);
                            const borrower = db.getUserById(req.requesterId);
                            const hasRated = db.hasUserRatedInRequest(user.id, req.requesterId, req.id);

                            return (
                                <div key={req.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                    <p><strong>{borrower?.name}</strong> has returned <strong>{book?.title}</strong>.</p>
                                    <button className="btn btn-primary btn-block" style={{ marginTop: '8px' }} onClick={() => handleConfirmReturn(req.id)}>
                                        Confirm Receipt
                                    </button>
                                    {hasRated && (
                                        <p className="text-sm text-muted" style={{ marginTop: '8px' }}>✓ You've rated this user</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Incoming Requests */}
            <h3>Incoming Requests</h3>
            <div className="section">
                {incomingRequests.length === 0 ? (
                    <div className="text-center" style={{ padding: '32px 0', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <p>No pending requests.</p>
                    </div>
                ) : (
                    incomingRequests.map(req => {
                        const book = books.find(b => b.id === req.bookId);
                        const requester = db.getUserById(req.requesterId);
                        const requesterBorrows = db.getUserActiveBorrows(req.requesterId);
                        const canBorrow = db.canUserBorrow(req.requesterId);

                        return (
                            <div key={req.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <p><strong>{requester?.name || 'Unknown'}</strong> wants to borrow <strong>{book?.title}</strong></p>
                                    {requester && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ color: '#fbbf24' }}>★</span>
                                            <span className="text-sm">{requester.reputation}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-muted">
                                    Borrowing {requesterBorrows}/{requester?.borrowLimit || 3} books
                                </p>
                                {!canBorrow && (
                                    <p className="text-sm" style={{ color: '#dc2626', marginTop: '4px' }}>
                                        ⚠️ User has reached their borrow limit
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.9rem' }} onClick={() => handleApprove(req.id)} disabled={!canBorrow}>
                                        Approve
                                    </button>
                                    <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.9rem' }} onClick={() => handleReject(req.id)}>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Borrowed Books */}
            <h3 style={{ marginTop: '32px' }}>Borrowed Books</h3>
            <div className="section">
                {myBorrowRequests.length === 0 ? (
                    <div className="text-center" style={{ padding: '32px 0', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <p>You are not borrowing any books.</p>
                    </div>
                ) : (
                    myBorrowRequests.map(req => {
                        const book = books.find(b => b.id === req.bookId);
                        const hasRatedBook = db.hasUserRatedBook(user.id, book?.id);
                        const hasRatedOwner = db.hasUserRatedInRequest(user.id, req.ownerId, req.id);
                        const dueDate = book?.dueDate ? new Date(book.dueDate) : null;
                        const isOverdue = dueDate && dueDate < new Date();

                        return (
                            <div key={req.id} className="card" style={{ display: 'flex', gap: '16px' }}>
                                {book?.coverUrl && (
                                    <img src={book.coverUrl} alt={book.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <h4>{book?.title}</h4>
                                    <p className="text-sm text-muted">
                                        Due: {dueDate ? dueDate.toLocaleDateString() : 'N/A'}
                                        {isOverdue && <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '8px' }}>⚠️ OVERDUE</span>}
                                    </p>

                                    {req.status === 'ReturnedAndPendingConfirm' ? (
                                        <>
                                            <div className="badge" style={{ background: '#fef3c7', color: '#d97706', marginTop: '8px', display: 'inline-block' }}>
                                                Pending Confirmation
                                            </div>
                                            {!hasRatedOwner && (
                                                <p className="text-sm" style={{ marginTop: '8px', color: '#0284c7' }}>
                                                    You can rate the owner after they confirm the return
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => handleReturnBook(book.id)}
                                            >
                                                Return Book
                                            </button>
                                            {!hasRatedBook && (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setRatingModalBook(book)}
                                                >
                                                    Rate Book
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Lent Books */}
            <h3 style={{ marginTop: '32px' }}>Lent Books</h3>
            <div className="section">
                {lentBooks.length === 0 ? (
                    <div className="text-center" style={{ padding: '32px 0', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <p>You haven't lent any books.</p>
                    </div>
                ) : (
                    lentBooks.map(req => {
                        const book = books.find(b => b.id === req.bookId);
                        const borrower = db.getUserById(req.requesterId);
                        const dueDate = book?.dueDate ? new Date(book.dueDate) : null;
                        const isOverdue = dueDate && dueDate < new Date();
                        const daysOverdue = isOverdue ? Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24)) : 0;

                        return (
                            <div key={req.id} className="card" style={{ display: 'flex', gap: '16px' }}>
                                {book?.coverUrl && (
                                    <img src={book.coverUrl} alt={book.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <h4>{book?.title}</h4>
                                    <p className="text-sm text-muted">
                                        Borrowed by <strong>{borrower?.name}</strong>
                                    </p>
                                    <p className="text-sm text-muted">
                                        Due: {dueDate ? dueDate.toLocaleDateString() : 'N/A'}
                                        {isOverdue && (
                                            <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '8px' }}>
                                                ⚠️ {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                                            </span>
                                        )}
                                    </p>

                                    {req.status === 'ReturnedAndPendingConfirm' ? (
                                        <div className="badge" style={{ background: '#fef3c7', color: '#d97706', marginTop: '8px', display: 'inline-block' }}>
                                            Pending Your Confirmation
                                        </div>
                                    ) : (
                                        <>
                                            {isOverdue && !req.returnRequested && (
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    style={{ marginTop: '8px', borderColor: '#dc2626', color: '#dc2626' }}
                                                    onClick={() => handleRequestReturn(req.id)}
                                                >
                                                    Request Return
                                                </button>
                                            )}
                                            {req.returnRequested && (
                                                <div className="badge" style={{ background: '#fee2e2', color: '#dc2626', marginTop: '8px', display: 'inline-block' }}>
                                                    Return Requested
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
                </>
            )}
            {/* ===== END LEGACY REQUEST UI ===== */}

            {/* My Organizations */}
            <h3 style={{ marginTop: '32px' }}>My Organizations</h3>
            <div className="section">
                {getUserOrganizations(user.id).length === 0 ? (
                    <div className="text-center" style={{ padding: '32px 0', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <p>You haven't joined any book clubs yet.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
                            <button className="btn btn-outline" onClick={() => navigate('/organizations')}>Browse Clubs</button>
                            <button className="btn btn-primary" onClick={() => navigate('/organizations/create')}>Create Club</button>
                        </div>
                    </div>
                ) : (
                    getUserOrganizations(user.id).map(org => (
                        <div key={org.id} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <img
                                src={org.logoUrl}
                                alt={org.name}
                                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1 }}>
                                <h4>{org.name}</h4>
                                <p className="text-sm text-muted">{org.city} • {db.getOrganizationMembers(org.id).length} members</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => navigate(`/organizations/${org.id}/chat`)}
                                >
                                    Chat
                                </button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => navigate(`/organizations/${org.id}`)}
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* My Library */}
            <h3 style={{ marginTop: '32px' }}>My Library</h3>
            <div className="section">
                {myBooks.length === 0 ? (
                    <div className="text-center" style={{ padding: '32px 0', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <p>You haven't listed any books yet.</p>
                        <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => navigate('/add')}>Add a Book</button>
                    </div>
                ) : (
                    myBooks.map(book => {
                        const avgRating = db.getBookAverageRating(book.id);
                        const ratingCount = db.getBookRatings(book.id).length;
                        const borrower = book.borrowerId ? db.getUserById(book.borrowerId) : null;

                        return (
                            <div key={book.id} className="card" style={{ display: 'flex', gap: '16px' }}>
                                {book.coverUrl && (
                                    <img src={book.coverUrl} alt={book.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <h4>{book.title}</h4>
                                    <p className="text-sm text-muted">
                                        Status: <span style={{ color: book.status === 'Available' ? '#16a34a' : '#f59e0b', fontWeight: '500' }}>{book.status}</span>
                                    </p>
                                    {borrower && (
                                        <p className="text-sm text-muted">
                                            Borrowed by <strong>{borrower.name}</strong>
                                        </p>
                                    )}
                                    {avgRating && (
                                        <p className="text-sm" style={{ marginTop: '4px' }}>
                                            <span style={{ color: '#fbbf24' }}>★</span> {avgRating} ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Book Rating Modal */}
            {ratingModalBook && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                        <h3>Rate "{ratingModalBook.title}"</h3>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Rating</label>
                            <select
                                className="input"
                                value={bookRating}
                                onChange={(e) => setBookRating(Number(e.target.value))}
                            >
                                <option value="5">5 Stars - Excellent</option>
                                <option value="4">4 Stars - Good</option>
                                <option value="3">3 Stars - Average</option>
                                <option value="2">2 Stars - Poor</option>
                                <option value="1">1 Star - Terrible</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Review (Optional)</label>
                            <textarea
                                className="input"
                                value={bookReview}
                                onChange={(e) => setBookReview(e.target.value)}
                                placeholder="Share your thoughts about this book..."
                                rows="3"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                                setRatingModalBook(null);
                                setBookRating(5);
                                setBookReview('');
                            }}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRateBook}>Submit Rating</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mutual Rating Modal */}
            {mutualRatingModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                        <h3>Rate {mutualRatingModal.otherUserName}</h3>
                        <p className="text-muted" style={{ marginTop: '8px' }}>
                            {mutualRatingModal.isOwner ? 'How was your experience with this borrower?' : 'How was your experience with this book owner?'}
                        </p>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Rating</label>
                            <select
                                className="input"
                                value={userRating}
                                onChange={(e) => setUserRating(Number(e.target.value))}
                            >
                                <option value="5">5 Stars - Excellent</option>
                                <option value="4">4 Stars - Good</option>
                                <option value="3">3 Stars - Average</option>
                                <option value="2">2 Stars - Poor</option>
                                <option value="1">1 Star - Terrible</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                                setMutualRatingModal(null);
                                setUserRating(5);
                            }}>Skip</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmitUserRating}>Submit Rating</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Pickup Modal */}
            {schedulePickupModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Schedule Pickup</h3>
                        <p className="text-muted" style={{ marginTop: '4px' }}>Set up pickup details for "{books.find(b => b.id === schedulePickupModal.bookId)?.title}"</p>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Exchange Method</label>
                            <select className="input" value={pickupDetails.method} onChange={(e) => setPickupDetails({ ...pickupDetails, method: e.target.value })}>
                                <option value="IN_PERSON">In Person</option>
                                <option value="COURIER">Courier/Delivery</option>
                                <option value="BOOKCLUB_MEETUP">Book Club Meetup</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Location / Address</label>
                            <input className="input" type="text" placeholder="e.g., Coffee shop at Lekki Phase 1" value={pickupDetails.locationText} onChange={(e) => setPickupDetails({ ...pickupDetails, locationText: e.target.value })} />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Date & Time</label>
                            <input className="input" type="datetime-local" value={pickupDetails.scheduledAt} onChange={(e) => setPickupDetails({ ...pickupDetails, scheduledAt: e.target.value })} />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Note (Optional)</label>
                            <textarea className="input" placeholder="Any additional instructions..." value={pickupDetails.note} onChange={(e) => setPickupDetails({ ...pickupDetails, note: e.target.value })} rows="2" />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setSchedulePickupModal(null); setPickupDetails({ method: 'IN_PERSON', locationText: '', scheduledAt: '', note: '' }); }}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleApproveAndSchedulePickup} disabled={!pickupDetails.locationText || !pickupDetails.scheduledAt}>Confirm Pickup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Return Modal */}
            {scheduleReturnModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Schedule Return</h3>
                        <p className="text-muted" style={{ marginTop: '4px' }}>Set up return details for "{books.find(b => b.id === scheduleReturnModal.bookId)?.title}"</p>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Exchange Method</label>
                            <select className="input" value={returnDetails.method} onChange={(e) => setReturnDetails({ ...returnDetails, method: e.target.value })}>
                                <option value="IN_PERSON">In Person</option>
                                <option value="COURIER">Courier/Delivery</option>
                                <option value="BOOKCLUB_MEETUP">Book Club Meetup</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Location / Address</label>
                            <input className="input" type="text" placeholder="e.g., Same pickup location" value={returnDetails.locationText} onChange={(e) => setReturnDetails({ ...returnDetails, locationText: e.target.value })} />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Date & Time</label>
                            <input className="input" type="datetime-local" value={returnDetails.scheduledAt} onChange={(e) => setReturnDetails({ ...returnDetails, scheduledAt: e.target.value })} />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Note (Optional)</label>
                            <textarea className="input" placeholder="Any additional instructions..." value={returnDetails.note} onChange={(e) => setReturnDetails({ ...returnDetails, note: e.target.value })} rows="2" />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setScheduleReturnModal(null); setReturnDetails({ method: 'IN_PERSON', locationText: '', scheduledAt: '', note: '' }); }}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleScheduleReturn} disabled={!returnDetails.locationText || !returnDetails.scheduledAt}>Schedule Return</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
