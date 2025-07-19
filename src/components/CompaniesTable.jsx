import React, { useState, useEffect } from 'react';
import MessageBox from './MessageBox'; // Import the reusable MessageBox component
import useAxiosPrivate from '../api/axiosPrivate'; // For authenticated API calls
import { getCsrfToken } from '../api/axios'; // For fetching CSRF token

// Define the API URL for companies.
const COMPANIES_API_URL = import.meta.env.VITE_COMPANIES_API_URL || '/api/companies';

// Company Edit Modal Component (moved inside CompaniesTable for simplicity, or can be a separate file)
const CompanyEditModal = ({ company, onClose, onSave }) => {
    // Initialize editFormData with only the editable fields from the company object
    const [editFormData, setEditFormData] = useState({
        companyName: company.companyName || '',
        shortForm: company.shortForm || '',
        typeOfJob: company.typeOfJob || '',
        contactPerson: company.contactPerson || '',
        officeAddress: company.officeAddress || '',
        contactNo: company.contactNo || '',
        email: company.email || '',
        gstin: company.gstin || '',
        _id: company._id // Keep _id for the PUT request URL
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });
    const [csrfToken, setCsrfToken] = useState('');

    const axiosPrivate = useAxiosPrivate();

    const showMessage = (message, type, details = '') => {
        setMessageBoxContent({ message, type, details });
        setShowMessageBox(true);
    };

    useEffect(() => {
        const fetchCsrf = async () => {
            try {
                const token = await getCsrfToken();
                setCsrfToken(token);
            } catch (err) {
                console.error('Failed to fetch CSRF token for edit modal:', err);
                setError('Failed to initialize form. Please refresh the page.');
                showMessage('Initialization failed.', 'error', 'Could not fetch security token.');
            }
        };
        fetchCsrf();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Client-side validation: Ensure all required fields are filled
        if (!editFormData.companyName || !editFormData.typeOfJob || !editFormData.contactNo || !editFormData.email || !editFormData.gstin) {
            setError('Please fill in all required fields.');
            showMessage('Validation Error', 'error', 'Please fill in all required fields.');
            setLoading(false);
            return;
        }

        if (!csrfToken) {
            setError('CSRF token not available. Please refresh the page.');
            showMessage('Security Error', 'error', 'CSRF token missing. Please refresh the page.');
            setLoading(false);
            return;
        }

        try {
            // Construct the data payload with ONLY the fields that can be updated by the user
            const dataToSend = {
                companyName: editFormData.companyName,
                shortForm: editFormData.shortForm,
                typeOfJob: editFormData.typeOfJob,
                contactPerson: editFormData.contactPerson,
                officeAddress: editFormData.officeAddress,
                contactNo: editFormData.contactNo,
                email: editFormData.email,
                gstin: editFormData.gstin
            };

            const response = await axiosPrivate.put(
                `${COMPANIES_API_URL}/${editFormData._id}`, // Use _id from editFormData for the URL
                JSON.stringify(dataToSend), // Send only the explicitly chosen data
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken,
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                showMessage('Company updated successfully!', 'success');
                onSave(response.data); // Pass updated company data back to parent
                onClose(); // Close modal
            } else {
                setError(response.data.message || 'Failed to update company.');
                showMessage('Update Failed', 'error', response.data.message || 'An unexpected error occurred.');
            }
        } catch (err) {
            console.error('Error updating company:', err);
            if (!err?.response) {
                setError('No Server Response. Please check your network connection.');
                showMessage('Network Error', 'error', 'No server response. Check your internet connection.');
            } else if (err.response?.status === 400) {
                setError(err.response?.data?.message || 'Invalid data provided.');
                showMessage('Validation Error', 'error', err.response?.data?.message || 'Invalid data provided.');
            } else if (err.response?.status === 403) {
                setError(err.response?.data?.message || 'Forbidden: You do not have permission to update this company.');
                showMessage('Permission Denied', 'error', err.response?.data?.message || 'You are not authorized to perform this action.');
            } else {
                setError('Company update failed. Please try again later.');
                showMessage('Update Failed', 'error', err.response?.data?.message || 'An unexpected error occurred during company update.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Edit Company</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    {/* Form fields */}
                    <div>
                        <label htmlFor="editCompanyName" className="block text-gray-700 text-sm font-medium mb-1">Company Name:</label>
                        <input
                            type="text"
                            id="editCompanyName"
                            name="companyName"
                            value={editFormData.companyName}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="editShortForm" className="block text-gray-700 text-sm font-medium mb-1">Short Form:</label>
                        <input
                            type="text"
                            id="editShortForm"
                            name="shortForm"
                            value={editFormData.shortForm}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="editTypeOfJob" className="block text-gray-700 text-sm font-medium mb-1">Type of Job:</label>
                        <select
                            id="editTypeOfJob"
                            name="typeOfJob"
                            value={editFormData.typeOfJob}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">Select Job Type</option>
                            <option value="Upstream">Upstream</option>
                            <option value="Downstream">Downstream</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="editContactPerson" className="block text-gray-700 text-sm font-medium mb-1">Contact Person:</label>
                        <input
                            type="text"
                            id="editContactPerson"
                            name="contactPerson"
                            value={editFormData.contactPerson}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="editOfficeAddress" className="block text-gray-700 text-sm font-medium mb-1">Office Address:</label>
                        <textarea
                            id="editOfficeAddress"
                            name="officeAddress"
                            value={editFormData.officeAddress}
                            onChange={handleChange}
                            rows="3"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="editContactNo" className="block text-gray-700 text-sm font-medium mb-1">Contact No:</label>
                        <input
                            type="tel"
                            id="editContactNo"
                            name="contactNo"
                            value={editFormData.contactNo}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="editEmail" className="block text-gray-700 text-sm font-medium mb-1">Email:</label>
                        <input
                            type="email"
                            id="editEmail"
                            name="email"
                            value={editFormData.email}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="editGstin" className="block text-gray-700 text-sm font-medium mb-1">GSTIN:</label>
                        <input
                            type="text"
                            id="editGstin"
                            name="gstin"
                            value={editFormData.gstin}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center" role="alert">{error}</p>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            disabled={loading || !csrfToken}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
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
        </div>
    );
};

// CompaniesTable component to display, edit, and delete company data
const CompaniesTable = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });
    const [csrfToken, setCsrfToken] = useState('');

    const axiosPrivate = useAxiosPrivate();

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
                console.error('Failed to fetch CSRF token for companies table:', err);
                setError('Failed to initialize. Please refresh the page.');
                showMessage('Initialization failed.', 'error', 'Could not fetch security token. Please refresh.');
            }
        };
        fetchCsrf();
    }, []);

    // Function to fetch companies data
    const fetchCompanies = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosPrivate.get(COMPANIES_API_URL);
            setCompanies(response.data);
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError('Failed to load companies data. Please try again.');
            showMessage('Data Fetch Failed', 'error', err.response?.data?.message || 'Could not load companies data.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch companies on component mount and when axiosPrivate is ready
    useEffect(() => {
        fetchCompanies();
    }, [axiosPrivate]);

    // Handle edit button click
    const handleEditClick = (company) => {
        setCompanyToEdit(company);
        setShowEditModal(true);
    };

    // Handle save after edit
    const handleCompanySaved = (updatedCompany) => {
        setCompanies(prevCompanies =>
            prevCompanies.map(comp => (comp._id === updatedCompany._id ? updatedCompany : comp))
        );
        setShowEditModal(false);
        showMessage('Company updated successfully!', 'success');
    };

    // Handle delete button click
    const handleDeleteClick = (company) => {
        setCompanyToDelete(company);
        setShowDeleteConfirm(true);
    };

    // Handle confirmation of delete
    const handleConfirmDelete = async () => {
        if (!companyToDelete) return;

        setLoading(true);
        setShowDeleteConfirm(false); // Close confirmation modal

        if (!csrfToken) {
            showMessage('Security Error', 'error', 'CSRF token missing. Cannot perform delete.');
            setLoading(false);
            return;
        }

        try {
            const response = await axiosPrivate.delete(`${COMPANIES_API_URL}/${companyToDelete._id}`, {
                headers: {
                    'X-CSRF-Token': csrfToken,
                },
                withCredentials: true,
            });

            if (response.status === 200) {
                setCompanies(prevCompanies =>
                    prevCompanies.filter(comp => comp._id !== companyToDelete._id)
                );
                showMessage('Company deleted successfully!', 'success');
            } else {
                showMessage('Deletion Failed', 'error', response.data.message || 'An unexpected error occurred during deletion.');
            }
        } catch (err) {
            console.error('Error deleting company:', err);
            showMessage('Deletion Failed', 'error', err.response?.data?.message || 'An unexpected error occurred during deletion.');
        } finally {
            setLoading(false);
            setCompanyToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
                <p className="text-xl text-gray-700 animate-pulse">Loading companies...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 font-inter">
                <h2 className="text-2xl font-bold text-red-800 mb-4">Error</h2>
                <p className="text-lg text-red-700 mb-8 text-center">{error}</p>
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
    }

    return (
        <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md font-inter">
            <h2 className="text-3xl font-bold text-center text-blue-800 mb-6">Companies List</h2>

            {companies.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No companies found. Please create a new company.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Form</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact No</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {companies.map((company) => (
                                <tr key={company._id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{company.companyName}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{company.shortForm}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{company.typeOfJob}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{company.contactPerson}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{company.contactNo}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{company.email}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{company.gstin}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEditClick(company)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            title="Edit Company"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(company)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete Company"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal Render */}
            {showEditModal && companyToEdit && (
                <CompanyEditModal
                    company={companyToEdit}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleCompanySaved}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <MessageBox
                    message="Are you sure you want to delete this company?"
                    type="error"
                    onClose={() => setShowDeleteConfirm(false)}
                    details={
                        <div className="flex justify-center space-x-4 mt-4">
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    }
                />
            )}

            {/* General Message Box */}
            {showMessageBox && !showDeleteConfirm && ( // Ensure it doesn't show if delete confirm is active
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

export default CompaniesTable;
