// Local-first screening store — tests, sessions, bookmarks, prefs.
// No backend. All persistence in localStorage.

export type Category = "Depression" | "Anxiety" | "Stress" | "Wellbeing" | "Sleep" | "Self" | "Social" | "Academic" | "Mindfulness";
export type Difficulty = "Light" | "Moderate" | "Reflective";

export type Question = {
  id: string;
  text: string;
  options: { label: string; value: number }[];
  reverse?: boolean;
};

export type Test = {
  id: string;
  code: string;
  name: string;
  category: Category;
  short: string;
  measures: string;
  why: string;
  whoFor: string;
  minutes: number;
  difficulty: Difficulty;
  source: string;
  accuracy: string;
  updated: string;
  featured?: boolean;
  bands: { min: number; max: number; label: string; tone: "calm" | "mild" | "moderate" | "elevated" | "high" }[];
  questions: Question[];
};

// ─── option scales ──────────────────────────────────────────────────
const s4 = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];
const stress5 = [
  { label: "Never", value: 0 },
  { label: "Almost never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly often", value: 3 },
  { label: "Very often", value: 4 },
];
const who6 = [
  { label: "At no time", value: 0 },
  { label: "Some of the time", value: 1 },
  { label: "Less than half the time", value: 2 },
  { label: "More than half the time", value: 3 },
  { label: "Most of the time", value: 4 },
  { label: "All of the time", value: 5 },
];
const agree4 = [
  { label: "Strongly disagree", value: 0 },
  { label: "Disagree", value: 1 },
  { label: "Agree", value: 2 },
  { label: "Strongly agree", value: 3 },
];
const often4 = [
  { label: "Never", value: 0 },
  { label: "Rarely", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
];
const lonely4 = [
  { label: "Never", value: 1 },
  { label: "Rarely", value: 2 },
  { label: "Sometimes", value: 3 },
  { label: "Often", value: 4 },
];

// ─── tests ──────────────────────────────────────────────────────────
const q = (prefix: string, texts: string[], options: Question["options"]): Question[] =>
  texts.map((t, i) => ({ id: `${prefix}-${i + 1}`, text: t, options }));

export const TESTS: Test[] = [
  {
    id: "phq9", code: "PHQ-9", name: "Depression Screening", category: "Depression",
    short: "A gentle check for depressive symptoms over the last two weeks.",
    measures: "Frequency of nine core depressive symptoms.",
    why: "Early awareness lets small feelings stay small. This is one of the most validated screens in the world.",
    whoFor: "Anyone noticing low mood, low energy, or loss of interest for more than a few days.",
    minutes: 4, difficulty: "Light", featured: true,
    source: "Kroenke, Spitzer & Williams (2001)",
    accuracy: "Sensitivity ~88%, specificity ~88% for major depression.",
    updated: "2024",
    bands: [
      { min: 0, max: 4, label: "Minimal", tone: "calm" },
      { min: 5, max: 9, label: "Mild", tone: "mild" },
      { min: 10, max: 14, label: "Moderate", tone: "moderate" },
      { min: 15, max: 19, label: "Moderately severe", tone: "elevated" },
      { min: 20, max: 27, label: "Severe", tone: "high" },
    ],
    questions: q("phq9", [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself — or that you are a failure",
      "Trouble concentrating on things like reading or classes",
      "Moving or speaking slowly, or being fidgety and restless",
      "Thoughts that you would be better off not being here",
    ], s4),
  },
  {
    id: "gad7", code: "GAD-7", name: "Anxiety Screening", category: "Anxiety",
    short: "Understand how anxiety has been showing up in the last two weeks.",
    measures: "Frequency of seven generalized anxiety symptoms.",
    why: "Anxiety is common in student life. Noticing it clearly is the first step to caring for it.",
    whoFor: "Anyone feeling on-edge, restless, or worried more days than not.",
    minutes: 3, difficulty: "Light", featured: true,
    source: "Spitzer, Kroenke, Williams & Löwe (2006)",
    accuracy: "Sensitivity ~89%, specificity ~82% for generalized anxiety.",
    updated: "2024",
    bands: [
      { min: 0, max: 4, label: "Minimal", tone: "calm" },
      { min: 5, max: 9, label: "Mild", tone: "mild" },
      { min: 10, max: 14, label: "Moderate", tone: "moderate" },
      { min: 15, max: 21, label: "Severe", tone: "high" },
    ],
    questions: q("gad7", [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it's hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ], s4),
  },
  {
    id: "who5", code: "WHO-5", name: "Wellbeing Index", category: "Wellbeing",
    short: "A brief snapshot of positive wellbeing.",
    measures: "Positive mood, vitality, and general interests over two weeks.",
    why: "Wellbeing is more than the absence of hurt. This measures the good, gently.",
    whoFor: "Anyone curious about their overall sense of thriving.",
    minutes: 2, difficulty: "Light", featured: true,
    source: "World Health Organization (1998)",
    accuracy: "High construct validity across 30+ countries.",
    updated: "2024",
    bands: [
      { min: 0, max: 28, label: "Low wellbeing", tone: "elevated" },
      { min: 29, max: 50, label: "Reduced wellbeing", tone: "moderate" },
      { min: 51, max: 75, label: "Moderate wellbeing", tone: "mild" },
      { min: 76, max: 100, label: "High wellbeing", tone: "calm" },
    ],
    questions: q("who5", [
      "I have felt cheerful and in good spirits",
      "I have felt calm and relaxed",
      "I have felt active and vigorous",
      "I woke up feeling fresh and rested",
      "My daily life has been filled with things that interest me",
    ], who6),
  },
  {
    id: "pss10", code: "PSS-10", name: "Perceived Stress Scale", category: "Stress",
    short: "How unpredictable, uncontrollable, and overloaded life has felt.",
    measures: "Global perception of stress in the last month.",
    why: "Stress isn't only what happens — it's how we experience it.",
    whoFor: "Students in exam seasons, transitions, or heavy weeks.",
    minutes: 4, difficulty: "Moderate",
    source: "Cohen, Kamarck & Mermelstein (1983)",
    accuracy: "Reliability α ≈ 0.85.",
    updated: "2024",
    bands: [
      { min: 0, max: 13, label: "Low stress", tone: "calm" },
      { min: 14, max: 26, label: "Moderate stress", tone: "moderate" },
      { min: 27, max: 40, label: "High stress", tone: "high" },
    ],
    questions: [
      ...q("pss10", ["Been upset because of something that happened unexpectedly", "Felt unable to control the important things in your life", "Felt nervous and stressed"], stress5),
      { id: "pss10-4", text: "Felt confident about your ability to handle personal problems", options: stress5, reverse: true },
      { id: "pss10-5", text: "Felt that things were going your way", options: stress5, reverse: true },
      ...q("pss10-b", ["Found that you could not cope with all the things you had to do"], stress5),
      { id: "pss10-7", text: "Been able to control irritations in your life", options: stress5, reverse: true },
      { id: "pss10-8", text: "Felt that you were on top of things", options: stress5, reverse: true },
      ...q("pss10-c", ["Been angered because of things outside your control", "Felt difficulties were piling up so high you could not overcome them"], stress5),
    ],
  },
  {
    id: "ucla3", code: "UCLA-3", name: "Loneliness Scale", category: "Social",
    short: "A brief look at feelings of connection and belonging.",
    measures: "Perceived social isolation.",
    why: "Loneliness is a signal, not a verdict. It softens with tending.",
    whoFor: "Anyone in a new city, hostel, or transition.",
    minutes: 2, difficulty: "Light",
    source: "Hughes, Waite, Hawkley & Cacioppo (2004)",
    accuracy: "Correlates strongly (r ≈ 0.82) with the 20-item scale.",
    updated: "2024",
    bands: [
      { min: 3, max: 5, label: "Not lonely", tone: "calm" },
      { min: 6, max: 8, label: "Somewhat lonely", tone: "mild" },
      { min: 9, max: 12, label: "Lonely", tone: "elevated" },
    ],
    questions: q("ucla3", [
      "How often do you feel that you lack companionship?",
      "How often do you feel left out?",
      "How often do you feel isolated from others?",
    ], lonely4),
  },
  {
    id: "rses", code: "RSES", name: "Rosenberg Self-Esteem", category: "Self",
    short: "How you relate to yourself, right now.",
    measures: "Global self-worth.",
    why: "Self-esteem shapes how we walk through the world.",
    whoFor: "Anyone being unusually hard on themselves lately.",
    minutes: 3, difficulty: "Moderate",
    source: "Rosenberg (1965)",
    accuracy: "Reliability α ≈ 0.88.",
    updated: "2024",
    bands: [
      { min: 0, max: 14, label: "Low self-esteem", tone: "elevated" },
      { min: 15, max: 25, label: "Normal range", tone: "mild" },
      { min: 26, max: 30, label: "Healthy self-esteem", tone: "calm" },
    ],
    questions: [
      { id: "rses-1", text: "On the whole, I am satisfied with myself", options: agree4 },
      { id: "rses-2", text: "At times, I think I am no good at all", options: agree4, reverse: true },
      { id: "rses-3", text: "I feel that I have a number of good qualities", options: agree4 },
      { id: "rses-4", text: "I am able to do things as well as most other people", options: agree4 },
      { id: "rses-5", text: "I feel I do not have much to be proud of", options: agree4, reverse: true },
      { id: "rses-6", text: "I certainly feel useless at times", options: agree4, reverse: true },
      { id: "rses-7", text: "I feel that I'm a person of worth", options: agree4 },
      { id: "rses-8", text: "I wish I could have more respect for myself", options: agree4, reverse: true },
      { id: "rses-9", text: "All in all, I am inclined to feel that I am a failure", options: agree4, reverse: true },
      { id: "rses-10", text: "I take a positive attitude toward myself", options: agree4 },
    ],
  },
  {
    id: "psqi", code: "PSQI-b", name: "Sleep Quality (brief)", category: "Sleep",
    short: "A short look at how your nights have been.",
    measures: "Sleep quality, duration, and disturbance.",
    why: "Sleep quietly shapes mood, focus, and hope.",
    whoFor: "Anyone whose nights feel restless, short, or heavy.",
    minutes: 3, difficulty: "Light",
    source: "Buysse et al. (1989), brief adaptation",
    accuracy: "α ≈ 0.83 for the full scale.",
    updated: "2024",
    bands: [
      { min: 0, max: 5, label: "Good sleep", tone: "calm" },
      { min: 6, max: 10, label: "Fair sleep", tone: "mild" },
      { min: 11, max: 15, label: "Disturbed sleep", tone: "moderate" },
      { min: 16, max: 21, label: "Poor sleep", tone: "high" },
    ],
    questions: q("psqi", [
      "I have had trouble falling asleep within 30 minutes",
      "I wake up in the middle of the night or too early",
      "I feel my sleep is not restful",
      "I feel sleepy or low-energy during the day",
      "I use my phone in bed late into the night",
      "I feel my sleep schedule is unpredictable",
      "I struggle to wake up feeling clear-headed",
    ], s4),
  },
  {
    id: "dass21", code: "DASS-21", name: "Depression, Anxiety & Stress", category: "Stress",
    short: "A three-in-one snapshot across three emotional currents.",
    measures: "Depression, anxiety, and stress in the last week.",
    why: "Three currents, one page. Useful when you're not sure what you're feeling.",
    whoFor: "Anyone wanting a broader emotional picture.",
    minutes: 5, difficulty: "Moderate",
    source: "Lovibond & Lovibond (1995)",
    accuracy: "α ≈ 0.88 across subscales.",
    updated: "2024",
    bands: [
      { min: 0, max: 20, label: "Within normal range", tone: "calm" },
      { min: 21, max: 40, label: "Mild elevation", tone: "mild" },
      { min: 41, max: 60, label: "Moderate elevation", tone: "moderate" },
      { min: 61, max: 63, label: "High elevation", tone: "high" },
    ],
    questions: q("dass21", [
      "I found it hard to wind down",
      "I was aware of dryness in my mouth",
      "I couldn't seem to experience any positive feeling",
      "I experienced breathing difficulty",
      "I found it difficult to work up initiative",
      "I tended to over-react to situations",
      "I experienced trembling (e.g. in the hands)",
      "I felt I was using a lot of nervous energy",
      "I was worried about situations in which I might panic",
      "I felt I had nothing to look forward to",
      "I found myself getting agitated",
      "I found it difficult to relax",
      "I felt down-hearted and blue",
      "I was intolerant of anything that kept me from getting on",
      "I felt I was close to panic",
      "I was unable to become enthusiastic about anything",
      "I felt I was not worth much as a person",
      "I felt that I was rather touchy",
      "I was aware of my heart beating in absence of exertion",
      "I felt scared without any good reason",
      "I felt that life was meaningless",
    ], s4),
  },
  {
    id: "burnout", code: "ABS", name: "Academic Burnout", category: "Academic",
    short: "How your relationship with study is holding up.",
    measures: "Exhaustion, cynicism, and inefficacy in academic life.",
    why: "Burnout hides behind productivity. This surfaces it kindly.",
    whoFor: "Students juggling long semesters, projects, or exam blocks.",
    minutes: 3, difficulty: "Moderate",
    source: "Adapted from Maslach Burnout Inventory — Student",
    accuracy: "α ≈ 0.86.",
    updated: "2024",
    bands: [
      { min: 0, max: 14, label: "Low burnout", tone: "calm" },
      { min: 15, max: 24, label: "Building burnout", tone: "moderate" },
      { min: 25, max: 36, label: "High burnout", tone: "high" },
    ],
    questions: q("abs", [
      "I feel emotionally drained by my studies",
      "I feel used up at the end of a study day",
      "I feel tired when I get up in the morning and have to face another day of class",
      "Studying all day is really a strain for me",
      "I have become less interested in my studies since starting",
      "I have become less enthusiastic about my studies",
      "I doubt the significance of my studies",
      "I can effectively solve problems that arise in my studies",
      "I feel I am making a good contribution to my classes",
      "In my opinion, I am a good student",
      "I feel exhilarated when I accomplish something in my studies",
      "I have accomplished many worthwhile things during my studies",
    ], often4),
  },
  {
    id: "saq", code: "SAQ", name: "Social Anxiety", category: "Social",
    short: "How social situations have been landing.",
    measures: "Anxiety and avoidance in social contexts.",
    why: "Awareness is the beginning of easing.",
    whoFor: "Anyone who dreads speaking up, meeting new people, or being watched.",
    minutes: 3, difficulty: "Moderate",
    source: "Adapted from Liebowitz Social Anxiety Scale (brief)",
    accuracy: "α ≈ 0.85.",
    updated: "2024",
    bands: [
      { min: 0, max: 8, label: "Low", tone: "calm" },
      { min: 9, max: 16, label: "Mild", tone: "mild" },
      { min: 17, max: 24, label: "Moderate", tone: "moderate" },
      { min: 25, max: 30, label: "Marked", tone: "high" },
    ],
    questions: q("saq", [
      "Speaking up in class or a meeting",
      "Meeting new people",
      "Being watched while doing something",
      "Eating in front of others",
      "Attending parties or gatherings",
      "Making a phone call in public",
      "Being the center of attention",
      "Disagreeing with someone you don't know well",
      "Presenting to a group",
      "Asking a stranger for help",
    ], often4),
  },
  {
    id: "resilience", code: "BRS", name: "Emotional Resilience", category: "Self",
    short: "How you bounce, bend, and return.",
    measures: "Capacity to recover from stress.",
    why: "Resilience isn't hardness. It's flexibility with care.",
    whoFor: "Anyone curious about their inner recovery strength.",
    minutes: 2, difficulty: "Light",
    source: "Smith et al. (2008), Brief Resilience Scale",
    accuracy: "α ≈ 0.83.",
    updated: "2024",
    bands: [
      { min: 6, max: 13, label: "Low", tone: "elevated" },
      { min: 14, max: 21, label: "Normal", tone: "mild" },
      { min: 22, max: 30, label: "High", tone: "calm" },
    ],
    questions: [
      { id: "brs-1", text: "I tend to bounce back quickly after hard times", options: [{label:"Strongly disagree",value:1},{label:"Disagree",value:2},{label:"Neutral",value:3},{label:"Agree",value:4},{label:"Strongly agree",value:5}] },
      { id: "brs-2", text: "I have a hard time making it through stressful events", options: [{label:"Strongly disagree",value:5},{label:"Disagree",value:4},{label:"Neutral",value:3},{label:"Agree",value:2},{label:"Strongly agree",value:1}], reverse: true },
      { id: "brs-3", text: "It does not take me long to recover from a stressful event", options: [{label:"Strongly disagree",value:1},{label:"Disagree",value:2},{label:"Neutral",value:3},{label:"Agree",value:4},{label:"Strongly agree",value:5}] },
      { id: "brs-4", text: "It is hard for me to snap back when something bad happens", options: [{label:"Strongly disagree",value:5},{label:"Disagree",value:4},{label:"Neutral",value:3},{label:"Agree",value:2},{label:"Strongly agree",value:1}], reverse: true },
      { id: "brs-5", text: "I usually come through difficult times with little trouble", options: [{label:"Strongly disagree",value:1},{label:"Disagree",value:2},{label:"Neutral",value:3},{label:"Agree",value:4},{label:"Strongly agree",value:5}] },
      { id: "brs-6", text: "I tend to take a long time to get over set-backs in my life", options: [{label:"Strongly disagree",value:5},{label:"Disagree",value:4},{label:"Neutral",value:3},{label:"Agree",value:2},{label:"Strongly agree",value:1}], reverse: true },
    ],
  },
  {
    id: "maas", code: "MAAS-b", name: "Mindfulness Assessment", category: "Mindfulness",
    short: "How present you've been able to be.",
    measures: "Everyday attention and awareness.",
    why: "Presence is a skill and a rest.",
    whoFor: "Anyone drawn to meditation or noticing they've been on autopilot.",
    minutes: 3, difficulty: "Light",
    source: "Brown & Ryan (2003), Mindful Attention Awareness Scale (brief)",
    accuracy: "α ≈ 0.87.",
    updated: "2024",
    bands: [
      { min: 0, max: 20, label: "Low presence", tone: "elevated" },
      { min: 21, max: 35, label: "Moderate presence", tone: "mild" },
      { min: 36, max: 48, label: "High presence", tone: "calm" },
    ],
    questions: q("maas", [
      "I find it difficult to stay focused on what's happening in the present",
      "I do things without paying attention",
      "I rush through activities without being really attentive to them",
      "I get lost in my thoughts and forget what's around me",
      "I forget a person's name almost as soon as I've been told it",
      "I break or spill things because of carelessness or thinking of something else",
      "I find myself preoccupied with the future or the past",
      "I snack without being aware that I'm eating",
    ], [
      { label: "Almost always", value: 0 },
      { label: "Very frequently", value: 1 },
      { label: "Somewhat frequently", value: 2 },
      { label: "Somewhat infrequently", value: 3 },
      { label: "Very infrequently", value: 4 },
      { label: "Almost never", value: 5 },
    ]),
  },
];

export const getTest = (id: string) => TESTS.find((t) => t.id === id);

// ─── sessions ───────────────────────────────────────────────────────
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type Session = {
  id: string;
  testId: string;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  answers: Record<string, number>;
  currentIndex: number;
  status: SessionStatus;
  score?: number;
  scorePct?: number;
  bandLabel?: string;
  bandTone?: string;
};

export type Prefs = {
  bookmarks: string[];
  reminders: { monthly: boolean; incomplete: boolean; milestones: boolean };
  autosave: boolean;
  darkMode: boolean;
  language: "en" | "hi";
};

const KEY_S = "peacecode.screening.sessions.v1";
const KEY_P = "peacecode.screening.prefs.v1";

const safeGet = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};
const safeSet = (key: string, v: unknown) => { if (typeof window !== "undefined") try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

export const loadSessions = (): Session[] => safeGet<Session[]>(KEY_S, []);
export const saveSessions = (list: Session[]) => safeSet(KEY_S, list);

export const loadPrefs = (): Prefs => safeGet<Prefs>(KEY_P, {
  bookmarks: [], reminders: { monthly: true, incomplete: true, milestones: true },
  autosave: true, darkMode: false, language: "en",
});
export const savePrefs = (p: Prefs) => safeSet(KEY_P, p);

export const upsertSession = (s: Session) => {
  const all = loadSessions();
  const i = all.findIndex((x) => x.id === s.id);
  if (i >= 0) all[i] = s; else all.unshift(s);
  saveSessions(all);
};
export const deleteSession = (id: string) => saveSessions(loadSessions().filter((s) => s.id !== id));

export const newSessionId = () => `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export function scoreSession(test: Test, answers: Record<string, number>) {
  let raw = 0;
  test.questions.forEach((q) => { const v = answers[q.id]; if (typeof v === "number") raw += v; });
  // WHO-5 is percentage
  const score = test.id === "who5" ? raw * 4 : raw;
  const band = test.bands.find((b) => score >= b.min && score <= b.max) ?? test.bands[test.bands.length - 1];
  const maxRaw = test.questions.reduce((s, q) => s + Math.max(...q.options.map((o) => o.value)), 0);
  const scorePct = test.id === "who5" ? score : Math.round((raw / (maxRaw || 1)) * 100);
  return { score, scorePct, bandLabel: band.label, bandTone: band.tone };
}

export function overallWellness(sessions: Session[]): number | null {
  const completed = sessions.filter((s) => s.status === "completed" && typeof s.scorePct === "number");
  if (!completed.length) return null;
  // Higher score is worse for most tests except WHO-5, RSES, BRS, MAAS
  const positive = new Set(["who5", "rses", "resilience", "maas"]);
  const norm = completed.slice(0, 5).map((s) => positive.has(s.testId) ? (s.scorePct ?? 0) : 100 - (s.scorePct ?? 0));
  return Math.round(norm.reduce((a, b) => a + b, 0) / norm.length);
}
