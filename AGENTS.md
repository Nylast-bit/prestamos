# AGENTS.md (Contexto del Proyecto)

**MANTÉN ESTE ARCHIVO BAJO 100 LÍNEAS.**
**🧠 LECTURA OBLIGATORIA:** Siempre lee el archivo `MEMORY.md` al iniciar para saber en qué estamos trabajando y cuáles son los próximos pasos. Si descubres un aprendizaje en `MEMORY.md` lo suficientemente crítico, **tienes permiso de pasarlo a este archivo (`AGENTS.md`)** para que sea una regla global.

## 🚫 LÍMITES ESTRICTOS (Lo que NO debes hacer)
1. **NO uses la raíz para npm**: Ejecuta comandos directamente dentro de `prestamosapi/` o `prestamosapp/`. No hay workspaces.
2. **NO asumas que los hooks de Husky se ejecutan**: Valida manualmente tu código con build y tests antes de hacer commit.
3. **NO intentes hacer migraciones en código**: No hay ORM (ignora los restos de Prisma y PG). Toda la base de datos es Supabase y el schema se altera copiando SQL a mano.
4. **NO corrompas archivos con comandos de PowerShell**: Las fuentes son UTF-8 sin BOM. Usa siempre tus herramientas nativas de lectura/escritura (o `-Encoding UTF8` si usas PS).
5. **NO commitees `tsconfig.tsbuildinfo`** innecesariamente.
6. **NO despliegues backend sin compilar**: `prestamosapi/dist/` está en git y Docker lo ejecuta directo. Siempre haz `npm run build` tras cambiar el backend y commitea la carpeta `dist`.
7. **NO arranques cronjobs dentro de los tests**: El script `capitalJob.ts` arranca con el server, no lo inicies testeando.
8. **NO asumas que rompiste el linter del frontend**: `npm run lint` en la app ya tiene decenas de errores en HEAD por código legacy.

## 🚀 Comandos y Configuración
* **API (`prestamosapi/` - Puerto 3001)**: `npm run dev`, `npm run build`, `npm test`. 
  * *Verificar*: `npm run build && npm test`
* **APP (`prestamosapp/` - Puerto 3000)**: `npm run dev`, `npx tsc --noEmit`, `npm run build`.
  * *Verificar*: `npx tsc --noEmit && npm run build`
* **Docker-compose**: Levanta ambos, pero requieren sus propios `.env` locales. 

## ⚠️ Gotchas Críticos

### Backend (Supabase y Tests)
- **Tests Rotos en HEAD**: Fallan porque las cadenas del query builder crecieron más allá de los mocks.
- **Mocks de Supabase (CRÍTICO)**: Si añades o cambias un método de Supabase (`.eq`, `.lte`, etc) en un servicio, **DEBES actualizar los mocks a mano en DOS lugares** en su archivo de test, o el test morirá.
- **Middlewares**: El orden en `src/index.ts` es sagrado; el `errorHandler` va hasta el final, y los orígenes de CORS se añaden hardcodeados ahí.
- **Scripts de datos**: Los scripts en `src/scripts/` apuntan a producción. Manéjalos con mucho cuidado.

### Frontend
- **Tres métodos HTTP co-existiendo**: 
  1. `lib/api.ts` (instancia de axios, la URL base *debe* incluir `/api`).
  2. `lib/fetchWithAuth.ts` (el método moderno preferido, parchea y maneja sesión).
  3. `fetch` crudo que usa `NEXT_PUBLIC_API_BASE_URL` (sin el `/api`).
- **Estructura UI**: Las páginas bajo `app/client/*` son simples wrappers. La lógica real y la UI viven en `components/*-content.tsx`.
- **PWA (Serwist)**: El SW vive en `app/sw.ts` (**excluido del tsconfig**; no metas `"webworker"` en `lib` global) y se compila vía `app/serwist/[path]/route.ts`. **Solo corre en producción**: probar con `npm run build && npm start` (en `dev` está deshabilitado). Verifica que `/serwist/sw.js` *no* contenga `process.env.NODE_ENV` literal.
- **Cache offline de API**: GETs `/api/*` cross-origin → `NetworkFirst` en `cacheName "api-data"`; mutaciones `NetworkOnly`. El `logout` en `store/authStore.ts` purga esa cache — no lo elimines.
- **Iconos PWA/UI**: regenerar con `npm run icons` (`scripts/gen-icons.mjs`, fuente `Logo.jfif` en la raíz). El `favicon.ico` necesita PNGs **RGBA** (`.ensureAlpha()`), si no `next build` falla.
- **`NEXT_PUBLIC_*` se inlinea en build**: en Docker van como `ARG`+`ENV` antes de `next build` (ya está en `Docker-compose.yml`). El frontend Docker ya **no** corre `next dev`: es build+start de producción, reconstruye la imagen para cambios de UI.
- **Encoding (CRÍTICO)**: nunca copies texto de la salida de PowerShell a un `oldString`/`newString` (mojibake: "Método"→"MActodo"). Usa siempre la herramienta Read para copiar texto de archivos.
