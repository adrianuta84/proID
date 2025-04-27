// proID/frontend/src/components/PhoneUpdateForm.tsx

import React, { useState } from 'react';
import axios from 'axios';

interface PhoneUpdateFormProps {
  token: string;
}

const PhoneUpdateForm: React.FC<PhoneUpdateFormProps> = ({ token }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.post(
        '/api/user/phone', // Endpoint for adding phone numbers
        { phoneNumber, label },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage('Phone number updated successfully!');
    } catch (err: any) {
      setError('Failed to update phone number');
    }
  };

  return (
    <div>
      <h2>Update Phone Number</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Phone Number:</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label>Label (e.g., Mobile):</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter label"
          />
        </div>
        <button type="submit">Submit</button>
      </form>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </div>
  );
};

export default PhoneUpdateForm;
