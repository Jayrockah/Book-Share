import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    MapPin, Users, BookOpen, MessageCircle, Settings,
    UserPlus, LogOut, Edit, Plus, Search, X
} from 'lucide-react';

const OrganizationProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        organizations,
        organizationMemberships,
        organizationBooks,
        joinOrganization,
        leaveOrganization,
        isOrganizationAdmin,
        isOrganizationMember,
        getOrganizationMembers,
        requestOrganizationBook
    } = useData();
    const { user, MOCK_USERS } = useAuth();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState('overview');
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState(null);

    useEffect(() => {
        const org = organizations.find(o => o.id === id);
        if (org) {
            setOrganization(org);

            try {
                const rawMembers = getOrganizationMembers(id) || [];
                const enrichedMembers = rawMembers.map(m => {
                    const memberUser = (MOCK_USERS || []).find(u => u.id === m.userId);
                    return {
                        ...m,
                        userName: memberUser ? memberUser.name : 'Unknown User',
                        joinedAt: m.createdAt
                    };
                });
                setMembers(enrichedMembers);
            } catch (err) {
                console.error("Error loading members:", err);
                setMembers([]);
            }

            setBooks(organizationBooks.filter(b => b.organizationId === id));
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, organizations, organizationMemberships, organizationBooks, MOCK_USERS]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center md:pl-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center md:pl-64 p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h2>
                <p className="text-gray-600 mb-4">The book club you're looking for doesn't exist or has been removed.</p>
                <button
                    onClick={() => navigate('/organizations')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Browse Clubs
                </button>
            </div>
        );
    }

    const isAdmin = user && isOrganizationAdmin(id, user.id);
    const isMember = user && isOrganizationMember(id, user.id);

    const handleJoin = async () => {
        if (!user) {
            addToast('Please login to join this club', 'error');
            return;
        }
        try {
            await joinOrganization(id, user.id);
            addToast(`Welcome to ${organization.name}!`, 'success');
        } catch {
            addToast('Failed to join organization', 'error');
        }
    };

    const handleLeave = async () => {
        if (window.confirm('Are you sure you want to leave this club?')) {
            try {
                await leaveOrganization(id, user.id);
                addToast('You have left the organization', 'info');
            } catch {
                addToast('Failed to leave organization', 'error');
            }
        }
    };

    const handleRequestBook = async (book) => {
        if (!user) {
            addToast('Please login to request books', 'error');
            return;
        }

        const result = requestOrganizationBook(book.id);
        if (result.success) {
            addToast(result.message, 'success');
            setSelectedBook(null);
        } else {
            addToast(result.message, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64 pt-16 md:pt-0">
            {/* Header Banner */}
            <div className="bg-white border-b border-gray-200">
                <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 relative">
                    {/* Cover Image / Gradient */}
                </div>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                    <div className="relative -mt-12 flex flex-col md:flex-row md:items-end md:space-x-6">
                        {/* Logo */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={organization.logoUrl}
                                alt={organization.name}
                                className="h-24 w-24 rounded-xl border-4 border-white shadow-md bg-white object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="mt-4 md:mt-0 flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                            <div className="flex items-center text-gray-600 mt-1 text-sm">
                                <MapPin size={16} className="mr-1" />
                                {organization.city} • {members.length} members
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 md:mt-0 flex space-x-3">
                            {isMember ? (
                                <>
                                    <button
                                        onClick={() => navigate(`/organizations/${id}/chat`)}
                                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        <MessageCircle size={18} className="mr-2" />
                                        Chat
                                    </button>
                                    {isAdmin ? (
                                        <button
                                            onClick={() => navigate(`/organizations/${id}/manage`)}
                                            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            <Settings size={18} className="mr-2" />
                                            Manage
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLeave}
                                            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                                        >
                                            <LogOut size={18} className="mr-2" />
                                            Leave
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
                                >
                                    <UserPlus size={18} className="mr-2" />
                                    Join Club
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {['overview', 'catalog', 'members'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors
                    ${activeTab === tab
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">About Us</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {organization.description}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent Books</h3>
                                    <button
                                        onClick={() => setActiveTab('catalog')}
                                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                                    >
                                        View All
                                    </button>
                                </div>
                                {books.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {books.slice(0, 3).map(book => (
                                            <div key={book.id} className="group relative cursor-pointer" onClick={() => setSelectedBook(book)}>
                                                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200">
                                                    <img
                                                        src={book.coverUrl || `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`}
                                                        alt={book.title}
                                                        className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                                                    />
                                                </div>
                                                <div className="mt-2">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">{book.title}</h4>
                                                    <p className="text-xs text-gray-500 truncate">{book.author}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No books in the catalog yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Club Details</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <MapPin size={18} className="text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Location</p>
                                            <p className="text-sm text-gray-600">{organization.location || 'Online / TBD'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Users size={18} className="text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Members</p>
                                            <p className="text-sm text-gray-600">{members.length} active members</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <BookOpen size={18} className="text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Library</p>
                                            <p className="text-sm text-gray-600">{books.length} books available</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'catalog' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Club Catalog</h2>
                            {isAdmin && (
                                <button
                                    onClick={() => navigate(`/organizations/${id}/manage`)}
                                    className="flex items-center px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    <Plus size={16} className="mr-1" />
                                    Add Book
                                </button>
                            )}
                        </div>

                        {/* Search Bar could go here */}

                        {books.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {books.map(book => (
                                    <div key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => setSelectedBook(book)}
                                    >
                                        <div className="aspect-[2/3] w-full bg-gray-200 relative">
                                            <img
                                                src={book.coverPhoto || `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`}
                                                alt={book.title}
                                                className="h-full w-full object-cover"
                                            />
                                            {book.stock === 0 && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm px-2 py-1 bg-red-600 rounded">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h3 className="text-sm font-bold text-gray-900 truncate" title={book.title}>{book.title}</h3>
                                            <p className="text-xs text-gray-500 truncate">{book.author}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{book.genre}</span>
                                                <span className={`text-xs font-medium ${book.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {book.stock > 0 ? `${book.stock} left` : '0 left'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No books yet</h3>
                                <p className="text-gray-500 mt-1">This club hasn't added any books to their library.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Members ({members.length})</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <ul className="divide-y divide-gray-100">
                                {members.map((member) => (
                                    <li key={member.userId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                                                {member.userName.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                                                <p className="text-xs text-gray-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {member.role === 'admin' && (
                                                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mr-2">
                                                    Admin
                                                </span>
                                            )}
                                            <button
                                                onClick={() => navigate(`/profile/${member.userId}`)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Book Details Modal */}
            {selectedBook && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSelectedBook(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 bg-gray-200">
                            <img
                                src={selectedBook.coverUrl || `https://covers.openlibrary.org/b/title/${encodeURIComponent(selectedBook.title)}-M.jpg`}
                                alt={selectedBook.title}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => setSelectedBook(null)}
                                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedBook.title}</h2>
                                    <p className="text-lg text-gray-600">{selectedBook.author}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedBook.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {selectedBook.stock > 0 ? `${selectedBook.stock} Available` : 'Out of Stock'}
                                </span>
                            </div>

                            <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded-md">{selectedBook.genre}</span>
                                <span className="flex items-center">
                                    <BookOpen size={16} className="mr-1" />
                                    {selectedBook.condition} Condition
                                </span>
                            </div>

                            <div className="space-y-4">
                                {isMember ? (
                                    <button
                                        onClick={() => handleRequestBook(selectedBook)}
                                        disabled={selectedBook.stock === 0}
                                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center
                                            ${selectedBook.stock > 0
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {selectedBook.stock > 0 ? 'Request to Borrow' : 'Currently Unavailable'}
                                    </button>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <p className="text-gray-600 mb-2">Join this club to borrow books</p>
                                        <button
                                            onClick={handleJoin}
                                            className="text-emerald-600 font-medium hover:text-emerald-700"
                                        >
                                            Join Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationProfilePage;
