import React, { useState, useEffect } from 'react';
import MessageBox from './MessageBox'; // Import the reusable MessageBox component
import useAxiosPrivate from '../api/axiosPrivate'; // For authenticated API calls
import { getCsrfToken } from '../api/axios'; // For fetching CSRF token
import useAuth from '../hooks/useAuth'; // To get the logged-in user's info

// Define the API URL for members.
const MEMBERS_API_URL = import.meta.env.VITE_MEMBERS_API_URL || '/api/members';
const COMPANIES_API_URL = import.meta.env.VITE_COMPANIES_API_URL || '/api/companies';

// Define numeric role codes for frontend use (must match backend)
const ROLES_MAP = {
    'User': 100,
    'Editor': 200,
    'Admin': 999,
};

const CreateMemberForm = () => {
    const { auth } = useAuth(); // Get auth context to access logged-in user's info

    const [formData, setFormData] = useState({
        companyId: '', // To store the selected company's _id
        memberName: '',
        designation: '',
        educationalQualification: '',
        employeeCode: '',
        contactNo: '',
        emailId: '', // Member's contact email, will also derive user email
        pfNo: '',
        dateOfBirth: '',
        dateOfJoining: '',
        accessLevel: 'User', // Default access level, will map to user role
        // createdBy will be set automatically from auth.user.username, not in formData state
    });
    const [companies, setCompanies] = useState([]); // State to hold companies for dropdown
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });
    const [loading, setLoading] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');

    const axiosPrivate = useAxiosPrivate();

    const showMessage = (message, type, details = '') => {
        setMessageBoxContent({ message, type, details });
        setShowMessageBox(true);
    };

    useEffect(() => {
        const fetchCsrfAndCompanies = async () => {
            try {
                const token = await getCsrfToken();
                setCsrfToken(token);

                const companiesResponse = await axiosPrivate.get(COMPANIES_API_URL);
                setCompanies(companiesResponse.data);
            } catch (err) {
                console.error('Failed to fetch CSRF token or companies:', err);
                showMessage('Initialization Failed', 'error', 'Could not load necessary data. Please refresh.');
            }
        };
        fetchCsrfAndCompanies();
    }, [axiosPrivate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Derived username from memberName (e.g., "John Doe" -> "john.doe")
    const derivedUsername = formData.memberName
        ? formData.memberName.toLowerCase().replace(/\s+/g, '.')
        : '';

    // Derived email from emailId
    const derivedEmail = formData.emailId;

    // Derived roles from accessLevel
    const derivedRoles = [ROLES_MAP[formData.accessLevel]]; // Ensure it's an array of numbers

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setShowMessageBox(false); // Hide previous message box

        if (!csrfToken) {
            showMessage('Security Error', 'error', 'CSRF token missing. Please refresh the page.');
            setLoading(false);
            return;
        }

        // Basic client-side validation for required fields
        if (!formData.companyId || !formData.memberName || !formData.contactNo || !formData.emailId || !formData.accessLevel) {
            showMessage('Validation Error', 'error', 'Please fill in all required fields.');
            setLoading(false);
            return;
        }

        // Prepare data to send, including derived user details and auto-set createdBy
        const dataToSend = {
            // User details (derived)
            username: derivedUsername,
            email: derivedEmail,
            password: "P@ssword", // Default password as per instruction
            roles: derivedRoles,

            // Member details
            companyId: formData.companyId,
            memberName: formData.memberName,
            designation: formData.designation,
            educationalQualification: formData.educationalQualification,
            employeeCode: formData.employeeCode,
            contactNo: formData.contactNo,
            emailId: formData.emailId, // Member's contact email
            pfNo: formData.pfNo,
            dateOfBirth: formData.dateOfBirth || null, // Send null if empty
            dateOfJoining: formData.dateOfJoining || null, // Send null if empty
            accessLevel: formData.accessLevel,
            createdBy: auth.user?.username || 'System', // Auto-set from logged-in user or 'System' fallback
        };

        try {
            const response = await axiosPrivate.post(
                MEMBERS_API_URL,
                JSON.stringify(dataToSend),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken,
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 201) {
                showMessage('Member created successfully!', 'success', `New member: ${response.data.memberName} (User: ${response.data.userRef.username})`);
                // Reset form
                setFormData({
                    companyId: '',
                    memberName: '',
                    designation: '',
                    educationalQualification: '',
                    employeeCode: '',
                    contactNo: '',
                    emailId: '',
                    pfNo: '',
                    dateOfBirth: '',
                    dateOfJoining: '',
                    accessLevel: 'User',
                });
            } else {
                showMessage('Creation Failed', 'error', response.data.message || 'An unexpected error occurred.');
            }
        } catch (err) {
            console.error('Error creating member:', err);
            if (!err?.response) {
                showMessage('Network Error', 'error', 'No server response. Check your internet connection.');
            } else if (err.response?.status === 400) {
                const details = err.response?.data?.errors ? err.response.data.errors.join(', ') : (err.response?.data?.message || 'Invalid data provided.');
                showMessage('Validation Error', 'error', details);
            } else if (err.response?.status === 403) {
                showMessage('Permission Denied', 'error', err.response?.data?.message || 'You are not authorized to perform this action.');
            } else {
                showMessage('Creation Failed', 'error', err.response?.data?.message || 'An unexpected error occurred during member creation.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md font-inter">
            <h2 className="text-3xl font-bold text-center text-green-800 mb-6">Create New Member</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Member Details Section */}
                <div className="bg-blue-50 p-4 rounded-md shadow-sm">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Member Details</h3>

                    {/* Company */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="companyId" className="font-semibold text-gray-700">Company:<span className="text-red-500">*</span></label>
                        <div className="md:col-span-2">
                            <select
                                id="companyId"
                                name="companyId"
                                value={formData.companyId}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">Select a Company</option>
                                {companies.map(company => (
                                    <option key={company._id} value={company._id}>
                                        {company.companyName} ({company.shortForm})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Member Name */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="memberName" className="font-semibold text-gray-700">Member Name:<span className="text-red-500">*</span></label>
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                id="memberName"
                                name="memberName"
                                value={formData.memberName}
                                onChange={handleChange}
                                placeholder="e.g., Jane Doe"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Contact Email (for member, also used for user account email) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="emailId" className="font-semibold text-gray-700">Contact Email:<span className="text-red-500">*</span></label>
                        <div className="md:col-span-2">
                            <input
                                type="email"
                                id="emailId"
                                name="emailId"
                                value={formData.emailId}
                                onChange={handleChange}
                                placeholder="e.g., jane.contact@example.com"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Access Level (for member, maps to user role) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="accessLevel" className="font-semibold text-gray-700">Access Level:<span className="text-red-500">*</span></label>
                        <div className="md:col-span-2">
                            <select
                                id="accessLevel"
                                name="accessLevel"
                                value={formData.accessLevel}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="User">User</option>
                                <option value="Editor">Editor</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Other Member Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4 mt-6">
                        <label htmlFor="designation" className="font-semibold text-gray-700">Designation:</label>
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                id="designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                placeholder="e.g., Engineer"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="educationalQualification" className="font-semibold text-gray-700">Education:</label>
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                id="educationalQualification"
                                name="educationalQualification"
                                value={formData.educationalQualification}
                                onChange={handleChange}
                                placeholder="e.g., B.Tech"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="employeeCode" className="font-semibold text-gray-700">Employee Code:</label>
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                id="employeeCode"
                                name="employeeCode"
                                value={formData.employeeCode}
                                onChange={handleChange}
                                placeholder="e.g., EMP12345"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
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
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="pfNo" className="font-semibold text-gray-700">PF No:</label>
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                id="pfNo"
                                name="pfNo"
                                value={formData.pfNo}
                                onChange={handleChange}
                                placeholder="e.g., PF1234567"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="dateOfBirth" className="font-semibold text-gray-700">Date of Birth:</label>
                        <div className="md:col-span-2">
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-4">
                        <label htmlFor="dateOfJoining" className="font-semibold text-gray-700">Date of Joining:</label>
                        <div className="md:col-span-2">
                            <input
                                type="date"
                                id="dateOfJoining"
                                name="dateOfJoining"
                                value={formData.dateOfJoining}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors font-bold text-lg"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Member'}
                </button>
            </form>

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

export default CreateMemberForm;
