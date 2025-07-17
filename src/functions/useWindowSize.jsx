import { useState, useEffect } from 'react';

    function useWindowSize() {
      // Initialize state with current window dimensions
      const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      useEffect(() => {
        // Function to update state on window resize
        function handleResize() {
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }

        // Add event listener for window resize
        window.addEventListener('resize', handleResize);

        // Cleanup function to remove event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
      }, []); // Empty dependency array ensures effect runs only once on mount

      return windowSize;
    }

    export default useWindowSize;