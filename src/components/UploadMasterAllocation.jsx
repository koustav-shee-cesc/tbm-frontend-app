import React, { useState } from 'react';
import ExcelJS from 'exceljs'; // Import ExcelJS library for parsing

// Reusable Message Box Component (copied from previous forms)
const MessageBox = ({ message, type, onClose, details = '' }) => {
    const bgColor = type === 'success' ? 'bg-blue-600' : 'bg-red-600';
    const hoverColor = type === 'success' ? 'hover:bg-blue-700' : 'hover:bg-red-700';
    const titleColor = type === 'success' ? 'text-blue-600' : 'text-red-600';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
                <h3 className={`text-xl font-semibold mb-4 ${titleColor}`}>{type === 'success' ? 'Success!' : 'Error!'}</h3>
                <p className="mb-2 text-gray-800">{message}</p>
                {details && <div className="text-sm text-gray-600 mb-6">{details}</div>}
                <button
                    onClick={onClose}
                    className={`px-6 py-2 text-white rounded-md transition-colors ${bgColor} ${hoverColor} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const UploadMasterAllocation = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });

    // Helper function to show message box
    const showMessage = (message, type, details = '') => {
        setMessageBoxContent({ message, type, details });
        setShowMessageBox(true);
    };

    // Handles file selection and initiates Excel parsing for preview
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setPreviewData([]); // Clear previous preview
        setHeaders([]); // Clear previous headers

        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => { // Made async to use await with workbook.xlsx.load
                try {
                    const buffer = e.target.result;
                    const workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.load(buffer); // Load workbook from array buffer

                    const worksheet = workbook.worksheets[0]; // Get the first worksheet
                    if (!worksheet) {
                        showMessage('No worksheets found in the Excel file.', 'error');
                        return;
                    }

                    const fileHeaders = [];
                    // Read headers from the first row
                    worksheet.getRow(1).eachCell((cell) => {
                        fileHeaders.push(cell.value);
                    });

                    const fileData = [];
                    // Iterate over rows, skipping the header row (rowNumber starts from 1)
                    worksheet.eachRow((row, rowNumber) => {
                        if (rowNumber !== 1) { // Skip header row
                            const rowObject = {};
                            // Iterate over cells in the current row
                            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                                // Map cell value to its corresponding header using colNumber
                                rowObject[fileHeaders[colNumber - 1]] = cell.value;
                            });
                            fileData.push(rowObject);
                        }
                    });

                    if (fileData.length > 0) {
                        setHeaders(fileHeaders);
                        // Take only the first 5 rows for preview
                        setPreviewData(fileData.slice(0, 5)); // fileData elements are already objects
                    } else {
                        showMessage('Empty or no data rows found in the Excel file.', 'error');
                    }
                } catch (parseError) {
                    console.error('Error parsing Excel file with ExcelJS:', parseError);
                    showMessage('Error parsing Excel file.', 'error', parseError.message);
                }
            };
            reader.readAsArrayBuffer(file); // Read file as ArrayBuffer for ExcelJS
        }
    };

    // Handles the upload of the parsed data to the backend
    const handleUpload = async () => {
        if (!selectedFile) {
            showMessage('Please select an Excel file to upload.', 'error');
            return;
        }

        setLoading(true);
        showMessage('Uploading data...', 'success'); // Show immediate feedback

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const buffer = e.target.result;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);

                const worksheet = workbook.worksheets[0];
                if (!worksheet) {
                    showMessage('No worksheets found in the Excel file.', 'error');
                    setLoading(false);
                    return;
                }

                const fileHeaders = [];
                worksheet.getRow(1).eachCell((cell) => {
                    fileHeaders.push(cell.value);
                });

                const jsonData = [];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber !== 1) {
                        const rowObject = {};
                        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                            rowObject[fileHeaders[colNumber - 1]] = cell.value;
                        });
                        jsonData.push(rowObject);
                    }
                });

                // Assuming your backend expects an array of objects
                const response = await fetch('http://localhost:3000/api/master-allocation/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // You might need to include CSRF token here if your backend requires it for this endpoint
                        // 'X-CSRF-Token': yourCsrfToken,
                    },
                    body: JSON.stringify(jsonData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                showMessage('File uploaded successfully!', 'success', `Inserted ${result.insertedCount} records.`);
                setSelectedFile(null);
                setPreviewData([]);
                setHeaders([]);
            } catch (error) {
                console.error('Error uploading data:', error);
                showMessage('Upload failed!', 'error', error.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md font-inter">
            <h2 className="text-3xl font-bold text-center text-teal-800 mb-6">Upload Master Allocation Data</h2>

            <div className="mb-6">
                <label htmlFor="file-upload" className="block text-gray-700 text-sm font-bold mb-2">
                    Select Excel File (.xlsx, .xls)
                </label>
                <input
                    type="file"
                    id="file-upload"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600"
                />
            </div>

            {previewData.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">File Preview (First 5 Rows)</h3>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {headers.map((header, index) => (
                                        <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {headers.map((header, colIndex) => (
                                            <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Showing first 5 rows for preview. Total rows: {previewData.length}</p>

                    <button
                        onClick={handleUpload}
                        className="mt-6 w-full bg-teal-600 text-white py-3 px-6 rounded-md hover:bg-teal-700 transition-colors font-bold text-lg"
                        disabled={loading}
                    >
                        {loading ? 'Uploading...' : 'Upload Data to MongoDB'}
                    </button>
                </div>
            )}

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

export default UploadMasterAllocation;
