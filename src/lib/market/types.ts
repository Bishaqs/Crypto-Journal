export interface CalendarEvent {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: "high" | "medium" | "low" | "holiday";
  forecast: string | null;
  previous: string | null;
}

export interface TradeMarketContext {
  eventsNearEntry: CalendarEvent[];
  eventsNearExit: CalendarEvent[];
  newsNearEntry: Array<{
    title: string;
    source: string;
    sentiment: string | null;
    publishedAt: string;
    url: string;
  }>;
  fearGreedAtEntry: { value: number; classification: string } | null;
  highImpactAlert: string | null;
}
