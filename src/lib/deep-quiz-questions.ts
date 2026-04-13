// ─── Deep Quiz: Archetype-Personalized Assessment ──────────────────────────
// 10 universal questions + 10 archetype-specific questions = 20 total
// Each question has 4 options scored 1-4 on a spectrum

import type { MiniArchetype } from "./mini-quiz-archetypes";

export type DeepQuizQuestion = {
  id: string;
  question: string;
  category: "triggers" | "coping" | "risk_behavior" | "self_awareness" | "growth";
  options: { label: string; score: number }[];
};

// ─── Universal Questions (asked to ALL archetypes) ──────────────────────────

export const UNIVERSAL_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "u_1",
    question: "After a losing trade, how long before you feel ready to trade again?",
    category: "coping",
    options: [
      { label: "I need the rest of the day off minimum", score: 1 },
      { label: "A couple of hours to cool down", score: 2 },
      { label: "30 minutes or so — review and move on", score: 3 },
      { label: "Almost immediately — one trade doesn't define me", score: 4 },
    ],
  },
  {
    id: "u_2",
    question: "When you look at your trading history, what pattern stands out?",
    category: "self_awareness",
    options: [
      { label: "I tend to make the same mistakes repeatedly", score: 1 },
      { label: "I improve slowly but still slip under pressure", score: 2 },
      { label: "I've gotten better at recognizing my patterns", score: 3 },
      { label: "I actively track and correct my patterns", score: 4 },
    ],
  },
  {
    id: "u_3",
    question: "How do you handle a market that goes sideways for weeks?",
    category: "coping",
    options: [
      { label: "I get restless and start taking questionable trades", score: 1 },
      { label: "I overtrade trying to find something", score: 2 },
      { label: "I reduce activity and wait for a clearer signal", score: 3 },
      { label: "I use the downtime to review and improve my process", score: 4 },
    ],
  },
  {
    id: "u_4",
    question: "Do you have a written trading plan that you follow consistently?",
    category: "self_awareness",
    options: [
      { label: "No plan — I trade based on what feels right in the moment", score: 1 },
      { label: "I have a rough plan but rarely follow it under pressure", score: 2 },
      { label: "I have a plan and follow it most of the time", score: 3 },
      { label: "Strict plan with rules for every scenario — I follow it religiously", score: 4 },
    ],
  },
  {
    id: "u_5",
    question: "How do you react when a trade goes against you immediately after entry?",
    category: "triggers",
    options: [
      { label: "Panic — start questioning everything and hovering over the close button", score: 1 },
      { label: "Anxious but I try to stick to my stop loss", score: 2 },
      { label: "Slightly uncomfortable but I trust my setup", score: 3 },
      { label: "Completely unfazed — this is part of the game", score: 4 },
    ],
  },
  {
    id: "u_6",
    question: "When you compare yourself to other traders on social media, you feel...",
    category: "self_awareness",
    options: [
      { label: "Inadequate — everyone else seems to be crushing it", score: 1 },
      { label: "Motivated but also pressured to match their results", score: 2 },
      { label: "I look for useful ideas but don't compare results", score: 3 },
      { label: "I mostly ignore social media — it's noise", score: 4 },
    ],
  },
  {
    id: "u_7",
    question: "At what point do you typically journal or reflect on your trades?",
    category: "growth",
    options: [
      { label: "I don't journal — it feels like extra work", score: 1 },
      { label: "Only after big losses when I'm trying to understand what happened", score: 2 },
      { label: "At the end of each day I do a quick review", score: 3 },
      { label: "I log every trade with entry logic, emotions, and lessons in real-time", score: 4 },
    ],
  },
  {
    id: "u_8",
    question: "How much does your mood outside of trading affect your trading decisions?",
    category: "triggers",
    options: [
      { label: "Heavily — if I'm stressed about something else, my trading suffers", score: 1 },
      { label: "More than I'd like to admit", score: 2 },
      { label: "I'm usually able to separate them", score: 3 },
      { label: "I have a ritual to get into 'trading mode' that blocks out external noise", score: 4 },
    ],
  },
  {
    id: "u_9",
    question: "How do you size your positions?",
    category: "risk_behavior",
    options: [
      { label: "Gut feeling — I size up when I'm feeling confident", score: 1 },
      { label: "Roughly based on how much I can afford to lose", score: 2 },
      { label: "Fixed percentage of my account per trade", score: 3 },
      { label: "Calculated based on stop distance, R-multiple, and account risk %", score: 4 },
    ],
  },
  {
    id: "u_10",
    question: "When was the last time you changed something about your trading process based on data (not emotion)?",
    category: "growth",
    options: [
      { label: "I don't track enough data to make changes from it", score: 1 },
      { label: "A while ago — I know I should do it more", score: 2 },
      { label: "Recently — I review my stats monthly", score: 3 },
      { label: "Constantly — my process evolves based on what the numbers show", score: 4 },
    ],
  },
];

// ─── Archetype-Specific Questions ───────────────────────────────────────────

const ARCHITECT_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "arch_1",
    question: "Your backtested strategy shows 68% win rate but you've had 5 losses in a row. What do you think?",
    category: "triggers",
    options: [
      { label: "The system is broken — time to rebuild or add more indicators", score: 1 },
      { label: "Frustrating, but I check if the market regime has changed", score: 2 },
      { label: "5 in a row is within expected variance for 68% — I continue", score: 3 },
      { label: "I already calculated the max consecutive loss probability — this was expected", score: 4 },
    ],
  },
  {
    id: "arch_2",
    question: "A trade meets 8 of your 10 criteria. The 2 missing ones are minor. Do you take it?",
    category: "risk_behavior",
    options: [
      { label: "No — if it doesn't meet ALL criteria, it's not a valid setup", score: 1 },
      { label: "I hesitate and usually end up missing the entry", score: 2 },
      { label: "I take it with reduced size to account for the uncertainty", score: 3 },
      { label: "Yes — I've learned that 8/10 is a high-quality setup", score: 4 },
    ],
  },
  {
    id: "arch_3",
    question: "You discover your model had a flaw that inflated your backtest results by 15%. How do you respond?",
    category: "self_awareness",
    options: [
      { label: "Deny it at first — my model can't be that wrong", score: 1 },
      { label: "Feel terrible about it but eventually accept the correction", score: 2 },
      { label: "Fix the flaw and re-run the backtest immediately", score: 3 },
      { label: "I already stress-test for data errors — this wouldn't surprise me", score: 4 },
    ],
  },
  {
    id: "arch_4",
    question: "How many indicators do you typically use before entering a trade?",
    category: "risk_behavior",
    options: [
      { label: "5+ — more data points = more confidence", score: 1 },
      { label: "3-4 — I like a comprehensive picture", score: 2 },
      { label: "2-3 — I focus on the key signals", score: 3 },
      { label: "1-2 max — adding more just adds noise", score: 4 },
    ],
  },
  {
    id: "arch_5",
    question: "When your system says 'hold' but the market feels dangerous, you...",
    category: "triggers",
    options: [
      { label: "Trust the system 100% — feelings are irrelevant", score: 1 },
      { label: "Override the system and add an extra stop — just in case", score: 2 },
      { label: "Reduce size but stay in — compromise between system and gut", score: 3 },
      { label: "Exit — I've learned that 'the market feels dangerous' is real data too", score: 4 },
    ],
  },
  {
    id: "arch_6",
    question: "Your model predicted a move perfectly 3 times in a row. On the 4th, how much do you size up?",
    category: "risk_behavior",
    options: [
      { label: "Significantly — the model is clearly working right now", score: 1 },
      { label: "A little — I'm tempted but try to stay disciplined", score: 2 },
      { label: "Same size — past predictions don't change my risk rules", score: 3 },
      { label: "I actually reduce exposure — 3 in a row increases mean reversion probability", score: 4 },
    ],
  },
  {
    id: "arch_7",
    question: "You spent a weekend building a new model and it shows incredible results. Your first thought?",
    category: "self_awareness",
    options: [
      { label: "Finally — this is the one. I'm ready to go live Monday", score: 1 },
      { label: "Excited, but I'll paper trade it for a week first", score: 2 },
      { label: "Suspicious — results this good usually have a bug", score: 3 },
      { label: "I check for overfitting, survivorship bias, and regime-dependence before getting excited", score: 4 },
    ],
  },
  {
    id: "arch_8",
    question: "A trade that met all your criteria just resulted in a -3R loss. What broke?",
    category: "coping",
    options: [
      { label: "Nothing — sometimes valid setups lose. That's just variance", score: 4 },
      { label: "I review the trade calmly but don't change the system for one loss", score: 3 },
      { label: "I feel the need to add a new filter to prevent this specific loss", score: 2 },
      { label: "I immediately start questioning the entire system", score: 1 },
    ],
  },
  {
    id: "arch_9",
    question: "How do you feel when someone trades profitably using a simple strategy with no technical analysis?",
    category: "self_awareness",
    options: [
      { label: "They're just lucky — it won't last without a real system", score: 1 },
      { label: "Slightly threatened — if simplicity works, why do I need all this complexity?", score: 2 },
      { label: "Impressed — simplicity has its own edge", score: 3 },
      { label: "Curious — I'd want to understand what makes their approach actually work", score: 4 },
    ],
  },
  {
    id: "arch_10",
    question: "Be honest: is your system optimized for making money, or for being right?",
    category: "growth",
    options: [
      { label: "Making money, obviously", score: 1 },
      { label: "Money... but I feel worse about a wrong prediction than a small loss", score: 2 },
      { label: "I'm working on separating the two — they're not the same thing", score: 3 },
      { label: "I've accepted that profitable trading means being wrong often", score: 4 },
    ],
  },
];

const TILT_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "tilt_1",
    question: "After a surprise loss, how quickly does the urge to 'get it back' hit you?",
    category: "triggers",
    options: [
      { label: "Instantly — I'm already scanning for the next entry", score: 1 },
      { label: "Within minutes — I try to resist but the pull is strong", score: 2 },
      { label: "It takes a while — I feel the urge but can usually wait", score: 3 },
      { label: "Rarely — I've trained myself to pause first", score: 4 },
    ],
  },
  {
    id: "tilt_2",
    question: "You're up $800 on the day, then lose $400 in one trade. What's your next move?",
    category: "triggers",
    options: [
      { label: "Trade bigger to get back to $800 — I was just there", score: 1 },
      { label: "Feel frustrated and take a rushed trade I wouldn't normally take", score: 2 },
      { label: "Remind myself I'm still up $400 and stick to normal size", score: 3 },
      { label: "Stop for 15 minutes to reset, then evaluate if there's a real setup", score: 4 },
    ],
  },
  {
    id: "tilt_3",
    question: "What physical signs do you notice when you're about to revenge trade?",
    category: "self_awareness",
    options: [
      { label: "I don't notice any — I only realize it was revenge after the fact", score: 1 },
      { label: "Heart racing, jaw clenched, but I trade through it", score: 2 },
      { label: "I notice the tension and sometimes catch myself", score: 3 },
      { label: "I have a clear body awareness practice and can feel the shift", score: 4 },
    ],
  },
  {
    id: "tilt_4",
    question: "How often does one bad trade turn into a bad day?",
    category: "risk_behavior",
    options: [
      { label: "Almost every time — one loss snowballs into three or four", score: 1 },
      { label: "Frequently — I know my pattern but struggle to stop it", score: 2 },
      { label: "Sometimes — but I'm getting better at cutting the session early", score: 3 },
      { label: "Rarely — I have hard rules (daily loss limit, forced break)", score: 4 },
    ],
  },
  {
    id: "tilt_5",
    question: "Do you have a daily loss limit, and do you actually follow it?",
    category: "coping",
    options: [
      { label: "No daily loss limit — I can always make it back", score: 1 },
      { label: "I have one but I've broken it more times than I've followed it", score: 2 },
      { label: "I have one and follow it most days — but bad days still happen", score: 3 },
      { label: "Strict limit — I close the platform when I hit it, no exceptions", score: 4 },
    ],
  },
  {
    id: "tilt_6",
    question: "After your worst trading day ever, what did you do?",
    category: "coping",
    options: [
      { label: "Traded the next day trying to recover, which made it worse", score: 1 },
      { label: "Took a day off but felt anxious the whole time", score: 2 },
      { label: "Took a break, reviewed what happened, wrote down lessons", score: 3 },
      { label: "Took a break AND changed my process to prevent it from happening again", score: 4 },
    ],
  },
  {
    id: "tilt_7",
    question: "Your analytical plan says 'no trade today.' But you see a setup that looks good. You...",
    category: "triggers",
    options: [
      { label: "Take it — my plan said no trade but this is too good to miss", score: 1 },
      { label: "Take it with smaller size — a compromise", score: 2 },
      { label: "Write it down and watch, but don't enter", score: 3 },
      { label: "Trust the plan — the setup will come back another day", score: 4 },
    ],
  },
  {
    id: "tilt_8",
    question: "How do you feel about the phrase 'trade to trade well, not to make money'?",
    category: "growth",
    options: [
      { label: "Makes no sense — I trade to make money, period", score: 1 },
      { label: "I understand it intellectually but can't feel it in the moment", score: 2 },
      { label: "I'm starting to get it — process over outcome", score: 3 },
      { label: "This is my mantra — good process generates good results over time", score: 4 },
    ],
  },
  {
    id: "tilt_9",
    question: "During a winning streak, what happens to your position sizing?",
    category: "risk_behavior",
    options: [
      { label: "It goes up — I'm in the zone and should capitalize", score: 1 },
      { label: "I notice it creeping up but don't always catch it", score: 2 },
      { label: "I consciously keep it the same", score: 3 },
      { label: "I actually reduce slightly — overconfidence is as dangerous as revenge", score: 4 },
    ],
  },
  {
    id: "tilt_10",
    question: "What time of day are you most likely to make an impulsive trade?",
    category: "self_awareness",
    options: [
      { label: "I haven't tracked this — it just happens", score: 1 },
      { label: "Late in the session when I'm trying to 'end green'", score: 2 },
      { label: "After lunch — energy dip plus P&L pressure", score: 3 },
      { label: "I've identified my danger times and have specific rules for those windows", score: 4 },
    ],
  },
];

const LIBRARIAN_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "lib_1",
    question: "In the last month, how many setups did you see but NOT take?",
    category: "self_awareness",
    options: [
      { label: "Too many to count — I see good setups daily and take almost none", score: 1 },
      { label: "10+ — it's a real problem", score: 2 },
      { label: "A few — but I'm getting better at pulling the trigger", score: 3 },
      { label: "I track missed trades and they're becoming less frequent", score: 4 },
    ],
  },
  {
    id: "lib_2",
    question: "What's the real reason you don't take the trade when you see a valid setup?",
    category: "triggers",
    options: [
      { label: "There's always one more thing to check — I never feel 100% ready", score: 1 },
      { label: "Fear that this will be the one that doesn't work", score: 2 },
      { label: "I tell myself I'll catch the next one, which feels safer", score: 3 },
      { label: "I genuinely think the setup isn't good enough — my bar is very high", score: 4 },
    ],
  },
  {
    id: "lib_3",
    question: "How do you feel when you see a setup you didn't take running to your target?",
    category: "coping",
    options: [
      { label: "Sick — it confirms I should have taken it and I beat myself up", score: 1 },
      { label: "Frustrated — I knew it was good but couldn't pull the trigger", score: 2 },
      { label: "Noted — I add it to my missed trade log for review", score: 3 },
      { label: "Neutral — I focus on the trades I did take", score: 4 },
    ],
  },
  {
    id: "lib_4",
    question: "How many indicators or confirmations do you need before you feel 'safe' entering?",
    category: "risk_behavior",
    options: [
      { label: "4+ signals aligned — I need everything pointing the same direction", score: 1 },
      { label: "3 — but honestly, a 4th would make me more comfortable", score: 2 },
      { label: "2 — I've learned that too many confirmations = too late entries", score: 3 },
      { label: "1 strong signal — I trust my primary setup and don't need extras", score: 4 },
    ],
  },
  {
    id: "lib_5",
    question: "If you had to trade a setup with only 60% confidence (instead of your usual 80%+), you would...",
    category: "triggers",
    options: [
      { label: "Not take it — 60% is basically a coin flip to me", score: 1 },
      { label: "Agonize about it, probably miss the entry, then regret not taking it", score: 2 },
      { label: "Take it with smaller size to manage the uncertainty", score: 3 },
      { label: "Take it — 60% with proper risk management is a profitable trade", score: 4 },
    ],
  },
  {
    id: "lib_6",
    question: "Your win rate on trades you actually take is...",
    category: "self_awareness",
    options: [
      { label: "Very high — because I only take near-perfect setups (and miss the rest)", score: 1 },
      { label: "Good — but I know the trades I skip are often just as good", score: 2 },
      { label: "About average — I'm learning to take more setups including imperfect ones", score: 3 },
      { label: "I track both taken and missed trades and they have similar win rates", score: 4 },
    ],
  },
  {
    id: "lib_7",
    question: "What would help you take more trades?",
    category: "growth",
    options: [
      { label: "Honestly, I'm not sure — the paralysis feels deeply wired", score: 1 },
      { label: "An external signal telling me 'this is good enough, go'", score: 2 },
      { label: "Seeing data on my missed trades — making opportunity cost visible", score: 3 },
      { label: "I've already started addressing this — rule-based entries help bypass doubt", score: 4 },
    ],
  },
  {
    id: "lib_8",
    question: "Do you ever research a trade so long that by the time you're ready, the entry is gone?",
    category: "triggers",
    options: [
      { label: "All the time — this is my primary problem", score: 1 },
      { label: "Frequently — and it's incredibly frustrating", score: 2 },
      { label: "Sometimes — but I've started setting time limits on analysis", score: 3 },
      { label: "Rarely — I now have a 'decision by X time' rule", score: 4 },
    ],
  },
  {
    id: "lib_9",
    question: "How many assets are on your watchlist right now?",
    category: "risk_behavior",
    options: [
      { label: "30+ — I monitor everything to catch the best setups", score: 1 },
      { label: "15-30 — a wide net so I don't miss anything", score: 2 },
      { label: "5-15 — focused enough to actually act on what I see", score: 3 },
      { label: "Under 5 — I narrowed down to my highest-conviction setups", score: 4 },
    ],
  },
  {
    id: "lib_10",
    question: "A trading mentor says 'your analysis is better than most profitable traders — you just don't execute.' How does that feel?",
    category: "growth",
    options: [
      { label: "Painful but accurate — I know this is true", score: 1 },
      { label: "Motivating — but I've heard it before and still struggle to change", score: 2 },
      { label: "Helpful — I'm working on bridging the gap between analysis and action", score: 3 },
      { label: "I already know this — execution is the only thing I'm focused on improving", score: 4 },
    ],
  },
];

const PAPER_HAND_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "ph_1",
    question: "Your trade is $200 in profit. A candle turns red. Be honest — what do you do?",
    category: "triggers",
    options: [
      { label: "Close immediately — I can't watch profit disappear", score: 1 },
      { label: "Move my stop to breakeven so I 'can't lose'", score: 2 },
      { label: "Feel uncomfortable but check if my target is still valid", score: 3 },
      { label: "Ignore the candle — red candles happen in winning trades too", score: 4 },
    ],
  },
  {
    id: "ph_2",
    question: "How often do you close a trade before hitting your planned target?",
    category: "self_awareness",
    options: [
      { label: "Almost every time — I can't help it", score: 1 },
      { label: "More often than not — especially when profit starts to shrink", score: 2 },
      { label: "Sometimes — but I'm getting better at holding", score: 3 },
      { label: "Rarely — I trust my targets and let the trade play out", score: 4 },
    ],
  },
  {
    id: "ph_3",
    question: "You close a trade at +$150. It goes on to hit your original target at +$400. What do you feel?",
    category: "coping",
    options: [
      { label: "Sick — I always leave money on the table", score: 1 },
      { label: "Frustrated — but at least I locked in some profit", score: 2 },
      { label: "I note it but remind myself that taking profit isn't wrong", score: 3 },
      { label: "I use it as data to improve my exit strategy, no emotional charge", score: 4 },
    ],
  },
  {
    id: "ph_4",
    question: "Which statement best describes your average winning trade vs. losing trade?",
    category: "risk_behavior",
    options: [
      { label: "My winners are much smaller than my losers — I cut winners and hold losers", score: 1 },
      { label: "Winners are slightly smaller — I exit winners faster than losers", score: 2 },
      { label: "About even — I'm working on letting winners run", score: 3 },
      { label: "Winners are larger — I've learned to hold through discomfort", score: 4 },
    ],
  },
  {
    id: "ph_5",
    question: "When you say 'profit is profit,' is that a strategy or a coping mechanism?",
    category: "self_awareness",
    options: [
      { label: "It's genuinely how I feel — any profit is better than a loss", score: 1 },
      { label: "Honestly... probably a coping mechanism", score: 2 },
      { label: "I've started to realize it's costing me more than it's protecting me", score: 3 },
      { label: "I don't say this anymore — I focus on R-multiples, not absolute profit", score: 4 },
    ],
  },
  {
    id: "ph_6",
    question: "Your win rate is above 60% but your account isn't growing. Do you know why?",
    category: "self_awareness",
    options: [
      { label: "I'm not sure — I win most trades so it should be growing", score: 1 },
      { label: "I suspect my winners are too small but haven't tracked it", score: 2 },
      { label: "I know it's because my avg winner is smaller than my avg loser", score: 3 },
      { label: "I've fixed this — I now track and optimize my R-multiple distribution", score: 4 },
    ],
  },
  {
    id: "ph_7",
    question: "What would make you more comfortable holding a trade to target?",
    category: "growth",
    options: [
      { label: "I don't think anything would — the urge to close is too strong", score: 1 },
      { label: "If someone else was managing the exit so I couldn't interfere", score: 2 },
      { label: "A trailing stop so I know I'm protected while allowing upside", score: 3 },
      { label: "I've already started using partial exits — close 50%, hold 50% to target", score: 4 },
    ],
  },
  {
    id: "ph_8",
    question: "During a trade, how often do you check the P&L?",
    category: "triggers",
    options: [
      { label: "Constantly — I can't look away", score: 1 },
      { label: "Every few minutes — more often when it's green", score: 2 },
      { label: "Periodically — but I try to focus on the chart, not the number", score: 3 },
      { label: "I hide the P&L and trade the chart only", score: 4 },
    ],
  },
  {
    id: "ph_9",
    question: "You set a stop at -$300 and a target at +$600. The trade is at +$200 and pulling back. Where do you move your stop?",
    category: "risk_behavior",
    options: [
      { label: "Breakeven — I refuse to let a winner turn into a loser", score: 1 },
      { label: "+$100 — lock in at least something", score: 2 },
      { label: "I don't move it — my original stop was based on the chart, not my feelings", score: 3 },
      { label: "I trail it to a logical level (recent swing low), not an emotional one", score: 4 },
    ],
  },
  {
    id: "ph_10",
    question: "If you could see the future and KNOW a trade would hit your target, but it would dip -$300 first, would you hold?",
    category: "growth",
    options: [
      { label: "Even knowing the outcome, I'd probably still close during the dip", score: 1 },
      { label: "I'd hold, but it would be extremely uncomfortable", score: 2 },
      { label: "I'd hold — this is exactly the discipline I'm building", score: 3 },
      { label: "Easily — I've learned that drawdowns during winning trades are normal", score: 4 },
    ],
  },
];

const CHAMELEON_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "cham_1",
    question: "How many different strategies have you tried in the last 3 months?",
    category: "self_awareness",
    options: [
      { label: "5+ — none of them worked for me", score: 1 },
      { label: "3-4 — I keep finding better approaches", score: 2 },
      { label: "2 — I'm trying to narrow down", score: 3 },
      { label: "1 — I've committed to mastering one approach", score: 4 },
    ],
  },
  {
    id: "cham_2",
    question: "You've been running a strategy for 2 weeks and it's down 3 trades in a row. What do you do?",
    category: "triggers",
    options: [
      { label: "Switch to something else — clearly this isn't working", score: 1 },
      { label: "Start tweaking the rules to see if I can fix it", score: 2 },
      { label: "Continue but feel tempted to switch", score: 3 },
      { label: "Continue — 3 trades is not a meaningful sample size", score: 4 },
    ],
  },
  {
    id: "cham_3",
    question: "A trader on Twitter shows a different approach that made money today. You...",
    category: "triggers",
    options: [
      { label: "Start learning their approach immediately — what I'm doing clearly isn't as good", score: 1 },
      { label: "Feel the pull to switch but try to resist", score: 2 },
      { label: "Note it as interesting but continue with my own strategy", score: 3 },
      { label: "Ignore it — what works for them doesn't mean it'll work for me", score: 4 },
    ],
  },
  {
    id: "cham_4",
    question: "Be honest: do you switch systems because they fail, or because you get bored?",
    category: "self_awareness",
    options: [
      { label: "A mix of both — but if I'm being honest, mostly boredom", score: 1 },
      { label: "I tell myself it's because they fail, but maybe that's not always true", score: 2 },
      { label: "I've started to recognize when it's boredom vs. genuine failure", score: 3 },
      { label: "I only switch after a meaningful sample size proves it's not working", score: 4 },
    ],
  },
  {
    id: "cham_5",
    question: "What's the longest you've stuck with a single trading strategy?",
    category: "self_awareness",
    options: [
      { label: "Under 2 weeks — I always find something better", score: 1 },
      { label: "About a month — until a drawdown shakes my confidence", score: 2 },
      { label: "2-3 months — I'm getting more patient", score: 3 },
      { label: "6+ months — I understand that edge emerges over time", score: 4 },
    ],
  },
  {
    id: "cham_6",
    question: "Your gut says 'buy SOL.' Your system says 'no signal.' What wins?",
    category: "risk_behavior",
    options: [
      { label: "My gut — it's been right before and my system misses these moves", score: 1 },
      { label: "I take a small gut trade alongside my system trades", score: 2 },
      { label: "The system — but I track my gut calls separately to test them", score: 3 },
      { label: "Always the system — I don't let gut feelings override rules", score: 4 },
    ],
  },
  {
    id: "cham_7",
    question: "How do you feel during a quiet, boring market with no action?",
    category: "triggers",
    options: [
      { label: "Restless — I start looking for trades in smaller timeframes or different assets", score: 1 },
      { label: "Anxious — I feel like I'm missing something", score: 2 },
      { label: "A little bored but I use the time to review and prepare", score: 3 },
      { label: "Content — no setups = no trades = doing my job correctly", score: 4 },
    ],
  },
  {
    id: "cham_8",
    question: "You had a gut-feeling trade that made 15%. Does that validate or hurt your process?",
    category: "growth",
    options: [
      { label: "Validates it — my instinct is my real edge", score: 1 },
      { label: "Feels great, but I know one win doesn't prove anything", score: 2 },
      { label: "Hurts my process — it reinforces the habit of ignoring my system", score: 3 },
      { label: "I log it as data — track gut vs. system performance objectively over time", score: 4 },
    ],
  },
  {
    id: "cham_9",
    question: "What would make you commit to one strategy for 3 months straight?",
    category: "growth",
    options: [
      { label: "It would have to win 80%+ of the time — anything less and I'd want to switch", score: 1 },
      { label: "Seeing someone I respect profit consistently with it", score: 2 },
      { label: "Having a tracking system that shows me I haven't given it enough trades yet", score: 3 },
      { label: "I've already made this commitment — discipline over excitement", score: 4 },
    ],
  },
  {
    id: "cham_10",
    question: "How many tabs do you currently have open related to trading strategies or education?",
    category: "self_awareness",
    options: [
      { label: "10+ — I'm always researching the next thing", score: 1 },
      { label: "5-10 — a mix of current strategy and interesting alternatives", score: 2 },
      { label: "2-4 — focused on what I'm actually using", score: 3 },
      { label: "1-2 max — I've stopped consuming and started executing", score: 4 },
    ],
  },
];

const DEGEN_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "deg_1",
    question: "It's 2 AM and you see a token pumping on CT. What do you do?",
    category: "triggers",
    options: [
      { label: "Market buy immediately — can't miss this", score: 1 },
      { label: "Quick chart glance, then buy — FOMO is real", score: 2 },
      { label: "Bookmark it and check in the morning with fresh eyes", score: 3 },
      { label: "Ignore it — nothing good happens in my trading at 2 AM", score: 4 },
    ],
  },
  {
    id: "deg_2",
    question: "How many of your trades in the last week had zero technical analysis behind them?",
    category: "risk_behavior",
    options: [
      { label: "Most of them — I trade momentum and vibes", score: 1 },
      { label: "About half — some are planned, some are impulse", score: 2 },
      { label: "A few — I'm trying to plan more but still slip", score: 3 },
      { label: "None — every trade follows a checklist before I enter", score: 4 },
    ],
  },
  {
    id: "deg_3",
    question: "You just closed a 40% winner. What do you feel?",
    category: "self_awareness",
    options: [
      { label: "High — I'm unstoppable, where's the next one?", score: 1 },
      { label: "Excited — but the rush fades fast and I want more", score: 2 },
      { label: "Satisfied — I log the trade and take a break", score: 3 },
      { label: "Analytical — I check if the trade was actually good process, not just luck", score: 4 },
    ],
  },
  {
    id: "deg_4",
    question: "How often do you trade because you're bored (not because there's a setup)?",
    category: "triggers",
    options: [
      { label: "Daily — trading is my entertainment", score: 1 },
      { label: "A few times a week — especially during slow markets", score: 2 },
      { label: "Occasionally — but I recognize it when it happens now", score: 3 },
      { label: "Rarely — I have a pre-trade checklist that filters out boredom trades", score: 4 },
    ],
  },
  {
    id: "deg_5",
    question: "A coin you're holding drops 30%. Your CT timeline says 'HODL.' You...",
    category: "risk_behavior",
    options: [
      { label: "HODL — the community knows something I don't", score: 1 },
      { label: "Hold but feel uneasy — what if CT is wrong?", score: 2 },
      { label: "Check the fundamentals, not the timeline, to make my decision", score: 3 },
      { label: "Already exited at my stop loss — CT hype doesn't change my risk management", score: 4 },
    ],
  },
  {
    id: "deg_6",
    question: "What's the most you've lost on a single impulse trade?",
    category: "self_awareness",
    options: [
      { label: "Enough to seriously damage my account — more than once", score: 1 },
      { label: "A significant amount that taught me a hard lesson", score: 2 },
      { label: "Small amounts because I've learned to at least size down on impulse trades", score: 3 },
      { label: "I don't take impulse trades anymore — I eliminated them from my process", score: 4 },
    ],
  },
  {
    id: "deg_7",
    question: "When you open your trading app, how quickly do you place a trade?",
    category: "triggers",
    options: [
      { label: "Within 60 seconds — I already know what I want to do", score: 1 },
      { label: "Within a few minutes — I scan fast and act", score: 2 },
      { label: "I spend time checking my watchlist and plan before doing anything", score: 3 },
      { label: "I have a pre-market routine that takes 15-30 minutes before any trades", score: 4 },
    ],
  },
  {
    id: "deg_8",
    question: "How does leverage make you feel?",
    category: "risk_behavior",
    options: [
      { label: "Exciting — bigger moves, bigger profits, this is why I trade", score: 1 },
      { label: "Tempting — I know it's risky but the potential reward is addictive", score: 2 },
      { label: "Useful in specific situations with proper stop losses", score: 3 },
      { label: "Dangerous — I've removed access to leverage to protect myself", score: 4 },
    ],
  },
  {
    id: "deg_9",
    question: "If trading was removed from your life, what would you miss most?",
    category: "growth",
    options: [
      { label: "The rush — nothing else gives me this feeling", score: 1 },
      { label: "The excitement and community around it", score: 2 },
      { label: "The intellectual challenge and skill-building", score: 3 },
      { label: "The income — trading is a business, not entertainment", score: 4 },
    ],
  },
  {
    id: "deg_10",
    question: "Would you be profitable if you only took trades that existed on your watchlist from the night before?",
    category: "growth",
    options: [
      { label: "I don't have a watchlist — I trade what's moving", score: 1 },
      { label: "Maybe — but I'd miss the best momentum plays", score: 2 },
      { label: "Probably yes — my planned trades perform much better than my impulse ones", score: 3 },
      { label: "Definitely — I've tested this and my planned trades crush my impulse trades", score: 4 },
    ],
  },
];

const DIAMOND_HAND_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "dh_1",
    question: "You're holding an asset that's down 40%. A piece of negative fundamental news comes out. You...",
    category: "triggers",
    options: [
      { label: "Hold — FUD comes and goes, my conviction is strong", score: 1 },
      { label: "Hold but feel slightly uneasy — check for more information", score: 2 },
      { label: "Evaluate: is this news material enough to change my thesis?", score: 3 },
      { label: "Re-ask myself: would I buy this asset at this price today? If no, sell", score: 4 },
    ],
  },
  {
    id: "dh_2",
    question: "How do you tell the difference between 'patience' and 'denial'?",
    category: "self_awareness",
    options: [
      { label: "Patience IS holding through everything — that's the whole point", score: 1 },
      { label: "I think I can tell, but honestly, they feel the same in the moment", score: 2 },
      { label: "I check fundamentals regularly — if the thesis is broken, I exit", score: 3 },
      { label: "I have written criteria for when to exit and I review them monthly", score: 4 },
    ],
  },
  {
    id: "dh_3",
    question: "Think of an asset you held through a massive drawdown. Were you holding because of data, or because selling felt like losing?",
    category: "self_awareness",
    options: [
      { label: "Because selling would have meant the loss was 'real' — and I couldn't accept that", score: 1 },
      { label: "A mix of both — the data supported holding but the real reason was emotional", score: 2 },
      { label: "Mostly data — but the emotional attachment was stronger than I'd like to admit", score: 3 },
      { label: "Purely data — I had an exit plan and the conditions hadn't been met", score: 4 },
    ],
  },
  {
    id: "dh_4",
    question: "Do you have a written exit plan for every position you hold?",
    category: "risk_behavior",
    options: [
      { label: "No — I buy and hold, that's the strategy", score: 1 },
      { label: "I have a rough idea but nothing written down", score: 2 },
      { label: "I have target prices but not conditions for when to cut losses", score: 3 },
      { label: "Yes — specific conditions (fundamental and technical) that would trigger an exit", score: 4 },
    ],
  },
  {
    id: "dh_5",
    question: "How do you react when someone presents a bear case for your biggest holding?",
    category: "triggers",
    options: [
      { label: "Dismissive — they don't understand the project", score: 1 },
      { label: "Defensive — I counter with my bull case", score: 2 },
      { label: "Curious — I listen and check if any of their points are valid", score: 3 },
      { label: "Grateful — good bear cases protect me from blind spots", score: 4 },
    ],
  },
  {
    id: "dh_6",
    question: "How many of your current holdings would you buy again today at today's price?",
    category: "self_awareness",
    options: [
      { label: "All of them — my conviction hasn't changed", score: 1 },
      { label: "Most — but there are 1-2 I'm holding just because I've held them so long", score: 2 },
      { label: "Some — I know a few are sunk cost positions but it's hard to let go", score: 3 },
      { label: "Only the ones that still meet my original thesis criteria", score: 4 },
    ],
  },
  {
    id: "dh_7",
    question: "The team behind one of your holdings has a leadership shakeup. Key people leave. You...",
    category: "risk_behavior",
    options: [
      { label: "Hold — one event doesn't change the long-term potential", score: 1 },
      { label: "Concerned but wait for more information", score: 2 },
      { label: "Reduce position size — this changes my conviction level", score: 3 },
      { label: "Exit or heavily reduce — team changes are fundamental thesis changes", score: 4 },
    ],
  },
  {
    id: "dh_8",
    question: "You held BTC through the bottom and it recovered. You held LUNA through the bottom and it didn't. What did you learn?",
    category: "growth",
    options: [
      { label: "That conviction pays off — BTC proved it", score: 1 },
      { label: "That some assets recover and some don't — but I'm not sure how to tell the difference", score: 2 },
      { label: "That I need to differentiate between conviction with evidence and conviction from emotion", score: 3 },
      { label: "That survivorship bias is real — the BTC win doesn't validate the LUNA loss", score: 4 },
    ],
  },
  {
    id: "dh_9",
    question: "What percentage of your portfolio is in your single largest position?",
    category: "risk_behavior",
    options: [
      { label: "50%+ — I put my money where my conviction is", score: 1 },
      { label: "30-50% — high conviction deserves high allocation", score: 2 },
      { label: "15-30% — I believe in it but manage the risk", score: 3 },
      { label: "Under 15% — conviction is separate from concentration risk", score: 4 },
    ],
  },
  {
    id: "dh_10",
    question: "If Traverse showed you that holding through a drawdown cost you 3x more than selling and re-entering, would you change your behavior?",
    category: "growth",
    options: [
      { label: "Probably not — data doesn't change conviction", score: 1 },
      { label: "I'd consider it, but selling still feels wrong emotionally", score: 2 },
      { label: "Yes — hard data would override my emotional attachment", score: 3 },
      { label: "I already use this kind of analysis to make holding/selling decisions", score: 4 },
    ],
  },
];

const LURKER_QUESTIONS: DeepQuizQuestion[] = [
  {
    id: "lurk_1",
    question: "You see a perfect setup. Cursor is over the buy button. What happens?",
    category: "triggers",
    options: [
      { label: "I freeze. Heart races. Close the app. Trade gone.", score: 1 },
      { label: "I hesitate too long, move the limit lower 'just in case', and miss it", score: 2 },
      { label: "I take a deep breath and click — but it takes real effort", score: 3 },
      { label: "I click without drama — I've built this into my routine", score: 4 },
    ],
  },
  {
    id: "lurk_2",
    question: "In the last month, how much money have your NOT-taken trades hypothetically made?",
    category: "self_awareness",
    options: [
      { label: "I don't track it — I'd rather not know", score: 1 },
      { label: "Enough that it would have been a profitable month", score: 2 },
      { label: "I've started tracking and it's eye-opening", score: 3 },
      { label: "I track it and use the data to build confidence in my reads", score: 4 },
    ],
  },
  {
    id: "lurk_3",
    question: "What specifically scares you about pressing the buy/sell button?",
    category: "self_awareness",
    options: [
      { label: "That it will go against me IMMEDIATELY after I enter", score: 1 },
      { label: "That I'll be wrong and regret taking the trade", score: 2 },
      { label: "Losing money — even a small amount on a position feels bad", score: 3 },
      { label: "Nothing specific anymore — I've identified my fear and I'm working on it", score: 4 },
    ],
  },
  {
    id: "lurk_4",
    question: "You correctly predicted a move but didn't take the trade. How often does this happen?",
    category: "triggers",
    options: [
      { label: "Weekly — I'm always right on the sidelines", score: 1 },
      { label: "A few times a month — it's my most frustrating pattern", score: 2 },
      { label: "Occasionally — I'm taking more trades than before", score: 3 },
      { label: "Rarely — I've developed a system to act on my reads", score: 4 },
    ],
  },
  {
    id: "lurk_5",
    question: "Would you feel better taking a trade if there was zero chance of losing money?",
    category: "self_awareness",
    options: [
      { label: "Yes — the risk is the whole problem", score: 1 },
      { label: "Mostly — but even paper trading makes me hesitate", score: 2 },
      { label: "Partly — it's more about the act of committing than the money", score: 3 },
      { label: "The money isn't the issue — I've reframed trading as a probability game", score: 4 },
    ],
  },
  {
    id: "lurk_6",
    question: "You place a limit order but the market comes within $0.50 of filling it and bounces. You...",
    category: "coping",
    options: [
      { label: "Sigh of relief — I was secretly hoping it wouldn't fill", score: 1 },
      { label: "Frustrated — I should have used market order, but I set the limit so I could 'not have to decide'", score: 2 },
      { label: "Adjust the limit or switch to market — I actually want this trade", score: 3 },
      { label: "I don't use limits as a way to avoid committing — I use market orders when the setup is valid", score: 4 },
    ],
  },
  {
    id: "lurk_7",
    question: "What's your actual P&L for the last 3 months?",
    category: "risk_behavior",
    options: [
      { label: "Essentially $0 — I've barely traded", score: 1 },
      { label: "Slightly negative from the few trades I forced myself to take", score: 2 },
      { label: "Small positive — I'm taking more trades with small size", score: 3 },
      { label: "Solid positive — I've broken through the action barrier", score: 4 },
    ],
  },
  {
    id: "lurk_8",
    question: "Which would help you trade more?",
    category: "growth",
    options: [
      { label: "I honestly don't know — the freeze feels involuntary", score: 1 },
      { label: "Someone confirming my trade idea before I enter", score: 2 },
      { label: "Proof that my market reads are actually profitable (even if I don't trade them)", score: 3 },
      { label: "I've already found what works: tiny position sizes to build the habit of executing", score: 4 },
    ],
  },
  {
    id: "lurk_9",
    question: "How do you feel about paper trading?",
    category: "coping",
    options: [
      { label: "Even paper trading feels scary — I know that sounds irrational", score: 1 },
      { label: "I paper trade and I'm profitable, but can't translate to real money", score: 2 },
      { label: "I used paper trading as a bridge and now I trade small real positions", score: 3 },
      { label: "I've moved past paper trading — real execution is the only practice that matters", score: 4 },
    ],
  },
  {
    id: "lurk_10",
    question: "If Traverse tracked your gut calls and showed you 'Your intuition was right 67% of the time,' would that change your behavior?",
    category: "growth",
    options: [
      { label: "Maybe, but I'd probably still freeze in the moment", score: 1 },
      { label: "Yes — hard proof that I have an edge would help a lot", score: 2 },
      { label: "It would give me the confidence boost I need to start small", score: 3 },
      { label: "I've already started building this confidence — data is my antidote to fear", score: 4 },
    ],
  },
];

// ─── Export per archetype ───────────────────────────────────────────────────

export const DEEP_QUIZ_QUESTIONS: Record<MiniArchetype, DeepQuizQuestion[]> = {
  architect: ARCHITECT_QUESTIONS,
  tilt: TILT_QUESTIONS,
  librarian: LIBRARIAN_QUESTIONS,
  paper_hand: PAPER_HAND_QUESTIONS,
  chameleon: CHAMELEON_QUESTIONS,
  degen: DEGEN_QUESTIONS,
  diamond_hand: DIAMOND_HAND_QUESTIONS,
  lurker: LURKER_QUESTIONS,
};

export function getDeepQuizQuestions(archetype: MiniArchetype): DeepQuizQuestion[] {
  return [...UNIVERSAL_QUESTIONS, ...DEEP_QUIZ_QUESTIONS[archetype]];
}
