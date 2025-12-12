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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 pb-20 md:pb-0 md:pl-64 pt-16 md:pt-0">
            {/* Header Banner */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
                    {/* Decorative Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="relative -mt-16 flex flex-col md:flex-row md:items-end md:space-x-8">
                        {/* Logo */}
                        <div className="relative flex-shrink-0">
                            <div className="h-32 w-32 rounded-2xl border-4 border-white shadow-2xl bg-white ring-4 ring-emerald-50 overflow-hidden">
                                <img
                                    src={organization.logoUrl}
                                    alt={organization.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="mt-6 md:mt-0 flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{organization.name}</h1>
                            <div className="flex items-center text-gray-600 text-sm space-x-4">
                                <div className="flex items-center">
                                    <MapPin size={18} className="mr-1.5 text-emerald-600" />
                                    <span className="font-medium">{organization.city}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center">
                                    <Users size={18} className="mr-1.5 text-emerald-600" />
                                    <span className="font-medium">{members.length} members</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
                            {isMember ? (
                                <>
                                    <button
                                        onClick={() => navigate(`/organizations/${id}/chat`)}
                                        className="flex items-center px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                    >
                                        <MessageCircle size={18} className="mr-2" />
                                        Chat
                                    </button>
                                    {isAdmin ? (
                                        <button
                                            onClick={() => navigate(`/organizations/${id}/manage`)}
                                            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                                        >
                                            <Settings size={18} className="mr-2" />
                                            Manage
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLeave}
                                            className="flex items-center px-5 py-2.5 bg-white border-2 border-red-200 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                        >
                                            <LogOut size={18} className="mr-2" />
                                            Leave
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    className="flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                                >
                                    <UserPlus size={18} className="mr-2" />
                                    Join Club
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    <div className="border-b-2 border-gray-100">
                        <nav className="-mb-0.5 flex space-x-8">
                            {['overview', 'catalog', 'members'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                    whitespace-nowrap py-4 px-2 border-b-2 font-semibold text-sm capitalize transition-all duration-200
                    ${activeTab === tab
                                            ? 'border-emerald-600 text-emerald-600'
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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <span className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full mr-3"></span>
                                    About Us
                                </h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-base">
                                    {organization.description}
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                        <span className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full mr-3"></span>
                                        Recent Books
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab('catalog')}
                                        className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold hover:underline transition-all"
                                    >
                                        View All →
                                    </button>
                                </div>
                                {books.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                        {books.slice(0, 3).map(book => (
                                            <div key={book.id} className="group relative cursor-pointer" onClick={() => setSelectedBook(book)}>
                                                <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-200 shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                                                    <img
                                                        src={book.coverUrl || `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`}
                                                        alt={book.title}
                                                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                                <div className="mt-3">
                                                    <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{book.title}</h4>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{book.author}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                                        <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500 text-sm">No books in the catalog yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border border-emerald-100 p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center">
                                    <span className="w-1.5 h-4 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full mr-2"></span>
                                    Club Details
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex items-start bg-white rounded-xl p-4 shadow-sm">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <MapPin size={20} className="text-emerald-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-semibold text-gray-900">Location</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{organization.location || 'Online / TBD'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start bg-white rounded-xl p-4 shadow-sm">
                                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                            <Users size={20} className="text-teal-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-semibold text-gray-900">Members</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{members.length} active members</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start bg-white rounded-xl p-4 shadow-sm">
                                        <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                            <BookOpen size={20} className="text-cyan-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-semibold text-gray-900">Library</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{books.length} books available</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'catalog' && (
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Club Catalog</h2>
                                <p className="text-gray-600 text-sm mt-1">Browse all available books</p>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => navigate(`/organizations/${id}/manage`)}
                                    className="flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                                >
                                    <Plus size={18} className="mr-2" />
                                    Add Book
                                </button>
                            )}
                        </div>

                        {books.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {books.map(book => (
                                    <div key={book.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                                        onClick={() => setSelectedBook(book)}
                                    >
                                        <div className="aspect-[2/3] w-full bg-gray-200 relative overflow-hidden">
                                            <img
                                                src={book.coverPhoto || `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`}
                                                alt={book.title}
                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            {book.stock === 0 && (
                                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
                                                    <span className="text-white font-bold text-sm px-3 py-1.5 bg-red-600 rounded-lg shadow-lg">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors" title={book.title}>{book.title}</h3>
                                            <p className="text-xs text-gray-500 truncate mt-1">{book.author}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full font-medium">{book.genre}</span>
                                                <span className={`text-xs font-bold ${book.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {book.stock > 0 ? `${book.stock} left` : '0 left'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                                <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No books yet</h3>
                                <p className="text-gray-500">This club hasn't added any books to their library.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                            <p className="text-gray-600 text-sm mt-1">{members.length} active {members.length === 1 ? 'member' : 'members'}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <ul className="divide-y divide-gray-100">
                                {members.map((member) => (
                                    <li key={member.userId} className="p-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200 group">
                                        <div className="flex items-center">
                                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-lg transition-shadow">
                                                {member.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-5">
                                                <p className="text-base font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">{member.userName}</p>
                                                <p className="text-xs text-gray-500 mt-1">Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {member.role === 'admin' && (
                                                <span className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full shadow-sm">
                                                    Admin
                                                </span>
                                            )}
                                            <button
                                                onClick={() => navigate(`/profile/${member.userId}`)}
                                                className="text-gray-400 hover:text-emerald-600 transition-colors font-medium text-sm"
                                            >
                                                View Profile →
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedBook(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                        <div className="relative h-72 bg-gradient-to-br from-gray-200 to-gray-300">
                            <img
                                src={selectedBook.coverUrl || `https://covers.openlibrary.org/b/title/${encodeURIComponent(selectedBook.title)}-M.jpg`}
                                alt={selectedBook.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                            <button
                                onClick={() => setSelectedBook(null)}
                                className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                            >
                                <X size={20} className="text-gray-700" />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 pr-4">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{selectedBook.title}</h2>
                                    <p className="text-lg text-gray-600 font-medium">{selectedBook.author}</p>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md flex-shrink-0 ${selectedBook.stock > 0 ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700' : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'}`}>
                                    {selectedBook.stock > 0 ? `${selectedBook.stock} Available` : 'Out of Stock'}
                                </span>
                            </div>

                            <div className="flex items-center space-x-4 mb-8">
                                <span className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl text-sm font-semibold text-gray-700 shadow-sm">{selectedBook.genre}</span>
                                <span className="flex items-center text-sm text-gray-600 font-medium">
                                    <BookOpen size={18} className="mr-2 text-emerald-600" />
                                    {selectedBook.condition} Condition
                                </span>
                            </div>

                            <div className="space-y-4">
                                {isMember ? (
                                    <button
                                        onClick={() => handleRequestBook(selectedBook)}
                                        disabled={selectedBook.stock === 0}
                                        className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center text-base shadow-lg
                                            ${selectedBook.stock > 0
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:scale-105'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {selectedBook.stock > 0 ? 'Request to Borrow' : 'Currently Unavailable'}
                                    </button>
                                ) : (
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl text-center border border-emerald-100">
                                        <p className="text-gray-700 mb-4 font-medium">Join this club to borrow books</p>
                                        <button
                                            onClick={handleJoin}
                                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
