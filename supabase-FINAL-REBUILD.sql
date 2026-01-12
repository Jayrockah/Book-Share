-- ==============================================================================
-- BOOK SHARE - FINAL REBUILD SCRIPT (Bulletproof Version)
-- ==============================================================================
-- This script uses exception handling to ignore all errors during cleanup
-- Then creates fresh schema
-- Safe to run multiple times, regardless of database state
-- ==============================================================================

-- ==============================================================================
-- PART 1: AGGRESSIVE CLEANUP (Ignore all errors)
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all triggers (ignore errors if table doesn't exist)
    FOR r IN (
        SELECT DISTINCT trigger_schema, trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema IN ('public', 'auth')
    ) LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
                          r.trigger_name, r.trigger_schema, r.event_object_table);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore all errors
            NULL;
        END;
    END LOOP;

    -- Drop all functions in public schema
    FOR r IN (
        SELECT routine_schema, routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_type = 'FUNCTION'
    ) LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE',
                          r.routine_schema, r.routine_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    -- Drop all policies
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                          r.policyname, r.schemaname, r.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    -- Drop all tables in public schema
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    RAISE NOTICE '✅ Cleanup complete - old schema removed';
END $$;

-- ==============================================================================
-- PART 2: CREATE NEW SCHEMA
-- ==============================================================================

-- Profiles Table (replaces old "users" table)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  profile_photo_url TEXT,

  -- Trust & Safety
  reputation DECIMAL(3,2) DEFAULT 0 CHECK (reputation >= 0 AND reputation <= 5),
  borrow_limit INTEGER DEFAULT 3 CHECK (borrow_limit >= 0),
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  verified_identity BOOLEAN DEFAULT FALSE,

  -- Token System
  tokens DECIMAL(10,2) DEFAULT 0 CHECK (tokens >= 0),
  locked_tokens DECIMAL(10,2) DEFAULT 0 CHECK (locked_tokens >= 0),
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,

  -- Statistics
  total_books_lent INTEGER DEFAULT 0,
  total_books_borrowed INTEGER DEFAULT 0,
  successful_transactions INTEGER DEFAULT 0,

  -- Geolocation
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books Table
CREATE TABLE public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  borrower_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Book Information
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  genre TEXT,
  language TEXT DEFAULT 'English',
  publication_year INTEGER,

  -- Condition & Photos
  condition TEXT CHECK (condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
  cover_photo_url TEXT,
  condition_photos TEXT[],

  -- Availability
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'unavailable')),
  due_date TIMESTAMPTZ,
  notes TEXT,

  -- Token System
  required_tokens DECIMAL(10,2) DEFAULT 50,

  -- Popularity
  borrow_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Borrow Transactions
CREATE TABLE public.borrow_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  borrower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  borrowed_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'cancelled')),

  tokens_charged DECIMAL(10,2) DEFAULT 0,
  late_fee DECIMAL(10,2) DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book Ratings
CREATE TABLE public.book_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

-- User Ratings
CREATE TABLE public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rated_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rater_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.borrow_transactions(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rated_user_id, rater_user_id, transaction_id)
);

-- Waitlist
CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('borrow_request', 'book_due', 'book_returned', 'message', 'rating', 'waitlist')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('school', 'library', 'book_club', 'community')),
  description TEXT,
  city TEXT,
  logo_url TEXT,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Memberships
CREATE TABLE public.organization_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Organization Books
CREATE TABLE public.organization_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, book_id)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_profiles_reputation ON public.profiles(reputation DESC);
CREATE INDEX idx_profiles_location ON public.profiles(latitude, longitude);

CREATE INDEX idx_books_owner ON public.books(owner_id);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_genre ON public.books(genre);
CREATE INDEX idx_books_rating ON public.books(average_rating DESC);
CREATE INDEX idx_books_created ON public.books(created_at DESC);

CREATE INDEX idx_transactions_borrower ON public.borrow_transactions(borrower_id);
CREATE INDEX idx_transactions_lender ON public.borrow_transactions(lender_id);
CREATE INDEX idx_transactions_status ON public.borrow_transactions(status);

CREATE INDEX idx_messages_recipient ON public.messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

-- Auto-update timestamps
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile when user signs up
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper functions
CREATE FUNCTION public.user_owns_book(book_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.books
    WHERE id = book_uuid AND owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION public.get_user_book_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.books WHERE owner_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_books ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Books Policies
CREATE POLICY "Books are viewable by everyone"
  ON public.books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own books"
  ON public.books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own books"
  ON public.books FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own books"
  ON public.books FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Messages Policies
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view their transactions"
  ON public.borrow_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = borrower_id OR auth.uid() = lender_id);

-- Ratings Policies
CREATE POLICY "Ratings are viewable by everyone"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ratings"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Book ratings viewable by everyone"
  ON public.book_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can rate books"
  ON public.book_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Waitlist Policies
CREATE POLICY "Users can view waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join waitlist"
  ON public.waitlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave waitlist"
  ON public.waitlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Organizations Policies
CREATE POLICY "Organizations viewable by everyone"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update organizations"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (auth.uid() = admin_id);

CREATE POLICY "Memberships viewable by members"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organization books viewable"
  ON public.organization_books FOR SELECT
  TO authenticated
  USING (true);

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  table_count INTEGER;
  trigger_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'books', 'borrow_transactions', 'messages', 'notifications');

  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_books_updated_at');

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   DATABASE REBUILD VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables created: %', table_count;
  RAISE NOTICE '✅ Triggers created: %', trigger_count;
  RAISE NOTICE '✅ RLS Policies created: %', policy_count;
  RAISE NOTICE '';

  IF table_count >= 5 AND trigger_count >= 3 AND policy_count >= 15 THEN
    RAISE NOTICE '🎉 DATABASE REBUILD SUCCESSFUL!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run: npm install';
    RAISE NOTICE '2. Run: npm run dev';
    RAISE NOTICE '3. Test signup and login';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '⚠️  Some objects may be missing.';
    RAISE WARNING 'Tables: % (expected >= 5)', table_count;
    RAISE WARNING 'Triggers: % (expected >= 3)', trigger_count;
    RAISE WARNING 'Policies: % (expected >= 15)', policy_count;
  END IF;

  RAISE NOTICE '========================================';
END $$;
