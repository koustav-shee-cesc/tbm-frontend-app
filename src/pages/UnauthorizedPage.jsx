import React from 'react';
import { Link } from 'react-router-dom';
import error401 from '../assets/error-401.svg';

const UnauthorizedPage = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-yellow-50 p-4 font-inter">
      <div className="flex-none w-40 mr-4">
        <img src={error401} alt="UnAuthorized Access" />
      </div>
      <div className="flex-none pl-4 border-l-2 ">
        <h1 className="font-bold text-4xl mb-2 text-red-700">Error 401</h1>
        <p className="text-4xl font-bold text-yellow-800">Unauthorized Access.</p>
        <p className="text-lg text-yellow-700 mt-1 text-center">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
      <Link
        to="/"
        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 mx-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
