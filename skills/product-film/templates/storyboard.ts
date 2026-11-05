/**
 * Six-beat storyboard template for a 3:00 product film.
 *
 * Timing contract:
 * - 0:00-0:20 hook, 35-40 words
 * - 0:20-0:45 pain, 52-58 words
 * - 0:45-1:30 demo A, 80-90 words
 * - 1:30-2:15 demo B, 80-90 words
 * - 2:15-2:45 proof, 60-68 words
 * - 2:45-3:00 vision, 25-30 words
 *
 * `vo` is the spoken words only. Keep `[pause]` marks in the read script.
 * `cues` are visual beats. Capture real product states when kind is "image".
 */

export interface Fact {
  label: string;
  value: string;
  tone?: "ink" | "accent" | "alarm" | "gold" | "muted";
}

export interface Cue {
  at: number;
  hold: number;
  kind: "hero" | "line" | "money" | "card" | "image" | "receipt" | "end";
  text: string;
  sub?: string;
  label?: string;
  facts?: Fact[];
  image?: string;
  imageFit?: "cover" | "contain";
  tone?: "ink" | "accent" | "alarm" | "gold" | "muted";
}

export interface Scene {
  id: string;
  beat: string;
  start: number;
  duration: number;
  mode: "code" | "capture";
  tone: "light" | "dark";
  vo: string;
  cues: Cue[];
}

export const DURATION = 180;
export const FPS = 24;

export const storyboard: Scene[] = [
  {
    id: "hook",
    beat: "0:00-0:20 The hook",
    start: 0,
    duration: 20,
    mode: "code",
    tone: "light",
    vo: "The agent said [OUTCOME]. The ticket closed. The ledger says [FACT]. The agent is not lying. It just never checked. That gap is what we audit. I am [NAME]. This is [PRODUCT].",
    cues: [
      {
        at: 0.3,
        hold: 8.7,
        kind: "hero",
        text: "The agent said [OUTCOME].",
        highlight: "The ledger says [FACT].",
        sub: "One promise. One ledger. One receipt.",
        facts: [
          { label: "PROMISE", value: "[VALUE]" },
          { label: "SETTLED", value: "[VALUE]", tone: "alarm" },
          { label: "STATUS", value: "DRIFT", tone: "alarm" },
        ],
      },
    ],
  },
  {
    id: "pain",
    beat: "0:20-0:45 The pain",
    start: 20,
    duration: 25,
    mode: "code",
    tone: "dark",
    vo: "[COST]. [PRECEDENT]. [WHO PAYS]. [WHY IT KEEPS HAPPENING]. [WHAT THE INDUSTRY MISSES]. [WHAT THE CUSTOMER EXPERIENCES].",
    cues: [
      {
        at: 0.4,
        hold: 24,
        kind: "line",
        text: "[COST IN ONE SENTENCE]",
        sub: "[ONE SUPPORTING FACT]",
        tone: "alarm",
      },
    ],
  },
  {
    id: "demo-a",
    beat: "0:45-1:30 The core",
    start: 45,
    duration: 45,
    mode: "capture",
    tone: "dark",
    vo: "Watch the screen. [WHAT THE PRODUCT READS]. [WHAT IT RETURNS]. [WHAT THE MODEL DOES NOT DECIDE]. [WHAT THE DETERMINISTIC CHECK DOES]. Here is the gap: [PROMISE] against [SETTLED].",
    cues: [
      {
        at: 0.3,
        hold: 12,
        kind: "image",
        label: "01 / REAL INPUT",
        text: "[WHAT THE USER SEES]",
        sub: "[WHAT THE PRODUCT DOES]",
        image: "01-input.png",
        imageFit: "contain",
        facts: [
          { label: "INPUT", value: "[VALUE]" },
          { label: "MODEL", value: "[MODEL]" },
          { label: "CHECK", value: "[CHECK]" },
        ],
      },
      {
        at: 12.8,
        hold: 12,
        kind: "image",
        label: "02 / THE GAP",
        text: "[THE DRIFT]",
        sub: "[THE LEDGER FACT]",
        image: "02-gap.png",
        imageFit: "contain",
        facts: [
          { label: "PROMISE", value: "[VALUE]" },
          { label: "SETTLED", value: "[VALUE]", tone: "alarm" },
          { label: "AT RISK", value: "[VALUE]", tone: "alarm" },
        ],
      },
    ],
  },
  {
    id: "demo-b",
    beat: "1:30-2:15 The fix",
    start: 90,
    duration: 45,
    mode: "capture",
    tone: "dark",
    vo: "Here is the fix. [ONE ACTION]. [WHAT THE RECEIPT CARRIES]. [WHAT A RETRY DOES]. [WHAT A DUPLICATE DOES]. [WHAT THE SIGNATURE PROVES]. [THE RESULT].",
    cues: [
      {
        at: 0.3,
        hold: 14,
        kind: "image",
        label: "03 / THE FIX",
        text: "[ONE ACTION]",
        sub: "[WHAT CHANGES]",
        image: "03-fix.png",
        imageFit: "contain",
        facts: [
          { label: "ACTION", value: "[VALUE]" },
          { label: "KEY", value: "[KEY]" },
          { label: "RESULT", value: "[VALUE]" },
        ],
      },
      {
        at: 14.5,
        hold: 14,
        kind: "receipt",
        label: "04 / THE PROOF",
        text: "[WHAT THE RECEIPT PROVES]",
        sub: "[WHAT FAILS WHEN TAMPERED]",
        tone: "accent",
      },
    ],
  },
  {
    id: "proof",
    beat: "2:15-2:45 The numbers",
    start: 135,
    duration: 30,
    mode: "code",
    tone: "dark",
    vo: "The proof is not a projection. [MEASURED CATCH]. [LABELED EVAL]. [WILD SAMPLE]. Then the model: [PROJECTION]. Stated assumptions, not a guarantee.",
    cues: [
      {
        at: 0.4,
        hold: 7,
        kind: "money",
        label: "TIER 1 / LIVE",
        text: "[VALUE]",
        sub: "[SCOPE AND WHAT DID NOT HAPPEN]",
        tone: "accent",
      },
      {
        at: 7.6,
        hold: 7,
        kind: "money",
        label: "TIER 2 / LABELED",
        text: "[COUNT]",
        sub: "[EXACT COUNTS AND SAMPLE SIZE]",
        tone: "ink",
      },
      {
        at: 15,
        hold: 14,
        kind: "money",
        label: "TIER 3 / MODELED, NOT MEASURED",
        text: "[LOW] to [HIGH]",
        sub: "[PROJECTION AND ASSUMPTIONS]",
        tone: "gold",
      },
    ],
  },
  {
    id: "vision",
    beat: "2:45-3:00 Vision and end card",
    start: 165,
    duration: 15,
    mode: "code",
    tone: "dark",
    vo: "[CATEGORY] needs [THING]. [WHO NEEDS IT]. [WHAT THE PRODUCT DOES NEXT]. Built for [EVENT] on [MODEL].",
    cues: [
      {
        at: 0.3,
        hold: 6,
        kind: "line",
        text: "[VISION LINE]",
        sub: "[SECOND LINE]",
        tone: "accent",
      },
      {
        at: 9.8,
        hold: 5.2,
        kind: "end",
        text: "[TAGLINE]",
        tone: "accent",
      },
    ],
  },
];
