"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Lock, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const { loginState, isAuthenticated, user } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Si ya está logueado, redirigir al dashboard
        if (isAuthenticated()) {
            if (user?.rol === 'SuperAdmin') {
                router.push("/superadmin");
            } else {
                router.push("/client/dashboard");
            }
        }
    }, [isAuthenticated, router, user]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/login", { email, password });

            if (response.data?.token) {
                loginState(response.data.token, response.data.user);
                if (response.data.user?.rol === 'SuperAdmin') {
                    router.push("/superadmin");
                } else {
                    router.push("/client/dashboard");
                }
            } else {
                setError("Respuesta inesperada del servidor.");
            }
        } catch (err: any) {
            console.error("Login fallido:", err);
            setError(
                err.response?.data?.error ||
                "Error al conectar con el servidor. Revisa tus credenciales o conexión."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4 py-10">
            <div className="absolute top-4 left-4 z-20">
                <Button variant="ghost" asChild className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al inicio
                    </Link>
                </Button>
            </div>

            <div className="mb-6 flex flex-col items-center gap-2 text-center">
                <img src="/logo-symbol.png" alt="CreditWay" width={80} height={80} className="h-20 w-20 rounded-2xl" />
                <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                    CreditWay Préstamos
                </h1>
            </div>

            <Card className="w-full max-w-md shadow-lg border-zinc-200 dark:border-zinc-800 relative z-10">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight">Acceso Seguro</CardTitle>
                    <CardDescription className="text-sm text-zinc-500">
                        Ingresa tu email y contraseña para acceder a tu panel de administración.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800 text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@prueba.com"
                                    className="pl-9 text-base"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9 text-base"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full mt-4 bg-blue-600" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Conectando...
                                </>
                            ) : (
                                "Iniciar Sesión"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <p className="mt-6 text-center text-sm text-zinc-500">
                &copy; {new Date().getFullYear()} CreditWay Platform. Todos los derechos reservados.
            </p>
        </div>
    );
}
