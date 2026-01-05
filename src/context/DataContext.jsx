import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../services/MockDatabase'; // TODO: Migrate organization & transaction features to Supabase
import { useAuth } from './AuthContext';
import { fetchAllBooks, createBook } from '../services/bookService';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [requests, setRequests] = useState([]);
    const [waitlist, setWaitlist] = useState([]);

    // Organization state
    const [organizations, setOrganizations] = useState([]);
    const [organizationMemberships, setOrganizationMemberships] = useState([]);
    const [organizationBooks, setOrganizationBooks] = useState([]);
    const [organizationRequests, setOrganizationRequests] = useState([]);
    const [messages, setMessages] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const refreshData = async () => {
        try {
            // Fetch books from Supabase
            const supabaseBooks = await fetchAllBooks();
            setBooks(supabaseBooks || []);
        } catch (error) {
            console.error('Error refreshing books:', error);
            setBooks([]);
        }

        // Fetch user data from MockDatabase (separate try-catch to prevent crashes)
        if (user) {
            try {
                setRequests([...db.getRequestsForUser(user.id)]);
                setWaitlist([...db.data.waitlist]);
                setTransactions([...db.getTransactionsForUser(user.id)]);
            } catch (dbError) {
                console.error('Error loading user data from MockDatabase:', dbError);
                setRequests([]);
                setWaitlist([]);
                setTransactions([]);
            }
        } else {
            setRequests([]);
            setWaitlist([]);
            setTransactions([]);
        }
    };

    const refreshOrganizationData = () => {
        setOrganizations([...(db.getOrganizations() || [])]);
        setOrganizationMemberships([...(db.data.organizationMemberships || [])]);
        setOrganizationBooks([...(db.data.organizationBooks || [])]);
        setOrganizationRequests([...(db.data.organizationRequests || [])]);
        setMessages([...(db.data.messages || [])]);
    };

    useEffect(() => {
        refreshData();
        refreshOrganizationData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const addBook = async (bookData) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        // Validation
        if (!bookData.title || !bookData.author || !bookData.genre || !bookData.condition) {
            return { success: false, message: 'All fields are required' };
        }

        // Save to Supabase instead of MockDatabase
        const result = await createBook({
            owner_id: user.id,
            title: bookData.title,
            author: bookData.author,
            genre: bookData.genre,
            condition: bookData.condition,
            cover_photo_url: bookData.coverUrl || null,
            notes: bookData.notes || null
        });

        if (result.success) {
            // Refresh to get the latest books from Supabase
            await refreshData();
            return { success: true, message: 'Book added successfully!' };
        }

        return { success: false, message: result.error || 'Failed to add book' };
    };

    // ===== LEGACY REQUEST METHODS - TODO: Remove after full transaction migration =====
    // These methods are kept for backward compatibility but should not be used in new code.
    // Use createBorrowTransaction and related transaction methods instead.

    const requestBook = (bookId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        if (user.isBanned) return { success: false, message: 'Your account has been banned' };

        const book = books.find(b => b.id === bookId);
        if (!book) return { success: false, message: 'Book not found' };
        if (book.ownerId === user.id) return { success: false, message: 'Cannot borrow your own book' };
        if (book.status !== 'Available') return { success: false, message: 'Book is not available' };

        // Check borrow limit
        if (!db.canUserBorrow(user.id)) {
            const activeBorrows = db.getUserActiveBorrows(user.id);
            return { success: false, message: `You've reached your borrow limit (${activeBorrows}/${user.borrowLimit} books)` };
        }

        const existing = requests.find(r => r.bookId === bookId && r.requesterId === user.id && r.status === 'Pending');
        if (existing) return { success: false, message: 'Request already pending' };

        db.createRequest({
            bookId,
            requesterId: user.id,
            ownerId: book.ownerId
        });
        refreshData();
        return { success: true, message: 'Request sent successfully!' };
    };

    const approveRequest = (requestId) => {
        const request = requests.find(r => r.id === requestId);
        if (!request) return { success: false, message: 'Request not found' };

        // Check if requester is banned
        const requester = db.getUserById(request.requesterId);
        if (requester && requester.isBanned) {
            return { success: false, message: 'This user has been banned' };
        }

        // Double-check borrow limit before approval
        if (!db.canUserBorrow(request.requesterId)) {
            const activeBorrows = db.getUserActiveBorrows(request.requesterId);
            const userName = requester?.name || 'User';
            const borrowLimit = requester?.borrowLimit || 3;
            return { success: false, message: `${userName} has reached their borrow limit (${activeBorrows}/${borrowLimit})` };
        }

        db.updateRequestStatus(requestId, 'Approved');
        refreshData();
        return { success: true, message: 'Request approved! Waiting for borrower to confirm receipt.' };
    };

    const rejectRequest = (requestId) => {
        db.updateRequestStatus(requestId, 'Rejected');
        refreshData();
        return { success: true, message: 'Request rejected.' };
    };

    const returnBook = (bookId) => {
        const request = requests.find(r => r.bookId === bookId && r.status === 'Approved');
        if (request) {
            db.updateRequestStatus(request.id, 'ReturnedAndPendingConfirm');
            refreshData();
            return { success: true, message: 'Return initiated. Waiting for owner confirmation.' };
        }
        return { success: false, message: 'Active borrow not found' };
    };

    const confirmReturn = (requestId) => {
        db.updateRequestStatus(requestId, 'Returned');
        refreshData();
        return { success: true, message: 'Return confirmed! Book is now available.' };
    };

    const joinWaitlist = (bookId) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        const book = books.find(b => b.id === bookId);
        if (!book) return { success: false, message: 'Book not found' };
        if (book.ownerId === user.id) return { success: false, message: 'Cannot join waitlist for your own book' };

        const entry = db.joinWaitlist(bookId, user.id);
        if (!entry) return { success: false, message: 'You are already in the waitlist' };

        refreshData();
        return { success: true, message: `Joined waitlist at position #${entry.position}` };
    };

    const leaveWaitlist = (bookId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        db.removeFromWaitlist(bookId, user.id);
        refreshData();
        return { success: true, message: 'Left waitlist successfully' };
    };

    const rateUser = (toUserId, rating, requestId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        if (user.id === toUserId) return { success: false, message: 'Cannot rate yourself' };

        // Check if already rated for this request
        if (db.hasUserRatedInRequest(user.id, toUserId, requestId)) {
            return { success: false, message: 'You have already rated this user for this transaction' };
        }

        db.addRating({
            fromUserId: user.id,
            toUserId,
            rating,
            requestId
        });
        refreshData();
        return { success: true, message: 'Rating submitted! Thank you for your feedback.' };
    };

    const addBookRating = (bookId, rating, review = null) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        if (db.hasUserRatedBook(user.id, bookId)) {
            return { success: false, message: 'You have already rated this book' };
        }

        db.addBookRating({
            bookId,
            userId: user.id,
            rating,
            review
        });
        refreshData();
        return { success: true, message: 'Book rating submitted!' };
    };

    const getWaitlistPosition = (bookId) => {
        if (!user) return null;
        return db.getWaitlistPosition(bookId, user.id);
    };

    const getWaitlistCount = (bookId) => {
        return db.getWaitlistForBook(bookId).length;
    };

    const requestReturn = (requestId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const result = db.requestReturn(requestId);
        if (result) {
            refreshData();
            return { success: true, message: 'Return requested. Borrower has been notified.' };
        }
        return { success: false, message: 'Could not request return' };
    };

    const confirmBorrowerReceipt = (requestId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const result = db.confirmBorrowerReceipt(requestId);
        if (result) {
            refreshData();
            return { success: true, message: 'Receipt confirmed! Enjoy your book.' };
        }
        return { success: false, message: 'Could not confirm receipt' };
    };

    const banUser = (userId) => {
        if (!user || !user.isAdmin) return { success: false, message: 'Admin access required' };
        const result = db.banUser(userId);
        if (result) {
            refreshData();
            return { success: true, message: 'User banned successfully.' };
        }
        return { success: false, message: 'Could not ban user' };
    };

    const unbanUser = (userId) => {
        if (!user || !user.isAdmin) return { success: false, message: 'Admin access required' };
        const result = db.unbanUser(userId);
        if (result) {
            refreshData();
            return { success: true, message: 'User unbanned successfully.' };
        }
        return { success: false, message: 'Could not unban user' };
    };

    // ===== ORGANIZATION METHODS =====

    const createOrganization = (orgData) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        if (!orgData.name || !orgData.city || !orgData.location || !orgData.description) {
            return { success: false, message: 'All fields are required' };
        }

        const organization = db.createOrganization({
            ...orgData,
            createdByUserId: user.id
        });
        refreshOrganizationData();
        return { success: true, message: 'Organization created successfully!', organization };
    };

    const joinOrganization = (organizationId, role = 'onlineMember') => {
        if (!user) return { success: false, message: 'Must be logged in' };

        const membership = db.addOrganizationMember(organizationId, user.id, role);
        if (membership) {
            refreshOrganizationData();
            return { success: true, message: 'Joined organization successfully!' };
        }
        return { success: false, message: 'Already a member or organization not found' };
    };

    const addOrganizationBook = (organizationId, bookData) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        // Check if user is admin
        if (!db.isOrganizationAdmin(organizationId, user.id)) {
            return { success: false, message: 'Admin access required' };
        }

        if (!bookData.title || !bookData.author || !bookData.genre || !bookData.condition) {
            return { success: false, message: 'All fields are required' };
        }

        const book = db.addOrganizationBook(organizationId, bookData);
        refreshOrganizationData();
        return { success: true, message: 'Book added to catalog!', book };
    };

    const requestOrganizationBook = (organizationBookId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        if (user.isBanned) return { success: false, message: 'Your account has been banned' };

        const request = db.createOrganizationBorrowRequest(organizationBookId, user.id);
        if (request) {
            refreshOrganizationData();
            return { success: true, message: 'Request sent to organization!' };
        }
        return { success: false, message: 'Book not available or out of stock' };
    };

    const approveOrganizationRequest = (requestId, dueDate) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        const result = db.approveOrganizationRequest(requestId, dueDate);
        if (result) {
            refreshOrganizationData();
            return { success: true, message: 'Request approved!' };
        }
        return { success: false, message: 'Could not approve request' };
    };

    const rejectOrganizationRequest = (requestId) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        const result = db.rejectOrganizationRequest(requestId);
        if (result) {
            refreshOrganizationData();
            return { success: true, message: 'Request rejected' };
        }
        return { success: false, message: 'Could not reject request' };
    };

    const markOrganizationBookPickedUp = (requestId) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        const result = db.markBookPickedUp(requestId);
        if (result) {
            refreshOrganizationData();
            return { success: true, message: 'Marked as picked up' };
        }
        return { success: false, message: 'Could not update status' };
    };

    const markOrganizationBookReturned = (requestId) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        const result = db.markBookReturned(requestId);
        if (result) {
            refreshOrganizationData();
            return { success: true, message: 'Book returned successfully!' };
        }
        return { success: false, message: 'Could not mark as returned' };
    };

    const sendMessage = (content, organizationId = null) => {
        if (!user) return { success: false, message: 'Must be logged in' };

        const message = db.addMessage(user.id, content, organizationId);
        refreshOrganizationData();
        return { success: true, message: 'Message sent!', data: message };
    };

    const getOrganizationMessages = (organizationId) => {
        return db.getOrganizationMessages(organizationId);
    };

    const getOrganizationMembers = (organizationId) => {
        return db.getOrganizationMembers(organizationId);
    };

    const getUserOrganizations = () => {
        if (!user) return [];
        return db.getUserOrganizations(user.id);
    };

    const isOrganizationAdmin = (organizationId) => {
        if (!user) return false;
        return db.isOrganizationAdmin(organizationId, user.id);
    };

    const isOrganizationMember = (organizationId) => {
        if (!user) return false;
        return db.isOrganizationMember(organizationId, user.id);
    };

    const getMyActiveBorrows = () => {
        if (!user) return [];

        const activeBorrows = [];
        const myBorrowRequests = requests.filter(r =>
            r.requesterId === user.id &&
            (r.status === 'Approved' || r.status === 'PendingBorrowerConfirmation')
        );

        for (const req of myBorrowRequests) {
            const book = books.find(b => b.id === req.bookId);
            const owner = db.getUserById(req.ownerId);
            if (book && owner) {
                activeBorrows.push({
                    request: req,
                    book,
                    owner
                });
            }
        }

        return activeBorrows;
    };

    // ===== BORROW TRANSACTION METHODS =====

    const createBorrowTransaction = (bookId, requestDetails = {}) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        if (user.isBanned) return { success: false, message: 'Your account has been banned' };

        const book = books.find(b => b.id === bookId);
        if (!book) return { success: false, message: 'Book not found' };
        if (book.ownerId === user.id) return { success: false, message: 'Cannot borrow your own book' };
        if (book.status !== 'Available') return { success: false, message: 'Book is not available' };

        const existingTx = db.getActiveTransactionForBook(bookId);
        if (existingTx) return { success: false, message: 'Book already has an active transaction' };

        if (!db.canUserBorrow(user.id)) {
            return { success: false, message: `You've reached your borrow limit` };
        }

        const transaction = db.createTransaction({
            bookId,
            borrowerId: user.id,
            ownerId: book.ownerId,
            method: requestDetails.method,
            note: requestDetails.note,
            contactMethod: requestDetails.contactMethod,
            contactValue: requestDetails.contactValue
        });

        refreshData();
        return { success: true, message: 'Borrow request sent!', transaction };
    };

    const approveAndSchedulePickup = (transactionId, pickupDetails) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const transaction = db.getTransactionById(transactionId);
        if (!transaction) return { success: false, message: 'Transaction not found' };
        if (transaction.ownerId !== user.id) return { success: false, message: 'Only the owner can approve' };

        const result = db.approveAndSchedulePickup(transactionId, pickupDetails);
        if (result) {
            refreshData();
            return { success: true, message: 'Pickup scheduled!', transaction: result };
        }
        return { success: false, message: 'Could not schedule pickup' };
    };

    const confirmPickup = (transactionId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const transaction = db.getTransactionById(transactionId);
        if (!transaction) return { success: false, message: 'Transaction not found' };

        const role = transaction.borrowerId === user.id ? 'borrower' : transaction.ownerId === user.id ? 'owner' : null;
        if (!role) return { success: false, message: 'You are not part of this transaction' };

        const result = db.confirmPickup(transactionId, user.id, role);
        if (result) {
            refreshData();
            const bothConfirmed = result.pickupExchange.borrowerConfirmed && result.pickupExchange.ownerConfirmed;
            return { success: true, message: bothConfirmed ? 'Pickup complete! Borrowing period started.' : 'Pickup confirmed. Waiting for other party.', transaction: result };
        }
        return { success: false, message: 'Could not confirm pickup' };
    };

    const initiateReturn = (transactionId, returnDetails = {}) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const transaction = db.getTransactionById(transactionId);
        if (!transaction) return { success: false, message: 'Transaction not found' };
        if (transaction.borrowerId !== user.id) return { success: false, message: 'Only the borrower can initiate return' };

        const result = db.initiateReturn(transactionId, returnDetails);
        if (result) {
            refreshData();
            return { success: true, message: 'Return initiated. Waiting for owner to schedule.', transaction: result };
        }
        return { success: false, message: 'Could not initiate return' };
    };

    const scheduleReturn = (transactionId, returnDetails) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const transaction = db.getTransactionById(transactionId);
        if (!transaction) return { success: false, message: 'Transaction not found' };
        if (transaction.ownerId !== user.id) return { success: false, message: 'Only the owner can schedule return' };

        const result = db.scheduleReturn(transactionId, returnDetails);
        if (result) {
            refreshData();
            return { success: true, message: 'Return scheduled!', transaction: result };
        }
        return { success: false, message: 'Could not schedule return' };
    };

    const confirmTransactionReturn = (transactionId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const transaction = db.getTransactionById(transactionId);
        if (!transaction) return { success: false, message: 'Transaction not found' };

        const role = transaction.borrowerId === user.id ? 'borrower' : transaction.ownerId === user.id ? 'owner' : null;
        if (!role) return { success: false, message: 'You are not part of this transaction' };

        const result = db.confirmReturn(transactionId, user.id, role);
        if (result) {
            refreshData();
            const bothConfirmed = result.returnExchange.borrowerConfirmed && result.returnExchange.ownerConfirmed;
            return { success: true, message: bothConfirmed ? 'Return complete! Transaction finished.' : 'Return confirmed. Waiting for other party.', transaction: result };
        }
        return { success: false, message: 'Could not confirm return' };
    };

    const cancelTransaction = (transactionId) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        const transaction = db.getTransactionById(transactionId);
        if (!transaction) return { success: false, message: 'Transaction not found' };
        if (transaction.borrowerId !== user.id && transaction.ownerId !== user.id) {
            return { success: false, message: 'You are not part of this transaction' };
        }

        const result = db.cancelTransaction(transactionId);
        if (result) {
            refreshData();
            return { success: true, message: 'Transaction cancelled.', transaction: result };
        }
        return { success: false, message: 'Could not cancel transaction' };
    };

    const getTransactionById = (transactionId) => db.getTransactionById(transactionId);
    const getActiveTransactionForBook = (bookId) => db.getActiveTransactionForBook(bookId);

    return (
        <DataContext.Provider value={{
            books,
            requests,
            waitlist,
            organizations,
            organizationMemberships,
            organizationBooks,
            organizationRequests,
            messages,
            addBook,
            requestBook,
            approveRequest,
            rejectRequest,
            returnBook,
            confirmReturn,
            joinWaitlist,
            leaveWaitlist,
            rateUser,
            addBookRating,
            getWaitlistPosition,
            getWaitlistCount,
            requestReturn,
            confirmBorrowerReceipt,
            banUser,
            unbanUser,
            createOrganization,
            joinOrganization,
            addOrganizationBook,
            requestOrganizationBook,
            approveOrganizationRequest,
            rejectOrganizationRequest,
            markOrganizationBookPickedUp,
            markOrganizationBookReturned,
            sendMessage,
            getOrganizationMessages,
            getOrganizationMembers,
            getUserOrganizations,
            isOrganizationAdmin,
            isOrganizationMember,
            getMyActiveBorrows,
            // Transaction methods
            transactions,
            createBorrowTransaction,
            approveAndSchedulePickup,
            confirmPickup,
            initiateReturn,
            scheduleReturn,
            confirmTransactionReturn,
            cancelTransaction,
            getTransactionById,
            getActiveTransactionForBook,
            refreshData,
            refreshOrganizationData
        }}>
            {children}
        </DataContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);
