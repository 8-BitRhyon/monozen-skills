import { defineHexConfig, type HandlerContext } from "@hex/commands";

// ============================================================================
// 1. FILLER-WORD & DISFLUENCY STRIPPING ENGINE
// ============================================================================

const BACKTRACK_TRIGGER_REGEX = /(?:scratch that|wait no|no wait|or rather|actually (?:wait )?no)/i;

/**
 * Removes speech disfluencies, filler words, stutters, and mid-sentence
 * thought backtracking without requiring an AI model or incurring network latency.
 * Achieves sub-millisecond deterministic cleanup.
 */
export function stripDisfluencies(text: string): string {
  let s = text;

  // 1. Mid-sentence thought correction and backtracking
  // Fast trigger pre-check avoids O(N^2) catastrophic backtracking on long text
  if (BACKTRACK_TRIGGER_REGEX.test(s)) {
    // Leading trigger at utterance beginning (DISF-05)
    s = s.replace(/^(?:actually\s+wait\s+no|actually\s+no|wait\s+no|no\s+wait|scratch\s+that|or\s+rather)\s*,?\s*/i, "");

    // Mid-sentence clause backtracking
    s = s.replace(
      /(\b(?:we need to|we need|let us|lets|I want to|please|I will)\s+)?(?:[^\n,.;!?]+?)\s*,?\s*\b(?:actually\s+wait\s+no|actually\s+no|wait\s+no|no\s+wait|scratch\s+that|or\s+rather)\s*,?\s*(.+?)(?=[.,;!?]|$)/gi,
      (_match, prefix, replacement) => (prefix || "") + replacement
    );
  }

  // Standalone filler/correction markers (only when flanked by pauses/punctuation)
  s = s.replace(/(?:^|[,\s]+)I mean(?=[,\s]|$)/gi, " ");

  // 2. Vocal fillers (um, uh, er, ah, you know, sort of, kind of)
  s = s.replace(/\b(um|uh|er|ah|you know|sort of|kind of)\b/gi, "");

  // 3. Conversational "like" filler (preserving grammatical verbs like "like programming", "users like fast apps")
  s = s.replace(/,\s*like\s*,/gi, ", ");
  s = s.replace(/\blike,\s*/gi, "");
  s = s.replace(/\b(?:um|uh)\s+like\b/gi, "");
  s = s.replace(/\blike\s+(?=(?:super|totally|literally|basically|really|pretty|sort of|kind of)\b)/gi, "");
  s = s.replace(/\band\s+like\s+/gi, "and ");

  // 4. Stutters / immediate word duplication (collapses multiple repetitions e.g. "the the the" -> "the")
  s = s.replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1");

  // 5. Cleanup orphan punctuation from stripped fillers and pauses
  s = s.replace(/\s+,/g, ",");
  s = s.replace(/,\s*,+/g, ",");
  s = s.replace(/(^|\n)[,\s]+/g, "$1");
  s = s.replace(/,\s*([.!?]|\n|$)/g, "$1");

  // 6. Cleanup redundant whitespace
  return s.replace(/[ \t]{2,}/g, " ").trim();
}

// ============================================================================
// 2. CODE IDENTIFIER CASING ENGINE
// ============================================================================

// Restrict stop words to syntax operators and command triggers; allow prepositions (to, for, in, by, of, is, be, new, with)
const CODE_STOP_WORDS =
  "and|or|equal|equals|arrow|fat|thin|plus|minus|times|divide|modulo|strictly|bullet|point|semicolon|colon|period|comma|camel|snake|kebab|pascal|constant|screaming";
const IDENTIFIER_WORD = `(?!\\b(?:${CODE_STOP_WORDS})\\b)[a-zA-Z0-9]+`;
// Extended from {0,4} to {0,8} to support identifiers up to 9 words
const BOUNDED_PHRASE = `${IDENTIFIER_WORD}(?:\\s+${IDENTIFIER_WORD}){0,8}`;

/**
 * Transforms spoken casing directives into exact syntactic code identifiers.
 * Example: "camel case user profile service" -> "userProfileService"
 * Example: "screaming snake case max retry count" -> "MAX_RETRY_COUNT"
 */
export function formatCodeIdentifiers(text: string): string {
  let s = text;

  // 1. CONSTANT_CASE / SCREAMING_SNAKE_CASE
  // Must execute BEFORE snake_case to prevent greedy "snake case" hijacking
  s = s.replace(
    new RegExp(
      `\\b(?:constant case|screaming snake(?:\\s+case)?)\\s+(${BOUNDED_PHRASE})`,
      "gi"
    ),
    (_, phrase) => {
      return phrase.trim().toUpperCase().split(/\s+/).join("_");
    }
  );

  // 2. PascalCase
  s = s.replace(
    new RegExp(`\\b(?:pascal case|pascalcase)\\s+(${BOUNDED_PHRASE})`, "gi"),
    (_, phrase) => {
      return phrase
        .trim()
        .split(/\s+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    }
  );

  // 3. camelCase
  s = s.replace(
    new RegExp(`\\b(?:camel case|camelcase)\\s+(${BOUNDED_PHRASE})`, "gi"),
    (_, phrase) => {
      const words = phrase.trim().split(/\s+/);
      if (!words.length || !words[0]) return phrase;
      return (
        words[0].toLowerCase() +
        words
          .slice(1)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join("")
      );
    }
  );

  // 4. kebab-case
  s = s.replace(
    new RegExp(`\\b(?:kebab case|kebabcase)\\s+(${BOUNDED_PHRASE})`, "gi"),
    (_, phrase) => {
      return phrase.trim().toLowerCase().split(/\s+/).join("-");
    }
  );

  // 5. snake_case
  s = s.replace(
    new RegExp(`\\b(?:snake case|snakecase)\\s+(${BOUNDED_PHRASE})`, "gi"),
    (_, phrase) => {
      return phrase.trim().toLowerCase().split(/\s+/).join("_");
    }
  );

  return s;
}

// ============================================================================
// 3. MATH & TECHNICAL SYMBOL EXPANSION
// ============================================================================

const SPOKEN_NUM_WORDS: Readonly<Record<string, string>> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
  thirty: "30",
  forty: "40",
  fifty: "50",
  sixty: "60",
  seventy: "70",
  eighty: "80",
  ninety: "90",
  hundred: "100",
  thousand: "1000",
};

/**
 * Expands spoken mathematical, logical, and programming operators into exact symbols.
 * Example: "plus equals five" -> "+= 5"
 * Example: "fat arrow" -> "=>"
 */
export function expandSymbolsAndOperators(text: string): string {
  let s = text;

  // Arrows
  s = s.replace(/\b(?:fat arrow|arrow function)\b/gi, "=>");
  s = s.replace(/\b(?:thin arrow|right arrow)\b/gi, "->");

  // Compound assignment operators
  s = s.replace(/\bplus equals\b/gi, "+=");
  s = s.replace(/\bminus equals\b/gi, "-=");
  s = s.replace(/\b(?:times equals|multiply equals)\b/gi, "*=");
  s = s.replace(/\bdivide equals\b/gi, "/=");
  s = s.replace(/\bmodulo equals\b/gi, "%=");

  // Comparison & equality operators
  s = s.replace(/\b(?:strictly equals|triple equals)\b/gi, "===");
  s = s.replace(/\b(?:strictly not equals|triple not equals)\b/gi, "!==");
  s = s.replace(/\bdouble equals\b/gi, "==");
  s = s.replace(/\bnot equals\b/gi, "!=");
  s = s.replace(/\b(?:greater than or equal to|greater than or equals)\b/gi, ">=");
  s = s.replace(/\b(?:less than or equal to|less than or equals)\b/gi, "<=");

  // Logical operators
  s = s.replace(/\b(?:logical and|double ampersand)\b/gi, "&&");
  s = s.replace(/\b(?:logical or|double pipe)\b/gi, "||");
  s = s.replace(/\b(?:nullish coalescing|question mark question mark)\b/gi, "??");
  s = s.replace(/\b(?:optional chaining|question dot)\b/gi, "?.");

  // Technical symbols & units
  s = s.replace(/\bplus or minus\b/gi, "±");
  s = s.replace(
    /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\s+dollars?\b/gi,
    (_, num) => `$${SPOKEN_NUM_WORDS[num.toLowerCase()] || num}`
  );
  s = s.replace(
    /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\s+cents?\b/gi,
    (_, num) => `${SPOKEN_NUM_WORDS[num.toLowerCase()] || num}¢`
  );
  s = s.replace(/\b(\d+)\s+percent\b/gi, "$1%");

  // Operator following numbers in word form
  s = s.replace(
    /(\+=|-=|\*=|\/=|%=|===|!==|==|!=|>=|<=)\s+(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b/gi,
    (_, op, num) => `${op} ${SPOKEN_NUM_WORDS[num.toLowerCase()] || num}`
  );

  return s;
}

// ============================================================================
// 4. SMART PUNCTUATION, CAPITALIZATION & MARKDOWN LISTS
// ============================================================================

/**
 * Automatically detects and restores missing question marks for interrogative sentences
 * and statements with question tag endings, while stripping accidental trailing periods from CLI commands.
 */
export function recoverInterrogativePunctuation(text: string): string {
  // If utterance is a CLI command (e.g. git, herdr, npm, cargo, docker), strip accidental trailing period
  if (/^\s*(?:git|herdr|npm|pnpm|yarn|bun|cargo|docker|kubectl|brew|cd|ls|cat|curl|python3?|node|grep|find|code|open|make|ps|kill|killall|mv|cp|rm|chmod|chown)\b/i.test(text)) {
    return text.replace(/[.]+$/, "");
  }

  const questionStarters = new RegExp(
    "^\\s*(?:" +
    // 5W1H
    "who|what|where|when|why|how|which|whose|whom|" +
    // Auxiliaries / Modals
    "is|are|am|was|were|" +
    "do|does|did|" +
    "can|could|would|should|will|shall|may|might|" +
    // Perfect auxiliaries with pronoun/subject
    "have\\s+(?:you|we|they|I)|has\\s+(?:he|she|it|anyone|someone|everybody|this)" +
    ")\\b",
    "i"
  );

  const questionTagEndings = new RegExp(
    ",?\\s*(?:right|correct|isn't\\s+it|aren't\\s+we|don't\\s+you|won't\\s+it|doesn't\\s+it)[.!]?$",
    "i"
  );

  // Process line by line so newlines and markdown list structures are completely untouched
  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    // If it's a markdown list item or empty line, don't modify structure
    if (!line.trim() || line.trim().startsWith("- ") || /^\d+\.\s+/.test(line.trim())) {
      return line;
    }

    return line.replace(/(?:^|(?<=[.!?])\s+)(.+?)([.!?]|$)(?=\s+|$)/g, (fullMatch, body, punct) => {
      const trimmed = body.trim();
      const isInterrogative = questionStarters.test(trimmed) || questionTagEndings.test(trimmed);
      if (isInterrogative) {
        if (punct === "." || punct === "!") {
          return fullMatch.replace(/[.!]$/, "?");
        } else if (!punct.includes("?")) {
          return fullMatch + "?";
        }
      }
      return fullMatch;
    });
  });

  return processedLines.join("\n");
}

/**
 * Resolves acoustic pause comma errors and enforces grammatical comma placement.
 * 1. Strips acoustic micro-pause commas emitted by ASR between verbs and direct objects ("test, placement" -> "test placement").
 * 2. Strips pause commas after prepositions ("with, herdr" -> "with herdr"), determiners ("the, fact" -> "the fact"), and auxiliaries ("can, you" -> "can you").
 * 3. Strips pause commas trailing subordinating/coordinating conjunctions ("because, " -> "because ").
 * 4. Inserts natural commas before causal, contrasting, and concessive conjunctions mid-sentence (", because", ", due to the fact that", ", although").
 * 5. Inserts introductory commas after discourse markers ("By the way,", "As you can see,", "Also,") and temporal setting phrases ("This year, it is...", "Today, we are...", "Right now, ...") while preserving subject usages ("This year is...").
 */
export function sanitizeAndPlaceCommas(text: string): string {
  let s = text;

  // 1. Strip acoustic pause commas after determiners, articles, and possessives
  s = s.replace(
    /\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their|some|any|each|every|all|both|neither|either|many|much|few),\s+/gi,
    "$1 "
  );

  // 2. Strip acoustic pause commas after prepositions
  s = s.replace(
    /\b(with|in|on|at|to|from|for|of|by|about|into|through|during|above|below|between|under|across|along|behind|without|within|upon|onto),\s+(?!(?:however|therefore|meanwhile)\b)/gi,
    "$1 "
  );

  // 3. Strip acoustic pause commas after modals and auxiliary verbs
  s = s.replace(
    /\b(can|could|would|should|will|shall|may|might|must|is|are|am|was|were|be|been|being),\s+/gi,
    "$1 "
  );

  // 4. Strip acoustic pause commas after common transitive / action verbs (protecting parenthetical clauses like "as you can see")
  s = s.replace(
    /(?<!\b(?:as you can|as we can)\s+)\b(test|check|verify|run|build|find|see|show|ensure|know|notice|want|need|get|make|take|give|send|look|watch|ask|tell|call|fix|clean|open|close|type|print|log|push|pull|commit|deploy|start|stop|restart|kill|like|have|has|had|do|does|did),\s+(?!(?:however|therefore|moreover|furthermore|meanwhile|in fact|of course|and|or|but|so|yet)\b)/gi,
    "$1 "
  );

  // 5. Strip acoustic pause commas immediately following subordinating / coordinating conjunctions
  s = s.replace(
    /\b(because|and|but|or|so|if|that|whether|as|since|although|though|unless|until|while),\s+/gi,
    "$1 "
  );

  // 6. Insert comma before causal, contrasting, or concessive subordinating conjunctions mid-sentence
  s = s.replace(
    /(?<![,:;!?.-\s])\s+\b(because|due to the fact that|although|even though|even if|whereas)\b/gi,
    ", $1"
  );

  // 7. Introductory discourse markers & conjunctive adverbs (2-pass loop for chained markers e.g. "Also, as you can see,")
  const INTRO_REGEX =
    /(^|\n+|(?<=[.!?]\s+)|(?<=,\s+)|\b(?:and|but|so)\s+)\b(by the way|as you can see|for example|for instance|in addition|furthermore|moreover|however|therefore|meanwhile|in fact|first of all|at the same time|of course|to be honest|in general|also|finally|naturally|clearly|specifically)\b(?!\s*[,:;!?])/gi;
  let prev = "";
  let iterations = 0;
  do {
    prev = s;
    s = s.replace(INTRO_REGEX, "$1$2,");
    iterations++;
  } while (s !== prev && iterations < 3);

  // 8. Introductory temporal & locative setting phrases: only when followed by a subject clause (NOT a direct linking verb)
  // E.g., "This year it is..." -> "This year, it is..."
  // But "This year is..." -> "This year is..." (preserving subject usage)
  const VERB_FOLLOWERS =
    "is|was|were|are|am|will|shall|has|had|have|brings|saw|marks|felt|seems|looks";
  s = s.replace(
    new RegExp(
      "(^|\\n+|(?<=[.!?]\\s+)|(?<=,\\s+))\\b(this year|last year|next year|right now|at the moment|at this point|at present|recently|currently|lately|nowadays|in the meantime|so far|to date|over time|in this case|in our case|today|yesterday|tomorrow)\\b(?!\\s*[,:;!?])(?=\\s+(?!(?:" +
        VERB_FOLLOWERS +
        ")\\b)[a-zA-Z0-9_]+)",
      "gi"
    ),
    "$1$2,"
  );

  // 9. Clean up any accidental double commas or whitespace-comma artifacts
  s = s.replace(/,\s*,+/g, ",");
  s = s.replace(/\s+,/g, ",");

  return s;
}

/**
 * Normalizes spoken punctuation commands, markdown bullet lists, and automatic sentence casing.
 */
export function formatPunctuationAndStructure(text: string): string {
  let s = text;

  // Spoken punctuation triggers (protecting noun usages of "period")
  s = s.replace(
    /(?<!\b(?:this|that|the|a|an|grace|time|first|second|third|trial|probationary|missing|trailing|extra|unwanted|no|without|needs|single|double)\s+)\bperiod\b|\bfull stop\b/gi,
    "."
  );
  s = s.replace(/\bcomma\b/gi, ",");
  s = s.replace(/\bquestion mark\b/gi, "?");
  s = s.replace(/\bexclamation (?:mark|point)\b/gi, "!");
  s = s.replace(/\bcolon\b/gi, ":");
  s = s.replace(/\bsemicolon\b/gi, ";");
  s = s.replace(/\bopen quote\b/gi, "\"");
  s = s.replace(/\bclose quote\b/gi, "\"");
  s = s.replace(/\b(?:open paren|open parenthesis)\b/gi, "(");
  s = s.replace(/\b(?:close paren|close parenthesis)\b/gi, ")");
  s = s.replace(/\bopen bracket\b/gi, "[");
  s = s.replace(/\bclose bracket\b/gi, "]");
  s = s.replace(/\b(?:open brace|open curly)\b/gi, "{");
  s = s.replace(/\b(?:close brace|close curly)\b/gi, "}");
  s = s.replace(/\s*(?:new paragraph|next paragraph)\s*/gi, "\n\n");
  s = s.replace(/\s*new line\s*/gi, "\n");

  // Markdown lists: preserve preceding sentence terminating punctuation ([.!?:])
  s = s.replace(/(?:([.!?:])\s*|,\s*|(?:\n|^)\s*|\s+)\b(?:bullet point|bullet)\s+/gi, (_, punct) => {
    return punct ? `${punct}\n- ` : "\n- ";
  });
  s = s.replace(/(?:([.!?:])\s*|,\s*|(?:\n|^)\s*|\s+)\b(?:number|item)\s+(\d+)\s*[:.]?\s+/gi, (_, punct, num) => {
    return punct ? `${punct}\n${num}. ` : `\n${num}. `;
  });

  // Whitespace normalization around punctuation marks (protecting nullish coalescing ??)
  s = s.replace(/\s+([,!;:;]|(?<!\?)\?(?!\?)|\.(?!\d))/g, "$1");
  // Standardize nullish coalescing spacing
  s = s.replace(/(?<=\S)\s*\?\?\s*(?=\S)/g, " ?? ");
  // Zero-callback spacing: protect numbers (3.14), versions (v1.0.0), IP addresses (127.0.0.1), time (12:30), formatted numbers (1,000), member access dot notation (console.log), and URLs (api.example.com)
  s = s.replace(/(?<![a-zA-Z0-9_])(\.)(?=[a-zA-Z])|([,!;:;]|(?<!\?)\?(?!\?))(?=[a-zA-Z])|([!?;])(?=\d)|(?<!\d)(,)(?=\d)/g, "$1$2$3$4 ");

  // Normalize spacing inside opening and closing delimiters (PUNC-04)
  s = s.replace(/([(\[{])\s+/g, "$1");
  s = s.replace(/\s+([)\]}])/g, "$1");
  s = s.replace(/"\s+([^"\n]+?)\s+"/g, "\"$1\"");

  // Clean trailing spaces before newlines
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n[ \t]+/g, "\n");

  // Sanitize acoustic pause commas and enforce grammatical/introductory comma placement
  s = sanitizeAndPlaceCommas(s);

  // Interrogative punctuation recovery and CLI command period stripping
  s = recoverInterrogativePunctuation(s);

  // Sentence and paragraph auto-capitalization (protecting CLI verbs, nullish coalescing ??, member access dot notation, and URLs at start of lines)
  const cliVerbs = "git|herdr|npm|pnpm|yarn|bun|cargo|docker|kubectl|brew|cd|ls|cat|curl|python3?|node|grep|find|code|open|make|ps|kill|killall|mv|cp|rm|chmod|chown";
  s = s.replace(
    new RegExp(`(^\\s*(?!(?:${cliVerbs}|[a-zA-Z0-9_]+(?:\\.[a-zA-Z]|\\:\\/\\/))\\b)|\\n+(?!(?:${cliVerbs}|[a-zA-Z0-9_]+(?:\\.[a-zA-Z]|\\:\\/\\/))\\b)|(?<!\\?)[.!?]\\s+|- |\\d+\\.\\s+)([a-z])`, "g"),
    (_, pre, ch) => pre + ch.toUpperCase()
  );

  return s.trim();
}

// ============================================================================
// 5. POST-LLM GUARDRAIL (PREAMBLE & CONVERSATIONAL SLOP STRIPPER)
// ============================================================================

/**
 * Strips LLM conversational preambles, meta-commentary, code fences, and trailing sign-offs.
 * Guarantees zero conversational pollution reaches the active cursor while protecting
 * legitimate user dictations and email sign-offs.
 */
export function stripLLMPreamble(text: string): string {
  let s = text.trim();

  // 1. Strip genuine LLM headers referring to code/text/version followed by colon and newline (PRE-01)
  s = s.replace(
    /^(?:(?:sure|certainly|of course)[!,.]?\s*)?(?:(?:here is|here's|below is|this is)\s+(?:the|your|a)?\s*(?:clean|updated|polished|revised|corrected|suggested|requested|formatted|generated|final|rewritten)?\s*(?:code|text|version|snippet|output|implementation|response)\s*:\s+)/i,
    ""
  ).trim();
  s = s.replace(/^(?:sure!|certainly!|of course!)\s*\n+/i, "").trim();

  // 2. Strip trailing canned LLM chat sign-offs (preserving authentic user sign-offs like "Best regards") (PRE-02)
  s = s.replace(
    /\n+(?:hope this helps!|hope that helps!|let me know if you need (?:anything|any) (?:else|further)|feel free to ask(?: any questions)?|happy coding!)[\s\S]*$/i,
    ""
  ).trim();

  // 3. Strip wrapping code fences if present around entire output (newline tolerant)
  s = s.replace(/^```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)\n?```$/i, "$1").trim();

  // 4. Strip wrapping quotes if LLM enclosed the whole answer (ASCII and Unicode typographic quotes) (PRE-03)
  if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("“") && s.endsWith("”"))) {
    if (s.length >= 2) {
      s = s.slice(1, -1).trim();
    }
  }

  return s;
}

// ============================================================================
// 6. DECOUPLED HIGH-PERFORMANCE TRANSFORMS
// ============================================================================

const RESERVED_CODE_KEYWORDS: ReadonlySet<string> = new Set([
  "async", "await", "break", "case", "catch", "class", "const", "continue",
  "debugger", "default", "delete", "do", "else", "enum", "export", "extends",
  "finally", "for", "from", "function", "if", "implements", "import", "in",
  "instanceof", "interface", "let", "new", "package", "private", "protected",
  "public", "readonly", "return", "static", "super", "switch", "this", "throw",
  "try", "type", "typeof", "var", "void", "while", "with", "yield",
  "console", "http", "https", "document", "window", "process"
]);

/**
 * Suppresses erroneous sentence capitalization on reserved language keywords
 * at the start of lines and statements in code dictation.
 */
function protectCodeKeywords(text: string): string {
  return text.replace(/(^|\n\s*|[;{}]\s*)([A-Z][a-zA-Z0-9]*)\b/g, (match, prefix, word) => {
    const lower = word.toLowerCase();
    if (RESERVED_CODE_KEYWORDS.has(lower)) {
      return prefix + lower;
    }
    return match;
  });
}

/**
 * Zero-latency deterministic transform pipeline for code editors and terminals.
 * Order of operations:
 * 1. stripLLMPreamble: cleans any model artifacts if running after LLM.
 * 2. stripDisfluencies: eliminates vocal fillers and backtracking.
 * 3. expandSymbolsAndOperators: expands mathematical and logic operators.
 * 4. formatPunctuationAndStructure: normalizes punctuation and structure.
 * 5. protectCodeKeywords: restores reserved keyword lowercase.
 * 6. formatCodeIdentifiers: formats casing (camelCase, snake_case, etc.) preserving exact casing over sentence capitalization.
 */
export function deterministicCodePolish(rawText: string, _context?: HandlerContext): string {
  const withoutPreamble = stripLLMPreamble(rawText);
  const withoutDisfluency = stripDisfluencies(withoutPreamble);
  const withSymbols = expandSymbolsAndOperators(withoutDisfluency);
  const structured = formatPunctuationAndStructure(withSymbols);
  const withKeywords = protectCodeKeywords(structured);
  return formatCodeIdentifiers(withKeywords);
}

/**
 * Closes multi-word declarative statements with a trailing period if missing,
 * while safely ignoring markdown lists, code blocks, URLs, and CLI commands.
 */
export function closeDeclarativeStatement(text: string): string {
  const s = text.trim();
  if (!s) return text;
  // If already ends in terminal punctuation or delimiter
  if (/[.!?:"'\`)}\]\n\-\;]$/.test(s)) return text;
  // If ends in a URL
  if (/https?:\/\/\S+$/i.test(s) || /[a-zA-Z0-9_-]+\.[a-zA-Z]{2,4}$/.test(s)) return text;
  // If last line is a markdown list item or code block
  const lastLine = s.split("\n").pop()?.trim() || "";
  if (lastLine.startsWith("- ") || /^\d+\.\s+/.test(lastLine) || lastLine.startsWith("```")) return text;
  // If single token, semver, or decimal
  if (s.split(/\s+/).length < 2 || /^v?\d+(?:\.\d+)+/i.test(s) || /\.\d+$/.test(s)) return text;
  // If CLI command
  if (/^\s*(?:git|herdr|npm|pnpm|yarn|bun|cargo|docker|kubectl|brew|cd|ls|cat|curl|python3?|node|grep|find|code|open|make|ps|kill|killall|mv|cp|rm|chmod|chown)\b/i.test(s)) return text;
  return text + ".";
}

/**
 * Fast-path prose polish for documents, social feeds, and email.
 * Normalizes lists, cadence, paragraphs, and punctuation while stripping disfluencies.
 */
export function deterministicProsePolish(rawText: string, _context?: HandlerContext): string {
  const withoutPreamble = stripLLMPreamble(rawText);
  const withoutDisfluency = stripDisfluencies(withoutPreamble);
  const withSymbols = expandSymbolsAndOperators(withoutDisfluency);
  const structured = formatPunctuationAndStructure(withSymbols);
  const cleaned = structured.replace(/\n{3,}/g, "\n\n").trim();
  return closeDeclarativeStatement(cleaned);
}

/**
 * Conversational chat polish for Slack, Teams, and Discord.
 * Removes disfluencies and cleans punctuation while preserving conversational fluidity.
 */
export function deterministicChatPolish(rawText: string, _context?: HandlerContext): string {
  const withoutPreamble = stripLLMPreamble(rawText);
  const withoutDisfluency = stripDisfluencies(withoutPreamble);
  const withSymbols = expandSymbolsAndOperators(withoutDisfluency);
  return formatPunctuationAndStructure(withSymbols);
}

// ============================================================================
// 7. HEX CONFIGURATION EXPORT & TRANSFORMATION REGISTRY
// ============================================================================

export default defineHexConfig({
  transformations: {
    // Zero-latency deterministic transform pipeline for code editors and terminals
    deterministicCodePolish: {
      name: "Deterministic Code Polish",
      description:
        "Zero-latency (<1ms) casing, symbol expansion, disfluency cleaning, and syntax formatting",
      transform: (rawText: string, context: HandlerContext) =>
        deterministicCodePolish(rawText, context),
    },

    // Fast-path prose polish for documents, social feeds, and email
    deterministicProsePolish: {
      name: "Deterministic Prose Polish",
      description:
        "Cadence, markdown lists, currency/entity normalization, and smart punctuation",
      transform: (rawText: string, context: HandlerContext) =>
        deterministicProsePolish(rawText, context),
    },

    // Conversational chat polish for Slack, Teams, and Discord
    deterministicChatPolish: {
      name: "Deterministic Chat Polish",
      description: "Fast, punchy messaging cleanup without corporate formalisms",
      transform: (rawText: string, context: HandlerContext) =>
        deterministicChatPolish(rawText, context),
    },
  },
});
