import React, { useState, useEffect } from 'react';
import MessageBox from './MessageBox'; // Import the reusable MessageBox component
import useAxiosPrivate from '../api/axiosPrivate'; // For authenticated API calls
import { getCsrfToken } from '../api/axios'; // For fetching CSRF token

const CREATE_COMPANY_URL = import.meta.env.VITE_CREATE_COMPANY_URL || '/api/companies'; // API endpoint for creating companies

const CreateCompanyForm = () => {
    // State for form data
    const [formData, setFormData] = useState({
        companyName: '',
        shortForm: '',
        typeOfJob: '', // 'Upstream' or 'Downstream'
        contactPerson: '',
        officeAddress: '',
        contactNo: '',
        email: '',
        gstin: ''
    });

    // State for UI feedback
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });
    const [csrfToken, setCsrfToken] = useState(''); // State for CSRF token

    const axiosPrivate = useAxiosPrivate(); // Hook for authenticated axios instance

    // Helper function to show message box
    const showMessage = (message, type, details = '') => {
        setMessageBoxContent({ message, type, details });
        setShowMessageBox(true);
    };

    // Fetch CSRF token on component mount
    useEffect(() => {
        const fetchCsrf = async () => {
            try {
                const token = await getCsrfToken();
                setCsrfToken(token);
            } catch (err) {
                console.error('Failed to fetch CSRF token for company form:', err);
                setError('Failed to initialize form. Please refresh the page.');
                showMessage('Initialization failed.', 'error', 'Could not fetch security token. Please refresh.');
            }
        };
        fetchCsrf();
    }, []); // Run only once on mount

    // Handles changes to form input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handles form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setLoading(true); // Set loading state

        // Basic client-side validation
        if (!formData.companyName || !formData.typeOfJob || !formData.contactNo || !formData.email || !formData.gstin) {
            setError('Please fill in all required fields.');
            showMessage('Validation Error', 'error', 'Please fill in all required fields.');
            setLoading(false);
            return;
        }

        // Ensure CSRF token is available
        if (!csrfToken) {
            setError('CSRF token not available. Please refresh the page.');
            showMessage('Security Error', 'error', 'CSRF token missing. Please refresh the page.');
            setLoading(false);
            return;
        }

        try {
            // Send data to the backend
            const response = await axiosPrivate.post(
                CREATE_COMPANY_URL,
                JSON.stringify(formData), // Send form data as JSON
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken, // Include CSRF token
                    },
                    withCredentials: true,
                }
            );

            // Check for successful response
            if (response.status === 201) {
                showMessage('Company created successfully!', 'success', `Company ID: ${response.data._id}`);
                // Reset form fields after successful submission
                setFormData({
                    companyName: '',
                    shortForm: '',
                    typeOfJob: '',
                    contactPerson: '',
                    officeAddress: '',
                    contactNo: '',
                    email: '',
                    gstin: ''
                });
            } else {
                // This block might not be reached if axios throws an error for non-2xx responses
                setError(response.data.message || 'Failed to create company.');
                showMessage('Creation Failed', 'error', response.data.message || 'An unexpected error occurred.');
            }
        } catch (err) {
            console.error('Error creating company:', err);
            if (!err?.response) {
                setError('No Server Response. Please check your network connection.');
                showMessage('Network Error', 'error', 'No server response. Check your internet connection.');
            } else if (err.response?.status === 400) {
                setError(err.response?.data?.message || 'Invalid data provided.');
                showMessage('Validation Error', 'error', err.response?.data?.message || 'Invalid data provided.');
            } else if (err.response?.status === 403) {
                setError(err.response?.data?.message || 'Forbidden: You do not have permission to create a company.');
                showMessage('Permission Denied', 'error', err.response?.data?.message || 'You are not authorized to perform this action.');
            } else {
                setError('Company creation failed. Please try again later.');
                showMessage('Creation Failed', 'error', err.response?.data?.message || 'An unexpected error occurred during company creation.');
            }
        } finally {
            setLoading(false); // Always reset loading state
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md font-inter">
            <h2 className="text-3xl font-bold text-center text-yellow-800 mb-6">Create New Company</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="companyName" className="font-semibold text-gray-700">Company Name:<span className="text-red-500">*</span></label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="e.g., ABC Solutions Pvt Ltd"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* Short Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="shortForm" className="font-semibold text-gray-700">Short Form:</label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            id="shortForm"
                            name="shortForm"
                            value={formData.shortForm}
                            onChange={handleChange}
                            placeholder="e.g., ABC"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* Type of Job */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="typeOfJob" className="font-semibold text-gray-700">Type of Job:<span className="text-red-500">*</span></label>
                    <div className="md:col-span-2">
                        <select
                            id="typeOfJob"
                            name="typeOfJob"
                            value={formData.typeOfJob}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        >
                            <option value="">Select Job Type</option>
                            <option value="Upstream">Upstream</option>
                            <option value="Downstream">Downstream</option>
                        </select>
                    </div>
                </div>

                {/* Contact Person */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="contactPerson" className="font-semibold text-gray-700">Contact Person:</label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            id="contactPerson"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            placeholder="e.g., John Doe"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* Office Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="officeAddress" className="font-semibold text-gray-700">Office Address:</label>
                    <div className="md:col-span-2">
                        <textarea
                            id="officeAddress"
                            name="officeAddress"
                            value={formData.officeAddress}
                            onChange={handleChange}
                            placeholder="Enter full office address"
                            rows="3"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        ></textarea>
                    </div>
                </div>

                {/* Contact No */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="contactNo" className="font-semibold text-gray-700">Contact No:<span className="text-red-500">*</span></label>
                    <div className="md:col-span-2">
                        <input
                            type="tel"
                            id="contactNo"
                            name="contactNo"
                            value={formData.contactNo}
                            onChange={handleChange}
                            placeholder="e.g., +919876543210"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="email" className="font-semibold text-gray-700">Email:<span className="text-red-500">*</span></label>
                    <div className="md:col-span-2">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g., contact@example.com"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* GSTIN */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label htmlFor="gstin" className="font-semibold text-gray-700">GSTIN:<span className="text-red-500">*</span></label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            id="gstin"
                            name="gstin"
                            value={formData.gstin}
                            onChange={handleChange}
                            placeholder="Enter GSTIN (e.g., 22AAAAA1111A1Z1)"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* Error message display */}
                {error && (
                    <p className="text-red-500 text-sm text-center mb-4" role="alert">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="w-full bg-yellow-600 text-white py-3 px-6 rounded-md hover:bg-yellow-700 transition-colors font-bold text-lg flex items-center justify-center"
                    disabled={loading || !csrfToken} // Disable button when loading or CSRF token not ready.
                    aria-live="polite" // Announce changes to assistive technologies.
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        'Create Company'
                    )}
                </button>
            </form>

            {/* Message Box Render */}
            {showMessageBox && (
                <MessageBox
                    message={messageBoxContent.message}
                    type={messageBoxContent.type}
                    details={messageBoxContent.details}
                    onClose={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

export default CreateCompanyForm;
