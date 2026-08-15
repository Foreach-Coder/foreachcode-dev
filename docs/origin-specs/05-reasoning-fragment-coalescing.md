# Reasoning 碎片逻辑合并需求

- 需求 ID：`ORIGIN-05`
- 类型：跨版本需求
- 状态：已确认

## 版本实现矩阵

| OpenCode 基线 | 实现分支 | 完成提交 | 版本落地 spec |
| --- | --- | --- | --- |
| `v1.17.9` | `dev-foreachcode-1.17.9` | `268cd6d3ddb3b5447bd7582b624a093009d245ef` | [`OpenCode 1.17.9 Reasoning 碎片合并落地设计`](https://github.com/Foreach-Coder/opencode/blob/d20dd4fa61c405736559eb4e217bfb0aea01e33a/docs/superpowers/specs/2026-08-15-05-reasoning-fragment-coalescing-design.md) |

## 1. 需求背景

部分 OpenAI-compatible gateway 会把一个连续 reasoning 段拆成大量逐 token 的 start/delta/end 生命周期。若按传输碎片直接持久化和展示，用户会看到大量只有一两个字的 reasoning 区块，事件消费者也会收到不符合逻辑语义的生命周期。

带签名或其他 Provider metadata 的 reasoning 边界可能具有协议意义，不能被相同规则合并。

## 2. 核心行为

- 同一个生成步骤中，相邻、无签名且没有其他内容打断的 reasoning 生命周期，必须表现为一个逻辑 reasoning 段。
- 合并后文本严格按接收顺序连接，不得丢失、重复或重排。
- 一个逻辑 reasoning 段只能有一次开始、一次最终结束和一个稳定身份。
- 所有当前支持的存储投影和事件接口必须表达相同的逻辑分段，不得一侧合并、另一侧仍暴露传输碎片。
- 带任何 Provider metadata 的生命周期必须保持独立；不能解析、猜测或合并签名内容。

## 3. 合并边界

以下任一情况必须结束当前逻辑 reasoning 段，后续内容不能继续合并：

- 新 reasoning 生命周期带 metadata，或当前段已带 metadata；
- 文本输出开始；
- 工具输入或工具调用开始；
- 当前生成步骤结束；
- 流正常结束、失败或取消；
- Provider 重试或新的处理循环开始。

无 metadata 的传输级 reasoning end 本身不一定代表逻辑段结束；如果随后仍是满足条件的相邻无签名 reasoning，可以继续并入当前逻辑段。

## 4. Metadata 合同

- start 或 end 任一侧出现 metadata，都使对应生命周期成为不可合并块。
- 如果 metadata 只在 end 时到达，系统必须保留该 metadata，并立即结束该独立块。
- 不按 metadata 内容相同、文本相似、时间间隔或 token 数猜测合并。

## 5. 失败与重试

- 流失败或取消时，已收到的 reasoning 文本和 metadata 必须被保存，逻辑段必须具有结束状态。
- 失败终态对外发布前，当前 reasoning 段必须先结束，保证事件顺序完整。
- 不同重试或处理循环之间不得共享未完成 reasoning 状态。
- 清理操作必须幂等，不得重复结束或重复发布同一逻辑段。

## 6. 非目标

- 不修改 Provider adapter 发出的原始事件。
- 不跨文本、工具、步骤、重试或签名边界合并。
- 不改变 reasoning 是否向用户显示的产品设置。

## 7. 验收标准

1. 三个相邻无签名碎片“我”“先”“分析”最终表现为一个文本为“我先分析”的 reasoning 段。
2. 合并段只有一个稳定身份、一次开始和一次结束；所有投影的生命周期一致。
3. 文本、工具、步骤结束和流终止都会截断合并窗口。
4. start 带 metadata、end 才带 metadata以及连续不同签名的块都保持独立。
5. 失败或取消后，已有 reasoning 不丢失且处于已结束状态。
6. 重试之间不发生 reasoning 串接。
7. 普通单段 reasoning、assistant 文本、usage 和工具限制等既有行为不受影响。
