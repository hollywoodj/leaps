"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ElectronMenu() {
  const router = useRouter();

  useEffect(() => {
    const api = window.leaps;
    if (!api?.onMenuCommand) return;
    return api.onMenuCommand((command) => {
      if (command.type === "today") router.push("/");
      if (command.type === "pet") router.push("/pet");
      if (command.type === "reports") router.push("/reports");
      if (command.type === "create") router.push("/create");
      if (command.type === "settings") router.push("/settings");
    });
  }, [router]);

  return null;
}
