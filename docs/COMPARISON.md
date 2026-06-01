# pi-superpowers 技术对比分析

> 三个仓库/包的横向对比：`coctostan/pi-superpowers-plus` vs `weiping/pi-superpowers` vs `@gotgenes/pi-subagents`
>
> 当前环境：pi **v0.78.0**，SDK `@earendil-works/pi-coding-agent`，已内置 `@gotgenes/pi-subagents` v13.2.1

---

## 一、总览

| 维度 | pi-superpowers-plus | weiping/pi-superpowers | @gotgenes/pi-subagents |
|------|---------------------|------------------------|------------------------|
| **GitHub** | [coctostan/pi-superpowers-plus](https://github.com/coctostan/pi-superpowers-plus) | [weiping/pi-superpowers](https://github.com/weiping/pi-superpowers) | [gotgenes/pi-packages](https://github.com/gotgenes/pi-packages) (subdir) |
| **版本** | v0.4.1 | v5.1.0 | v13.2.1 |
| **npm 包名** | `pi-superpowers-plus` | `@weiping/pi-superpowers` | `@gotgenes/pi-subagents` |
| **定位** | 结构化工作流 + 运行时强制执行 | Superpowers 技能移植 + 中文支持 | 专业 subagent 基础设施 |
| **依赖 pi SDK** | `@mariozechner/*`（旧版） | `@mariozechner/*`（旧版） | `@earendil-works/*`（新版 ≥ 0.75.0） |
| **Node 要求** | - | - | ≥ 22 |
| **SDK 导入处数** | **14+** 处 / 6+ 文件 | **2** 处 / 2 文件 | 自身即 SDK 消费者 |

---

## 二、功能对比

### 2.1 核心功能矩阵

| 功能 | plus | weiping | gotgenes |
|------|:----:|:-------:|:--------:|
| 工作流技能（Skills） | ✅ 12 个 | ✅ 14 个 | ❌ |
| TDD 强制执行（扩展） | ✅ Workflow Monitor | ❌ | ❌ |
| 调试周期追踪 | ✅ Debug Monitor | ❌ | ❌ |
| 验证门控（commit/push/PR） | ✅ | ❌ | ❌ |
| 分支安全提醒 | ✅ | ❌ | ❌ |
| Subagent 工具 | ✅ `subagent` | ✅ `dispatch_agent` | ✅ `subagent` |
| Subagent 并行模式 | ✅ Parallel + Chain | ❌ 仅单任务 | ✅ Foreground + Background |
| Subagent 后台模式 | ❌ | ❌ | ✅ + 轮询 + steer |
| Subagent 引导（Steer） | ❌ | ❌ | ✅ `steer_subagent` |
| Subagent 结果查询 | ❌ 仅 final output | ❌ | ✅ `get_subagent_result` |
| Agent 自定义文件 | ✅ `.pi/agents/*.md` | ✅ 内置角色 | ✅ `.pi/agents/*.md` |
| 聊天通知 | ❌ | ❌ | ✅ 完成/失败通知 |
| 任务追踪（TUI Widget） | ✅ Plan Tracker | ❌ | ✅ Agent Widget |
| 中文触发支持 | ❌ | ✅ 中英双语关键词 | ❌ |
| Bootstrap 注入 | ❌ 技能按需加载 | ✅ 会话启动自动注入 | ❌ |
| 斜杠命令 | ✅ `/workflow-next` + `/workflow-reset` | ✅ `/brainstorm` 等 | ✅ `/agents` 管理菜单 |
| 提示模板（Prompts） | ❌ | ✅ 3 个 | ❌ |
| 跨 Session 持久化 | ✅ `superpowers_state` | ❌ | ✅ `subagents:record` |
| Event 系统 | ❌ 无自定义事件 | ❌ | ✅ 6 个自定义事件 |
| 跨扩展服务接口 | ❌ | ❌ | ✅ `Symbol.for()` 发布 |

---

## 三、架构深度对比

### 3.1 Subagent 工具对比

| 特性 | plus `subagent` | weiping `dispatch_agent` | gotgenes `subagent` |
|------|:--:|:--:|:--:|
| 实现方式 | `spawn("pi", ...)` 子进程 | `pi.exec("pi", ...)` | `createAgentSession` (SDK API) |
| 运行模式 | single / parallel / chain | 仅单任务 | foreground / background |
| 并发控制 | Semaphore 信号量 | 无 | ConcurrencyQueue |
| 超时机制 | 可配置 + 120s 不活动 | 5 分钟硬编码 | session 级别控制 |
| Agent 发现 | ~/.pi/agent/agents + .pi/agents + bundled | 角色硬编码 | .pi/agents/*.md + 内置默认 |
| Agent 配置 | frontmatter: name/description/tools/extensions/model | 无配置文件 | frontmatter: 完整配置 |
| TDD 追踪 | 子进程写 tdd-violations.txt | ❌ | ❌ |
| 结果获取 | JSON 流解析 stdout | stdout 字符串 | Agent Promise + 轮询工具 |
| 上下文继承 | ❌ | ❌ | ✅ `inherit_context` |
| Compaction | ❌ | ❌ | ✅ |
| 生命周期状态机 | ❌ 仅进程追踪 | ❌ 无状态 | ✅ running→completed/error |
| TUI 渲染 | 完整（展开/折叠/usage stats） | 基础文本 | Claude Code 风格 |

#### pi-superpowers-plus 的 `subagent`

```
模式: single / parallel / chain 三种
并发: Semaphore 信号量控制
超时: 可配置 + 120s 不活动超时
Agent 发现: ~/.pi/agent/agents → .pi/agents → bundled（优先级覆盖）
TDD 追踪: 子进程写入 tdd-violations.txt
结果: JSON 流式解析，支持实时 update
渲染: 完整的 TUI 渲染（展开/折叠、token/cost 统计）
亮点: Chain 模式支持 {previous} 占位符串行执行
```

#### weiping 的 `dispatch_agent`

```
角色: implementer / spec-reviewer / code-quality-reviewer
超时: 5 分钟硬编码
结果: 解析 stdout/stderr
渲染: 基础文本
亮点: 最简洁的实现，code-quality-reviewer 的完整 prompt 内置在代码中
局限: 角色硬编码，不管理 agent 配置文件
```

#### @gotgenes/pi-subagents 的 `subagent`

```
模式: foreground / background
后台: 支持 get_subagent_result 轮询 + steer_subagent 中途引导
并发: ConcurrencyQueue 调度
会话: 子 agent 拥有独立 session 文件，支持 fork parent context
通知: 完成/失败时 UI 通知
Event: subagents:started/completed/failed/compacted/created/steered
管理: /agents 交互式 TUI 菜单
持久化: appendEntry("subagents:record", ...) 跨 session 历史
服务: Symbol.for() 跨扩展发布，供其他扩展调用
```

### 3.2 技能体系对比

#### pi-superpowers-plus（12 个技能）

```
brainstorming              — 需求分析
writing-plans              — 编写实现计划
subagent-driven-development — 按计划逐任务实现
executing-plans            — 批量执行计划
test-driven-development    — 测试驱动开发
systematic-debugging       — 系统性调试
dispatching-parallel-agents — 并行任务派发
requesting-code-review     — 请求代码审查
receiving-code-review      — 处理审查意见
verification-before-completion — 完成前验证
finishing-a-development-branch — 分支收尾
using-git-worktrees        — 隔离工作区
```

附带 4 个 agent 定义（implementer, code-reviewer, spec-reviewer, worker）在 `agents/` 目录

#### weiping/pi-superpowers（14 个技能）

```
                    ← 与 plus 相同的 12 个
+ using-superpowers  ← 元技能（bootstrap 自动注入）
+ writing-skills     ← 创建/修改技能文件
```

**额外特性**：
- 每个 SKILL.md 的 frontmatter 包含中英文 description，中文关键词自动匹配
- `using-superpowers` 在会话启动时通过 bootstrap 扩展注入系统提示
- 内置 Claude Code → Pi 工具映射（`Skill` → `/skill:`, `TodoWrite` → `TodoWrite`, `Task` → `dispatch_agent`）

### 3.3 扩展架构对比

#### pi-superpowers-plus — 重运行时强制

```
extensions/
  ├── plan-tracker.ts               # 任务计划追踪（TUI widget）
  ├── workflow-monitor.ts           # 工作流总控（782 行）
  ├── workflow-monitor/             # 13 个子模块
  │   ├── tdd-monitor.ts            # TDD 周期追踪（idle→red→green→refactor）
  │   ├── debug-monitor.ts          # 调试周期追踪（fix without investigation 升级）
  │   ├── verification-monitor.ts   # 提交验证门控（commit/push/PR 前检查）
  │   ├── git.ts                    # 分支安全（首条输出显示分支/SHA）
  │   ├── test-runner.ts            # 测试命令检测（vitest/pytest/npm test）
  │   ├── workflow-tracker.ts       # 工作流阶段（brainstorm→plan→execute→verify→review→finish）
  │   ├── workflow-transitions.ts   # 阶段转换逻辑
  │   ├── heuristics.ts             # 技能检测启发式
  │   ├── investigation.ts          # 调查行为检测（LSP/kota/web search）
  │   ├── skip-confirmation.ts      # 跳过确认处理
  │   ├── reference-tool.ts         # workflow_reference 按需加载
  │   ├── warnings.ts               # 警告升级机制（advisory→escalated→blocking）
  │   └── workflow-handler.ts       # 事件路由 + 状态管理
  ├── subagent/
  │   ├── index.ts                  # 核心工具注册 + TUI 渲染
  │   ├── agents.ts                 # Agent 发现/加载（frontmatter 解析）
  │   ├── concurrency.ts            # Semaphore 并发控制
  │   ├── lifecycle.ts              # ProcessTracker（kill all on exit）
  │   ├── timeout.ts                # 超时配置
  │   └── env.ts                    # 环境变量构建
  └── logging.ts                    # 日志模块（debug 开关: PI_SUPERPOWERS_DEBUG）
```

**设计亮点**：
- 三场景 TDD 模型：新功能（全 TDD）/ 修改已有测试代码（跑现有测试）/ 琐碎变更（自行判断）
- 警告升级机制：advisory → escalated → blocking
- 思考阶段写入限制：Brainstorm/Plan 阶段只允许写 `docs/plans/`
- 完成阶段预填：自动填充 docs + learnings 提示

#### weiping/pi-superpowers — 轻量技能 + 引导

```
extensions/
  ├── bootstrap.ts          # 会话启动：注入 using-superpowers 到系统提示
  ├── bootstrap-utils.ts    # 纯函数：stripFrontmatter, buildPiToolMapping, buildBootstrapContent
  ├── subagent.ts           # dispatch_agent 工具注册
  └── subagent-utils.ts     # 纯函数：buildRolePrompt, buildPiArgs, parseSubagentResult

hooks/                      # 钩子脚本
prompts/                    # 3 个斜杠命令提示模板
```

**设计亮点**：
- 极度精简：核心扩展仅 4 个文件
- 测试友好：utils 纯函数独立测试
- Bootstrap 注入策略：`before_agent_start` 事件，仅首个 user turn 注入一次

#### @gotgenes/pi-subagents — 完备的 subagent 基础设施

```
src/
  ├── index.ts               # 入口：注册 3 工具 + 1 命令 + 6 事件 + 1 消息渲染器
  ├── runtime.ts              # SubagentRuntime：统一可变状态（DI 容器模式）
  ├── types.ts                # 完整类型定义
  ├── settings.ts             # 设置管理（持久化 + 事件通知）
  ├── config/
  │   ├── agent-types.ts      # Agent 类型注册表（内置 + 自定义）
  │   └── custom-agents.ts    # .pi/agents/*.md 加载
  ├── handlers/               # SessionLifecycle / ToolStart 事件处理
  ├── lifecycle/
  │   ├── agent-manager.ts    # Agent 生命周期（spawn/resume/steer）
  │   ├── agent.ts            # Agent 记录（状态机 + promise）
  │   ├── concurrency-queue.ts # 并发排队
  │   ├── create-subagent-session.ts # 子 session 创建
  │   └── parent-snapshot.ts  # 父会话快照（fork context）
  ├── tools/
  │   ├── agent-tool.ts       # subagent 工具（foreground/background/resume）
  │   ├── get-result-tool.ts  # get_subagent_result 轮询
  │   ├── steer-tool.ts       # steer_subagent 中途引导
  │   ├── background-spawner.ts # 后台 spawn 逻辑
  │   ├── foreground-runner.ts  # 前台流式执行
  │   ├── spawn-config.ts     # 参数解析 + 验证
  │   ├── result-renderer.ts  # 结果渲染
  │   └── helpers.ts          # 工具函数
  ├── observation/            # 通知系统（completion/failure/compaction）
  ├── session/                # 环境检测、模型解析、prompt 构建
  ├── service/                # 跨扩展服务（Symbol.for() 发布）
  └── ui/                     # AgentWidget + /agents 菜单 + 文件操作
```

**设计亮点**：
- 依赖注入：所有组件构造函数注入依赖，高度可测试
- 生命周期完整：running → completed/error/stopped/aborted + compaction
- 跨扩展通信：`Symbol.for("pi-subagents.service")` 服务发布
- 会话隔离：每个子 agent 拥有独立 session 文件
- 流式更新：foreground 模式通过 onUpdate 实时推送进度

---

## 四、🚨 与 @gotgenes/pi-subagents 的兼容性分析

### 4.1 当前环境

```
pi 版本:    0.78.0
SDK scope:  @earendil-works/pi-coding-agent (新版)
已安装:     @gotgenes/pi-subagents v13.2.1 (使用 @earendil-works/*)
pi 安装路径: D:\nodejs\npm\npm_global\pi
SDK 路径:    D:\nodejs\npm\npm_global\node_modules\@earendil-works\pi-coding-agent
```

### 4.2 完整注册点对比

| 注册类型 | pi-superpowers-plus | weiping/pi-superpowers | @gotgenes/pi-subagents | 🔴🟡🟢 |
|----------|:---:|:---:|:---:|:---:|
| **工具 (Tools)** | | | | |
| `subagent` | ✅ | ❌ | ✅ | 🔴 **重名冲突** |
| `plan_tracker` | ✅ | ❌ | ❌ | 🟢 |
| `workflow_reference` | ✅ | ❌ | ❌ | 🟢 |
| `dispatch_agent` | ❌ | ✅ | ❌ | 🟢 |
| `get_subagent_result` | ❌ | ❌ | ✅ | 🟢 |
| `steer_subagent` | ❌ | ❌ | ✅ | 🟢 |
| **命令 (Commands)** | | | | |
| `/agents` | ❌ | ❌ | ✅ | 🟢 |
| `/workflow-next` | ✅ | ❌ | ❌ | 🟢 |
| `/workflow-reset` | ✅ | ❌ | ❌ | 🟢 |
| **消息渲染器** | | | | |
| `subagent-notification` | ❌ | ❌ | ✅ | 🟢 |
| **appendEntry type** | | | | |
| `superpowers_state` | ✅ | ❌ | ❌ | 🟢 |
| `subagents:record` | ❌ | ❌ | ✅ | 🟢 |
| **事件监听** | | | | |
| `session_start` | ✅ | ✅ | ✅ | 🟢 可多监听 |
| `tool_call` | ✅ | ❌ | ❌ | 🟢 |
| `tool_result` | ✅ | ❌ | ❌ | 🟢 |
| `agent_end` | ✅ | ❌ | ❌ | 🟢 |
| `input` | ✅ | ❌ | ❌ | 🟢 |
| `before_agent_start` | ❌ | ✅ | ❌ | 🟢 |
| `tool_execution_start` | ❌ | ❌ | ✅ | 🟢 |
| `session_before_switch` | ❌ | ❌ | ✅ | 🟢 |
| `session_shutdown` | ❌ | ❌ | ✅ | 🟢 |
| **事件发射** | | | | |
| `subagents:started` | ❌ | ❌ | ✅ | 🟢 |
| `subagents:completed` | ❌ | ❌ | ✅ | 🟢 |
| `subagents:failed` | ❌ | ❌ | ✅ | 🟢 |
| `subagents:compacted` | ❌ | ❌ | ✅ | 🟢 |
| `subagents:created` | ❌ | ❌ | ✅ | 🟢 |
| `subagents:steered` | ❌ | ❌ | ✅ | 🟢 |

**结论：只有 `subagent` 一个工具名冲突。命令、事件、appendEntry、消息渲染器全部不重叠。**

### 4.3 SDK 导入冲突（根本性阻塞）

pi v0.78.0 使用 `@earendil-works/pi-coding-agent`，旧的 `@mariozechner/*` 包在 node_modules 中**不存在**。

#### pi-superpowers-plus 的 SDK 导入（14+ 处）

```
extensions/subagent/index.ts:
  import type { AgentToolResult } from "@mariozechner/pi-agent-core"      ← 包不存在
  import type { Message } from "@mariozechner/pi-ai"                       ← 包不存在
  import { StringEnum } from "@mariozechner/pi-ai"                         ← 包不存在
  import { type ExtensionAPI, getMarkdownTheme } from "@mariozechner/pi-coding-agent"  ← 包不存在
  import { Container, Markdown, Spacer, Text } from "@mariozechner/pi-tui" ← 包不存在

extensions/subagent/agents.ts:
  import { parseFrontmatter } from "@mariozechner/pi-coding-agent"         ← 包不存在

extensions/plan-tracker.ts:
  import { StringEnum } from "@mariozechner/pi-ai"                         ← 包不存在
  import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent"
  import { Text } from "@mariozechner/pi-tui"                              ← 包不存在

extensions/workflow-monitor.ts:
  import { StringEnum } from "@mariozechner/pi-ai"                         ← 包不存在
  import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent"
  import { Text } from "@mariozechner/pi-tui"                              ← 包不存在

extensions/workflow-monitor/workflow-handler.ts:
  import type { SessionEntry } from "@mariozechner/pi-coding-agent"        ← 包不存在

extensions/workflow-monitor/workflow-tracker.ts:
  import type { SessionEntry } from "@mariozechner/pi-coding-agent"        ← 包不存在
```

#### weiping/pi-superpowers 的 SDK 导入（仅 2 处）

```typescript
// extensions/bootstrap.ts:17
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// extensions/subagent.ts:19
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
```

### 4.4 API 兼容性分析

新版 SDK (`@earendil-works/pi-coding-agent`) 将旧版拆分的多个包合并为单一入口：

| 旧版导入 (plus 使用) | 新版位置 | 兼容性 |
|------|------|:--:|
| `@mariozechner/pi-coding-agent` → `ExtensionAPI` | `@earendil-works/pi-coding-agent` → `ExtensionAPI` | ✅ 存在 |
| `@mariozechner/pi-coding-agent` → `getMarkdownTheme` | `@earendil-works/pi-coding-agent` → `getMarkdownTheme` | ✅ 存在 |
| `@mariozechner/pi-coding-agent` → `parseFrontmatter` | `@earendil-works/pi-coding-agent` → `parseFrontmatter` | ✅ 存在 |
| `@mariozechner/pi-coding-agent` → `SessionEntry` | `@earendil-works/pi-coding-agent` → `SessionEntry` | ✅ 存在 |
| `@mariozechner/pi-coding-agent` → `ExtensionContext` | `@earendil-works/pi-coding-agent` → `ExtensionContext` | ✅ 存在 |
| `@mariozechner/pi-coding-agent` → `defineTool` | `@earendil-works/pi-coding-agent` → `defineTool` | ✅ 存在 |
| `@mariozechner/pi-agent-core` → `AgentToolResult` | `@earendil-works/pi-coding-agent` → `AgentToolResult` | ✅ 存在 |
| `@mariozechner/pi-ai` → `StringEnum` | `@earendil-works/pi-ai`（嵌套依赖） → `StringEnum` | ⚠️ 嵌套依赖，需验证 |
| `@mariozechner/pi-ai` → `Message` | `@earendil-works/pi-ai`（嵌套依赖） → `Message` | ⚠️ 嵌套依赖，需验证 |
| `@mariozechner/pi-tui` → `Container` | `@earendil-works/pi-tui`（嵌套依赖） → `Component` | ⚠️ API 可能有变化 |
| `@mariozechner/pi-tui` → `Markdown` | `@earendil-works/pi-tui`（嵌套依赖） | ⚠️ 需验证 |
| `@mariozechner/pi-tui` → `Spacer` | `@earendil-works/pi-tui`（嵌套依赖） | ⚠️ 需验证 |
| `@mariozechner/pi-tui` → `Text` | `@earendil-works/pi-tui`（嵌套依赖） | ⚠️ 需验证 |

**关键风险**：新版 SDK 是 0.75+ 的大版本，API 签名可能有破坏性变更。`Container`、`Markdown`、`Spacer` 可能已改名或签名变了。

### 4.5 Agent 文件格式兼容性

两者都从 `.pi/agents/*.md` 和 `~/.pi/agent/agents/*.md` 读取：

| frontmatter 字段 | plus | gotgenes | 兼容？ |
|------|:--:|:--:|:--:|
| `name` | ✅ 必需 | ✅ | ✅ |
| `description` | ✅ 必需 | ✅ | ✅ |
| `tools` | ✅ 逗号分隔 | `builtinToolNames` | ⚠️ 字段名不同 |
| `extensions` | ✅ 逗号分隔 | ❌ | ⚠️ |
| `model` | ✅ | ✅ | ✅ |
| `thinking` | ❌ | ✅ | 🟢 不影响 |
| `maxTurns` | ❌ | ✅ | 🟢 不影响 |
| `inheritContext` | ❌ | ✅ | 🟢 不影响 |
| `runInBackground` | ❌ | ✅ | 🟢 不影响 |
| `isDefault` | ❌ | ✅ | 🟢 不影响 |
| `enabled` | ❌ | ✅ | 🟢 不影响 |

**基本可共享**：公共字段兼容，扩展字段互不干扰。

---

## 五、冲突评估

### 5.1 pi-superpowers-plus vs @gotgenes/pi-subagents

| 冲突项 | 严重程度 | 说明 |
|--------|:--------:|------|
| SDK scope 不兼容 | 🔴 **致命** | 14+ 处导入 `@mariozechner/*`，pi 0.78 中这些包不存在 |
| 工具名 `subagent` 冲突 | 🔴 **致命** | 同名工具，后注册者覆盖先注册者 |
| TUI 组件 API 变更 | 🟡 **高** | `Container`/`Markdown`/`Spacer`/`Text` 在新 SDK 可能已改 |
| `pi-ai`/`pi-tui` 为嵌套依赖 | 🟡 **中** | 需确认 pi 模块解析能否找到嵌套依赖路径 |
| Agent 文件格式差异 | 🟢 **低** | `tools` vs `builtinToolNames` 字段名不同，其余兼容 |
| appendEntry 类型 | 🟢 **无** | `superpowers_state` vs `subagents:record` 不重叠 |

### 5.2 weiping/pi-superpowers vs @gotgenes/pi-subagents

| 冲突项 | 严重程度 | 说明 |
|--------|:--------:|------|
| SDK scope 不兼容 | 🔴 **致命** | 仅 2 处导入，但 `@mariozechner/*` 包不存在 |
| 工具名冲突 | 🟢 **无** | `dispatch_agent` ≠ `subagent` |
| 命令冲突 | 🟢 **无** | 无命令注册 |
| 事件冲突 | 🟢 **无** | 仅监听，无自定义事件发射 |
| API 签名风险 | 🟢 **低** | 仅使用 `ExtensionAPI` type，新旧版应兼容 |

---

## 六、共存方案与迁移成本

### 6.1 weiping/pi-superpowers → 最低成本共存

**仅需修改 2 行**，且 `ExtensionAPI` 在新旧 SDK 中都存在，API 兼容性风险极低：

```diff
// extensions/bootstrap.ts:17
- import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
+ import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// extensions/subagent.ts:19
- import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
+ import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
```

改完后：
- `dispatch_agent` 工具与 gotgenes 的 `subagent` 互不冲突
- 14 个技能 + bootstrap 注入正常工作
- 中文触发可用

### 6.2 pi-superpowers-plus → 高成本共存

需要：
1. **改 14+ 处 import 路径**，涉及 `@mariozechner/pi-ai`、`@mariozechner/pi-agent-core`、`@mariozechner/pi-tui`、`@mariozechner/pi-coding-agent` → 统一改为 `@earendil-works/pi-coding-agent`
2. **验证 TUI 组件 API**：`Container`、`Markdown`、`Spacer`、`Text` 在新版 SDK 中签名是否兼容
3. **验证 `StringEnum`、`Message` 导入路径**：这些来自嵌套依赖 `@earendil-works/pi-ai`，需确认 pi 模块解析可达
4. **解决 `subagent` 工具名冲突**：需要将 plus 的工具改名为 `dispatch_agent` 或其他名称
5. **回归测试**：253 个单元测试需要在新 SDK 环境下重新跑

### 6.3 推荐方案

| 场景 | 方案 |
|------|------|
| 需要中文技能支持 | ✅ 改 weiping 的 2 行 import，直接可用 |
| 需要运行时强制执行（TDD 监控） | ❌ plus 迁移成本太高，不建议 |
| 仅需要技能内容 | 📋 手动复制 `skills/` 目录的 SKILL.md 到 `~/.pi/agent/skills/` 或 `.pi/skills/`，纯 Markdown 无 SDK 依赖 |
| 保持现状 | ✅ gotgenes 在 subagent 能力上已是最强，无需替换 |

---

## 七、总结

| 维度 | 🏆 胜出者 | 说明 |
|------|------|------|
| **Subagent 完备性** | `@gotgenes/pi-subagents` | 后台模式、steer、通知、compaction、跨扩展服务 |
| **工作流强制执行** | `pi-superpowers-plus` | TDD 监控、验证门控、分支安全、警告升级 |
| **文档/本地化** | `@weiping/pi-superpowers` | 中英双语触发、详细中文 README |
| **代码架构** | `@gotgenes/pi-subagents` | 依赖注入、完整类型、模块化 |
| **SDK 兼容性** | `@gotgenes/pi-subagents` | 与 pi 0.78.0 原生兼容 |
| **安装即用** | `@gotgenes/pi-subagents` | 已内置，零配置 |
| **迁移成本** | `@weiping/pi-superpowers` | 仅 2 行改动即可在 pi 0.78.0 运行 |

### 最终建议

```
当前最优栈：@gotgenes/pi-subagents（已内置）
可低成本叠加：@weiping/pi-superpowers（改 2 行 import 后共存）
不建议安装：pi-superpowers-plus（SDK 断裂 + 工具名冲突，迁移成本过高）
```
