import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Advertencia: Esto permite que la compilación de producción
    // termine con éxito incluso si tu proyecto tiene errores de ESLint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
