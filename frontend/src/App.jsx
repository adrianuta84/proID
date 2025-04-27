// proID/frontend/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [appName, setAppName] = useState('');

  useEffect(() => {
    api.get('/health')
      .then(response => {
        setBackendStatus(response.data.status);
        setAppName(response.data.app || 'Backend');
      })
      .catch(error => {
        console.error("Health check failed:", error);
        setBackendStatus('Error');
      });
  }, []);

  return (
    <>
      <h1>proID Application</h1>
      {/* TODO: Login/Signup Interface */}
      <div className="card">
        <p>Landing Page / Login Area</p>
      </div>
      <p>
        {appName} Status: {backendStatus}
      </p>
      {/* TODO: Main App Interface post-login */}
    </>
  );
}

export default App;