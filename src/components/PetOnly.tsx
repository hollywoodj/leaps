"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Pocket Pet UI is a separate app. Leaps never renders it. */
export function PetOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (window.leaps?.app === "pet") {
      setAllowed(true);
      return;
    }
    router.replace("/");
  }, [router]);

  if (!allowed) return null;
  return children;
}
