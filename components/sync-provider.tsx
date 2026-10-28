"use client";

import { useEffect } from "react";
import { start } from "@/lib/store/sync";

/** Mounted once in the root layout: starts the account sync in the browser. Renders nothing. */
export function SyncProvider() {
  useEffect(() => {
    void start();
  }, []);
  return null;
}
