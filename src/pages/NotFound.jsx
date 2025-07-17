import React from 'react';
import { Link } from 'react-router-dom';
import Error404 from '../assets/error-404.png';

const NotFound = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-red-100 p-4 font-inter">
      <div className="flex items-center">
        <div className="flex-none w-40 mr-4">
          <img src={Error404} alt="404 Not Found" />
        </div>
        <div className="flex-none pl-4 border-l-2 ">
          <h1 className="text-5xl font-bold text-red-900 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-red-800 mb-2">Page Not Found</h2>
          <p className="text-lg text-red-700 mb-2 text-center">
            The page you are looking for does not exist.
          </p>
        </div>
      </div>
      <Link
        to="/"
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 mt-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      >
        Go to Home
      </Link>
    </main>
  );
};

export default NotFound;
