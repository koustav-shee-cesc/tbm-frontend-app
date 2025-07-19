import React, { useState, useEffect } from 'react';

// Reusable Message Box Component (copied for self-containment)
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

const TodaysTBMPage = () => {
    const [todaysTBMData, setTodaysTBMData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null); // State to manage expanded row
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [filterTeamName, setFilterTeamName] = useState('');
    const [companies, setCompanies] = useState([]); // For team name filter dropdown

    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
    };

    // Fetch companies for the filter dropdown
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/companies');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCompanies(data);
            } catch (error) {
                console.error("Failed to fetch companies for filter:", error);
                setMessageBoxContent({
                    message: `Failed to load companies for filter: ${error.message}`,
                    type: 'error',
                    details: 'Please ensure the backend server is running.'
                });
                setShowMessageBox(true);
            }
        };
        fetchCompanies();
    }, []);

    // Fetch Todays TBM data based on filters
    useEffect(() => {
        const fetchTodaysTBMData = async () => {
            setLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams();
                if (filterDate) {
                    queryParams.append('date', filterDate);
                }
                if (filterTeamName) {
                    queryParams.append('teamName', filterTeamName);
                }

                const response = await fetch(`http://localhost:3000/api/todays-tbm?${queryParams.toString()}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setTodaysTBMData(data);
            } catch (err) {
                console.error("Failed to fetch Todays TBM data:", err);
                setError("Failed to load Todays TBM data. Please ensure the backend server is running.");
                setMessageBoxContent({
                    message: `Failed to load Todays TBM data: ${err.message}`,
                    type: 'error',
                    details: 'Please ensure the backend server is running and data is available.'
                });
                setShowMessageBox(true);
            } finally {
                setLoading(false);
            }
        };
        fetchTodaysTBMData();
    }, [filterDate, filterTeamName]);

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Loading Todays TBM data...</p>
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
                Todays TBM (Toolbox Meeting)
            </h1>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-1">Filter by Date:</label>
                    <input
                        type="date"
                        id="filterDate"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="filterTeamName" className="block text-sm font-medium text-gray-700 mb-1">Filter by Team Name:</label>
                    <select
                        id="filterTeamName"
                        value={filterTeamName}
                        onChange={(e) => setFilterTeamName(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="">All Teams</option>
                        {companies.map(company => (
                            <option key={company._id} value={company.companyName}>
                                {company.companyName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>


            {todaysTBMData.length === 0 ? (
                <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-md">
                    No TBM data found for the selected criteria.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">
                                    Date
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Team Name
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Team Members
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Asset Name
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Connection Status
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {todaysTBMData.map((data) => (
                                <React.Fragment key={data._id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatDate(data.checklistDate)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            {data.teamName}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            {data.teamMembers.join(', ')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            {data.assetNameDS}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            {data.connectionStatusDS}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => toggleRow(data._id)}
                                                className="text-blue-600 hover:text-blue-900 focus:outline-none"
                                            >
                                                {expandedRow === data._id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRow === data._id && (
                                        <tr className="bg-gray-100">
                                            <td colSpan="6" className="px-4 py-4 text-sm text-gray-800">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {/* Pre-Site Details */}
                                                    <div className="p-3 bg-white rounded-md shadow-sm">
                                                        <h4 className="font-semibold text-gray-700 mb-2">Pre-Site Checklist Details:</h4>
                                                        <p><strong>Type of Job:</strong> {data.typeOfJobPreSite}</p>
                                                        <p><strong>DMS Checked:</strong> {data.dmsCheckedPreSite}</p>
                                                        <p><strong>Site Checklists Taken:</strong> {data.siteChecklistsTakenPreSite}</p>
                                                        <p><strong>Route Maps Taken:</strong> {data.routeMapsTakenPreSite}</p>
                                                        <p><strong>PPEs Taken:</strong> {data.ppesTakenPreSite.join(', ')}</p>
                                                        <p><strong>PPEs Condition:</strong> {data.ppesConditionPreSite}</p>
                                                        <p><strong>Torch Taken:</strong> {data.torchTakenPreSite}</p>
                                                        <p><strong>Proper Keys Taken:</strong> {data.properKeysTakenPreSite}</p>
                                                        <p><strong>Sanitizer/Mask:</strong> {data.sanitizerMaskAvailablePreSite}</p>
                                                        <p><strong>Team Fit:</strong> {data.teamFitPreSite}</p>
                                                        <p><strong>Remarks:</strong> {data.remarksPreSite || 'N/A'}</p>
                                                    </div>

                                                    {/* DS Site Details */}
                                                    <div className="p-3 bg-white rounded-md shadow-sm">
                                                        <h4 className="font-semibold text-gray-700 mb-2">DS Site Checklist Details:</h4>
                                                        <p><strong>Asset Type:</strong> {data.assetTypeDS}</p>
                                                        <p><strong>District:</strong> {data.districtDS}</p>
                                                        <p><strong>Asset Name Not Listed:</strong> {data.assetNameNotListedDS}</p>
                                                        {data.specifyAssetNameDS && <p><strong>Specified Asset Name:</strong> {data.specifyAssetNameDS}</p>}
                                                        {data.slNoDS && <p><strong>SL No:</strong> {data.slNoDS}</p>}
                                                        {data.photoSlNoPathDS && <p><strong>Photo SL No Path:</strong> {data.photoSlNoPathDS}</p>}
                                                        <p><strong>Test Status:</strong> {data.testStatusDS}</p>
                                                        {data.photoNTRPathDS && <p><strong>Photo NTR Path:</strong> {data.photoNTRPathDS}</p>}
                                                        <p><strong>Access to Asset:</strong> {data.accessToAssetDS || 'N/A'}</p>
                                                        <p><strong>Proper Illumination:</strong> {data.properIlluminationDS || 'N/A'}</p>
                                                        <p><strong>Bare Live Components:</strong> {data.bareLiveComponentsDS || 'N/A'}</p>
                                                        <p><strong>HT/LT Box Confirmed:</strong> {data.htLtBoxConfirmedDS || 'N/A'}</p>
                                                        <p><strong>HT Components:</strong> {data.htComponentsDS || 'N/A'}</p>
                                                        <p><strong>Abnormalities Observed:</strong> {data.abnormalitiesObservedDS || 'N/A'}</p>
                                                        {data.othersAbnormalitiesDS && <p><strong>Other Abnormalities:</strong> {data.othersAbnormalitiesDS}</p>}
                                                        <p><strong>Sign Writing Checked:</strong> {data.signWritingCheckedDS.join(', ') || 'N/A'}</p>
                                                        <p><strong>Team Members Worn PPEs:</strong> {data.teamMembersWornPPEsDS || 'N/A'}</p>
                                                        <p><strong>Remarks:</strong> {data.remarksDS || 'N/A'}</p>
                                                    </div>

                                                    {/* Merged Remarks */}
                                                    <div className="p-3 bg-white rounded-md shadow-sm col-span-full">
                                                        <h4 className="font-semibold text-gray-700 mb-2">Merged Remarks:</h4>
                                                        <p className="whitespace-pre-wrap">{data.mergedRemarks}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
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

export default TodaysTBMPage;
