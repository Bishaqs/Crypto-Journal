"use client";

import { createContext, useContext, useState, useEffect } from "react";

type TimezoneContextType = {
  timezone: string;
  setTimezone: (tz: string) => void;
};

const TimezoneContext = createContext<TimezoneContextType>({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  setTimezone: () => {},
});

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  useEffect(() => {
    const raw = localStorage.getItem("stargate-global-settings");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.timezone) setTimezoneState(parsed.timezone);
      } catch {}
    }
  }, []);

  function setTimezone(tz: string) {
    setTimezoneState(tz);
    const raw = localStorage.getItem("stargate-global-settings");
    let settings: Record<string, string> = {};
    if (raw) {
      try { settings = JSON.parse(raw); } catch {}
    }
    settings.timezone = tz;
    localStorage.setItem("stargate-global-settings", JSON.stringify(settings));
  }

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  return useContext(TimezoneContext);
}
