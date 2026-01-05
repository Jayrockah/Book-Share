import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { createBook } from '../services/bookService';
import { useData } from '../context/DataContext';

const AddBookPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { refreshData } = useData();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [condition, setCondition] = useState('Good');
    const [genre, setGenre] = useState('Fiction');
    const [notes, setNotes] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const searchBooks = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5`);
            const data = await response.json();
            setSearchResults(data.items || []);
            setSelectedBook(null);
        } catch (error) {
            console.error('Error searching books:', error);
            addToast('Failed to search books. Please try again.', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectBook = (book) => {
        setSelectedBook(book);
        setSearchResults([]); // Clear results to show selection
        // Auto-detect genre if possible
        const categories = book.volumeInfo?.categories;
        if (categories && categories.length > 0) {
            setGenre(categories[0]);
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();

        if (!user || !user.id) {
            addToast('You must be logged in to add a book', 'error');
            navigate('/login');
            return;
        }

        if (!selectedBook) {
            addToast('Please select a book first', 'error');
            return;
        }

        if (!condition) {
            addToast('Please select a condition', 'error');
            return;
        }

        if (!genre.trim()) {
            addToast('Please enter a genre', 'error');
            return;
        }

        try {
            const volumeInfo = selectedBook.volumeInfo || {};
            const result = await createBook({
                owner_id: user.id,
                title: volumeInfo.title || 'Untitled',
                author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
                genre: genre.trim(),
                condition,
                cover_photo_url: volumeInfo.imageLinks?.thumbnail || null,
                notes: notes.trim() || null
            });

            if (result.success) {
                addToast('Book added successfully!', 'success');
                // Refresh data context to fetch the newly added book
                await refreshData();
                navigate('/profile');
            } else {
                addToast(result.error || 'Failed to add book', 'error');
            }
        } catch (error) {
            console.error('Error adding book:', error);
            addToast('An error occurred while adding the book', 'error');
        }
    };

    return (
        <div className="container">
            <h1>Add a Book</h1>

            {!selectedBook ? (
                <>
                    <form onSubmit={searchBooks} style={{ marginBottom: '24px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Search Google Books..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="submit"
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-65%)', // Adjust for input margin
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)'
                                }}
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </form>

                    {isSearching && <p className="text-center text-muted">Searching...</p>}

                    <div className="search-results">
                        {searchResults.map(item => {
                            const info = item.volumeInfo;
                            return (
                                <div key={item.id} className="card" onClick={() => handleSelectBook(item)} style={{ cursor: 'pointer', display: 'flex', gap: '12px' }}>
                                    {info.imageLinks?.thumbnail && (
                                        <img src={info.imageLinks.thumbnail} alt={info.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                                    )}
                                    <div>
                                        <h4>{info.title}</h4>
                                        <p className="text-muted text-sm">{info.authors?.join(', ')}</p>
                                        <p className="text-muted text-sm" style={{ fontSize: '0.75rem' }}>{info.publishedDate?.substring(0, 4)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="confirm-selection">
                    <div className="card" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                        {selectedBook.volumeInfo.imageLinks?.thumbnail && (
                            <img src={selectedBook.volumeInfo.imageLinks.thumbnail} alt={selectedBook.volumeInfo.title} style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <div>
                            <h3>{selectedBook.volumeInfo.title}</h3>
                            <p className="text-muted">{selectedBook.volumeInfo.authors?.join(', ')}</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddBook}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Condition</label>
                            <select
                                className="input"
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                            >
                                <option value="New">New</option>
                                <option value="Good">Good</option>
                                <option value="Worn">Worn</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Genre *</label>
                            <input
                                type="text"
                                className="input"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                placeholder="e.g. Fiction, Sci-Fi"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Notes (Optional)</label>
                            <textarea
                                className="input"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special notes about the book..."
                                rows="3"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedBook(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>List Book</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AddBookPage;
