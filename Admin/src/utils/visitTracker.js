import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
  const counted = sessionStorage.getItem('visit_counted') === 'true';
  console.log('🔍 Has session been counted?', counted);
  return counted;
};

// Mark session as counted
const markSessionAsCounted = () => {
  sessionStorage.setItem('visit_counted', 'true');
};

// Record application visit (called once per session)
export const recordApplicationVisit = async () => {
  console.log('🔥 recordApplicationVisit called');
  
  // Only count once per session
  if (hasSessionBeenCounted()) {
    console.log('✅ Visit already counted for this session');
    return;
  }

  try {
    const sessionId = getSessionId();
    console.log('📝 Recording visit with sessionId:', sessionId);
    console.log('🌐 API URL:', `${API_BASE_URL}/visits`);
    
    const response = await axios.post(`${API_BASE_URL}/visits`, {
      page: 'application-access',
      userId: null,
      sessionId: sessionId
    });
    
    console.log('✅ Visit response:', response.data);
    
    // Mark this session as counted
    markSessionAsCounted();
    console.log('🎉 Application visit recorded successfully');
    
  } catch (error) {
    console.error('❌ Error recording application visit:', error);
    if (error.response) {
      console.error('❌ Response data:', error.response.data);
      console.error('❌ Response status:', error.response.status);
    }
    // Don't throw error to prevent breaking the app for unauthenticated users
  }
};

// Get total visits count
export const fetchTotalVisits = async () => {
  try {
    console.log('📊 Fetching total visits from:', `${API_BASE_URL}/visits/total`);
    const response = await axios.get(`${API_BASE_URL}/visits/total`);
    console.log('📊 Total visits response:', response.data);
    return response.data.totalVisits;
  } catch (error) {
    console.error('❌ Error fetching total visits:', error);
    if (error.response) {
      console.error('❌ Response data:', error.response.data);
      console.error('❌ Response status:', error.response.status);
    }
    return 0;
  }
};

// Record specific page visit (for detailed analytics)
export const recordPageVisit = async (pageName, userId = null) => {
  try {
    const sessionId = getSessionId();
    console.log('📝 Recording page visit:', { pageName, userId, sessionId });
    
    await axios.post(`${API_BASE_URL}/visits`, {
      page: pageName,
      userId: userId,
      sessionId: sessionId
    });
    
    console.log('✅ Page visit recorded successfully');
  } catch (error) {
    console.error('❌ Error recording page visit:', error);
  }
};

// Record user login visit (tracks authenticated user activity)
export const recordUserLogin = async (userId, userRole) => {
  try {
    const sessionId = getSessionId();
    console.log('🔑 Recording user login:', { userId, userRole, sessionId });
    
    await axios.post(`${API_BASE_URL}/visits`, {
      page: `${userRole}-login`,
      userId: userId,
      sessionId: sessionId
    });
    
    console.log('✅ User login visit recorded successfully');
  } catch (error) {
    console.error('❌ Error recording user login:', error);
  }
};