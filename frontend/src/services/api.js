// API client for Suwa Sewa LK Doctor & Hospital management
const API_BASE = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('suwasewa_jwt_token') || '';
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('suwasewa_jwt_token', token);
  } else {
    localStorage.removeItem('suwasewa_jwt_token');
  }
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Doctors API
export const doctorApi = {
  getAll: async ({ hospitalId, specialization, search } = {}) => {
    const params = new URLSearchParams();
    if (hospitalId) params.append('hospitalId', hospitalId);
    if (specialization) params.append('specialization', specialization);
    if (search) params.append('search', search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/doctors${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to fetch doctors (${response.status})`);
    }
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE}/doctors/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to fetch doctor (${response.status})`);
    }
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to create doctor (${response.status})`);
    }
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to update doctor (${response.status})`);
    }
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to delete doctor (${response.status})`);
    }
    return true;
  },
};

// Hospitals API
export const hospitalApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/hospitals`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to fetch hospitals (${response.status})`);
    }
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE}/hospitals/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to fetch hospital (${response.status})`);
    }
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE}/hospitals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = typeof errData === 'object' && errData.ContactNumber ? errData.ContactNumber[0] : (errData.message || `Failed to create hospital (${response.status})`);
      throw new Error(msg);
    }
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/hospitals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = typeof errData === 'object' && errData.ContactNumber ? errData.ContactNumber[0] : (errData.message || `Failed to update hospital (${response.status})`);
      throw new Error(msg);
    }
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/hospitals/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to delete hospital (${response.status})`);
    }
    return true;
  },
};
