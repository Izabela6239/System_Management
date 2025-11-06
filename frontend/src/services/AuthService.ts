import axios from "axios";
export interface LoginResponse {
    token: string;
    username: string;
    role: string;
    userId: number | null;
    message: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>("http://localhost:8080/api/auth/login", {
        username,
        password
    });

    return response.data;
}
