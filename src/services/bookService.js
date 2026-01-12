import { supabase } from './supabaseClient';

/**
 * Create a new book in Supabase
 * @param {Object} bookData - Book data
 * @param {string} bookData.owner_id - Owner's user ID (UUID)
 * @param {string} bookData.title - Book title
 * @param {string} bookData.author - Book author
 * @param {string} bookData.genre - Book genre
 * @param {string} bookData.condition - Book condition ('New', 'Good', or 'Worn')
 * @param {string} bookData.cover_photo_url - URL to book cover image (optional)
 * @param {string} bookData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created book or error
 */
export const createBook = async (bookData) => {
    try {
        // Build insert object with all fields
        const insertData = {
            owner_id: bookData.owner_id,
            title: bookData.title,
            author: bookData.author,
            genre: bookData.genre,
            condition: bookData.condition,
            cover_photo_url: bookData.cover_photo_url || null,
            notes: bookData.notes || null,
            status: 'available'
        };

        const { data, error } = await supabase
            .from('books')
            .insert([insertData])
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                status,
                cover_photo_url,
                notes,
                due_date,
                created_at,
                owner:profiles!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .single();

        if (error) {
            console.error('Create book error:', error.message);
            throw error;
        }

        return { success: true, book: data };
    } catch (error) {
        console.error('Unexpected error creating book:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch all available books from Supabase with owner information
 * @returns {Promise<Array>} Array of books with owner data or empty array on error
 */
export const fetchAvailableBooks = async () => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                status,
                cover_photo_url,
                due_date,
                created_at,
                owner:profiles!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase book fetch error:', error.message);
            return [];
        }

        // Transform data to match expected format for HomePage
        return (data || []).map(book => ({
            id: book.id,
            ownerId: book.owner_id,
            title: book.title || 'Untitled',
            author: book.author || 'Unknown Author',
            genre: book.genre || 'Unknown',
            condition: book.condition || 'Good',
            coverUrl: book.cover_photo_url || null,
            status: book.status || 'available',
            dueDate: book.due_date || null,
            // Owner information (with fallbacks)
            ownerName: book.owner?.name || 'Unknown Owner',
            ownerCity: book.owner?.city || 'Unknown',
            ownerReputation: book.owner?.reputation || null,
            // For now, waitlist info will come from context/mock
            waitlistPosition: null,
            waitlistCount: 0
        }));
    } catch (error) {
        console.error('Unexpected error fetching books:', error);
        return [];
    }
};

/**
 * Fetch all books (not just available) from Supabase with owner information
 * @returns {Promise<Array>} Array of all books with owner data
 */
export const fetchAllBooks = async () => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                status,
                cover_photo_url,
                due_date,
                created_at,
                owner:profiles!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase all books fetch error:', error.message);
            return [];
        }

        const transformedBooks = (data || []).map(book => ({
            id: book.id,
            ownerId: book.owner_id,
            title: book.title || 'Untitled',
            author: book.author || 'Unknown Author',
            genre: book.genre || 'Unknown',
            condition: book.condition || 'Good',
            coverUrl: book.cover_photo_url || null,
            status: book.status || 'available',
            dueDate: book.due_date || null,
            ownerName: book.owner?.name || 'Unknown Owner',
            ownerCity: book.owner?.city || 'Unknown',
            ownerReputation: book.owner?.reputation || null,
            waitlistPosition: null,
            waitlistCount: 0
        }));

        console.log('✅ Fetched all books from Supabase:', transformedBooks.length, 'books');
        return transformedBooks;
    } catch (error) {
        console.error('❌ Unexpected error fetching all books:', error);
        return [];
    }
};

/**
 * Helper function to transform book data
 */
const transformBook = (book) => ({
    id: book.id,
    ownerId: book.owner_id,
    title: book.title || 'Untitled',
    author: book.author || 'Unknown Author',
    genre: book.genre || 'Unknown',
    condition: book.condition || 'Good',
    coverUrl: book.cover_photo_url || null,
    status: book.status || 'available',
    dueDate: book.due_date || null,
    createdAt: book.created_at,
    ownerName: book.owner?.name || 'Unknown Owner',
    ownerCity: book.owner?.city || 'Unknown',
    ownerReputation: book.owner?.reputation || null,
    waitlistPosition: null,
    waitlistCount: 0
});

/**
 * Fetch featured book (most recently added available book)
 * @returns {Promise<Object|null>} Featured book or null
 */
export const fetchFeaturedBook = async () => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                status,
                cover_photo_url,
                due_date,
                created_at,
                owner:profiles!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('❌ Supabase featured book fetch error:', error.message);
            return null;
        }

        // Return first book if exists, otherwise null
        return (data && data.length > 0) ? transformBook(data[0]) : null;
    } catch (error) {
        console.error('❌ Unexpected error fetching featured book:', error);
        return null;
    }
};

/**
 * Fetch trending books (simulated by recent books for now)
 * In production, this would use borrow_transactions count
 * @param {number} limit - Number of books to fetch
 * @returns {Promise<Array>} Array of trending books
 */
export const fetchTrendingBooks = async (limit = 8) => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                status,
                due_date,
                created_at,
                owner:profiles!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ Supabase trending books fetch error:', error.message);
            return [];
        }

        return (data || []).map(transformBook);
    } catch (error) {
        console.error('❌ Unexpected error fetching trending books:', error);
        return [];
    }
};

/**
 * Fetch new arrivals (most recent 10 books)
 * @param {number} limit - Number of books to fetch
 * @returns {Promise<Array>} Array of new books
 */
export const fetchNewArrivals = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                status,
                due_date,
                created_at,
                owner:profiles!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ Supabase new arrivals fetch error:', error.message);
            return [];
        }

        console.log('✅ Fetched new arrivals:', (data || []).length, 'books');
        return (data || []).map(transformBook);
    } catch (error) {
        console.error('❌ Unexpected error fetching new arrivals:', error);
        return [];
    }
};

/**
 * Fetch books by highly rated owners (reputation >= 4.5)
 * Randomized to show variety from different highly-rated owners
 * @param {number} limit - Number of books to fetch
 * @returns {Promise<Array>} Array of books from highly rated owners
 */
export const fetchBooksByHighRatedOwners = async (limit = 12) => {
    try {
        // Fetch more books than needed to allow for randomization
        const { data, error } = await supabase
            .from('books')
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                status,
                due_date,
                created_at,
                owner:profiles!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .eq('status', 'available')
            .gte('owner.reputation', 4.5)
            .limit(limit * 3); // Fetch 3x to ensure good variety

        if (error) {
            console.error('❌ Supabase highly rated owners fetch error:', error.message);
            return [];
        }

        // Shuffle the results using Fisher-Yates algorithm
        const shuffled = [...(data || [])];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Take only the requested limit and transform
        const randomBooks = shuffled.slice(0, limit);
        console.log('✅ Fetched books by highly rated owners (randomized):', randomBooks.length, 'books');
        return randomBooks.map(transformBook);
    } catch (error) {
        console.error('❌ Unexpected error fetching books by highly rated owners:', error);
        return [];
    }
};

/**
 * Fetch all unique genres
 * @returns {Promise<Array>} Array of genre strings
 */
export const fetchGenres = async () => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('genre')
            .eq('status', 'available');

        if (error) {
            console.error('❌ Supabase genres fetch error:', error.message);
            return [];
        }

        // Extract unique genres
        const genres = [...new Set((data || []).map(book => book.genre).filter(Boolean))];
        return genres.sort();
    } catch (error) {
        console.error('❌ Unexpected error fetching genres:', error);
        return [];
    }
};
