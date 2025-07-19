import React, { useState, useEffect } from 'react';

// MasterAllocationTable component to display allocation data
const MasterAllocationTable = () => {
    // State to store the fetched master allocation data
    const [allocations, setAllocations] = useState([]);
    // State to manage loading status
    const [loading, setLoading] = useState(true);
    // State to store any error messages
    const [error, setError] = useState(null);

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        // Check if the date is valid before formatting
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
    };

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchAllocations = async () => {
            try {
                // Fetch data from the consolidated backend API
                const response = await fetch('http://localhost:3000/api/master-allocations');
                if (!response.ok) {
                    // If response is not OK, throw an error
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // Parse the JSON response
                const data = await response.json();
                // Update the allocations state with fetched data
                setAllocations(data);
            } catch (err) {
                // Catch and set any errors during the fetch operation
                console.error("Failed to fetch master allocations:", err);
                setError("Failed to load allocations. Please try again later.");
            } finally {
                // Set loading to false once data fetching is complete (whether success or error)
                setLoading(false);
            }
        };

        fetchAllocations(); // Call the fetch function
    }, []); // Empty dependency array ensures this runs only once on mount

    // Render loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Loading master allocations...</p>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-red-100 text-red-700 p-4 rounded-lg">
                <p className="text-lg">{error}</p>
            </div>
        );
    }

    // Render the table if data is loaded successfully
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-8">
                Master Allocation Dashboard
            </h1>

            {allocations.length === 0 ? (
                <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-md">
                    No master allocation data available. Please upload a file.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">
                                    Asset No
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Category
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Asset Name
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    District
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    KV
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Month
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Year
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Vendor
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Upload Date
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Inspection Date
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    SM Entry Date
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">
                                    CM Entry Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allocations.map((allocation) => (
                                <tr key={allocation._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {allocation.assetNo}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {allocation.category}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {allocation.assetName}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {allocation.district}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {allocation.kv}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 capitalize">
                                        {allocation.month}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {allocation.year}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 uppercase">
                                        {allocation.vendorShortForm || 'N/A'} {/* Display vendorShortForm */}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(allocation.uploadDate)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(allocation.inspectionDate)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {allocation.status}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(allocation.smEntryDate)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(allocation.cmEntryDate)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MasterAllocationTable;
