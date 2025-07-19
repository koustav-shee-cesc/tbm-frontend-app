import React from 'react';

/**
 * Reusable Message Box Component.
 * Displays a modal message box with a customizable message, type (success/error),
 * and optional details. It includes a close button.
 *
 * @param {object} props - The component props.
 * @param {string} props.message - The main message to display.
 * @param {'success' | 'error'} props.type - The type of message, influences styling.
 * @param {function} props.onClose - Function to call when the close button is clicked.
 * @param {React.ReactNode} [props.details=''] - Optional, additional details or custom content to display.
 */
const MessageBox = ({ message, type, onClose, details = '' }) => {
    // Determine background and hover colors based on message type
    const bgColor = type === 'success' ? 'bg-blue-600' : 'bg-red-600';
    const hoverColor = type === 'success' ? 'hover:bg-blue-700' : 'hover:bg-red-700';
    // Determine title color based on message type
    const titleColor = type === 'success' ? 'text-blue-600' : 'text-red-600';

    return (
        // Fixed overlay to cover the entire screen
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 font-inter">
            {/* Modal content container */}
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
                {/* Title of the message box */}
                <h3 className={`text-xl font-semibold mb-4 ${titleColor}`}>
                    {type === 'success' ? 'Success!' : 'Error!'}
                </h3>
                {/* Main message content */}
                <p className="mb-2 text-gray-800">{message}</p>
                {/* Optional detailed content */}
                {details && <div className="text-sm text-gray-600 mb-6">{details}</div>}
                {/* Close button */}
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

export default MessageBox;
