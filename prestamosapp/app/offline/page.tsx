import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center dark:bg-zinc-950">
      <img src="/logo-symbol.png" alt="CreditWay" width={96} height={96} className="h-24 w-24 rounded-2xl" />
      <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
        Estás sin conexión
      </h1>
      <p className="max-w-sm text-sm text-zinc-500">
        No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.
      </p>
      <Link
        href="/"
        className="rounded-md bg-[#213685] px-4 py-2 text-sm font-semibold text-white"
      >
        Reintentar
      </Link>
    </main>
  );
}
