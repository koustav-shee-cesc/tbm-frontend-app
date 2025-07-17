import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// Custom hook to easily access the authentication context.
// This simplifies consuming the AuthContext in functional components.
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
