// frontend/src/utils/axios.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "/",
});

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
        // Normalizează la AxiosHeaders ca să mulțumim TypeScript
        const headers =
            config.headers instanceof AxiosHeaders
                ? config.headers
                : new AxiosHeaders(config.headers);

        headers.set("Authorization", `Bearer ${token}`);
        // poți seta și altele, dacă vrei:
        // headers.set("Accept", "application/json");
        // headers.set("Content-Type", "application/json");

        config.headers = headers;
    }
    return config;
});

export default instance;
