import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { db } from '../services/MockDatabase';
import {
    fetchAvailableBooks,
    fetchFeaturedBook,
    fetchTrendingBooks,
    fetchNewArrivals,
    fetchBooksByHighRatedOwners,
    fetchGenres
} from '../services/bookService';

const HomePage = () => {
    const { books, getWaitlistPosition, getWaitlistCount, createBorrowTransaction, getActiveTransactionForBook } = useData();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('All');
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [hoveredCard, setHoveredCard] = useState(null);

    // Supabase data
    const [supabaseBooks, setSupabaseBooks] = useState([]);
    const [featuredBook, setFeaturedBook] = useState(null);
    const [trendingBooks, setTrendingBooks] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [highlyRatedBooks, setHighlyRatedBooks] = useState([]);
    const [genres, setGenres] = useState([]);
    const [supabaseLoading, setSupabaseLoading] = useState(true);
    const [supabaseError, setSupabaseError] = useState(null);

    // Request modal state
    const [requestModal, setRequestModal] = useState(null);
    const [requestDetails, setRequestDetails] = useState({
        method: 'IN_PERSON',
        note: '',
        contactMethod: 'WHATSAPP',
        contactValue: ''
    });

    // Sync genre filter with URL parameters
    useEffect(() => {
        const genreParam = searchParams.get('genre');
        if (genreParam) {
            setSelectedGenre(genreParam);
        }
    }, [searchParams]);

    // Fetch all curated data from Supabase on mount
    useEffect(() => {
        const loadCuratedData = async () => {
            setSupabaseLoading(true);
            setSupabaseError(null);

            try {
                const [allBooks, featured, trending, arrivals, rated, genreList] = await Promise.all([
                    fetchAvailableBooks(),
                    fetchFeaturedBook(),
                    fetchTrendingBooks(8),
                    fetchNewArrivals(10),
                    fetchBooksByHighRatedOwners(12),
                    fetchGenres()
                ]);

                setSupabaseBooks(allBooks);
                setFeaturedBook(featured);
                setTrendingBooks(trending);
                setNewArrivals(arrivals);
                setHighlyRatedBooks(rated);
                setGenres(genreList);
            } catch (err) {
                setSupabaseError(err.message || 'Failed to load curated content');
                console.error('Error loading curated data:', err);
            } finally {
                setSupabaseLoading(false);
            }
        };

        loadCuratedData();
    }, []);

    // Determine which books to use: Supabase (if available) or fallback to mock
    const useSupabaseBooks = !supabaseLoading && !supabaseError && supabaseBooks.length > 0;
    const primaryBooks = useSupabaseBooks ? supabaseBooks : books;

    // Sort mock books by quality (rating DESC, count DESC, title ASC)
    const sortedMockBooks = useMemo(() => {
        if (useSupabaseBooks || books.length === 0) return [];
        const sorted = [...books].sort((a, b) => {
            const ra = typeof a.google_rating === 'number' ? a.google_rating : -1;
            const rb = typeof b.google_rating === 'number' ? b.google_rating : -1;

            if (rb !== ra) return rb - ra;

            const ca = a.google_rating_count || 0;
            const cb = b.google_rating_count || 0;

            if (cb !== ca) return cb - ca;

            return (a.title || '').localeCompare(b.title || '');
        });
        return sorted;
    }, [books, useSupabaseBooks]);

    // Apply search and filters to all books
    const filteredAllBooks = primaryBooks
        .map(book => {
            const waitlistPosition = getWaitlistPosition(book.id);
            const waitlistCount = getWaitlistCount(book.id);
            return { ...book, waitlistPosition, waitlistCount };
        })
        .filter(book =>
            (user?.isAdmin || book.ownerId !== user?.id) &&
            (cityFilter === 'All' || book.ownerCity === cityFilter) &&
            (selectedGenre === 'All' || book.genre === selectedGenre) &&
            (book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    const getOwner = (ownerId) => {
        return db.getUserById(ownerId);
    };

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

    const handleGenreSelect = (genre) => {
        setSelectedGenre(genre);
        if (genre === 'All') {
            searchParams.delete('genre');
        } else {
            searchParams.set('genre', genre);
        }
        setSearchParams(searchParams);
    };

    // Render a single book card
    const renderBookCard = (book, size = 'normal') => {
        const activeTransaction = user ? getActiveTransactionForBook(book.id) : null;
        const isSmall = size === 'small';

        return (
            <div
                key={book.id}
                className="card"
                style={{
                    padding: isSmall ? '12px' : '16px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    transform: hoveredCard === book.id ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: hoveredCard === book.id ? '0 8px 16px rgba(0,0,0,0.12)' : undefined,
                    minWidth: isSmall ? '200px' : 'auto'
                }}
                onMouseEnter={() => setHoveredCard(book.id)}
                onMouseLeave={() => setHoveredCard(null)}
            >
                {book.coverUrl && (
                    <img
                        src={book.coverUrl}
                        alt={book.title}
                        style={{
                            width: '100%',
                            height: isSmall ? '150px' : '180px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '12px'
                        }}
                    />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                        <h3 style={{ marginBottom: '4px', fontSize: isSmall ? '0.95rem' : '1.1rem', wordBreak: 'break-word' }}>
                            {book.title}
                        </h3>
                        <p className="text-muted text-sm">{book.author}</p>
                    </div>
                    <span
                        className="badge"
                        style={{
                            background: '#e0f2fe',
                            color: '#0284c7',
                            flexShrink: 0,
                            cursor: 'pointer',
                            fontSize: isSmall ? '0.7rem' : '0.75rem'
                        }}
                        onClick={() => handleGenreSelect(book.genre)}
                    >
                        {book.genre}
                    </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem', marginBottom: '8px' }}>
                    <span>📍 {book.ownerCity}</span>
                    <span style={{ color: book.condition === 'New' ? '#16a34a' : book.condition === 'Good' ? '#0284c7' : '#64748b' }}>
                        📖 {book.condition}
                    </span>
                    {book.ownerReputation && (
                        <span style={{ color: '#fbbf24' }}>
                            ★ {book.ownerReputation}
                        </span>
                    )}
                </div>

                {/* Google Books rating */}
                {typeof book.google_rating === 'number' && book.google_rating_count > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                        ⭐ {book.google_rating.toFixed(1)} • {book.google_rating_count.toLocaleString()} ratings
                    </div>
                )}

                <p className="text-sm text-muted" style={{ marginBottom: '12px' }}>
                    by <Link to={`/user/${book.ownerId}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                        {book.ownerName}
                    </Link>
                </p>

                {activeTransaction && activeTransaction.borrowerId === user?.id ? (
                    <span className="badge" style={{ background: '#e0f2fe', color: '#0284c7', display: 'inline-block' }}>
                        Request Sent
                    </span>
                ) : (
                    <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                        onClick={() => handleOpenRequestModal(book)}
                        disabled={!user}
                    >
                        Request to Borrow
                    </button>
                )}
            </div>
        );
    };

    if (supabaseLoading) {
        return (
            <div className="container">
                <div style={{ textAlign: 'center', padding: '64px 0', color: '#64748b' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
                    <h2>Loading curated books...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Data Source Status Banner */}
            {supabaseError && (
                <div style={{
                    padding: '16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#991b1b' }}>Unable to load online books</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                            Showing local data instead. Books you add will sync when you're back online.
                        </p>
                    </div>
                </div>
            )}

            {!supabaseError && !useSupabaseBooks && books.length > 0 && (
                <div style={{
                    padding: '16px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>📡</span>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#92400e' }}>Using local demo data</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#78350f' }}>
                            No books in the online catalog yet. Add your first book to see it appear here for others to discover!
                        </p>
                    </div>
                </div>
            )}

            {useSupabaseBooks && supabaseBooks.length === 0 && (
                <div style={{
                    padding: '16px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>📚</span>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#1e40af' }}>No books available yet</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#1e3a8a' }}>
                            Be the first to add a book! Click "Add Book" to list a book from your collection.
                        </p>
                    </div>
                </div>
            )}

            {/* Header with Search */}
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h1>Discover Books</h1>
                    {useSupabaseBooks && supabaseBooks.length > 0 && (
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            background: '#dcfce7',
                            color: '#16a34a',
                            borderRadius: '4px',
                            fontWeight: '500'
                        }}>
                            ✓ Live Data
                        </span>
                    )}
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by title or author..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* City Filter */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <select
                        className="input"
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                    >
                        <option value="All">All Cities</option>
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Port Harcourt">Port Harcourt</option>
                        <option value="Ibadan">Ibadan</option>
                    </select>
                </div>
            </header>

            {/* Explore by Genre - Horizontal Chips */}
            {useSupabaseBooks && genres.length > 0 && (
                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Explore by Genre</h2>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                        scrollbarWidth: 'thin'
                    }}>
                        <button
                            onClick={() => handleGenreSelect('All')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: selectedGenre === 'All' ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                                background: selectedGenre === 'All' ? 'var(--primary)' : 'white',
                                color: selectedGenre === 'All' ? 'white' : '#64748b',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            All Books
                        </button>
                        {genres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => handleGenreSelect(genre)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: selectedGenre === genre ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                                    background: selectedGenre === genre ? 'var(--primary)' : 'white',
                                    color: selectedGenre === genre ? 'white' : '#64748b',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* If search term or filters are active, show filtered results */}
            {(searchTerm || selectedGenre !== 'All' || cityFilter !== 'All') && (
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ marginBottom: '16px' }}>
                        Search Results
                        <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '8px' }}>
                            ({filteredAllBooks.length} {filteredAllBooks.length === 1 ? 'book' : 'books'})
                        </span>
                    </h2>
                    {filteredAllBooks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔍</span>
                            <h3>No books found</h3>
                            <p>Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                            {filteredAllBooks.map(book => renderBookCard(book))}
                        </div>
                    )}
                </section>
            )}

            {/* Curated Sections - Only show when no active search/filter */}
            {!searchTerm && selectedGenre === 'All' && cityFilter === 'All' && (
                <>
                    {/* Featured Book of the Week */}
                    {useSupabaseBooks && featuredBook && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ marginBottom: '16px', fontSize: '1.4rem' }}>📚 Featured Book of the Week</h2>
                            <div className="card" style={{
                                padding: '24px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: featuredBook.coverUrl ? '200px 1fr' : '1fr', gap: '24px' }}>
                                    {featuredBook.coverUrl && (
                                        <img
                                            src={featuredBook.coverUrl}
                                            alt={featuredBook.title}
                                            style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                    )}
                                    <div>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.3)', color: 'white', marginBottom: '12px', display: 'inline-block' }}>
                                            {featuredBook.genre}
                                        </span>
                                        <h3 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'white' }}>{featuredBook.title}</h3>
                                        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '16px' }}>by {featuredBook.author}</p>
                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '0.95rem' }}>
                                            <span>📍 {featuredBook.ownerCity}</span>
                                            <span>📖 {featuredBook.condition}</span>
                                            {featuredBook.ownerReputation && <span>★ {featuredBook.ownerReputation}</span>}
                                        </div>
                                        <p style={{ marginBottom: '16px', opacity: 0.9 }}>
                                            Owned by <Link to={`/user/${featuredBook.ownerId}`} style={{ color: 'white', textDecoration: 'underline', fontWeight: '600' }}>
                                                {featuredBook.ownerName}
                                            </Link>
                                        </p>
                                        <button
                                            className="btn"
                                            style={{ background: 'white', color: '#667eea', fontWeight: '600' }}
                                            onClick={() => handleOpenRequestModal(featuredBook)}
                                            disabled={!user}
                                        >
                                            Request to Borrow
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Trending Books - Horizontal Carousel */}
                    {useSupabaseBooks && trendingBooks.length > 0 && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>🔥 Trending Now</h2>
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                overflowX: 'auto',
                                paddingBottom: '16px',
                                scrollbarWidth: 'thin'
                            }}>
                                {trendingBooks.map(book => (
                                    <div key={book.id} style={{ flexShrink: 0, width: '220px' }}>
                                        {renderBookCard(book, 'small')}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* New Arrivals */}
                    {useSupabaseBooks && newArrivals.length > 0 && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>✨ New Arrivals</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                                {newArrivals.slice(0, 6).map(book => renderBookCard(book))}
                            </div>
                        </section>
                    )}

                    {/* Highly Rated Owners */}
                    {useSupabaseBooks && highlyRatedBooks.length > 0 && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>⭐ From Highly Rated Owners</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                                {highlyRatedBooks.slice(0, 6).map(book => renderBookCard(book))}
                            </div>
                        </section>
                    )}

                    {/* Fallback to mock data if Supabase empty */}
                    {!useSupabaseBooks && books.length > 0 && (
                        <section>
                            <h2 style={{ marginBottom: '16px' }}>All Available Books</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                                {sortedMockBooks.slice(0, 12).map(book => {
                                    const owner = getOwner(book.ownerId);
                                    const enrichedBook = {
                                        ...book,
                                        ownerName: owner?.name || 'Unknown',
                                        ownerCity: owner?.city || 'Unknown'
                                    };
                                    return renderBookCard(enrichedBook);
                                })}
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* Request Modal */}
            {requestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Request to Borrow</h3>
                        <p className="text-muted" style={{ marginTop: '4px' }}>
                            "{requestModal.title}" by {requestModal.author}
                        </p>

                        <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                            <p className="text-sm text-muted" style={{ marginBottom: '4px' }}>Owner</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Link to={`/user/${requestModal.ownerId}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                                    {useSupabaseBooks ? requestModal.ownerName : getOwner(requestModal.ownerId)?.name}
                                </Link>
                                <span className="text-muted text-sm">• {useSupabaseBooks ? requestModal.ownerCity : getOwner(requestModal.ownerId)?.city}</span>
                                {(useSupabaseBooks ? requestModal.ownerReputation : getOwner(requestModal.ownerId)?.reputation) && (
                                    <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                                        ★ {useSupabaseBooks ? requestModal.ownerReputation : getOwner(requestModal.ownerId)?.reputation}
                                    </span>
                                )}
                            </div>
                        </div>

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

export default HomePage;
