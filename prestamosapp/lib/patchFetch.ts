import { useAuthStore } from "@/store/authStore";

if (typeof window !== "undefined") {
    const originalFetch = window.fetch;

    // Solo aplicamos el parche si no se aplicó ya (evitar loops o múltiples envolturas)
    if (!(window as any).__fetchPatched) {
        (window as any).__fetchPatched = true;

        window.fetch = async (...args) => {
            let [resource, config] = args;
            const token = useAuthStore.getState().token;

            if (!config) config = {};

            // Asegurar que headers existe y es un objeto plano, no un objeto Headers aún
            // (si es objeto Headers hay que hacer append, pero por simplicidad de JSON es así)
            const isHeadersObject = config.headers instanceof Headers;

            if (token) {
                if (isHeadersObject) {
                    (config.headers as Headers).set("Authorization", `Bearer ${token}`);
                } else {
                    config.headers = {
                        ...config.headers,
                        Authorization: `Bearer ${token}`
                    };
                }
            }

            const response = await originalFetch(resource, config);

            if (response.status === 401) {
                // Token vencido o faltante
                useAuthStore.getState().logout();
                window.location.href = "/login";
            }

            return response;
        };
    }
}
