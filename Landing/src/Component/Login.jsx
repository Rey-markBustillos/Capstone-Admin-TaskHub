import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate for programmatic navigation

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // useNavigate hook for programmatic navigation

  const handleSubmit = (e) => {
    e.preventDefault();

    // Dummy login validation (Replace with actual API call)
    if (email === 'student@domain.com' && password === 'student') {
      setError('');
      navigate('/student');  // Navigate to student portal
    } else if (email === 'teacher@domain.com' && password === 'teacher') {
      setError('');
      navigate('/teacher');  // Navigate to teacher portal
    } else if (email === 'admin@domain.com' && password === 'admin') {
      setError('');
      navigate('/admin');  // Navigate to admin portal
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      <h1>Login to Your Account</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default LoginPage;
