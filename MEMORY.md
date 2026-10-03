# 🧠 MEMORY.md: Iniciativa Mobile-First & PWA

Este archivo actúa como nuestra "memoria" a largo plazo.
**Instrucción para el Agente:** Tienes la responsabilidad de **actualizar continuamente este archivo** conforme avances. Si descubres bugs recurrentes, dependencias extrañas o encuentras un aprendizaje clave, regístralo aquí. Si el aprendizaje es lo suficientemente crítico para que el proyecto no se rompa, pásalo a `AGENTS.md`.

## 🎯 Objetivo Principal
1. Adaptar toda la interfaz de `prestamosapp` para que sea 100% responsiva, con excelente usabilidad en teléfonos móviles. ✅ (fase base completada)
2. Convertir la aplicación en una Progressive Web App (PWA) instalable con datos offline de lectura. ✅ (implementada; falta validación en dispositivo real)

## 🚀 Siguientes Pasos Inmediatos
- [x] Analizar `app/layout.tsx` y la navegación lateral actual (era shadcn Sidebar con Sheet móvil ya funcional).
- [x] Navegación móvil: no hacía falta menú nuevo; sí fix de `truncate` en títulos de header.
- [ ] **Validar en teléfono real**: instalar desde Chrome (Vercel), probar modo offline, banner "Sin conexión" y logout (debe purgar cache `api-data`).
- [ ] Setear `NEXT_PUBLIC_API_URL=https://prestamosapi-5jpx.onrender.com/api` en el dashboard de Vercel (no se puede verificar desde el repo).

## 📋 Plan de Acción (Roadmap)

### Fase 1: Auditoría y Base Responsiva ✅
- [x] `viewport` + `themeColor` exportados en `app/layout.tsx` (Viewport type).
- [x] Navegación móvil verificada (Sidebar→Sheet <768px, hook `use-mobile`).
- [x] Headers con `truncate`/`min-w-0` (client y superadmin layouts).
- [x] Login re-en-flow (sin absolutos que rompían en viewports cortos) + inputs `text-base` (anti auto-zoom iOS).

### Fase 2: Refactorización de Vistas (Componentes `-content.tsx`) ✅
- [x] **Login**: logo + layout fluido.
- [x] **Superadmin**: tablas raw de empresas/suscripciones envueltas en `overflow-x-auto` + `min-w`.
- [x] Roturas 375px: filtros de pagos con `flex-wrap`, dashboard header stackeable, `w-[340px]`→`w-full sm:`, header de gastos fijos, clase muerta `auto-scroll` eliminada.
- [x] **Vistas de Cliente**: grids de forms → `grid-cols-1 sm:grid-cols-N`; diálogos con `max-h-[85vh] overflow-y-auto`; `min-w` de botones → `sm:min-w`.
- [x] Estrategia de tablas densas: **scroll horizontal** (decisión del usuario; `ui/table.tsx` ya trae wrapper).

### Fase 3: Transformación a PWA ✅
- [x] Serwist vía `@serwist/turbopack` (NO `next-pwa`: muerto y rompe con Turbopack de Next 16).
- [x] `app/manifest.ts` + iconos generados de `Logo.jfif` (`npm run icons`, script `scripts/gen-icons.mjs`).
- [x] Service Worker `app/sw.ts`: precache del shell + **GET /api cross-origin con NetworkFirst** (`cacheName: "api-data"`, 64 entradas/24h) + mutaciones NetworkOnly + fallback `/offline`.
- [x] Registro vía `SerwistProvider swUrl="/serwist/sw.js"` **deshabilitado en development**.
- [x] `app/offline/page.tsx`, banner `OfflineBanner`, purge de `api-data` en `authStore.logout`.
- [x] Docker frontend pasó a `next build && next start` con ARGs build-time para `NEXT_PUBLIC_*`.

## 💡 Aprendizajes del Agente (Knowledge Base)
- **NUNCA copies texto de la salida de PowerShell a un edit**: PS 5.1 decodifica UTF-8 como ANSI y produce mojibake ("Método"→"MActodo"). Usar la herramienta Read para copiar texto de archivos. *Costó una corrupción en PrestamoTable (ya corregida).*
- **Turbopack exige PNG RGBA en `favicon.ico`**: generar con `.ensureAlpha()`, si no `next build` falla con "The PNG is not in RGBA format".
- **`app/sw.ts` está excluido del tsconfig**: no añadir `"webworker"` al `lib` global (rompe los tipos DOM de la app). Se compila aparte con esbuild en la ruta `/serwist/sw.js`; `process.env.NODE_ENV` se reemplaza vía `esbuildOptions.define` en `app/serwist/[path]/route.ts`.
- **El SW solo corre en producción**: probar con `npm run build && npm start` (nunca con `next dev`). Verificar que `/serwist/sw.js` no contenga `process.env.NODE_ENV` literal.
- **`NEXT_PUBLIC_*` se inlinea en BUILD**: en Docker van como `ARG`+`ENV` antes de `next build` (compose ya los pasa). `lib/api.ts` (axios) necesita la base **con** `/api`; los fetch de componentes la base **sin** `/api`.
- `defaultCache` de Serwist en dev = NetworkOnly total (útil: no ensucia caches en desarrollo).
- `npm run lint` tiene 88 errores preexistentes en HEAD (scripts legacy); no suben con cambios nuevos (+4 warnings `no-img-element` por los `<img>` del logo).
- El `tailwind.config.ts` del frontend es **código muerto** (Tailwind v4 no lo lee; no hay `@config` en globals.css). Breakpoints = defaults v4 (sm 640/md 768/lg 1024).

## 📐 Reglas de Diseño (Tailwind)
1. **Mobile-First siempre**: El diseño base sin prefijos aplica a celulares. `sm:`/`md:`/`lg:` solo para escalar.
2. **Touch Targets**: botones/enlaces con al menos `p-2` o `h-10`/`h-12`.
3. **Inputs en Móvil**: `text-base` (16px) mínimo para evitar auto-zoom en iOS.
4. **Convención de forms**: `grid-cols-1 sm:grid-cols-2|3`; labels `sm:text-right`; selects `w-full sm:w-[Npx]`.
5. **Diálogos**: todo `DialogContent` lleva `max-h-[85vh] overflow-y-auto`.

## 📝 Bitácora de Progreso (Log)
* **[2026-10-03]**: Inicialización del plan de acción Responsive + PWA.
* **[2026-10-03]**: Fases 1-6 ejecutadas: responsive completo (login, shell, superadmin, grids/dialogs), logo `Logo.jfif` como favicon/iconos PWA/UI, Serwist offline-con-datos GET, Docker build-time env. Verificado: `npx tsc --noEmit` ✓, `npm run build` ✓ (61 precache entries), `next start` sirve SW+manifest ✓, lint sin errores nuevos.
