"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL = 3 * 60 * 1000; // 3 minutes

export function Heartbeat() {
  useEffect(() => {
    function ping() {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    }

    ping();
    const id = setInterval(ping, HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return null;
}
