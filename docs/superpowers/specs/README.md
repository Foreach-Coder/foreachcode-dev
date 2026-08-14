# OpenCode 1.17.9 定制特性逆向规格

- 状态：逆向确认
- 对比基线：tag `v1.17.9`（`5c23e88419c4743b9be42cea132f2fb1e6cb63ff`）
- 目标分支：`dev-foreachcode-1.17.9`（`268cd6d3ddb3b5447bd7582b624a093009d245ef`）
- 源码子仓库：`opencode/`（文档中的实现锚点均相对于该目录）
- 目标产品：`BluedCode`
- 最后整理：2026-08-15

## 1. 用途

本目录记录目标分支相对于 OpenCode `v1.17.9` 的行为增量。后续迁移到新版 OpenCode 时，应以这里的行为合同和验收标准为准重新实现，不要求复用 1.17.9 分支的文件布局、函数名或补丁上下文。

规格只描述当前需要继续维护的 `BluedCode` 产品。历史分支中出现过的其他品牌配置不属于迁移目标，也不应作为默认值、示例或验收基准带入新版本。

## 2. 规格清单

| 规格 | 负责的能力 |
| --- | --- |
| [`2026-08-15-01-product-branding-design.md`](2026-08-15-01-product-branding-design.md) | BluedCode 构建参数、产品身份、发行版本、视觉资源和分发隔离 |
| [`2026-08-15-02-enterprise-product-policy-design.md`](2026-08-15-02-enterprise-product-policy-design.md) | 企业构建的 Provider、分享、遥测、更新及公共服务限制 |
| [`2026-08-15-03-file-tree-preference-sync-design.md`](2026-08-15-03-file-tree-preference-sync-design.md) | 会话文件树显示偏好的初始化和运行时同步 |
| [`2026-08-15-04-independent-clone-isolation-design.md`](2026-08-15-04-independent-clone-isolation-design.md) | 相同仓库的独立 clone 与 linked worktree/sandbox 分类 |
| [`2026-08-15-05-reasoning-fragment-coalescing-design.md`](2026-08-15-05-reasoning-fragment-coalescing-design.md) | 相邻无签名 reasoning 生命周期的合并 |
| [`2026-08-15-06-llm-performance-logging-design.md`](2026-08-15-06-llm-performance-logging-design.md) | 不保留提示词内容的 LLM 性能诊断日志 |

## 3. 提交追踪矩阵

| 提交 | 逆向出的能力 | 规格落点 |
| --- | --- | --- |
| `efc966ebb4` | 产品展示名、独立安装身份、数据目录、CLI、Desktop/Web/TUI 品牌及公共能力收口 | `2026-08-15-01-product-branding-design.md`、`2026-08-15-02-enterprise-product-policy-design.md` |
| `eaff84fc14` | 无源码修改的构建态品牌参数化、隔离暂存和视觉注入 | `2026-08-15-01-product-branding-design.md` |
| `bb64a6551c` | BluedCode preset、同目录 PNG 安全内嵌到 App Icon SVG | `2026-08-15-01-product-branding-design.md` |
| `70157ccf92` | 文件树偏好与可见状态同步 | `2026-08-15-03-file-tree-preference-sync-design.md` |
| `4f9f129a61` | Provider 仅允许显式配置、关闭凭据连接入口 | `2026-08-15-02-enterprise-product-policy-design.md` |
| `3654f46519` | 将连接、分享和 OTLP 限制统一为企业策略；增加产品发行号和组合版本 | `2026-08-15-02-enterprise-product-policy-design.md`、`2026-08-15-01-product-branding-design.md` |
| `7e98570f70` | 隐私安全的 LLM 性能事件 | `2026-08-15-06-llm-performance-logging-design.md` |
| `66ec4bbeff` | 独立 clone 不再误入 sandbox 列表 | `2026-08-15-04-independent-clone-isolation-design.md` |
| `268cd6d3dd` | 合并碎片化的无签名 reasoning 流 | `2026-08-15-05-reasoning-fragment-coalescing-design.md` |

## 4. 推荐迁移顺序

1. 先恢复 `2026-08-15-01-product-branding-design.md`，建立唯一构建输入、品牌注入和隔离产物。
2. 恢复 `2026-08-15-02-enterprise-product-policy-design.md`，从服务边界开始封闭外联，再隐藏 UI 入口。
3. 分别迁移文件树同步、clone 分类和 reasoning 合并；三者互不依赖。
4. 最后接入 LLM 性能日志，以新版 LLM 流式接口为集成点重新核对时间边界。
5. 对每份规格逐项执行验收，不以“补丁可应用”代替行为验证。

## 5. 解释规则

- “必须”表示迁移后的产品行为合同。
- “1.17.9 实现锚点”仅用于定位原实现和测试，不限制新版代码结构。
- 当新版上游已经提供等价能力时，应优先配置或复用上游能力，并增加合同测试，不重复维护分叉实现。
- 当规格与旧补丁偶然实现细节冲突时，以规格中的用户可见行为、安全边界和验收标准为准。
- `.opencode`、`opencode.json(c)`、`OPENCODE_*`、`x-opencode-*`、`@opencode-ai/*` 和 `opencode` provider ID 属于上游兼容协议，不因产品名改变。
