import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface UserData {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    idEmpresa: number;
    nombreEmpresa: string;
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
            logout: () => set({ token: null, user: null }),
            isAuthenticated: () => {
                const { token } = get();
                if (!token) return false;
                try {
                    const decoded: any = jwtDecode(token);
                    if (decoded.exp * 1000 < Date.now()) {
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
