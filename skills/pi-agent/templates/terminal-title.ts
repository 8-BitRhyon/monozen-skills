// terminal-title.ts - Pi extension: live spinner + status in the terminal tab header.
// Install: cp templates/terminal-title.ts ~/.pi/agent/extensions/  then /reload
// API: https://pi.dev/docs/latest/extensions
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const ACTIVE_TITLE = "▣ pi";

export default function (pi: ExtensionAPI) {
  let busy = false;
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const setTitle = (text: string) => {
    process.stdout.write(`\x1b]0;${text}\x07`);
  };

  const stop = () => {
    busy = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const spin = () => {
    if (!busy) return;
    frame = (frame + 1) % FRAMES.length;
    setTitle(`${FRAMES[frame]} ${ACTIVE_TITLE}`);
  };

  const start = () => {
    busy = true;
    if (timer) return;
    setTitle(`${FRAMES[0]} ${ACTIVE_TITLE}`);
    timer = setInterval(spin, 120);
  };

  const idle = (_event: unknown, ctx: any) => {
    stop();
    const name = ctx.sessionManager?.getSessionName?.() || null;
    const label = name || ctx.cwd || "pi";
    setTitle(label);
  };

  pi.on("agent_start", () => start());
  pi.on("turn_start", () => start());
  pi.on("agent_end", (_event, ctx) => idle(_event, ctx));
  pi.on("agent_settled", (_event, ctx) => idle(_event, ctx));

  // Always restore the title when the session ends or Pi exits.
  pi.on("session_shutdown", () => {
    stop();
    setTitle("pi");
  });
}