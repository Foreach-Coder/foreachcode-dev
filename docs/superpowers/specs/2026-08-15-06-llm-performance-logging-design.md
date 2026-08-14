# LLM 隐私安全性能日志规格

- 状态：逆向确认
- 迁移顺序：`06`
- 基线版本：OpenCode `1.17.9`
- 最后整理：2026-08-15

## 1. 目标

为每一次 Provider 流式请求记录准备、重试、响应头、首输出、生成吞吐和终止耗时，同时保证日志不保存 system prompt、用户消息、工具定义、请求正文、模型输出或异常消息。

该能力用于本地性能诊断，不负责远程遥测传输。企业构建的 exporter 边界见 [`2026-08-15-02-enterprise-product-policy-design.md`](2026-08-15-02-enterprise-product-policy-design.md)。

## 2. 跟踪实例

每次进入 LLM stream 调用时创建独立 tracker，并生成随机 `requestID`。tracker 的不可变基础字段为：

| 字段 | 含义 |
| --- | --- |
| `llm.request_id` | 单次逻辑请求 UUID，用于关联重试事件 |
| `llm.provider` | Provider ID |
| `llm.model` | Model ID |
| `session.id` | Session ID |
| `llm.agent` | Agent 名称 |
| `llm.mode` | Agent mode |
| `llm.small` | 是否为 small-model 请求 |

所有事件使用 info 级结构化日志，message 固定以 `llm performance ` 开头。

## 3. 生命周期事件

### 3.1 `start`

在完成请求准备、即将选择 runtime/发起 Provider 请求时记录：

- `llm.message_count`：prepared messages 数组长度，非数组为 0；
- `llm.tool_count`：prepared tools 的顶层键数量；
- `llm.system_bytes`：system 数组 JSON UTF-8 字节数；
- `llm.message_bytes`：messages JSON UTF-8 字节数；
- `llm.retry_limit`：允许的重试次数；
- `llm.preparation_ms`：进入 LLM run 到准备完成的耗时。

字节统计只输出数字，序列化失败时省略该字段。

### 3.2 `attempt`

每一次实际 Provider 尝试开始时记录：

- `llm.attempt`：从 1 开始递增的尝试序号。

Native runtime 至少记录 attempt；AI SDK runtime 的 middleware 必须对每次重试分别记录 attempt。

### 3.3 `response`

Provider 建立响应并返回流元数据后记录：

- `llm.attempt`；
- `llm.response_headers_ms`：本次 attempt 开始到收到 response 的耗时；
- `llm.request_bytes`：实际请求 body 的 UTF-8 字节数；若 runtime 不暴露 body，则使用最终 params 估算；不能记录 body 本身。

不提供响应头阶段的 runtime 可以省略该事件，不得伪造时间。

### 3.4 `attempt error`

某次尝试在建立可消费响应前失败时记录：

- `llm.attempt`；
- `llm.attempt_ms`；
- 第 5 节定义的错误分类字段。

若 retry policy 继续执行，随后产生新的 attempt，逻辑请求不因此终止。

### 3.5 `first output`

逻辑请求首次观察到以下任一事件时只记录一次：

- `text-delta`；
- `reasoning-delta`；
- `tool-input-delta`；
- `tool-call`。

字段为：

- `llm.ttft_ms`：逻辑请求开始到首输出；
- `llm.provider_ttft_ms`：当前 attempt 开始到首输出；
- `llm.first_output_after_headers_ms`：收到 response 到首输出；
- `llm.attempt_count`；
- `llm.retry_count = max(0, attempt_count - 1)`。

没有对应时间点时省略 provider/header 分段字段。

### 3.6 `finish`

观察到正常 `finish` 事件时记录一次并关闭 tracker：

- `llm.total_ms`：逻辑请求总耗时；
- `llm.generation_ms`：首输出到 finish 的耗时；
- attempt/retry count；
- input、output、reasoning、cache read、cache write token 数；
- `llm.output_tokens_per_second`：`outputTokens / generationSeconds`，四舍五入到两位小数；
- `llm.finish_reason`。

若没有首输出或 token 数据，相关字段省略。

### 3.7 `error` 与 `interrupted`

- 流以错误终止时记录 `error`，包含 total time、attempt/retry count 和错误分类。
- 流在没有 `finish` 或错误的情况下关闭时记录 `interrupted`，并设置 `llm.interrupted=true`。
- `AbortError` 归类为 interrupted，但仍遵守错误字段白名单。
- tracker 一旦终止，后续 finish/fail/end 调用不再产生日志，确保一个请求只有一个终态。

## 4. 时间规则

- 时间源默认使用 `Date.now()`；测试必须可注入单调的替代时间源和初始时间。
- 所有耗时取非负整数毫秒并四舍五入；时钟回拨时最小为 0。
- retry 不重置逻辑请求开始时间，但每次重置 attempt start 和 response time。
- 首输出时间只由第一个有效输出事件设置，跨 retry 不重置。

## 5. 错误字段白名单

错误日志只允许：

| 字段 | 来源 |
| --- | --- |
| `llm.error_name` | Error name、嵌套 cause/error 的 name 或安全的构造器名 |
| `llm.http_status` | `statusCode`、`status` 或嵌套错误中的数值状态 |
| `llm.retryable` | 顶层或嵌套错误中的布尔值 |
| `llm.interrupted` | error name 是否为 `AbortError` |

禁止记录 error message、stack、response body、headers、URL、cause 对象或原始 error。

## 6. 内容隐私

任何 `llm performance *` 日志都不得包含：

- system prompt 文本；
- 用户/助手消息内容；
- reasoning 或模型文本；
- tool 名称、description、schema、input 或 output；
- API key、authorization header、cookie；
- 请求/响应 body；
- Provider 异常 message 和 stack。

允许记录第 2 节身份字段、计数、字节数、token 数、耗时、finish reason 和错误分类。新增字段必须先证明不包含用户或凭据内容，并加入隐私回归测试。

## 7. 集成要求

- Native 与 AI SDK runtime 最终都转换为同一种 LLM event stream，并在该标准化流外层进行 observe。
- AI SDK retry middleware 在最接近实际 `doStream` 的位置记录 attempt/response/attempt error。
- 正常事件、流错误和资源 finalizer 分别调用 observe、fail 和 end，终态幂等由 tracker 保证。
- 性能 tracker 不得改变流事件顺序、重试策略、取消语义或 Provider 请求参数。
- 日志写入失败不得把提示词内容作为调试 fallback 输出。

## 8. 验收标准

1. 已知时间序列下，preparation、headers、TTFT、generation、total 和 tokens/s 计算准确。
2. 两次 attempt 产生 `attempt_count=2`、`retry_count=1`，首次失败不提前结束 tracker。
3. text、reasoning、tool input 和 tool call 均可成为首输出，但总共只记录一次。
4. 正常 finish、error 和无终态关闭分别只产生一个终态事件。
5. AbortError 设置 interrupted，日志不包含其 message。
6. 将唯一 secret 分别放入 system、messages、tool name/description、request body、output delta 和异常 message 后，序列化全部性能事件均搜索不到 secret。
7. Native 与 AI SDK 集成测试都能得到 start/attempt/终态，且原流事件保持不变。

## 9. 1.17.9 实现锚点

- 状态机：`packages/opencode/src/session/llm/performance.ts`
- 流集成：`packages/opencode/src/session/llm.ts`
- 合同测试：`packages/opencode/test/session/llm-performance.test.ts`
