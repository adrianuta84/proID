// proID/frontend/src/components/RegisterForm.tsx

import React, { useState } from 'react';
import axios from 'axios';

// Define the base URL for the API. Vite exposes env vars starting with VITE_
// Fallback to /api if the env var isn't set for some reason.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // To display success messages
  const [error, setError] = useState('');     // To display error messages

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setMessage(''); // Clear previous messages
    setError('');   // Clear previous errors

    try {
      const response = await api.post('/auth/register', {
        name: name,
        email: email,
        password: password,
      });

      console.log('Registration successful:', response.data);
      setMessage(`Registration successful for ${response.data.user.email}! You can now log in.`);
      
      // Optionally clear the form
      setName('');
      setEmail('');
      setPassword('');
      
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (axios.isAxiosError(err) && err.response) {
        // Set error message from backend response if available
        setError(err.response.data.message || 'Registration failed. Please try again.');
      } else {
        // Generic error message
        setError('An unexpected error occurred during registration.');
      }
      setMessage(''); // Clear success message on error
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a password"
          />
        </div>
        <button type="submit">Register</button>
      </form>

      {/* Display success or error messages */}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default RegisterForm;
