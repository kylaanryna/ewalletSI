import React, { useState } from 'react';

const PasswordInput = ({ onPasswordChange }) => {
  const [password, setPassword] = useState('');

  const handleKeyDown = (event) => {
    // Allow only numeric keys
    if (event.key >= '0' && event.key <= '9') {
      setPassword((prev) => prev + event.key);
      onPasswordChange && onPasswordChange(password + event.key);
    }
    // Prevent non-numeric input
    event.preventDefault();
  };

  return (
    <div>
      {/* ...existing code... */}
      <input
        type="password"
        value={password}
        onKeyDown={handleKeyDown}
        onChange={(e) => setPassword(e.target.value)} // Optional: Sync with manual input
        placeholder="Enter password"
      />
      {/* ...existing code... */}
    </div>
  );
};

export default PasswordInput;
