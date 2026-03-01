"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { APPS_REGISTRY, type AppEntry } from "@/lib/apps-registry";

function AppTile({ app, onSelect }: { app: AppEntry; onSelect: () => void }) {
  const Icon = app.icon;

  if (app.isExternal) {
    return (
      <a
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSelect}
        className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-surface-hover transition-colors relative"
      >
        <Icon size={22} className="text-muted" />
        <span className="text-[10px] text-muted text-center leading-tight">{app.label}</span>
      </a>
    );
  }

  return (
    <Link
      href={app.href}
      onClick={onSelect}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-surface-hover transition-colors relative ${
        !app.exists ? "opacity-50" : ""
      }`}
    >
      {!app.exists && (
        <span className="absolute top-1 right-1 text-[7px] uppercase tracking-wider font-bold px-1 py-0.5 rounded-full bg-accent/15 text-accent">
          Soon
        </span>
      )}
      <Icon size={22} className="text-muted" />
      <span className="text-[10px] text-muted text-center leading-tight">{app.label}</span>
    </Link>
  );
}

export function AppsDropdown() {
  const [showApps, setShowApps] = useState(false);

  const apps = APPS_REGISTRY.filter((a) => a.category === "apps");
  const links = APPS_REGISTRY.filter((a) => a.category === "links");

  return (
    <div className="relative">
      <button
        onClick={() => setShowApps(!showApps)}
        className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
        style={{ boxShadow: "var(--shadow-card)" }}
        title="Apps"
      >
        <LayoutGrid size={14} />
      </button>

      {showApps && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowApps(false)} />
          <div
            className="absolute right-0 top-full mt-2 glass border border-border/50 rounded-2xl z-50 p-4 w-[320px]"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2 px-1">
              Apps
            </p>
            <div className="grid grid-cols-3 gap-0.5">
              {apps.map((app) => (
                <AppTile key={app.id} app={app} onSelect={() => setShowApps(false)} />
              ))}
            </div>

            <div className="h-px bg-border/50 my-3" />

            <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2 px-1">
              Links
            </p>
            <div className="grid grid-cols-3 gap-0.5">
              {links.map((app) => (
                <AppTile key={app.id} app={app} onSelect={() => setShowApps(false)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
