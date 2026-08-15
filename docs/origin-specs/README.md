# BluedCode 跨版本需求规格

本目录保存 BluedCode 在不同 OpenCode 版本中需要持续成立的产品需求合同。这里描述需求本身，不描述某个版本的源码改法。

## 规格分类

- 只适用于某个 OpenCode 版本的需求，直接写入 `opencode/docs/superpowers/specs/`。
- 需要跨版本持续实现的需求，先写入本目录，再为目标版本编写对应的版本落地 spec。
- 同一需求的版本 spec 必须引用对应的 origin spec，但不能复制同一套描述。

Origin spec 侧重产品目标、用户场景、行为、不变量、安全边界和黑盒验收；版本 spec 侧重源码映射、技术设计、兼容处理、实施步骤和测试结果。

## 规格清单

| ID | 规格 | 能力 |
| --- | --- | --- |
| `ORIGIN-01` | [`01-product-branding.md`](01-product-branding.md) | BluedCode 产品身份、构建一致性、数据隔离、版本和视觉资源合同 |
| `ORIGIN-02` | [`02-enterprise-product-policy.md`](02-enterprise-product-policy.md) | 企业构建的 Provider、分享、遥测、更新及公共服务边界 |
| `ORIGIN-03` | [`03-file-tree-preference-sync.md`](03-file-tree-preference-sync.md) | 会话文件树偏好的恢复与运行时同步 |
| `ORIGIN-04` | [`04-independent-clone-isolation.md`](04-independent-clone-isolation.md) | 独立 clone 与 linked worktree/sandbox 的生命周期隔离 |
| `ORIGIN-05` | [`05-reasoning-fragment-coalescing.md`](05-reasoning-fragment-coalescing.md) | 碎片化无签名 reasoning 的逻辑合并 |
| `ORIGIN-06` | [`06-llm-performance-logging.md`](06-llm-performance-logging.md) | 不保留提示词内容的 LLM 性能诊断日志 |

## 版本实现矩阵

每份 origin spec 都必须维护自己的版本实现矩阵。每实现一个新的 OpenCode 版本，追加一行，记录：

- OpenCode tag 或其他明确基线；
- 承载实现的版本分支；
- 该分支首次完整满足整个 origin spec 的 commit ID；
- 对应的版本落地 spec。

矩阵记录完整实现落点，不使用分支当前 HEAD，也不把尚未通过版本验收的提交登记为完成。构成实现过程的其他提交保留在 evidence 或版本 spec 中。

## 依赖关系

- `ORIGIN-02` 依赖 `ORIGIN-01` 提供不可变的企业产品身份。
- `ORIGIN-06` 的本地日志能力受 `ORIGIN-02` 的遥测出网策略约束。
- `ORIGIN-03`、`ORIGIN-04` 和 `ORIGIN-05` 相互独立。

依赖关系不等于目标版本的实施顺序；实际顺序由版本落地 spec 决定。

## 来源与版本落地

- 当前需求集由 OpenCode tag `v1.17.9` 与分支 `dev-foreachcode-1.17.9` 的差异逆向得到。
- OpenCode 1.17.9 的版本落地 spec 位于 `opencode/docs/superpowers/specs/`。
- 构成实现过程的历史提交、源码路径和测试位置由对应的版本落地 spec 维护。
- 文档只维护 `BluedCode` 产品；历史分支中的其他品牌不属于需求合同。

## 解释规则

- “必须”表示跨版本都应满足的产品行为。
- 实现可以随 OpenCode 版本变化，只要继续满足对应行为和验收标准。
- 上游已经提供等价能力时，应优先复用，并通过版本级测试证明合同仍成立。
- `.opencode`、`opencode.json(c)`、`OPENCODE_*`、`x-opencode-*`、`@opencode-ai/*` 和 `opencode` provider ID 是上游兼容协议，不因产品名变化。
