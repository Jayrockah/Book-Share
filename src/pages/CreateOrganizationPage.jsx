import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Upload, MapPin, Building, FileText, Image as ImageIcon } from 'lucide-react';

const CreateOrganizationPage = () => {
    const navigate = useNavigate();
    const { createOrganization } = useData();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        city: '',
        location: '',
        description: '',
        logoUrl: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            addToast('Please login to create an organization', 'error');
            return;
        }

        if (!formData.name || !formData.city || !formData.description) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Use a default logo if none provided
            const dataToSubmit = {
                ...formData,
                logoUrl: formData.logoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(formData.name)}`
            };

            const response = await createOrganization(dataToSubmit);
            if (response.success) {
                addToast('Organization created successfully!', 'success');
                navigate(`/organizations/${response.organization.id}`);
            } else {
                addToast(response.message || 'Failed to create organization', 'error');
            }
        } catch (error) {
            console.error('Error creating organization:', error);
            addToast('Failed to create organization', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64 pt-16 md:pt-0">
            <div className="max-w-2xl mx-auto p-4 md:p-8">
                <button
                    onClick={() => navigate('/organizations')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Organizations
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <h1 className="text-2xl font-bold text-gray-900">Create New Book Club</h1>
                        <p className="text-gray-600 mt-1">Start a community for book lovers in your city</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Club Name *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="e.g. Lagos Literary Circle"
                                    required
                                />
                            </div>
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={18} className="text-gray-400" />
                                </div>
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none bg-white"
                                    required
                                >
                                    <option value="">Select a city</option>
                                    <option value="Lagos">Lagos</option>
                                    <option value="Abuja">Abuja</option>
                                    <option value="Port Harcourt">Port Harcourt</option>
                                    <option value="Ibadan">Ibadan</option>
                                    <option value="Kano">Kano</option>
                                    <option value="Enugu">Enugu</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Specific Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Meeting Location (Optional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="e.g. 15 Awolowo Road, Ikoyi"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Where do you usually meet? Can be updated later.</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <FileText size={18} className="text-gray-400" />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="Tell us about your club, what kind of books you read, and who should join..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Logo URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Logo URL (Optional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ImageIcon size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="url"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Leave blank to generate a random logo.</p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </span>
                                ) : (
                                    'Create Book Club'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateOrganizationPage;
