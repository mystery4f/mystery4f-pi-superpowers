/**
 * pi-superpowers bootstrap extension
 *
 * Injects using-superpowers skill content into the system prompt at the start
 * of each conversation (equivalent to Superpowers' SessionStart hook for Claude Code).
 *
 * Architecture:
 *   bootstrap-utils.ts  ← pure functions (tested in bootstrap.test.ts)
 *   bootstrap.ts        ← Pi ExtensionAPI integration + assembleBootstrap() export
 *
 * Injection strategy:
 *   - Uses before_agent_start event (fires before each LLM call)
 *   - Only injects on the very first user turn (0 prior user messages)
 *   - Tracks injected session to avoid re-injection on follow-up prompts
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  stripFrontmatter,
  buildPiToolMapping,
  buildBootstrapContent,
} from "./bootstrap-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve the skills directory relative to this extension file
const DEFAULT_SKILLS_DIR = path.resolve(__dirname, "../skills");

/**
 * Assemble the full bootstrap content from the skills directory.
 * Returns null if the using-superpowers skill cannot be found.
 *
 * Exported for testing.
 */
export function assembleBootstrap(skillsDir: string): string | null {
  const skillPath = path.join(skillsDir, "using-superpowers", "SKILL.md");

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(skillPath, "utf8");
    const body = stripFrontmatter(raw);
    const toolMapping = buildPiToolMapping(skillsDir);
    return buildBootstrapContent(body, toolMapping);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pi Extension Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("✦ pi-superpowers loaded (superpowers skills available)", "info");
  });

  pi.on("before_agent_start", async (event, _ctx) => {
    const bootstrapContent = assembleBootstrap(DEFAULT_SKILLS_DIR);
    if (!bootstrapContent) {
      return {};
    }

    return {
      systemPrompt: event.systemPrompt + "\n\n" + bootstrapContent,
    };
  });
}
