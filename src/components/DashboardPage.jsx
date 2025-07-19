import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

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

const DashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });

    const assetCategories = ['DTR', 'RMU', 'SWGR', 'CM', 'PSS']; // Used for table headers

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:3000/api/dashboard-summary');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError("Failed to load dashboard data. Please ensure the backend server is running and data is available.");
                setMessageBoxContent({
                    message: `Failed to load dashboard data: ${err.message}`,
                    type: 'error',
                    details: 'Please ensure the backend server is running and data is available.'
                });
                setShowMessageBox(true);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Loading Dashboard data...</p>
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

    if (!dashboardData) {
        return (
            <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-md">
                No dashboard data available.
            </div>
        );
    }

    const { overallProgress, disconnectedCount, activeNTRCount, vendorData, districtData } = dashboardData;

    // Helper to get specific vendor data for charts
    const getVendorChartData = (vendorShortForm) => {
        const vendor = vendorData.find(v => v.vendor === vendorShortForm);
        if (!vendor) return [{ name: 'N/A', value: 1 }]; // Fallback for missing vendor

        const pending = vendor.totalAllocated - vendor.totalInspected;
        return [
            { name: 'Pending', value: pending, color: '#FFD700' }, // Gold
            { name: 'Inspected', value: vendor.totalInspected, color: '#32CD32' }, // LimeGreen
        ];
    };

    // Helper for rendering custom labels in PieChart
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index, name, totalValue }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (value === 0) return null; // Don't show label for zero values

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold text-sm">
                {`${value}`}
            </text>
        );
    };


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen font-inter">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-8">
                Dashboard
            </h1>

            {/* Top Row: Overall Progress, Disconnected, Active NTR, Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Overall Progress */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2">{overallProgress}%</div>
                    <div className="text-lg font-semibold text-gray-700">OVERALL PROGRESS</div>
                </div>

                {/* Disconnected Assets */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
                    <div className="text-5xl font-bold text-red-600 mb-2">{disconnectedCount}</div>
                    <div className="text-lg font-semibold text-gray-700">DISCONNECTED</div>
                </div>

                {/* Active NTR Case */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
                    <div className="text-5xl font-bold text-orange-500 mb-2">{activeNTRCount}</div>
                    <div className="text-lg font-semibold text-gray-700">ACTIVE NTR CASE</div>
                </div>

                {/* Date */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">DATE</div>
                    <div className="text-2xl font-semibold text-gray-700">{new Date().toLocaleDateString('en-GB')}</div>
                </div>
            </div>

            {/* Vendor-wise Progress Donut Charts */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Vendor-wise Progress</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                {['BSPL', 'LBE', 'LBEPC', 'SCPL', 'Virat Corp.'].map(vendorName => {
                    const chartData = getVendorChartData(vendorName);
                    const totalValue = chartData.reduce((sum, entry) => sum + entry.value, 0);
                    const vendorDisplayName = vendorName === 'SCPL' ? 'SCPL' : vendorName; // Adjust for SCPL if needed

                    return (
                        <div key={vendorName} className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{vendorDisplayName}</h3>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={renderCustomizedLabel}
                                        labelLine={false}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Label
                                        value={totalValue}
                                        position="center"
                                        fill="#000"
                                        className="font-bold text-xl"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-2 text-sm">
                                {chartData.map((entry, index) => (
                                    <div key={index} className="flex items-center">
                                        <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: entry.color }}></span>
                                        {entry.name} ({entry.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tables Section */}
            <div className="space-y-8">
                {/* TOTAL (Vendor Wise) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">TOTAL (Vendor Wise)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VENDOR</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL<br/>Allocated</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL<br/>Inspected</th>
                                    {assetCategories.map(cat => (
                                        <React.Fragment key={cat}>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cat}<br/>Allocated</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cat}<br/>Inspected</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendorData.map(vendor => (
                                    <tr key={vendor.vendor}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendor}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor.totalAllocated}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor.totalInspected}</td>
                                        {assetCategories.map(cat => (
                                            <React.Fragment key={cat}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor[cat.toLowerCase()]?.allocated || 0}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor[cat.toLowerCase()]?.inspected || 0}</td>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PENDING (Vendor Wise) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">PENDING (Vendor Wise)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VENDOR</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                                    {assetCategories.map(cat => (
                                        <th key={cat} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cat}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendorData.map(vendor => (
                                    <tr key={vendor.vendor}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendor}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                            {vendor.totalAllocated > 0 ? ((vendor.pending / vendor.totalAllocated) * 100).toFixed(1) + '%' : '0.0%'}
                                        </td>
                                        {assetCategories.map(cat => (
                                            <td key={cat} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                {vendor[cat.toLowerCase()]?.allocated > 0 ? ((vendor[cat.toLowerCase()]?.pending / vendor[cat.toLowerCase()]?.allocated) * 100).toFixed(1) + '%' : '0.0%'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* REPORTED NTR (Vendor Wise) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">REPORTED NTR (Vendor Wise)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VENDOR</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                                    {assetCategories.map(cat => (
                                        <th key={cat} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cat}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendorData.map(vendor => (
                                    <tr key={vendor.vendor}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendor}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor.reportedNTR}</td>
                                        {assetCategories.map(cat => (
                                            <td key={cat} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor[cat.toLowerCase()]?.reportedNTR || 0}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PENDING (Till Date - District Wise) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">PENDING (Till Date - District Wise)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                                    {assetCategories.map(cat => (
                                        <th key={cat} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cat}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {districtData.map(district => (
                                    <tr key={district.district}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{district.district}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{district.totalPending}</td>
                                        {assetCategories.map(cat => (
                                            <td key={cat} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{district[cat.toLowerCase() + 'Pending'] || 0}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ACTIVE NTR (Till Date - District Wise) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">ACTIVE NTR (Till Date - District Wise)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                                    {assetCategories.map(cat => (
                                        <th key={cat} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cat}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {districtData.map(district => (
                                    <tr key={district.district}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{district.district}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{district.totalActiveNTR}</td>
                                        {assetCategories.map(cat => (
                                            <td key={cat} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{district[cat.toLowerCase() + 'ActiveNTR'] || 0}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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

export default DashboardPage;
