const GREETINGS = [
  // Crypto memes & humor
  "gm. have you tried buying the dip of the dip of the dip?",
  "ser, this is a Wendy's and also a decentralized exchange",
  "few understand. fewer journal. you're the fewest.",
  "not financial advice but also not NOT financial advice",
  "the market can stay irrational longer than you can stay solvent. log it anyway.",
  "wen moon? idk but wen journal entry?",
  "your portfolio is down 40% but at least you're journaling",
  "imagine not logging your trades in 2026. ngmi.",
  "CT said this was a sure thing. your journal says otherwise.",
  "diamond hands are cool. diamond discipline is cooler.",
  "the only candle that matters is the one you logged",
  "everybody's a genius in a bull market. journal the bear too.",
  "ser, the chart pattern you drew looks like a giraffe",
  "WAGMI but only if you review your trades",
  "1000x or 0. no in between. (there's always an in between. log it.)",
  "this is the way. the way is through your journal.",
  "probably nothing. definitely should journal it though.",
  "the real alpha was the trades we logged along the way",
  "touch grass? how about touch the Log Trade button instead",
  "ser I lost everything. narrator: he did not log his trades.",
  "up only? the journal remembers the dips too.",
  "anon's TA was just vibes. yours is data.",
  "the chart whisperer has entered the chat. log the whispers.",
  "buy high sell low is a strategy if you journal it ironically",

  // Trading psychology wisdom
  "the best trade you'll ever make is the one you didn't take",
  "discipline is choosing between what you want now and what you want most",
  "your edge isn't your strategy. it's your ability to follow it.",
  "every losing trade is tuition. are you learning?",
  "the market doesn't care about your feelings. but your journal does.",
  "revenge trading is just paying the market twice for the same lesson",
  "if you can't explain why you entered, the trade was already lost",
  "confidence without data is just hope with a leveraged position",
  "the difference between a gambler and a trader? a journal.",
  "your process score matters more than today's P&L",
  "three green trades don't make you a genius. three red trades don't make you an idiot.",

  // Historical trader wisdom (adapted)
  "plan the trade. trade the plan. journal the result.",
  "markets are never wrong. opinions often are. — Jesse Livermore (adapted)",
  "the goal of a successful trader is to make the best trades. money is secondary.",
  "risk comes from not knowing what you're doing. — Buffett (and from not journaling)",
  "it's not whether you're right or wrong, but how much you make when right. log both.",
  "the trend is your friend until the end when it bends. did you journal the bend?",
  "cut your losses short, let your winners run, and write it all down",

  // Motivational
  "every expert was once a beginner who journaled their mistakes",
  "you don't need to be perfect. you need to be consistent.",
  "one trade at a time. one log at a time. that's how empires are built.",
  "the compound effect of daily journaling is your secret weapon",
  "future you will thank present you for logging this",
  "small improvements, consistently applied, create unstoppable momentum",
  "the traders who make it aren't the smartest — they're the most self-aware",
  "you can't manage what you don't measure. start measuring.",
  "today's journal entry is tomorrow's competitive edge",
  "it's not about having the best setup. it's about following YOUR best setup.",
];

export function getDailyGreeting(): string {
  if (typeof window === "undefined") return GREETINGS[0];
  const stored = sessionStorage.getItem("stargate-greeting-idx");
  if (stored) return GREETINGS[Number(stored) % GREETINGS.length];
  const idx = Math.floor(Math.random() * GREETINGS.length);
  sessionStorage.setItem("stargate-greeting-idx", String(idx));
  return GREETINGS[idx];
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "Trader";
  return localStorage.getItem("stargate-display-name") ?? "Trader";
}
