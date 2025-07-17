import React from 'react';
import { Link } from 'react-router-dom';
import error500 from '../assets/error-500.png';

const InternalError = () => {

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-blue-100 p-4 font-inter">
            <div className="flex items-center">
                <div className="flex-none w-40 mr-4">
                    <img src={error500} alt="Internal Error" />
                </div>
                <div className="flex-none pl-4 border-l-2 ">
                    <h1 className="text-5xl font-bold text-blue-900 mb-4">500</h1>
                    <h2 className="text-3xl font-bold text-blue-800 mb-2">Internal Server Error</h2>
                    <p className="text-lg text-blue-700 mb-2 text-center">
                        Something went wrong on the server side.
                    </p>
                </div>
            </div>
            <Link
                to="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 mt-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
                Go to Home
            </Link>
        </main>
    );
};

export default InternalError;