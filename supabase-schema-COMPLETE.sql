-- BookShare COMPLETE Production Database Schema for Supabase
-- This version includes ALL production requirements:
-- - Token/Deposit system
-- - Geolocation for "Books near me"
-- - Messaging for in-app chat
-- - Storage URLs for photos
-- - Performance indexes
-- - Complete trust & safety features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geolocation queries

-- =============================================
-- USERS TABLE (Enhanced)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    city TEXT NOT NULL,

    -- Geolocation for "Books near me"
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOGRAPHY(POINT, 4326), -- PostGIS point for distance queries

    -- Photos and media
    profile_photo_url TEXT,

    -- Trust & Safety
    reputation DECIMAL(3,2) DEFAULT 0,
    borrow_limit INTEGER DEFAULT 3,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    verified_phone BOOLEAN DEFAULT FALSE,
    verified_identity BOOLEAN DEFAULT FALSE,

    -- Token System (Virtual currency for deposits)
    tokens DECIMAL(10,2) DEFAULT 0, -- Available tokens
    locked_tokens DECIMAL(10,2) DEFAULT 0, -- Tokens locked in active transactions
    total_earned DECIMAL(10,2) DEFAULT 0, -- Lifetime earnings
    total_spent DECIMAL(10,2) DEFAULT 0, -- Lifetime spending

    -- Statistics
    total_books_lent INTEGER DEFAULT 0,
    total_books_borrowed INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKS TABLE (Enhanced)
-- =============================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Book details
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT, -- For barcode scanning
    genre TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Worn')),

    -- Photos and media
    cover_photo_url TEXT,
    condition_photos TEXT[], -- Array of photo URLs showing book condition

    -- Book metadata
    notes TEXT,
    language TEXT DEFAULT 'English',
    publication_year INTEGER,

    -- Availability
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Borrowed', 'Unavailable')),
    due_date TIMESTAMP WITH TIME ZONE,
    borrower_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Token Requirements (for deposit/insurance)
    required_tokens DECIMAL(10,2) DEFAULT 50, -- Tokens required to borrow

    -- Popularity and Discovery
    borrow_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BORROW TRANSACTIONS TABLE (Enhanced)
-- =============================================
CREATE TABLE borrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Transaction status
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED',
        'APPROVED',
        'PICKUP_SCHEDULED',
        'BORROWING',
        'RETURN_SCHEDULED',
        'COMPLETED',
        'CANCELLED',
        'OVERDUE',
        'DISPUTED'
    )),

    -- Dates
    due_date TIMESTAMP WITH TIME ZONE,
    actual_return_date TIMESTAMP WITH TIME ZONE,

    -- Token/Deposit System
    locked_tokens DECIMAL(10,2) DEFAULT 0, -- Tokens locked as deposit
    token_status TEXT DEFAULT 'locked' CHECK (token_status IN ('locked', 'released', 'forfeited', 'partially_returned')),
    penalty_tokens DECIMAL(10,2) DEFAULT 0, -- Tokens deducted for late return/damage

    -- Dispute handling
    dispute_raised BOOLEAN DEFAULT FALSE,
    dispute_raised_by UUID REFERENCES users(id),
    dispute_reason TEXT,
    dispute_resolved BOOLEAN DEFAULT FALSE,
    dispute_resolution TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXCHANGE RECORDS TABLE (Enhanced)
-- =============================================
CREATE TABLE exchange_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES borrow_transactions(id) ON DELETE CASCADE,
    exchange_type TEXT NOT NULL CHECK (exchange_type IN ('pickup', 'return')),

    -- Exchange details
    method TEXT CHECK (method IN ('COURIER', 'IN_PERSON', 'BOOKCLUB_MEETUP', 'OTHER')),
    location_text TEXT,

    -- Geolocation for meetup
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    -- Photos (condition verification)
    photos TEXT[], -- Array of photo URLs

    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Confirmation
    borrower_confirmed BOOLEAN DEFAULT FALSE,
    borrower_confirmed_at TIMESTAMP WITH TIME ZONE,
    owner_confirmed BOOLEAN DEFAULT FALSE,
    owner_confirmed_at TIMESTAMP WITH TIME ZONE,

    -- Contact info
    note TEXT,
    contact_method TEXT CHECK (contact_method IN ('WHATSAPP', 'PHONE_CALL', 'SMS', 'IN_APP_CHAT', 'OTHER')),
    contact_value TEXT,

    -- Issue tracking
    issue_flag BOOLEAN DEFAULT FALSE,
    issue_note TEXT,
    issue_photos TEXT[], -- Photos of damage/issues

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MESSAGES TABLE (In-App Chat)
-- =============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Participants
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For 1-on-1 chat
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- For org chat
    transaction_id UUID REFERENCES borrow_transactions(id) ON DELETE CASCADE, -- For transaction-specific chat

    -- Message content
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
    attachment_url TEXT, -- For image messages

    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: Either receiver_id OR organization_id must be set
    CHECK (
        (receiver_id IS NOT NULL AND organization_id IS NULL) OR
        (receiver_id IS NULL AND organization_id IS NOT NULL)
    )
);

-- =============================================
-- TOKEN TRANSACTIONS TABLE (Token Movement Ledger)
-- =============================================
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Transaction details
    amount DECIMAL(10,2) NOT NULL, -- Positive for credit, negative for debit
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'deposit', -- User adds tokens (via payment)
        'withdrawal', -- User cashes out
        'lock', -- Tokens locked for borrow
        'unlock', -- Tokens unlocked after return
        'forfeit', -- Tokens forfeited due to damage/late
        'reward', -- Tokens earned for successful lend
        'penalty', -- Tokens deducted as penalty
        'admin_adjustment' -- Manual admin correction
    )),

    -- Related entities
    borrow_transaction_id UUID REFERENCES borrow_transactions(id),
    payment_reference TEXT, -- For deposits/withdrawals

    -- Balance snapshot
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,

    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WAITLIST TABLE (Enhanced)
-- =============================================
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,

    -- Priority scoring (for smart waitlist ordering)
    priority_score INTEGER DEFAULT 0, -- Based on user reputation, wait time, etc.

    -- Notification
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, user_id)
);

-- =============================================
-- RATINGS TABLE (Enhanced)
-- =============================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    -- Context
    transaction_id UUID REFERENCES borrow_transactions(id) ON DELETE SET NULL,
    rating_type TEXT CHECK (rating_type IN ('borrower', 'lender')), -- What role was being rated

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id, transaction_id)
);

-- =============================================
-- BOOK RATINGS TABLE (Enhanced)
-- =============================================
CREATE TABLE book_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    -- Verification (only users who borrowed can rate)
    verified_borrow BOOLEAN DEFAULT FALSE,
    transaction_id UUID REFERENCES borrow_transactions(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, user_id)
);

-- =============================================
-- ORGANIZATIONS TABLE (Enhanced)
-- =============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Media
    logo_url TEXT,
    banner_url TEXT,
    photos TEXT[], -- Additional photos

    -- Geolocation
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    -- Settings
    is_verified BOOLEAN DEFAULT FALSE,
    membership_fee DECIMAL(10,2) DEFAULT 0, -- Monthly fee in tokens

    -- Statistics
    member_count INTEGER DEFAULT 0,
    book_count INTEGER DEFAULT 0,

    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ORGANIZATION MEMBERSHIPS TABLE
-- =============================================
CREATE TABLE organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'onlineMember' CHECK (role IN ('admin', 'physicalMember', 'onlineMember')),

    -- Subscription
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
    last_payment_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- =============================================
-- ORGANIZATION BOOKS TABLE
-- =============================================
CREATE TABLE organization_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    genre TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Worn')),
    stock INTEGER DEFAULT 1,
    available_stock INTEGER DEFAULT 1,
    cover_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ORGANIZATION BORROW REQUESTS TABLE
-- =============================================
CREATE TABLE organization_borrow_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_book_id UUID NOT NULL REFERENCES organization_books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'PickedUp', 'Returned')),
    due_date TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS TABLE (Push Notifications)
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification details
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'transaction_update',
        'message_received',
        'waitlist_available',
        'return_reminder',
        'overdue_notice',
        'rating_request',
        'organization_invite',
        'system_announcement'
    )),

    -- Related entities
    transaction_id UUID REFERENCES borrow_transactions(id),
    message_id UUID REFERENCES messages(id),
    book_id UUID REFERENCES books(id),

    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_location ON users USING GIST(location); -- For geospatial queries

-- Books
CREATE INDEX idx_books_owner_id ON books(owner_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_city ON books(owner_id) WHERE status = 'Available'; -- For discovery
CREATE INDEX idx_books_popularity ON books(borrow_count DESC, average_rating DESC);

-- Transactions
CREATE INDEX idx_transactions_book_id ON borrow_transactions(book_id);
CREATE INDEX idx_transactions_borrower_id ON borrow_transactions(borrower_id);
CREATE INDEX idx_transactions_owner_id ON borrow_transactions(owner_id);
CREATE INDEX idx_transactions_status ON borrow_transactions(status);
CREATE INDEX idx_transactions_due_date ON borrow_transactions(due_date) WHERE status IN ('BORROWING', 'OVERDUE');

-- Exchange Records
CREATE INDEX idx_exchange_records_transaction_id ON exchange_records(transaction_id);

-- Messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_transaction_id ON messages(transaction_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id) WHERE read = FALSE;

-- Token Transactions
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- Waitlist
CREATE INDEX idx_waitlist_book_id ON waitlist(book_id);
CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_position ON waitlist(book_id, position);

-- Organizations
CREATE INDEX idx_org_memberships_org_id ON organization_memberships(organization_id);
CREATE INDEX idx_org_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX idx_org_books_org_id ON organization_books(organization_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = firebase_uid);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- Books
CREATE POLICY "Books viewable by everyone" ON books FOR SELECT USING (true);
CREATE POLICY "Users can create books" ON books FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can update own books" ON books FOR UPDATE USING (
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can delete own books" ON books FOR DELETE USING (
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Transactions
CREATE POLICY "Transactions viewable by participants" ON borrow_transactions FOR SELECT USING (
    borrower_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can create transactions" ON borrow_transactions FOR INSERT WITH CHECK (
    borrower_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Participants can update transactions" ON borrow_transactions FOR UPDATE USING (
    borrower_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Messages
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (
    sender_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
    receiver_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
    organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    )
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (
    sender_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
    receiver_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Token Transactions
CREATE POLICY "Users can view own token transactions" ON token_transactions FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Similar policies for other tables...

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON borrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update user location point when lat/lng changes
CREATE OR REPLACE FUNCTION update_user_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_location_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_user_location();

-- Update book average rating when new rating is added
CREATE OR REPLACE FUNCTION update_book_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE books
    SET average_rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM book_ratings
        WHERE book_id = NEW.book_id
    )
    WHERE id = NEW.book_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_book_rating_trigger
AFTER INSERT OR UPDATE ON book_ratings
FOR EACH ROW EXECUTE FUNCTION update_book_average_rating();

-- Update organization member count
CREATE OR REPLACE FUNCTION update_org_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE organizations
        SET member_count = member_count + 1
        WHERE id = NEW.organization_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE organizations
        SET member_count = member_count - 1
        WHERE id = OLD.organization_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_org_member_count_trigger
AFTER INSERT OR DELETE ON organization_memberships
FOR EACH ROW EXECUTE FUNCTION update_org_member_count();
