// proID/frontend/src/components/LoginForm.tsx
import React, { useState } from 'react';
import axios from 'axios';

// Define the expected props type - including the function to call on successful login
interface LoginFormProps {
  onLoginSuccess: (token: string) => void;
}

// Define the base URL for the API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(''); // Clear previous errors

        try {
            const response = await api.post('/auth/login', {
                email: email,
                password: password,
            });

            if (response.data.token) {
                console.log('Login successful, token received.');
                onLoginSuccess(response.data.token); // Pass token up to App component
            } else {
                setError('Login failed: No token received.');
            }

        } catch (err: any) {
            console.error('Login failed:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Login failed. Check credentials.');
            } else {
                setError('An unexpected error occurred during login.');
            }
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="login-email">Email:</label>
                    <input
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                    />
                </div>
                <div>
                    <label htmlFor="login-password">Password:</label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Your password"
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default LoginForm;