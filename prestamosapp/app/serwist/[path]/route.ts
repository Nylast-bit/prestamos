import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// Revisión del manifest de precache: commit actual (o aleatoria si no hay git,
// p.ej. en el build de Docker donde .git no existe).
const gitRev = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim();
const revision = gitRev || crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/offline", revision }],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
    esbuildOptions: {
      define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
      },
    },
  });
