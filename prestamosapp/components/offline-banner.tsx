"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-black shadow-lg"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      Sin conexión — los datos pueden estar desactualizados
    </div>
  );
}
