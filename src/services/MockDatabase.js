import { User, Book, BorrowRequest, WaitlistEntry, Rating, BookRating, OrganizationBookClub, OrganizationMembership, OrganizationBook, OrganizationBorrowRequest, BookclubMessage, BorrowTransaction, createExchangeRecord, TRANSACTION_STATUS, generateUUID } from '../models/index';
import { createSeedData } from './SeedData';

const STORAGE_KEY = 'book_share_db_v5';

class MockDatabase {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return this.seedData();
    }

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    seedData() {
        const { users, books } = createSeedData();

        // Create sample organizations
        const organizations = [
            new OrganizationBookClub({
                id: generateUUID(),
                name: 'Lagos Literary Circle',
                city: 'Lagos',
                location: '15 Awolowo Road, Ikoyi, Lagos',
                description: 'A vibrant community of book lovers meeting weekly to discuss African literature, contemporary fiction, and classic novels. All are welcome!',
                logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=lagos',
                createdByUserId: users[0].id
            }),
            new OrganizationBookClub({
                id: generateUUID(),
                name: 'Abuja Readers Hub',
                city: 'Abuja',
                location: '23 Gana Street, Maitama, Abuja',
                description: 'Join us for monthly book discussions, author meet-and-greets, and literary events in the heart of Abuja.',
                logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=abuja',
                createdByUserId: users[1].id
            }),
            new OrganizationBookClub({
                id: generateUUID(),
                name: 'Port Harcourt Book Club',
                city: 'Port Harcourt',
                location: '8 Aba Road, Port Harcourt',
                description: 'Celebrating Nigerian authors and global literature. Weekly meetings every Saturday at 4 PM.',
                logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=portharcourt',
                createdByUserId: users[2].id
            })
        ];

        // Create memberships (creators are admins)
        const organizationMemberships = [
            new OrganizationMembership({
                organizationId: organizations[0].id,
                userId: users[0].id,
                role: 'admin'
            }),
            new OrganizationMembership({
                organizationId: organizations[0].id,
                userId: users[3].id,
                role: 'physicalMember'
            }),
            new OrganizationMembership({
                organizationId: organizations[0].id,
                userId: users[4].id,
                role: 'onlineMember'
            }),
            new OrganizationMembership({
                organizationId: organizations[1].id,
                userId: users[1].id,
                role: 'admin'
            }),
            new OrganizationMembership({
                organizationId: organizations[1].id,
                userId: users[5].id,
                role: 'physicalMember'
            }),
            new OrganizationMembership({
                organizationId: organizations[2].id,
                userId: users[2].id,
                role: 'admin'
            })
        ];

        // Create organization books
        const organizationBooks = [
            new OrganizationBook({
                organizationId: organizations[0].id,
                title: 'Things Fall Apart',
                author: 'Chinua Achebe',
                genre: 'Classic',
                condition: 'Good',
                stock: 3,
                coverPhoto: 'https://covers.openlibrary.org/b/id/8228691-L.jpg'
            }),
            new OrganizationBook({
                organizationId: organizations[0].id,
                title: 'Half of a Yellow Sun',
                author: 'Chimamanda Ngozi Adichie',
                genre: 'Historical Fiction',
                condition: 'New',
                stock: 2,
                coverPhoto: 'https://covers.openlibrary.org/b/id/8235553-L.jpg'
            }),
            new OrganizationBook({
                organizationId: organizations[0].id,
                title: 'Americanah',
                author: 'Chimamanda Ngozi Adichie',
                genre: 'Contemporary',
                condition: 'Good',
                stock: 2,
                coverPhoto: 'https://covers.openlibrary.org/b/id/7895134-L.jpg'
            }),
            new OrganizationBook({
                organizationId: organizations[1].id,
                title: 'Purple Hibiscus',
                author: 'Chimamanda Ngozi Adichie',
                genre: 'Fiction',
                condition: 'New',
                stock: 4,
                coverPhoto: 'https://covers.openlibrary.org/b/id/8235554-L.jpg'
            }),
            new OrganizationBook({
                organizationId: organizations[1].id,
                title: 'The Famished Road',
                author: 'Ben Okri',
                genre: 'Magical Realism',
                condition: 'Good',
                stock: 1,
                coverPhoto: 'https://covers.openlibrary.org/b/id/8228692-L.jpg'
            }),
            new OrganizationBook({
                organizationId: organizations[2].id,
                title: 'Homegoing',
                author: 'Yaa Gyasi',
                genre: 'Historical Fiction',
                condition: 'New',
                stock: 3,
                coverPhoto: 'https://covers.openlibrary.org/b/id/8451651-L.jpg'
            })
        ];

        return {
            users,
            books,
            requests: [],
            waitlist: [],
            ratings: [],
            bookRatings: [],
            organizations,
            organizationMemberships,
            organizationBooks,
            organizationRequests: [],
            messages: [],
            transactions: []
        };
    }

    save() {
        this.saveData();
    }

    // --- User Operations ---
    getUsers() {
        return this.data.users;
    }

    getUserById(id) {
        return this.data.users.find(u => u.id === id);
    }

    // --- Book Operations ---
    getBooks() {
        return this.data.books;
    }

    addBook(bookData) {
        const newBook = new Book(bookData);
        this.data.books.push(newBook);
        this.saveData();
        return newBook;
    }

    updateBookStatus(bookId, status, dueDate = null) {
        const book = this.data.books.find(b => b.id === bookId);
        if (book) {
            book.status = status;
            book.dueDate = dueDate;
            this.saveData();
        }
    }

    // --- Request Operations ---
    createRequest(requestData) {
        const newRequest = new BorrowRequest(requestData);
        this.data.requests.push(newRequest);
        this.saveData();
        return newRequest;
    }

    getRequestsForUser(userId) {
        return this.data.requests.filter(r => r.requesterId === userId || r.ownerId === userId);
    }

    updateRequestStatus(requestId, status) {
        const request = this.data.requests.find(r => r.id === requestId);
        if (request) {
            request.status = status;

            // Side effects based on status
            if (status === 'Approved') {
                request.approvedAt = new Date().toISOString();
                // Don't update book status yet - wait for borrower confirmation
                request.status = 'PendingBorrowerConfirmation';
            } else if (status === 'ReturnedAndPendingConfirm') {
                request.returnedAt = new Date().toISOString();
                // Book status remains 'Borrowed' until owner confirms
            } else if (status === 'Returned') {
                // Confirmed return - book becomes available again
                const book = this.data.books.find(b => b.id === request.bookId);
                if (book) {
                    book.status = 'Available';
                    book.dueDate = null;
                    book.borrowerId = null;
                }
                this.processWaitlist(request.bookId);
            }

            this.saveData();
        }
    }

    // --- Waitlist Operations ---
    joinWaitlist(bookId, userId) {
        // Check if user is already in waitlist
        const existing = this.data.waitlist.find(w => w.bookId === bookId && w.userId === userId);
        if (existing) return null;

        const queue = this.data.waitlist.filter(w => w.bookId === bookId);
        const position = queue.length + 1;
        const entry = new WaitlistEntry({ bookId, userId, position });
        this.data.waitlist.push(entry);
        this.saveData();
        return entry;
    }

    getWaitlistForBook(bookId) {
        return this.data.waitlist
            .filter(w => w.bookId === bookId)
            .sort((a, b) => a.position - b.position);
    }

    getWaitlistPosition(bookId, userId) {
        const entry = this.data.waitlist.find(w => w.bookId === bookId && w.userId === userId);
        return entry ? entry.position : null;
    }

    removeFromWaitlist(bookId, userId) {
        const index = this.data.waitlist.findIndex(w => w.bookId === bookId && w.userId === userId);
        if (index !== -1) {
            this.data.waitlist.splice(index, 1);
            // Reorder positions for remaining users
            const remaining = this.data.waitlist.filter(w => w.bookId === bookId);
            remaining.sort((a, b) => a.position - b.position);
            remaining.forEach((entry, idx) => {
                entry.position = idx + 1;
            });
            this.saveData();
        }
    }

    processWaitlist(bookId) {
        const queue = this.data.waitlist
            .filter(w => w.bookId === bookId)
            .sort((a, b) => a.position - b.position);

        if (queue.length > 0) {
            // In a real app, we'd send a notification to queue[0].userId
            // For now, we'll just log and keep them at position 1
            console.log(`User ${queue[0].userId} is next in line for book ${bookId}`);
            // The user at position 1 can now request the book
        }
    }

    // --- Rating Operations ---
    addRating(ratingData) {
        const rating = new Rating(ratingData);
        this.data.ratings.push(rating);

        // Update user reputation
        const userRatings = this.data.ratings.filter(r => r.toUserId === ratingData.toUserId);
        const total = userRatings.reduce((sum, r) => sum + r.rating, 0);
        const user = this.getUserById(ratingData.toUserId);
        if (user) {
            user.reputation = parseFloat((total / userRatings.length).toFixed(1));
        }

        this.saveData();
        return rating;
    }

    hasUserRatedInRequest(fromUserId, toUserId, requestId) {
        return this.data.ratings.some(
            r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.requestId === requestId
        );
    }

    // --- Book Rating Operations ---
    addBookRating(bookRatingData) {
        const bookRating = new BookRating(bookRatingData);
        this.data.bookRatings.push(bookRating);
        this.saveData();
        return bookRating;
    }

    getBookRatings(bookId) {
        return this.data.bookRatings.filter(r => r.bookId === bookId);
    }

    getBookAverageRating(bookId) {
        const ratings = this.getBookRatings(bookId);
        if (ratings.length === 0) return null;
        const total = ratings.reduce((sum, r) => sum + r.rating, 0);
        return (total / ratings.length).toFixed(1);
    }

    hasUserRatedBook(userId, bookId) {
        return this.data.bookRatings.some(r => r.userId === userId && r.bookId === bookId);
    }

    // --- Borrow Limit Operations ---
    getUserActiveBorrows(userId) {
        return this.data.requests.filter(
            r => r.requesterId === userId && (r.status === 'Approved' || r.status === 'ReturnedAndPendingConfirm')
        ).length;
    }

    canUserBorrow(userId) {
        const user = this.getUserById(userId);
        if (!user) return false;
        const activeBorrows = this.getUserActiveBorrows(userId);
        return activeBorrows < user.borrowLimit;
    }

    // --- Request Return Operations ---
    requestReturn(requestId) {
        const request = this.data.requests.find(r => r.id === requestId);
        if (request && request.status === 'Approved') {
            request.returnRequested = true;
            request.returnRequestedAt = new Date().toISOString();
            this.saveData();
            return true;
        }
        return false;
    }

    // --- Borrower Confirmation ---
    confirmBorrowerReceipt(requestId) {
        const request = this.data.requests.find(r => r.id === requestId);
        if (request && request.status === 'PendingBorrowerConfirmation') {
            request.borrowerConfirmed = true;
            request.borrowerConfirmedAt = new Date().toISOString();
            request.status = 'Approved';

            // Now update book status to Borrowed with due date
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7); // 7 days loan period

            const book = this.data.books.find(b => b.id === request.bookId);
            if (book) {
                book.status = 'Borrowed';
                book.dueDate = dueDate.toISOString();
                book.borrowerId = request.requesterId;
            }
            this.saveData();
            return true;
        }
        return false;
    }

    // --- Admin Operations ---
    banUser(userId) {
        const user = this.getUserById(userId);
        if (user && !user.isAdmin) {
            user.isBanned = true;
            this.saveData();
            return true;
        }
        return false;
    }

    unbanUser(userId) {
        const user = this.getUserById(userId);
        if (user) {
            user.isBanned = false;
            this.saveData();
            return true;
        }
        return false;
    }

    getAllRequests() {
        return this.data.requests;
    }

    getUserStatistics() {
        const totalUsers = this.data.users.length;
        const totalBooks = this.data.books.length;
        const activeRequests = this.data.requests.filter(r => r.status === 'Approved' || r.status === 'ReturnedAndPendingConfirm');
        const activeBorrows = activeRequests.length;

        const now = new Date();
        const overdueBooks = activeRequests.filter(r => {
            const book = this.data.books.find(b => b.id === r.bookId);
            return book && book.dueDate && new Date(book.dueDate) < now;
        });

        return {
            totalUsers,
            totalBooks,
            activeBorrows,
            overdueCount: overdueBooks.length,
            overdueBooks: overdueBooks.map(r => {
                const book = this.data.books.find(b => b.id === r.bookId);
                const borrower = this.getUserById(r.requesterId);
                const owner = this.getUserById(r.ownerId);
                return {
                    request: r,
                    book,
                    borrower,
                    owner
                };
            })
        };
    }

    // ===== ORGANIZATION METHODS =====

    // Organization CRUD
    createOrganization(data) {
        const organization = new OrganizationBookClub(data);
        this.data.organizations.push(organization);

        // Automatically add creator as admin
        const membership = new OrganizationMembership({
            organizationId: organization.id,
            userId: data.createdByUserId,
            role: 'admin'
        });
        this.data.organizationMemberships.push(membership);

        this.saveData();
        return organization;
    }

    getOrganizations() {
        return this.data.organizations || [];
    }

    getOrganizationById(id) {
        return (this.data.organizations || []).find(org => org.id === id);
    }

    getOrganizationsByCity(city) {
        return this.data.organizations.filter(org => org.city === city);
    }

    updateOrganization(id, updates) {
        const org = this.data.organizations.find(o => o.id === id);
        if (org) {
            Object.assign(org, updates);
            this.saveData();
            return true;
        }
        return false;
    }

    // Membership Management
    addOrganizationMember(organizationId, userId, role = 'onlineMember') {
        if (!this.data.organizationMemberships) this.data.organizationMemberships = [];

        // Check if already member
        const existing = this.data.organizationMemberships.find(
            m => m.organizationId === organizationId && m.userId === userId
        );

        if (existing) return null;

        const membership = {
            id: this.generateUUID(),
            organizationId,
            userId,
            role,
            joinedAt: new Date().toISOString()
        };

        this.data.organizationMemberships.push(membership);
        this.saveData();
        return membership;
    }

    getOrganizationMembers(organizationId) {
        return (this.data.organizationMemberships || []).filter(m => m.organizationId === organizationId);
    }

    getUserOrganizations(userId) {
        const memberships = (this.data.organizationMemberships || []).filter(m => m.userId === userId);
        return memberships.map(m => {
            const org = this.getOrganizationById(m.organizationId);
            if (!org) return null;
            return { ...org, membershipRole: m.role, membershipId: m.id };
        }).filter(Boolean);
    }

    isOrganizationMember(organizationId, userId) {
        return (this.data.organizationMemberships || []).some(
            m => m.organizationId === organizationId && m.userId === userId
        );
    }

    isOrganizationAdmin(organizationId, userId) {
        return (this.data.organizationMemberships || []).some(
            m => m.organizationId === organizationId && m.userId === userId && m.role === 'admin'
        );
    }

    updateMemberRole(membershipId, role) {
        const membership = (this.data.organizationMemberships || []).find(m => m.id === membershipId);
        if (membership) {
            membership.role = role;
            this.saveData();
            return true;
        }
        return false;
    }

    removeMember(membershipId) {
        const index = this.data.organizationMemberships.findIndex(m => m.id === membershipId);
        if (index !== -1) {
            this.data.organizationMemberships.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Organization Book Catalog
    addOrganizationBook(organizationId, bookData) {
        const book = new OrganizationBook({
            ...bookData,
            organizationId
        });
        this.data.organizationBooks.push(book);
        this.saveData();
        return book;
    }

    getOrganizationBooks(organizationId) {
        return this.data.organizationBooks.filter(b => b.organizationId === organizationId);
    }

    getOrganizationBookById(bookId) {
        return this.data.organizationBooks.find(b => b.id === bookId);
    }

    updateOrganizationBook(bookId, updates) {
        const book = this.data.organizationBooks.find(b => b.id === bookId);
        if (book) {
            Object.assign(book, updates);
            this.saveData();
            return true;
        }
        return false;
    }

    deleteOrganizationBook(bookId) {
        const index = this.data.organizationBooks.findIndex(b => b.id === bookId);
        if (index !== -1) {
            this.data.organizationBooks.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Organization Borrow Requests
    createOrganizationBorrowRequest(organizationBookId, userId) {
        const book = this.getOrganizationBookById(organizationBookId);
        if (!book || book.stock <= 0) return null;

        const request = new OrganizationBorrowRequest({
            organizationBookId,
            userId
        });
        this.data.organizationRequests.push(request);
        this.saveData();
        return request;
    }

    getOrganizationRequests(organizationId) {
        const orgBooks = this.getOrganizationBooks(organizationId);
        const bookIds = orgBooks.map(b => b.id);
        return this.data.organizationRequests.filter(r => bookIds.includes(r.organizationBookId));
    }

    getUserOrganizationRequests(userId) {
        return this.data.organizationRequests.filter(r => r.userId === userId);
    }

    approveOrganizationRequest(requestId, dueDate) {
        const request = this.data.organizationRequests.find(r => r.id === requestId);
        if (!request || request.status !== 'Pending') return false;

        const book = this.getOrganizationBookById(request.organizationBookId);
        if (!book || book.stock <= 0) return false;

        request.status = 'Approved';
        request.dueDate = dueDate;
        book.stock--;

        this.saveData();
        return true;
    }

    rejectOrganizationRequest(requestId) {
        const request = this.data.organizationRequests.find(r => r.id === requestId);
        if (!request || request.status !== 'Pending') return false;

        request.status = 'Rejected';
        this.saveData();
        return true;
    }

    markBookPickedUp(requestId) {
        const request = this.data.organizationRequests.find(r => r.id === requestId);
        if (!request || request.status !== 'Approved') return false;

        request.status = 'PickedUp';
        request.pickedUpAt = new Date().toISOString();
        this.saveData();
        return true;
    }

    markBookReturned(requestId) {
        const request = this.data.organizationRequests.find(r => r.id === requestId);
        if (!request || (request.status !== 'PickedUp' && request.status !== 'Approved')) return false;

        const book = this.getOrganizationBookById(request.organizationBookId);
        if (book) {
            book.stock++;
        }

        request.status = 'Returned';
        request.returnedAt = new Date().toISOString();
        this.saveData();
        return true;
    }

    // Chat Messages
    addMessage(userId, content, organizationId = null) {
        const message = new BookclubMessage({
            userId,
            content,
            organizationId
        });
        this.data.messages.push(message);
        this.saveData();
        return message;
    }

    getOrganizationMessages(organizationId) {
        return this.data.messages.filter(m => m.organizationId === organizationId);
    }

    getAllMessages() {
        return this.data.messages.filter(m => !m.organizationId); // General bookclub messages
    }

    // ===== BORROW TRANSACTION METHODS =====

    ensureTransactions() {
        if (!this.data.transactions) {
            this.data.transactions = [];
        }
    }

    getTransactions() {
        this.ensureTransactions();
        return this.data.transactions;
    }

    getTransactionById(transactionId) {
        this.ensureTransactions();
        return this.data.transactions.find(t => t.id === transactionId);
    }

    getTransactionsForUser(userId) {
        this.ensureTransactions();
        return this.data.transactions.filter(t => t.borrowerId === userId || t.ownerId === userId);
    }

    getActiveTransactionForBook(bookId) {
        this.ensureTransactions();
        return this.data.transactions.find(t =>
            t.bookId === bookId &&
            ![TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.CANCELLED].includes(t.status)
        );
    }

    createTransaction(data) {
        this.ensureTransactions();
        const transaction = new BorrowTransaction({
            bookId: data.bookId,
            borrowerId: data.borrowerId,
            ownerId: data.ownerId,
            pickupExchange: createExchangeRecord({
                method: data.method,
                note: data.note,
                contactMethod: data.contactMethod,
                contactValue: data.contactValue
            })
        });
        this.data.transactions.push(transaction);
        this.saveData();
        return transaction;
    }

    approveAndSchedulePickup(transactionId, pickupDetails) {
        const transaction = this.getTransactionById(transactionId);
        if (!transaction) return null;

        transaction.status = TRANSACTION_STATUS.PICKUP_SCHEDULED;
        transaction.pickupExchange.method = pickupDetails.method || transaction.pickupExchange.method;
        transaction.pickupExchange.locationText = pickupDetails.locationText;
        transaction.pickupExchange.scheduledAt = pickupDetails.scheduledAt;
        transaction.pickupExchange.note = pickupDetails.note || transaction.pickupExchange.note;

        this.saveData();
        return transaction;
    }

    confirmPickup(transactionId, userId, role) {
        const transaction = this.getTransactionById(transactionId);
        if (!transaction) return null;

        if (role === 'borrower') {
            transaction.pickupExchange.borrowerConfirmed = true;
        } else if (role === 'owner') {
            transaction.pickupExchange.ownerConfirmed = true;
        }

        if (transaction.pickupExchange.borrowerConfirmed && transaction.pickupExchange.ownerConfirmed) {
            transaction.pickupExchange.completedAt = new Date().toISOString();
            transaction.status = TRANSACTION_STATUS.BORROWING;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            transaction.dueDate = dueDate.toISOString();

            const book = this.data.books.find(b => b.id === transaction.bookId);
            if (book) {
                book.status = 'Borrowed';
                book.borrowerId = transaction.borrowerId;
                book.dueDate = transaction.dueDate;
            }
        }

        this.saveData();
        return transaction;
    }

    initiateReturn(transactionId, returnDetails) {
        const transaction = this.getTransactionById(transactionId);
        if (!transaction) return null;

        transaction.returnExchange = createExchangeRecord({
            method: returnDetails.method,
            note: returnDetails.note,
            contactMethod: returnDetails.contactMethod || transaction.pickupExchange.contactMethod,
            contactValue: returnDetails.contactValue || transaction.pickupExchange.contactValue
        });

        this.saveData();
        return transaction;
    }

    scheduleReturn(transactionId, returnDetails) {
        const transaction = this.getTransactionById(transactionId);
        if (!transaction) return null;

        transaction.status = TRANSACTION_STATUS.RETURN_SCHEDULED;
        transaction.returnExchange.method = returnDetails.method || transaction.returnExchange.method;
        transaction.returnExchange.locationText = returnDetails.locationText;
        transaction.returnExchange.scheduledAt = returnDetails.scheduledAt;
        transaction.returnExchange.note = returnDetails.note || transaction.returnExchange.note;

        this.saveData();
        return transaction;
    }

    confirmReturn(transactionId, userId, role) {
        const transaction = this.getTransactionById(transactionId);
        if (!transaction) return null;

        if (role === 'borrower') {
            transaction.returnExchange.borrowerConfirmed = true;
        } else if (role === 'owner') {
            transaction.returnExchange.ownerConfirmed = true;
        }

        if (transaction.returnExchange.borrowerConfirmed && transaction.returnExchange.ownerConfirmed) {
            transaction.returnExchange.completedAt = new Date().toISOString();
            transaction.status = TRANSACTION_STATUS.COMPLETED;

            const book = this.data.books.find(b => b.id === transaction.bookId);
            if (book) {
                book.status = 'Available';
                book.borrowerId = null;
                book.dueDate = null;
            }
        }

        this.saveData();
        return transaction;
    }

    reportExchangeIssue(transactionId, exchangeType, issueNote) {
        const transaction = this.getTransactionById(transactionId);
        if (!transaction) return null;

        if (exchangeType === 'pickup') {
            transaction.pickupExchange.issueFlag = true;
            transaction.pickupExchange.issueNote = issueNote;
        } else if (exchangeType === 'return') {
            transaction.returnExchange.issueFlag = true;
            transaction.returnExchange.issueNote = issueNote;
        }

        this.saveData();
        return transaction;
    }

    cancelTransaction(transactionId) {
        const transaction = this.getTransactionById(transactionId);
        if (!transaction) return null;

        const wasInBorrowing = transaction.status === TRANSACTION_STATUS.BORROWING;
        transaction.status = TRANSACTION_STATUS.CANCELLED;

        if (wasInBorrowing) {
            const book = this.data.books.find(b => b.id === transaction.bookId);
            if (book) {
                book.status = 'Available';
                book.borrowerId = null;
                book.dueDate = null;
            }
        }

        this.saveData();
        return transaction;
    }
}

export const db = new MockDatabase();
