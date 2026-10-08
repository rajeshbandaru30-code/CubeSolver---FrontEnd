import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function HealthCheck() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Calling the endpoint directly using axios to satisfy the requirement
    axios.get('http://localhost:8080/api/health')
      .then(res => setStatus(res.data))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Backend Health Check</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {status ? (
        <div style={{ background: '#e0ffe0', padding: '20px', border: '1px solid green' }}>
          <p><strong>Status:</strong> {status.status}</p>
          <p><strong>Message:</strong> {status.message}</p>
        </div>
      ) : (
        !error && <p>Checking health...</p>
      )}
    </div>
  );
}
