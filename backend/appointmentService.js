const BASE_URL = "/api/appointments";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handle(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const appointmentService = {
  getAll: (token, { status, date } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return fetch(`${BASE_URL}${qs}`, { headers: authHeaders(token) }).then(handle);
  },

  getByPatient: (token, patientId) =>
    fetch(`${BASE_URL}/patient/${patientId}`, { headers: authHeaders(token) }).then(handle),

  getByDoctor: (token, doctorId, { status } = {}) => {
    const qs = status ? `?status=${status}` : "";
    return fetch(`${BASE_URL}/doctor/${doctorId}${qs}`, { headers: authHeaders(token) }).then(handle);
  },

  getById: (token, id) =>
    fetch(`${BASE_URL}/${id}`, { headers: authHeaders(token) }).then(handle),

  create: (token, payload) =>
    fetch(BASE_URL, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }).then(handle),

  update: (token, id, payload) =>
    fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }).then(handle),

  updateStatus: (token, id, status) =>
    fetch(`${BASE_URL}/${id}/status`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }).then(handle),

  remove: (token, id) =>
    fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }).then(handle),
};
