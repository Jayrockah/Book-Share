export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export class User {
    constructor({ id, name, city, profilePhoto = null, reputation = 0, borrowLimit = 3, isAdmin = false, isBanned = false }) {
        this.id = id || generateUUID();
        this.name = name;
        this.city = city;
        this.profilePhoto = profilePhoto;
        this.reputation = reputation;
        this.borrowLimit = borrowLimit;
        this.isAdmin = isAdmin;
        this.isBanned = isBanned;
    }
}

export class Book {
    constructor({ id, ownerId, title, author, genre, condition, coverUrl = null, notes = null, status = 'Available', dueDate = null, borrowerId = null, google_rating = null, google_rating_count = 0 }) {
        this.id = id || generateUUID();
        this.ownerId = ownerId;
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.condition = condition; // "New" | "Good" | "Worn"
        this.coverUrl = coverUrl;
        this.notes = notes;
        this.status = status; // "Available" | "Borrowed"
        this.dueDate = dueDate;
        this.borrowerId = borrowerId; // Current borrower's user ID
        this.google_rating = google_rating; // Google Books average rating (1-5) or null
        this.google_rating_count = google_rating_count; // Number of ratings
    }
}

export class BorrowRequest {
    constructor({ id, bookId, requesterId, ownerId, status = 'Pending', createdAt = new Date().toISOString(), approvedAt = null, returnedAt = null, returnRequested = false, returnRequestedAt = null, borrowerConfirmed = false, borrowerConfirmedAt = null }) {
        this.id = id || generateUUID();
        this.bookId = bookId;
        this.requesterId = requesterId;
        this.ownerId = ownerId;
        this.status = status; // "Pending" | "Approved" | "Rejected" | "ReturnedAndPendingConfirm" | "Returned" | "PendingBorrowerConfirmation"
        this.createdAt = createdAt;
        this.approvedAt = approvedAt; // When request was approved by owner
        this.returnedAt = returnedAt; // When book was returned
        this.returnRequested = returnRequested; // Whether owner has requested return
        this.returnRequestedAt = returnRequestedAt; // When return was requested
        this.borrowerConfirmed = borrowerConfirmed; // Whether borrower confirmed receipt
        this.borrowerConfirmedAt = borrowerConfirmedAt; // When borrower confirmed receipt
    }
}

export class WaitlistEntry {
    constructor({ id, bookId, userId, position, createdAt = new Date().toISOString() }) {
        this.id = id || generateUUID();
        this.bookId = bookId;
        this.userId = userId;
        this.position = position;
        this.createdAt = createdAt;
    }
}

export class Rating {
    constructor({ id, fromUserId, toUserId, rating, requestId = null, createdAt = new Date().toISOString() }) {
        this.id = id || generateUUID();
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.rating = rating; // 1 to 5
        this.requestId = requestId; // Links rating to specific borrow transaction
        this.createdAt = createdAt;
    }
}

export class BookRating {
    constructor({ id, bookId, userId, rating, review = null, createdAt = new Date().toISOString() }) {
        this.id = id || generateUUID();
        this.bookId = bookId;
        this.userId = userId;
        this.rating = rating; // 1 to 5
        this.review = review;
        this.createdAt = createdAt;
    }
}

export class OrganizationBookClub {
    constructor({ id, name, city, location, description, logoUrl = null, createdByUserId, createdAt = new Date().toISOString() }) {
        this.id = id || generateUUID();
        this.name = name;
        this.city = city;
        this.location = location; // Physical address
        this.description = description;
        this.logoUrl = logoUrl;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
    }
}

export class OrganizationMembership {
    constructor({ id, organizationId, userId, role = 'onlineMember', createdAt = new Date().toISOString() }) {
        this.id = id || generateUUID();
        this.organizationId = organizationId;
        this.userId = userId;
        this.role = role; // 'admin' | 'physicalMember' | 'onlineMember'
        this.createdAt = createdAt;
    }
}

export class OrganizationBook {
    constructor({ id, organizationId, title, author, genre, condition, stock = 1, coverUrl = null, createdAt = new Date().toISOString() }) {
        this.id = id || generateUUID();
        this.organizationId = organizationId;
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.condition = condition; // "New" | "Good" | "Worn"
        this.stock = stock; // Number of copies available
        this.coverUrl = coverUrl;
        this.createdAt = createdAt;
    }
}

export class OrganizationBorrowRequest {
    constructor({ id, organizationBookId, userId, status = 'Pending', createdAt = new Date().toISOString(), dueDate = null, pickedUpAt = null, returnedAt = null }) {
        this.id = id || generateUUID();
        this.organizationBookId = organizationBookId;
        this.userId = userId;
        this.status = status; // 'Pending' | 'Approved' | 'Rejected' | 'PickedUp' | 'Returned'
        this.createdAt = createdAt;
        this.dueDate = dueDate;
        this.pickedUpAt = pickedUpAt;
        this.returnedAt = returnedAt;
    }
}

export class BookclubMessage {
    constructor({ id, userId, content, organizationId = null, createdAt = new Date().toISOString() }) {
        this.id = id || generateUUID();
        this.userId = userId;
        this.content = content;
        this.organizationId = organizationId; // For organization chat rooms
        this.createdAt = createdAt;
    }
}

// ===== BORROW TRANSACTION SYSTEM =====

// Exchange methods
export const EXCHANGE_METHODS = {
    COURIER: 'COURIER',
    IN_PERSON: 'IN_PERSON',
    BOOKCLUB_MEETUP: 'BOOKCLUB_MEETUP',
    OTHER: 'OTHER'
};

// Contact methods
export const CONTACT_METHODS = {
    WHATSAPP: 'WHATSAPP',
    PHONE_CALL: 'PHONE_CALL',
    SMS: 'SMS',
    OTHER: 'OTHER'
};

// Transaction statuses
export const TRANSACTION_STATUS = {
    REQUESTED: 'REQUESTED',
    APPROVED: 'APPROVED', // Reserved for future use - currently transactions go directly to PICKUP_SCHEDULED
    PICKUP_SCHEDULED: 'PICKUP_SCHEDULED',
    BORROWING: 'BORROWING',
    RETURN_SCHEDULED: 'RETURN_SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    OVERDUE: 'OVERDUE' // Set automatically when a BORROWING transaction passes its due date
};

// User-friendly phase labels
export const getTransactionPhase = (status) => {
    switch (status) {
        case TRANSACTION_STATUS.REQUESTED:
            return { label: 'Waiting for Approval', color: '#d97706' };
        case TRANSACTION_STATUS.APPROVED:
        case TRANSACTION_STATUS.PICKUP_SCHEDULED:
            return { label: 'Pickup Pending', color: '#0284c7' };
        case TRANSACTION_STATUS.BORROWING:
        case TRANSACTION_STATUS.OVERDUE:
            return { label: 'Currently Borrowing', color: '#16a34a' };
        case TRANSACTION_STATUS.RETURN_SCHEDULED:
            return { label: 'Return Pending', color: '#8b5cf6' };
        case TRANSACTION_STATUS.COMPLETED:
            return { label: 'Completed', color: '#64748b' };
        case TRANSACTION_STATUS.CANCELLED:
            return { label: 'Cancelled', color: '#dc2626' };
        default:
            return { label: status, color: '#64748b' };
    }
};

// ExchangeRecord - plain object factory
export const createExchangeRecord = (data = {}) => ({
    method: data.method || null,
    locationText: data.locationText || '',
    scheduledAt: data.scheduledAt || null,
    completedAt: data.completedAt || null,
    borrowerConfirmed: data.borrowerConfirmed || false,
    ownerConfirmed: data.ownerConfirmed || false,
    note: data.note || '',
    contactMethod: data.contactMethod || null,
    contactValue: data.contactValue || '',
    issueFlag: data.issueFlag || false,
    issueNote: data.issueNote || ''
});

// BorrowTransaction class
export class BorrowTransaction {
    constructor({
        id,
        bookId,
        borrowerId,
        ownerId,
        status = TRANSACTION_STATUS.REQUESTED,
        createdAt = new Date().toISOString(),
        dueDate = null,
        pickupExchange = null,
        returnExchange = null
    }) {
        this.id = id || generateUUID();
        this.bookId = bookId;
        this.borrowerId = borrowerId;
        this.ownerId = ownerId;
        this.status = status;
        this.createdAt = createdAt;
        this.dueDate = dueDate;
        this.pickupExchange = pickupExchange || createExchangeRecord();
        this.returnExchange = returnExchange || createExchangeRecord();
    }
}
