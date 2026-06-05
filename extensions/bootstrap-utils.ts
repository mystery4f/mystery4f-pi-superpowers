/**
 * bootstrap-utils.ts
 *
 * Pure utility functions for the pi-superpowers bootstrap extension.
 * Extracted from the main extension for testability.
 */

/**
 * Strip YAML frontmatter (--- block ---) from skill file content.
 * Returns the body content, trimmed of leading blank lines.
 */
export function stripFrontmatter(content: string): string {
  const match = content.match(/^---[\s\S]*?---\n+([\s\S]*)$/);
  if (match) {
    return match[1].trimStart();
  }
  return content;
}

/**
 * Build the Pi-specific tool mapping note.
 * Explains to the LLM how to substitute Pi tools for Claude Code tools.
 */
export function buildPiToolMapping(skillsDir: string): string {
  return `
---

## Pi 平台工具映射（Pi Platform Tool Mapping）

当 skills 提到以下工具时，在 Pi 中使用对应替代：

| Skills 中的工具 | Pi 中的替代方案 |
|---------------|--------------|
| \`Skill\` 工具 | 使用 \`read\` 工具读取技能文件（路径：\`${skillsDir}/<skill-name>/SKILL.md\`），或在编辑器输入 \`/skill:<name>\` 命令 |
| \`TodoWrite\` | 使用 \`write\`/\`edit\` 工具操作项目根目录的 \`TODO.md\` 文件，用 Markdown 复选框格式记录任务 |
| \`Task\`（子代理派发）| 使用 \`subagent\` 工具。具体用法（agent 选择、chain/parallel/async 模式、acceptance gates 等）见系统提示中的 \`pi-subagents\` 技能说明，以及 \`subagent-driven-development\` 技能。 |
| \`Read\` | \`read\` 工具（同名，直接使用）|
| \`Write\` | \`write\` 工具（同名，直接使用）|
| \`Edit\` | \`edit\` 工具（同名，直接使用）|
| \`Bash\` | \`bash\` 工具（同名，直接使用）|
`.trimEnd();
}

/**
 * Determine whether to inject bootstrap for this request.
 *
 * Rules:
 * - Only inject on the very first user turn (priorUserMessages === 0)
 * - This prevents re-injection on every subsequent user prompt
 *
 * Note: sessionId is not used for stateful deduplication here —
 * the extension layer handles session-level caching externally.
 */
export function shouldInjectBootstrap(
  _sessionId: string,
  priorUserMessages: number
): boolean {
  return priorUserMessages === 0;
}

/**
 * Build the full bootstrap content to inject into the system prompt.
 */
export function buildBootstrapContent(
  skillBody: string,
  toolMapping: string
): string {
  return `<EXTREMELY_IMPORTANT>
你拥有超级能力（You have superpowers）。

以下是 superpowers:using-superpowers 技能的完整内容，它已经加载，你正在遵循它。
**不要** 再次用 \`read\` 工具加载 using-superpowers，那是多余的。

${skillBody}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
}
