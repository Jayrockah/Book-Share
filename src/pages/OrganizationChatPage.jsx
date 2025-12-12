import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';

const OrganizationChatPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        organizations,
        messages,
        sendMessage,
        isOrganizationMember
    } = useData();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [messageText, setMessageText] = useState('');
    const [organization, setOrganization] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const org = organizations.find(o => o.id === id);
        if (org) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOrganization(org);
        }
    }, [id, organizations]);

    useEffect(() => {
        // Filter messages for this organization
        const orgMessages = messages.filter(m => m.organizationId === id);
        // Sort by timestamp
        orgMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setChatMessages(orgMessages);
    }, [id, messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !user) return;

        try {
            await sendMessage(id, user.id, messageText.trim());
            setMessageText('');
        } catch (error) {
            console.error('Error sending message:', error);
            addToast('Failed to send message', 'error');
        }
    };

    if (!organization) return null;

    if (!user || !isOrganizationMember(id, user.id)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center md:pl-64 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">You must be a member of this club to view the chat.</p>
                <button
                    onClick={() => navigate(`/organizations/${id}`)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Go to Club Profile
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 md:pl-64 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(`/organizations/${id}`)}
                        className="mr-3 text-gray-500 hover:text-gray-700 md:hidden"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center">
                        <img
                            src={organization.logoUrl}
                            alt={organization.name}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                        />
                        <div className="ml-3">
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">{organization.name}</h1>
                            <p className="text-xs text-gray-500">General Chat</p>
                        </div>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    chatMessages.map((msg) => {
                        const isMe = msg.userId === user.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                                    {!isMe && (
                                        <p className="text-xs text-gray-500 mb-1 ml-1">{msg.userName}</p>
                                    )}
                                    <div
                                        className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe
                                            ? 'bg-emerald-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 pb-20 md:pb-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className={`p-2 rounded-full ${messageText.trim()
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            } transition-colors`}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OrganizationChatPage;
