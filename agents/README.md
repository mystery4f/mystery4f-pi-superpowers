# Superpowers Agent 定义

> 将这些 `.md` 文件复制到 `~/.pi/agent/agents/` 目录即可启用。

Pi v0.78+ 已内置 subagent 基础设施（`@gotgenes/pi-subagents`），这里提供的是 superpowers 工作流专用的 agent 定义。

## Agent 一览

| Agent | 用途 | 模型 |
|-------|------|------|
| `superpowers-worker` | 按计划实现任务，遵循 TDD | 建议用强模型 |
| `superpowers-reviewer` | 多角色审查（spec + 代码质量 + 计划验证） | 建议用强模型 |
| `superpowers-spec-reviewer` | 纯 spec 合规审查（精简版） | 可用弱模型 |

## 安装

```bash
cp agents/*.md ~/.pi/agent/agents/
```

重启 Pi 后生效。

## 本地模型调整

如果你的模型提供商不同，修改对应 agent 的 `model` 字段即可。
