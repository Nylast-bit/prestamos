/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

// Declara el injectionPoint de Serwist (reemplazado en build con el manifest de precache).
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// La API es cross-origin (Render / localhost:3001). Reglas propias, SIEMPRE
// antes que defaultCache:
// - GET /api/*: NetworkFirst con fallback offline (solo se cachea respuestas 200).
// - Mutaciones (POST/PUT/PATCH/DELETE): NetworkOnly, nunca se cachean.
const apiRules: RuntimeCaching[] =
  process.env.NODE_ENV !== "production"
    ? []
    : [
        {
          matcher: ({ sameOrigin, request, url: { pathname } }) =>
            !sameOrigin && pathname.startsWith("/api/") && request.method !== "GET",
          handler: new NetworkOnly(),
        },
        {
          matcher: ({ sameOrigin, request, url: { pathname } }) =>
            !sameOrigin && pathname.startsWith("/api/") && request.method === "GET",
          handler: new NetworkFirst({
            cacheName: "api-data",
            networkTimeoutSeconds: 6,
            plugins: [
              new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60,
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
      ];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...apiRules, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
