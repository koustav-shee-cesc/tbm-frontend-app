import React, { useState, useEffect } from 'react';

// Reusable Message Box Component
const MessageBox = ({ message, type, onClose, details = '' }) => {
    const bgColor = type === 'success' ? 'bg-blue-600' : 'bg-red-600';
    const hoverColor = type === 'success' ? 'hover:bg-blue-700' : 'hover:bg-red-700';
    const titleColor = type === 'success' ? 'text-blue-600' : 'text-red-600';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
                <h3 className={`text-xl font-semibold mb-4 ${titleColor}`}>{type === 'success' ? 'Success!' : 'Error!'}</h3>
                <p className="mb-2">{message}</p>
                {details && <p className="text-sm text-gray-600 mb-6">{details}</p>}
                <button
                    onClick={onClose}
                    className={`px-6 py-2 text-white rounded-md transition-colors ${bgColor} ${hoverColor}`}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const MemberTable = () => {
    const [members, setMembers] = useState([]);
    const [companies, setCompanies] = useState([]); // State to store companies for dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingMember, setEditingMember] = useState(null); // Member currently being edited
    const [showEditModal, setShowEditModal] = useState(false); // State to control modal visibility

    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    // Fetch members and companies on component mount
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                // Fetch companies first
                const companiesResponse = await fetch('http://localhost:3000/api/companies');
                if (!companiesResponse.ok) throw new Error(`HTTP error! status: ${companiesResponse.status} for companies`);
                const companiesData = await companiesResponse.json();
                setCompanies(companiesData);

                // Then fetch members
                const membersResponse = await fetch('http://localhost:3000/api/members');
                if (!membersResponse.ok) throw new Error(`HTTP error! status: ${membersResponse.status} for members`);
                const membersData = await membersResponse.json();
                setMembers(membersData);

            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Failed to load data. Please ensure the backend server is running.");
                setMessageBoxContent({
                    message: `Failed to load data: ${err.message}`,
                    type: 'error',
                    details: 'Please ensure the backend server is running and data is available.'
                });
                setShowMessageBox(true);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // Handle opening the edit modal
    const handleEditClick = (member) => {
        // Ensure dates are formatted as YYYY-MM-DD for input type="date"
        setEditingMember({
            ...member,
            dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
            dateOfJoining: member.dateOfJoining ? new Date(member.dateOfJoining).toISOString().split('T')[0] : '',
        });
        setShowEditModal(true);
    };

    // Handle changes in the edit modal form
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingMember(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle submitting the edited member data
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingMember) return;

        // CRUCIAL FIX: Filter out Mongoose internal fields before sending
        const { _id, createdAt, updatedAt, __v, password, ...dataToSend } = editingMember;

        try {
            const response = await fetch(`http://localhost:3000/api/members/${_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend), // Send cleaned data
            });

            const result = await response.json();

            if (response.ok) {
                setMessageBoxContent({
                    message: 'Member updated successfully!',
                    type: 'success'
                });
                setShowMessageBox(true);
                setShowEditModal(false);
                // Update the members list in state
                setMembers(prevMembers =>
                    prevMembers.map(member => (member._id === _id ? result.data : member))
                );
            } else {
                setMessageBoxContent({
                    message: `Error updating member: ${result.message || 'Unknown error'}`,
                    type: 'error',
                    details: JSON.stringify(result.errors || '')
                });
                setShowMessageBox(true);
                console.error('Update error:', result.errors || result.error);
            }
        } catch (err) {
            console.error('Network error during update:', err);
            setMessageBoxContent({
                message: 'Network error: Could not connect to the server.',
                type: 'error'
            });
            setShowMessageBox(true);
        }
    };

    // Handle deleting a member
    const handleDeleteClick = async (memberId) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            try {
                const response = await fetch(`http://localhost:3000/api/members/${memberId}`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (response.ok) {
                    setMessageBoxContent({
                        message: 'Member deleted successfully!',
                        type: 'success'
                    });
                    setShowMessageBox(true);
                    setMembers(prevMembers => prevMembers.filter(member => member._id !== memberId));
                } else {
                    setMessageBoxContent({
                        message: `Error deleting member: ${result.message || 'Unknown error'}`,
                        type: 'error',
                        details: JSON.stringify(result.errors || '')
                    });
                    setShowMessageBox(true);
                    console.error('Delete error:', result.errors || result.error);
                }
            } catch (err) {
                console.error('Network error during delete:', err);
                setMessageBoxContent({
                    message: 'Network error: Could not connect to the server.',
                    type: 'error'
                });
                setShowMessageBox(true);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Loading members...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-red-100 text-red-700 p-4 rounded-lg">
                <p className="text-lg">{error}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-8">
                Member Management
            </h1>

            {members.length === 0 ? (
                <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-md">
                    No members found. Please add members.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">
                                    Company Name
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Vendor
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Member Name
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Designation
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Qualification
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Employee Code
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Contact No
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Email ID
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    PF No
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Date of Birth
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Date of Joining
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Access Level
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {members.map((member) => (
                                <tr key={member._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {member.companyName}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.vendor || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.memberName}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.designation || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.educationalQualification || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.employeeCode || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.contactNo}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.emailId}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.pfNo || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(member.dateOfBirth)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(member.dateOfJoining)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {member.accessLevel}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditClick(member)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(member._id)}
                                            className="text-red-600 hover:text-red-900"
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

            {/* Edit Member Modal */}
            {showEditModal && editingMember && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Member</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            {/* Company Name (Dropdown) */}
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                                <select
                                    id="companyName"
                                    name="companyName"
                                    value={editingMember.companyName}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                >
                                    {companies.map(company => (
                                        <option key={company._id} value={company.companyName}>{company.companyName}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Member Name */}
                            <div>
                                <label htmlFor="memberName" className="block text-sm font-medium text-gray-700">Member Name</label>
                                <input
                                    type="text"
                                    id="memberName"
                                    name="memberName"
                                    value={editingMember.memberName}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            {/* Designation */}
                            <div>
                                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Designation</label>
                                <input
                                    type="text"
                                    id="designation"
                                    name="designation"
                                    value={editingMember.designation || ''}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            {/* Educational Qualification */}
                            <div>
                                <label htmlFor="educationalQualification" className="block text-sm font-medium text-gray-700">Educational Qualification</label>
                                <input
                                    type="text"
                                    id="educationalQualification"
                                    name="educationalQualification"
                                    value={editingMember.educationalQualification || ''}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            {/* Employee Code */}
                            <div>
                                <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700">Employee Code</label>
                                <input
                                    type="text"
                                    id="employeeCode"
                                    name="employeeCode"
                                    value={editingMember.employeeCode || ''}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            {/* Contact No */}
                            <div>
                                <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700">Contact No</label>
                                <input
                                    type="text"
                                    id="contactNo"
                                    name="contactNo"
                                    value={editingMember.contactNo}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            {/* Email ID */}
                            <div>
                                <label htmlFor="emailId" className="block text-sm font-medium text-gray-700">Email ID</label>
                                <input
                                    type="email"
                                    id="emailId"
                                    name="emailId"
                                    value={editingMember.emailId}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            {/* PF No */}
                            <div>
                                <label htmlFor="pfNo" className="block text-sm font-medium text-gray-700">PF No</label>
                                <input
                                    type="text"
                                    id="pfNo"
                                    name="pfNo"
                                    value={editingMember.pfNo || ''}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            {/* Date of Birth */}
                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={editingMember.dateOfBirth || ''}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            {/* Date of Joining */}
                            <div>
                                <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700">Date of Joining</label>
                                <input
                                    type="date"
                                    id="dateOfJoining"
                                    name="dateOfJoining"
                                    value={editingMember.dateOfJoining || ''}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            {/* Access Level */}
                            <div>
                                <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700">Access Level</label>
                                <select
                                    id="accessLevel"
                                    name="accessLevel"
                                    value={editingMember.accessLevel}
                                    onChange={handleEditChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Viewer">Viewer</option>
                                    <option value="Editor">Editor</option>
                                    <option value="User">User</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

export default MemberTable;
