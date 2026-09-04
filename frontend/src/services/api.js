// API client for Suwa Sewa LK Doctor, Hospital, Patient & Appointment management
const API_BASE = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('suwasewa_jwt_token') || '';
};

export const getUserRole = () => {
  return localStorage.getItem('suwasewa_user_role') || 'Admin';
};

export const getUsername = () => {
  return localStorage.getItem('suwasewa_username') || 'Guest User';
};

export const setAuthData = (token, role, username) => {
  if (token) {
    localStorage.setItem('suwasewa_jwt_token', token);
    localStorage.setItem('suwasewa_user_role', role || 'Admin');
    localStorage.setItem('suwasewa_username', username || 'User');
  } else {
    localStorage.removeItem('suwasewa_jwt_token');
    localStorage.removeItem('suwasewa_user_role');
    localStorage.removeItem('suwasewa_username');
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

// Auth API
export const authApi = {
  login: async ({ username, password, role }) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Login failed (${response.status})`);
    }

    const data = await response.json();
    setAuthData(data.token, data.role, data.username);
    return data;
  },

  logout: () => {
    setAuthData(null, null, null);
  }
};

// Appointments API
export const appointmentApi = {
  getAll: async ({ doctorId, patientId, hospitalId, status } = {}) => {
    const params = new URLSearchParams();
    if (doctorId) params.append('doctorId', doctorId);
    if (patientId) params.append('patientId', patientId);
    if (hospitalId) params.append('hospitalId', hospitalId);
    if (status) params.append('status', status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/appointments${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to fetch appointments (${response.status})`);
    }
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to book appointment (${response.status})`);
    }
    return response.json();
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to update status (${response.status})`);
    }
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to cancel appointment (${response.status})`);
    }
    return true;
  }
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
