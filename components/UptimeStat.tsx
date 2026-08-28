"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/content";

function formatUptime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function UptimeStat() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const launch = new Date(profile.launchDate).getTime();
    const tick = () => setLabel(formatUptime(Date.now() - launch));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <>{label ?? "—"}</>;
}
