import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axios, { getCsrfToken } from '../api/axios';
import LoginSVGComponent from '../assets/LoginSVGComponent';
import { Eye, EyeOff } from 'lucide-react';


function Login() {

  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const token = await getCsrfToken();
        setCsrfToken(token);
      } catch (err) {
        console.error('Failed to fetch CSRF token for login:', err);
        setError('Failed to initialize login. Please try again.');
      }
    };
    fetchCsrf();
  }, []); // Run only once on mount

  // Handles the form submission for login.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior.
    setError(''); // Clear any previous errors.
    setLoading(true); // Set loading to true.

    // Basic client-side validation.
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    // Ensure CSRF token is available before submitting
    if (!csrfToken) {
      setError('CSRF token not available. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      // Make a POST request to your backend login endpoint.
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ email, password }), // Send email and password as JSON
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          withCredentials: true,
        }
      );


      const accessToken = response?.data?.accessToken;
      const user = response?.data?.user;

      // Update the global authentication state.
      setAuth({ user, accessToken });

      // Clear input fields after successful login.
      setEmail('');
      setPassword('');

      // Navigate the user to the intended destination or dashboard.
      navigate(from, { replace: true });

    } catch (err) {
      // Handle different types of errors from the backend.
      if (!err?.response) {
        setError('No Server Response. Please check your network connection.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Missing Email or Password.');
      } else if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      } else if (err.response?.status === 403) {
        // This could be a CSRF token mismatch or other forbidden error
        setError(err.response?.data?.message || 'Login failed due to security error. Please refresh and try again.');
        // Consider re-fetching CSRF token here if it's a CSRF error
        try {
          const newToken = await getCsrfToken();
          setCsrfToken(newToken);
        } catch (csrfErr) {
          console.error('Failed to re-fetch CSRF token after 403:', csrfErr);
        }
      } else {
        setError('Login Failed. Please try again later.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false); // Reset loading state.
    }
  };

  return (
    // Main container for the login form, centered on the screen.
    <div class="bg-gradient-to-br from-[#bcd7ea] to-[#071c2a] bg-no-repeat h-screen w-full min-h-[600px] min-w-[400px]">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[900px] min-w-[900px] h-[513px] bg-[#D1D5E6] rounded-[35px] flex shadow-[6px_5px_11px_3px_#1C243B4F] max-[900px]:max-w-[400px]
  max-[900px]:!min-w-[400px]" >
        <div class="max-w-[345px] h-[513px] bg-[#1C243B] rounded-[35px] grow-[2] shrink basis-0 max-[900px]:!hidden">
          <LoginSVGComponent className="w-[465px] h-[489px] mt-6" />
        </div>
        <div class="max-[900px]:!mt-[30px] max-[900px]:!mr-[30px] max-[900px]:!mb-[50px] max-[900px]:!ml-[50px]
                    min-[901px]:mt-[50px] min-[901px]:mr-[115px] min-[901px]:mb-[50px] min-[901px]:ml-[115px]
                    grow-[2] shrink basis-0">
          <h1 class="text-center font-Outfit font-bold not-italic text-[48px] text-[#1C243B] drop-shadow-[3px_3px_4px_#a0a6c0]">
            CMC ONE
            <span class="text-[12px]">
              v1.0
            </span>
          </h1>
          <h2 className="font-roboto font-bold not-italic text-[30px] text-[#1A3789] mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit}>
            {/* Email input field */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username" // Helps with browser autofill
                aria-label="Email"
              />
            </div>

            {/* Password input field */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password" // Helps with browser autofill
                  aria-label="Password"
                />
                <button
                  type="button" // Important: type="button" to prevent form submission
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />} {/* Toggle icon */}
                </button>
              </div>
            </div>

            {/* Error message display */}
            {error && (
              <p className="text-red-500 text-sm text-center mb-4" role="alert">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-[#1C243B] hover:bg-[#1A3789] text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out flex items-center justify-center"
              disabled={loading || !csrfToken} // Disable button when loading or CSRF token not ready.
              aria-live="polite" // Announce changes to assistive technologies.
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
