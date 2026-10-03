import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface UserData {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    idEmpresa: number;
    idPrestatario?: number | null;
    nombreEmpresa: string;
    colorFondo?: string;
    iconoEmpresa?: string;
    suscripcion?: {
        fechaVencimiento: string;
        plan: {
             LimiteUsuarios: number;
             LimitePrestamos: number;
             Nombre: string;
        }
    } | null;
}

interface AuthState {
    token: string | null;
    user: UserData | null;
    loginState: (token: string, user: UserData) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            loginState: (token, user) => set({ token, user }),
            logout: () => {
                set({ token: null, user: null });
                // Borra los datos cacheados por el Service Worker (modo offline)
                // para que el siguiente usuario de este dispositivo no los vea.
                try {
                    if (typeof window !== "undefined" && "caches" in window) {
                        caches.keys().then((keys) => {
                            keys.forEach((key) => {
                                if (key === "api-data") caches.delete(key);
                            });
                        });
                    }
                } catch { /* sin Service Worker disponible */ }
            },
            isAuthenticated: () => {
                const { token } = get();
                if (!token) return false;
                try {
                    const decoded = jwtDecode<JwtPayload>(token);
                    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                        get().logout();
                        return false;
                    }
                    return true;
                } catch (error) {
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
