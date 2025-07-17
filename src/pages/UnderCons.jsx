import React from 'react';
import { Link } from 'react-router-dom';
import UnderCons from '../assets/under-construction.png';

const UnderConstruction = () => {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-green-100 p-4 font-inter">
            <div className="flex items-center">
                <div className="flex-none w-40 mr-4">
                    <img src={UnderCons} alt="Under Construction" />
                </div>
                <div className="flex-none pl-4 border-l-2 ">
                    <h2 className="text-3xl font-bold text-green-800 mb-2">Page Under Construction</h2>
                    <p className="text-lg text-green-700 mb-2 text-center">
                        The page you are looking for is under construction..
                    </p>
                </div>
            </div>
            <Link
                to="/"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 mt-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
                Go to Home
            </Link>
        </main>
    );
};

export default UnderConstruction;