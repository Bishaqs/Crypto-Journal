"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const openedByTour = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [portalPos, setPortalPos] = useState<{ top: number; right: number } | null>(null);

  const apps = APPS_REGISTRY.filter((a) => a.category === "apps");
  const links = APPS_REGISTRY.filter((a) => a.category === "links");

  // Tour integration: programmatic open/close
  useEffect(() => {
    function handleTourOpen() {
      openedByTour.current = true;
      // Calculate position from button for portal rendering
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 480; // approximate max height of apps panel
        let top = rect.bottom + 8;
        // Clamp: don't start above viewport
        top = Math.max(8, top);
        // Clamp: if dropdown would overflow bottom, anchor to bottom instead
        if (top + dropdownHeight > window.innerHeight) {
          top = Math.max(8, window.innerHeight - dropdownHeight - 8);
        }
        setPortalPos({
          top,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      }
      setShowApps(true);
    }
    function handleTourClose() {
      openedByTour.current = false;
      setShowApps(false);
      setPortalPos(null);
    }
    window.addEventListener("tour-apps-open", handleTourOpen);
    window.addEventListener("tour-apps-close", handleTourClose);
    return () => {
      window.removeEventListener("tour-apps-open", handleTourOpen);
      window.removeEventListener("tour-apps-close", handleTourClose);
    };
  }, []);

  const panelContent = (
    <>
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
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        id="tour-apps"
        onClick={() => setShowApps(!showApps)}
        className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
        style={{ boxShadow: "var(--shadow-card)" }}
        title="Apps"
      >
        <LayoutGrid size={14} />
      </button>

      {showApps && (
        <>
          {openedByTour.current && portalPos ? (
            // Portal-render at document.body to escape main's z-10 stacking context
            createPortal(
              <div
                className="fixed glass border border-border/50 rounded-2xl p-4 w-[320px] z-[999] pointer-events-none"
                style={{
                  top: portalPos.top,
                  right: portalPos.right,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {panelContent}
              </div>,
              document.body,
            )
          ) : (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowApps(false)} />
              <div
                className="absolute right-0 top-full mt-2 glass border border-border/50 rounded-2xl p-4 w-[320px] z-50"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {panelContent}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
