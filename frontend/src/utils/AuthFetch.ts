import { API_BASE_URL } from "../config/api";

export async function authFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
    };

    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
    }

    return response;
}
