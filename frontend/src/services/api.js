import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const listDocuments = async (skip = 0, limit = 50) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/admin/documents`, {
      params: { skip, limit },
      headers: { 'X-User-Role': 'admin' },
    });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const uploadDocument = async (file, description = '', tags = '') => {
  try {
    const form = new FormData();
    form.append('file', file);
    if (description) form.append('description', description);
    if (tags) form.append('tags', tags);
    const res = await axios.post(`${BACKEND_URL}/admin/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data', 'X-User-Role': 'admin' },
    });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const editDocument = async (id, payload) => {
  try {
    const res = await axios.patch(`${BACKEND_URL}/admin/documents/${id}`, payload, {
      headers: { 'X-User-Role': 'admin' },
    });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const deleteDocument = async (id) => {
  try {
    await axios.delete(`${BACKEND_URL}/admin/documents/${id}`, {
      headers: { 'X-User-Role': 'admin' },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const downloadDocumentUrl = (id) => `${BACKEND_URL}/admin/documents/${id}/download`;

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
    const response = await axios.post(`${BACKEND_URL}/login`, credentials);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message || 'Login failed' };
  }
};

export const signupUser = async (userData) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/signup`, userData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message || 'Signup failed' };
  }
};

export const sendQuery = async (question, role = 'user', documentId = null) => {
  try {
    const payload = { question, top_k: 5 };
    if (documentId) payload.document_id = documentId;
    const res = await axios.post(`${BACKEND_URL}/query`, payload, {
      headers: { 'X-User-Role': role },
    });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};
