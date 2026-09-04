export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5292";

export const handleApiResponse = async (response) => {
    if (response.status === 401) {
        throw new Error("Authentication required. Please log in to continue.");
    }
    if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMsg = errorData.message;
            } else if (errorData.title) {
                errorMsg = errorData.title;
            }
        } catch {
            // Ignore JSON parsing errors for error bodies
        }
        if (response.status === 409) {
             throw new Error("Conflict: " + errorMsg);
        }
        if (response.status === 404) {
             throw new Error("Not Found: " + errorMsg);
        }
        throw new Error(errorMsg);
    }
    
    if (response.status === 204) {
        return null; // NoContent
    }
    
    return await response.json();
};

export const fetchPatients = async (search = "", nic = "") => {
    let url = `${API_BASE_URL}/api/patients`;
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (nic) params.append("nic", nic);
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    try {
        const response = await fetch(url, {
            headers: {
                // 'Authorization': `Bearer ...` // Pending shared auth integration
            }
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};

export const createPatient = async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData)
    });
    return await handleApiResponse(response);
};

export const updatePatient = async (id, patientData) => {
    const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData)
    });
    return await handleApiResponse(response);
};

export const deletePatient = async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
        method: "DELETE"
    });
    return await handleApiResponse(response);
};
