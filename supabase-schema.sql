-- BookShare Database Schema for Supabase
-- Run this in your Supabase SQL editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT,
    city TEXT NOT NULL,
    profile_photo TEXT,
    reputation DECIMAL(3,2) DEFAULT 0,
    borrow_limit INTEGER DEFAULT 3,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKS TABLE
-- =============================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Worn')),
    cover_photo TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Borrowed')),
    due_date TIMESTAMP WITH TIME ZONE,
    borrower_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BORROW TRANSACTIONS TABLE
-- =============================================
CREATE TABLE borrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'BORROWING', 'RETURN_SCHEDULED', 'COMPLETED', 'CANCELLED', 'OVERDUE')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXCHANGE RECORDS TABLE (for pickup and return)
-- =============================================
CREATE TABLE exchange_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES borrow_transactions(id) ON DELETE CASCADE,
    exchange_type TEXT NOT NULL CHECK (exchange_type IN ('pickup', 'return')),
    method TEXT CHECK (method IN ('COURIER', 'IN_PERSON', 'BOOKCLUB_MEETUP', 'OTHER')),
    location_text TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    borrower_confirmed BOOLEAN DEFAULT FALSE,
    owner_confirmed BOOLEAN DEFAULT FALSE,
    note TEXT,
    contact_method TEXT CHECK (contact_method IN ('WHATSAPP', 'PHONE_CALL', 'SMS', 'OTHER')),
    contact_value TEXT,
    issue_flag BOOLEAN DEFAULT FALSE,
    issue_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WAITLIST TABLE
-- =============================================
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, user_id)
);

-- =============================================
-- RATINGS TABLE (user-to-user ratings)
-- =============================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    transaction_id UUID REFERENCES borrow_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id, transaction_id)
);

-- =============================================
-- BOOK RATINGS TABLE
-- =============================================
CREATE TABLE book_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, user_id)
);

-- =============================================
-- ORGANIZATIONS TABLE
-- =============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
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
    genre TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Worn')),
    stock INTEGER DEFAULT 1,
    cover_photo TEXT,
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
-- MESSAGES TABLE (for organization chat)
-- =============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- LEGACY BORROW REQUESTS TABLE (keep for migration)
-- =============================================
CREATE TABLE borrow_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'ReturnedAndPendingConfirm', 'Returned', 'PendingBorrowerConfirmation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    return_requested BOOLEAN DEFAULT FALSE,
    return_requested_at TIMESTAMP WITH TIME ZONE,
    borrower_confirmed BOOLEAN DEFAULT FALSE,
    borrower_confirmed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_books_owner_id ON books(owner_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_transactions_book_id ON borrow_transactions(book_id);
CREATE INDEX idx_transactions_borrower_id ON borrow_transactions(borrower_id);
CREATE INDEX idx_transactions_owner_id ON borrow_transactions(owner_id);
CREATE INDEX idx_transactions_status ON borrow_transactions(status);
CREATE INDEX idx_exchange_records_transaction_id ON exchange_records(transaction_id);
CREATE INDEX idx_waitlist_book_id ON waitlist(book_id);
CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_org_memberships_org_id ON organization_memberships(organization_id);
CREATE INDEX idx_org_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX idx_messages_org_id ON messages(organization_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, users can update their own profile
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = firebase_uid);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- Books: Everyone can read, owners can CRUD their own books
CREATE POLICY "Books are viewable by everyone" ON books FOR SELECT USING (true);
CREATE POLICY "Users can create their own books" ON books FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can update their own books" ON books FOR UPDATE USING (
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can delete their own books" ON books FOR DELETE USING (
    owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Transactions: Viewable by borrower and owner, created by borrower
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

-- Exchange Records: Viewable and updatable by transaction participants
CREATE POLICY "Exchange records viewable by transaction participants" ON exchange_records FOR SELECT USING (
    transaction_id IN (
        SELECT id FROM borrow_transactions WHERE
        borrower_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
        owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    )
);
CREATE POLICY "Exchange records insertable by transaction participants" ON exchange_records FOR INSERT WITH CHECK (
    transaction_id IN (
        SELECT id FROM borrow_transactions WHERE
        borrower_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
        owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    )
);
CREATE POLICY "Exchange records updatable by transaction participants" ON exchange_records FOR UPDATE USING (
    transaction_id IN (
        SELECT id FROM borrow_transactions WHERE
        borrower_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
        owner_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    )
);

-- Waitlist: Users can manage their own waitlist entries
CREATE POLICY "Waitlist viewable by everyone" ON waitlist FOR SELECT USING (true);
CREATE POLICY "Users can add themselves to waitlist" ON waitlist FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can remove themselves from waitlist" ON waitlist FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Ratings: Users can create ratings, everyone can read
CREATE POLICY "Ratings viewable by everyone" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON ratings FOR INSERT WITH CHECK (
    from_user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Book Ratings: Users can create book ratings, everyone can read
CREATE POLICY "Book ratings viewable by everyone" ON book_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create book ratings" ON book_ratings FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Organizations: Everyone can read, authenticated users can create
CREATE POLICY "Organizations viewable by everyone" ON organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Organization Memberships: Everyone can read, members can join
CREATE POLICY "Memberships viewable by everyone" ON organization_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join organizations" ON organization_memberships FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);
CREATE POLICY "Users can leave organizations" ON organization_memberships FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Organization Books: Everyone can read, admins can CRUD
CREATE POLICY "Organization books viewable by everyone" ON organization_books FOR SELECT USING (true);
CREATE POLICY "Organization admins can manage books" ON organization_books FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
        AND role = 'admin'
    )
);

-- Organization Borrow Requests: Viewable by requester and org admins
CREATE POLICY "Org borrow requests viewable by requester and admins" ON organization_borrow_requests FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text) OR
    (SELECT organization_id FROM organization_books WHERE id = organization_book_id) IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
        AND role = 'admin'
    )
);
CREATE POLICY "Users can create org borrow requests" ON organization_borrow_requests FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- Messages: Everyone in org can read/write
CREATE POLICY "Messages viewable by org members" ON messages FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    ) OR organization_id IS NULL
);
CREATE POLICY "Org members can create messages" ON messages FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON borrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
