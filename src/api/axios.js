import axios from 'axios';

export const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Function to fetch the CSRF token from the backend.
// This is a public endpoint and does not require an access token.
export const getCsrfToken = async () => {
  try {
    const response = await axiosPublic.get('/api/auth/csrf-token');
    return response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error; // Re-throw to be handled by calling component
  }
};

export default axiosPublic;
