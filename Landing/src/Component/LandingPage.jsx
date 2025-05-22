import React from 'react';
import { Link } from 'react-router-dom';  // Use Link for navigation

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header>
        <h1>Welcome to the Landing Page</h1>
        <p>This is the landing page of the application.</p>
        <p>Here you can find information about the application and its features.</p>
        <p>Feel free to explore!</p>
      </header>

      <section className="cta">
        <h2>Get Started</h2>
        <p>If you're ready to start, log in below:</p>
        <Link to="/login">  {/* Link to the login page */}
          <button className="btn">Login</button>
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
