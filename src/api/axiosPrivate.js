import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import { useEffect, useRef } from 'react'; 
import { getCsrfToken, axiosPublic } from './axios'; 

// This instance will have interceptors to manage access tokens and CSRF tokens.
const axiosPrivate = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Custom hook to provide the axiosPrivate instance with interceptors.
// This ensures that the interceptors have access to the latest auth state.
const useAxiosPrivate = () => {
  const { auth, setAuth } = useAuth(); 
  const csrfTokenRef = useRef(null); 

  useEffect(() => {
    // Function to fetch CSRF token and store it
    const fetchAndSetCsrfToken = async () => {
      try {
        const token = await getCsrfToken();
        csrfTokenRef.current = token;
        // console.log('CSRF Token fetched and set:', token); // For debugging
      } catch (error) {
        console.error('Error fetching CSRF token in interceptor setup:', error);
        // Handle error, e.g., redirect to login or show a message
      }
    };

    // This ensures we have a token for initial requests.
    fetchAndSetCsrfToken();

    // --- Request Interceptor ---
    // This interceptor adds the access token AND CSRF token to the Authorization header of every request.
    const requestIntercept = axiosPrivate.interceptors.request.use(
      async config => {
        // Add Authorization header if not already set
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${auth?.accessToken}`;
        }

        // Add CSRF token for state-changing methods (POST, PUT, PATCH, DELETE)
        const methodsRequiringCsrf = ['post', 'put', 'patch', 'delete'];
        if (methodsRequiringCsrf.includes(config.method) && csrfTokenRef.current) {
          config.headers['X-CSRF-Token'] = csrfTokenRef.current;
        } else if (methodsRequiringCsrf.includes(config.method) && !csrfTokenRef.current) {

          try {
            const newToken = await getCsrfToken();
            csrfTokenRef.current = newToken;
            config.headers['X-CSRF-Token'] = newToken;
          } catch (error) {
            console.error('Failed to fetch CSRF token for retry:', error);
            return Promise.reject(new Error('CSRF token missing and failed to refresh.'));
          }
        }
        return config;
      },
      error => Promise.reject(error) // Pass any request error down the chain
    );

    // --- Response Interceptor ---
    // This interceptor handles expired access tokens (403 Forbidden responses).
    // It attempts to refresh the token and retry the original failed request.
    const responseIntercept = axiosPrivate.interceptors.response.use(
      response => response, // If response is successful, just return it
      async (error) => {
        const prevRequest = error?.config; // Get the original request configuration
        // Check if the error status is 403 (Forbidden) and if it hasn't been retried yet.
        // `prevRequest.sent` is a custom flag to prevent infinite loops.
        if (error?.response?.status === 403 && !prevRequest?.sent) {
          prevRequest.sent = true; // Mark the request as sent to prevent re-retrying
          try {
            // Call the refresh token endpoint to get a new access token.
            const response = await axiosPublic.get('/api/auth/refresh');
            const newAccessToken = response.data.accessToken;

            // Update the authentication context with the new access token.
            setAuth(prev => ({ ...prev, accessToken: newAccessToken }));

            // Update the Authorization header of the original failed request with the new token.
            prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

            // Re-fetch CSRF token if it might have expired or changed (good practice after refresh)
            const newCsrfToken = await getCsrfToken();
            csrfTokenRef.current = newCsrfToken;
            prevRequest.headers['X-CSRF-Token'] = newCsrfToken;

            // Retry the original request with the new access token.
            return axiosPrivate(prevRequest);
          } catch (refreshError) {
            console.error("Failed to refresh token or retry request:", refreshError);
            // If refresh fails (e.g., refresh token expired/invalid), clear auth and redirect to login.
            setAuth({}); // Clear authentication state
            // In a real app, you might want to redirect to login page here.
            return Promise.reject(refreshError); // Propagate the refresh error
          }
        }
        return Promise.reject(error); // For any other errors, just pass them down
      }
    );

    // Cleanup function: Eject interceptors when the component unmounts or dependencies change.
    // This prevents memory leaks and ensures interceptors are always fresh.
    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [auth, setAuth]); // Re-run effect if auth state or setAuth function changes

  return axiosPrivate; // Return the configured private Axios instance
};

export default useAxiosPrivate;
