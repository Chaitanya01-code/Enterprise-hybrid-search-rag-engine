import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000';

export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/`, { timeout: 3500 });
    return { status: 'online', message: response.data?.message || 'Backend Connected' };
  } catch (error) {
    return { status: 'offline', message: 'Backend Server Offline' };
  }
};

export const loginUser = async (credentials) => {
  try {
    // Primary endpoint /login
    const response = await axios.post(`${BACKEND_URL}/login`, credentials);
    return { success: true, data: response.data };
  } catch (error) {
    // Fallback try /auth/login
    try {
      const fallbackResponse = await axios.post(`${BACKEND_URL}/auth/login`, credentials);
      return { success: true, data: fallbackResponse.data };
    } catch (fallbackError) {
      const errMsg = error.response?.data?.detail || error.message || 'Login failed';
      return { success: false, error: errMsg };
    }
  }
};

export const signupUser = async (userData) => {
  try {
    // Primary endpoint /signup
    const response = await axios.post(`${BACKEND_URL}/signup`, userData);
    return { success: true, data: response.data };
  } catch (error) {
    // Fallback try /auth/signup
    try {
      const fallbackResponse = await axios.post(`${BACKEND_URL}/auth/signup`, userData);
      return { success: true, data: fallbackResponse.data };
    } catch (fallbackError) {
      const errMsg = error.response?.data?.detail || error.message || 'Signup failed';
      return { success: false, error: errMsg };
    }
  }
};
