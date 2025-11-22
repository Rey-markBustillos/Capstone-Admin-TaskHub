import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

// Generate a unique session ID for this browser session
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('app_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('app_session_id', sessionId);
  }
  return sessionId;
};

// Check if this session has already been counted
const hasSessionBeenCounted = () => {
  return sessionStorage.getItem('visit_counted') === 'true';
};

// Mark session as counted
const markSessionAsCounted = () => {
  sessionStorage.setItem('visit_counted', 'true');
};

// Record application visit (called once per session)
export const recordApplicationVisit = async () => {
  // Only count once per session
  if (hasSessionBeenCounted()) {
    console.log('Visit already counted for this session');
    return;
  }

  try {
    const sessionId = getSessionId();
    
    await axios.post(`${API_BASE_URL}visits`, {
      page: 'application-access',
      userId: null,
      sessionId: sessionId
    });
    
    // Mark this session as counted
    markSessionAsCounted();
    console.log('Application visit recorded successfully');
    
  } catch (error) {
    console.error('Error recording application visit:', error);
    // Don't throw error to prevent breaking the app for unauthenticated users
  }
};

// Get total visits count
export const fetchTotalVisits = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}visits/total`);
    return response.data.totalVisits;
  } catch (error) {
    console.error('Error fetching total visits:', error);
    return 0;
  }
};

// Record specific page visit (for detailed analytics)
export const recordPageVisit = async (pageName, userId = null) => {
  try {
    const sessionId = getSessionId();
    
    await axios.post(`${API_BASE_URL}visits`, {
      page: pageName,
      userId: userId,
      sessionId: sessionId
    });
    
  } catch (error) {
    console.error('Error recording page visit:', error);
  }
};