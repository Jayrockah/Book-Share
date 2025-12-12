import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, BookOpen } from 'lucide-react';

const OrganizationManagePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        organizations,
        organizationBooks,
        addOrganizationBook,
        updateOrganizationBook,
        deleteOrganizationBook,
        isOrganizationAdmin
    } = useData();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [organization, setOrganization] = useState(null);
    const [books, setBooks] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingBookId, setEditingBookId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        genre: '',
        condition: 'Good',
        stock: 1,
        coverUrl: ''
    });

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const org = organizations.find(o => o.id === id);
        if (org) {
            setOrganization(org);
            setBooks(organizationBooks.filter(b => b.organizationId === id));
        }
    }, [id, organizations, organizationBooks]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Redirect if not admin
    useEffect(() => {
        if (user && organization && !isOrganizationAdmin(id, user.id)) {
            addToast('You do not have permission to manage this organization', 'error');
            navigate(`/organizations/${id}`);
        }
    }, [user, organization, id, isOrganizationAdmin, navigate, addToast]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'stock' ? parseInt(value) || 0 : value
        }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            author: '',
            genre: '',
            condition: 'Good',
            stock: 1,
            coverUrl: ''
        });
        setIsAdding(false);
        setEditingBookId(null);
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        try {
            await addOrganizationBook(id, formData);
            addToast('Book added successfully', 'success');
            resetForm();
        } catch {
            addToast('Failed to add book', 'error');
        }
    };

    const handleUpdateBook = async (e) => {
        e.preventDefault();
        try {
            await updateOrganizationBook(id, editingBookId, formData);
            addToast('Book updated successfully', 'success');
            resetForm();
        } catch {
            addToast('Failed to update book', 'error');
        }
    };

    const handleDeleteBook = async (bookId) => {
        if (window.confirm('Are you sure you want to remove this book from the catalog?')) {
            try {
                await deleteOrganizationBook(id, bookId);
                addToast('Book removed successfully', 'success');
            } catch {
                addToast('Failed to remove book', 'error');
            }
        }
    };

    const startEdit = (book) => {
        setFormData({
            title: book.title,
            author: book.author,
            genre: book.genre,
            condition: book.condition,
            stock: book.stock,
            coverUrl: book.coverUrl || ''
        });
        setEditingBookId(book.id);
        setIsAdding(false);
    };

    if (!organization) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64 pt-16 md:pt-0">
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                <button
                    onClick={() => navigate(`/organizations/${id}`)}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Profile
                </button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Catalog</h1>
                        <p className="text-gray-600">{organization.name}</p>
                    </div>
                    {!isAdding && !editingBookId && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <Plus size={20} className="mr-2" />
                            Add Book
                        </button>
                    )}
                </div>

                {/* Add/Edit Form */}
                {(isAdding || editingBookId) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isAdding ? 'Add New Book' : 'Edit Book'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={isAdding ? handleAddBook : handleUpdateBook} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="block w-full border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                    <input
                                        type="text"
                                        name="author"
                                        value={formData.author}
                                        onChange={handleInputChange}
                                        className="block w-full border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                                    <input
                                        type="text"
                                        name="genre"
                                        value={formData.genre}
                                        onChange={handleInputChange}
                                        className="block w-full border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                                    <select
                                        name="condition"
                                        value={formData.condition}
                                        onChange={handleInputChange}
                                        className="block w-full border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="New">New</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Worn">Worn</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        min="0"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        className="block w-full border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover URL (Optional)</label>
                                    <input
                                        type="url"
                                        name="coverUrl"
                                        value={formData.coverUrl}
                                        onChange={handleInputChange}
                                        className="block w-full border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="mr-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    <Save size={18} className="mr-2" />
                                    {isAdding ? 'Add Book' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Books List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Current Inventory ({books.length})</h3>
                    </div>

                    {books.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                            <p>No books in the catalog yet.</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Add your first book
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {books.map((book) => (
                                <li key={book.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center">
                                        <div className="h-16 w-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                            <img
                                                src={book.coverUrl || `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`}
                                                alt={book.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-sm font-bold text-gray-900">{book.title}</h4>
                                            <p className="text-xs text-gray-500">{book.author}</p>
                                            <div className="flex items-center mt-1 space-x-2">
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{book.genre}</span>
                                                <span className={`text-xs font-medium ${book.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    Stock: {book.stock}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(book)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBook(book.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationManagePage;
