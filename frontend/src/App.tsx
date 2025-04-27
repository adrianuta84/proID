// proID/frontend/src/App.tsx - UPDATED with Login Form and State
import React, { useState, useEffect } from 'react';
import './App.css';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm'; // Import the Login Form

function App() {
  // State to hold the JWT token. Initialize from localStorage if available.
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('proid-token'); // Check localStorage on initial load
  });

  // This effect runs once when the component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('proid-token');
    if (storedToken) {
      console.log("Found token in localStorage on load");
      setToken(storedToken);
      // TODO: Optionally verify token with backend here to ensure it's still valid
    }
  }, []); // Empty dependency array means run only once on mount


  // Function to handle successful login - receives token from LoginForm
  const handleLoginSuccess = (receivedToken: string) => {
    console.log("Setting token:", receivedToken);
    setToken(receivedToken);
    // Store token in localStorage for persistence across page refreshes
    // Note: localStorage has security implications (XSS). Consider alternatives
    // like httpOnly cookies or memory storage depending on security needs.
    localStorage.setItem('proid-token', receivedToken);
  };

  // Function to handle logout
  const handleLogout = () => {
    console.log("Logging out");
    setToken(null); // Clear token from state
    localStorage.removeItem('proid-token'); // Remove token from localStorage
  };

  return (
    <>
      <h1>proID Application</h1>

      {token ? (
        // If user IS logged in (token exists)
        <div>
          <p>Welcome! You are logged in.</p>
          {/* We can add components here that require login */}
          {/* Example: <UserProfile token={token} /> */}
          <button onClick={handleLogout}>Logout</button>
          {/* <p>Your token (dev only): {token}</p> */}
        </div>
      ) : (
        // If user is NOT logged in (no token)
        <div>
          <p>Please log in or register.</p>
          <hr />
          <LoginForm onLoginSuccess={handleLoginSuccess} />
          <hr />
          <RegisterForm />
        </div>
      )}
    </>
  )
}

export default App;