# Reasoning 碎片生命周期合并规格

- 状态：逆向确认
- 迁移顺序：`05`
- 基线版本：OpenCode `1.17.9`
- 最后更新：2026-08-15

## 1. 问题

部分 OpenAI-compatible GLM gateway 会为每个 token 反复发送 `reasoning-start → reasoning-delta → reasoning-end`。若逐段持久化，界面会产生大量只有一两个字的 reasoning part，V2 事件也会暴露碎片化生命周期。

另一些 Provider 使用带签名或其他 metadata 的 reasoning block；这些边界具有协议意义，不能合并。

## 2. 核心合同

处理器维护一个尚未最终结束的 `pending reasoning part`。一个新的 reasoning start 只有同时满足以下条件时，才能复用 pending part：

1. 存在 pending part；
2. 当前没有其他 active reasoning ID；
3. pending part 没有 provider metadata；
4. 新 start 也没有 provider metadata。

满足时：

- 新 Provider reasoning ID 映射到原 pending part；
- 新 delta 追加到同一文本；
- V1 最终只保留一个 reasoning part；
- V2 delta 继续使用首次 start 的 canonical reasoning ID；
- 不发布新的 V2 Reasoning.Started/Ended。

## 3. 延迟结束

收到无 metadata 的 `reasoning-end` 时，只移除该 Provider ID 的 active 映射，不立刻给 pending part 写 end time。这样紧接着的新无签名 lifecycle 可以继续追加。

以下任一边界出现时必须先完成 pending reasoning：

- 新 reasoning start 不能满足第 2 节的合并条件；
- reasoning-end 携带 provider metadata；
- `tool-input-start`；
- `tool-call`；
- `text-start`；
- `step-finish`；
- 流正常结束、失败、取消或处理器 cleanup。

完成操作必须：

1. 写入 end time 并持久化 part；
2. 发布一个 V2 Reasoning.Ended，ID 为首次 start 的 canonical ID；
3. 删除所有指向该 part 的临时 Provider ID 映射；
4. 清空 pending 状态；
5. 保证重复调用幂等。

## 4. Metadata 边界

- start 或 end 上存在任何 provider metadata，都将该 part 视为有签名/不可合并块。
- 不解析 metadata 内部格式，也不尝试合并两个内容相同的签名。
- 带 metadata 的每个 lifecycle 必须产生独立 V1 part 和独立 V2 Started/Delta/Ended 事件。
- 如果 metadata 只在 end 到达，必须先附加到当前 part，再立即完成该 part。

## 5. V1/V2 一致性

对于三个相邻的无签名 fragment，文本分别为“我”“先”“分析”：

- V1 存储一个文本为“我先分析”的 reasoning part；
- V2 Started ID 列表只有第一个 ID；
- 三个 Delta 全部使用第一个 ID；
- V2 Ended ID 列表只有第一个 ID。

若之后有两个带不同签名的 fragment，则两者各自成为独立 part 和独立 V2 生命周期。最终示例应得到三个 part：合并后的无签名 part，加两个签名 part。

## 6. 失败、取消与重试

- 流在 pending reasoning 尚未遇到显式边界时失败或取消，cleanup 仍必须写 end time，不能遗留永不结束的 part。
- V2 failure fragment flush 前必须先完成 pending reasoning，保证事件顺序为 reasoning ended 后再发布失败终态。
- 每次新的 Provider 重试/处理循环开始时清空 `reasoningMap` 和 pending state，不能把上一次失败的 reasoning 合并到新 attempt。
- 清理状态不能丢失已经收到的 reasoning 文本或 provider metadata。

## 7. 非目标

- 不按文本相似度、时间间隔或 token 数猜测合并。
- 不跨 text、tool、step 或 retry 边界合并。
- 不合并带签名/metadata 的块。
- 不改变 Provider adapter 的原始事件；归并发生在 session processor 的标准化事件层。
- 不改变 reasoning 是否向用户展示的设置。

## 8. 验收标准

1. 相邻的多个无签名 start/delta/end lifecycle 合并为一个 part，文本顺序不变。
2. 合并后的 part 只有一个 start time 和一个最终 end time。
3. V2 只发一个 Started、多个 canonical-ID Delta 和一个 Ended。
4. text start、tool input、tool call、step finish 和流终止都会截断合并窗口。
5. start 带 metadata、end 才带 metadata以及连续不同签名三种情况都保持独立。
6. 失败/取消后 pending part 有 end time，事件顺序完整。
7. retry 之间不共享 pending part。
8. 原有普通单段 reasoning、summary 禁止 tool call、usage 和 assistant text 测试保持通过。

## 9. 1.17.9 实现锚点

- 状态与边界处理：`packages/opencode/src/session/processor.ts`
- 回归测试：`packages/opencode/test/session/processor-effect.test.ts` 中 `merges only adjacent unsigned token reasoning lifecycles`
