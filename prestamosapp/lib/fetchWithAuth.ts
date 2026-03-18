import { useAuthStore } from "@/store/authStore";

export const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = useAuthStore.getState().token;
    const headers = new Headers(init?.headers || {});

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const config = { ...init, headers };

    const response = await fetch(input, config);

    if (response.status === 401) {
        // Si el token expira o es inválido, borramos sesión
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }

    return response;
};
