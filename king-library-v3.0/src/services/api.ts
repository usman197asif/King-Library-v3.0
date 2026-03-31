const API_BASE = "/api";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An unknown error occurred" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export const gigApi = {
  getAll: () => apiRequest("/gigs"),
  claim: (id: string) => apiRequest(`/gigs/${id}/claim`, { method: "POST" }),
};

export const userApi = {
  getProfile: () => apiRequest("/user/profile"),
  upgrade: () => apiRequest("/user/upgrade", { method: "POST" }),
};
