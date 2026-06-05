# Superpowers Agent 定义

> 将这些 `.md` 文件复制到 `~/.pi/agent/agents/` 目录即可启用。

Pi v0.78+ 已内置 subagent 基础设施（`@gotgenes/pi-subagents`），这里提供的是 superpowers 工作流专用的 agent 定义。

## Agent 一览

| Agent | 用途 | 模型 |
|-------|------|------|
| `superpowers-worker` | 普通任务（CRUD、加字段、改配置） | deepseek-v4-flash |
| `superpowers-worker-pro` | 复杂任务（跨模块、重构、异常处理） | deepseek-v4-pro |
| `superpowers-reviewer` | 多角色审查（spec + 代码质量 + 计划验证） | deepseek-v4-pro |
| `superpowers-spec-reviewer` | 纯 spec 合规审查（精简版） | deepseek-v4-flash |

## 安装

```bash
cp agents/*.md ~/.pi/agent/agents/
```

重启 Pi 后生效。

## 本地模型调整

如果你的模型提供商不同，修改对应 agent 的 `model` 字段即可。
