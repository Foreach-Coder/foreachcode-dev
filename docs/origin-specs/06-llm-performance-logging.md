# LLM 隐私安全性能日志需求

- 需求 ID：`ORIGIN-06`
- 类型：跨版本需求
- 状态：已确认

## 版本实现矩阵

| OpenCode 基线 | 实现分支 | 完成提交 | 版本落地 spec |
| --- | --- | --- | --- |
| `v1.17.9` | `dev-foreachcode-1.17.9` | `7e98570f7058d9fd29d89a30a7e7c0742c7466c8` | [`OpenCode 1.17.9 LLM 性能日志落地设计`](https://github.com/Foreach-Coder/opencode/blob/d20dd4fa61c405736559eb4e217bfb0aea01e33a/docs/superpowers/specs/2026-08-15-06-llm-performance-logging-design.md) |
| `v1.18.18` | `dev-foreachcode-1.18.18` | `2f61909544301cbe2b13db80c8bbc2d83043d09d` | [`opencode/docs/superpowers/specs/2026-08-17-07-llm-performance-logging-design.md`](../../opencode/docs/superpowers/specs/2026-08-17-07-llm-performance-logging-design.md) |

## 1. 需求目标

为每一次 Provider 流式请求提供可关联的本地性能诊断，覆盖请求准备、重试、响应建立、首输出、生成吞吐和终止耗时，同时保证日志不保存提示词、模型输出、凭据或 Provider 异常内容。

该能力只定义本地诊断合同，不授权远程遥测。企业发行的出网限制由 `ORIGIN-02` 定义。

## 2. 稳定诊断合同

每个逻辑请求必须具有随机且唯一的 `llm.request_id`，并在全部重试和终态事件中保持不变。以下身份字段是跨版本稳定的最小合同：

- `llm.provider`、`llm.model`；
- `session.id`；
- `llm.agent`、`llm.mode`、`llm.small`。

性能日志使用 info 级结构化事件，消息以 `llm performance ` 开头。事件名和本节定义的 `llm.*` 字段是诊断接口；如需改名或改变语义，必须先更新本 origin spec。

## 3. 生命周期事件

| 事件 | 必须表达的信息 |
| --- | --- |
| `start` | 消息数、工具数、system/messages 字节数、重试上限、准备耗时 |
| `attempt` | 从 1 开始的 Provider 尝试序号 |
| `response` | attempt 序号、响应建立耗时、请求体字节数；运行时无法观察时可以省略 |
| `attempt error` | attempt 序号、该次尝试耗时和安全错误分类；可继续重试 |
| `first output` | 总 TTFT、当前 attempt TTFT、响应后 TTFT、attempt/retry 计数；每个逻辑请求最多一次 |
| `finish` | 总耗时、生成耗时、attempt/retry 计数、token 使用、输出吞吐和 finish reason |
| `error` | 总耗时、attempt/retry 计数和安全错误分类 |
| `interrupted` | 总耗时、attempt/retry 计数和 `llm.interrupted=true` |

首输出包括文本增量、reasoning 增量、工具输入增量或工具调用。一个逻辑请求只能产生一个终态；终态之后的重复结束信号不得产生日志。

## 4. 指标语义

- 所有耗时为非负整数毫秒；时钟回拨时最小为 0。
- retry 不重置逻辑请求开始时间，但每次重置 attempt 和 response 计时。
- 首输出时间跨 retry 保持第一次有效输出，不被后续事件覆盖。
- `llm.retry_count = max(0, llm.attempt_count - 1)`。
- 输出吞吐为 output tokens 除以首输出至结束的秒数，并保留两位小数。
- 无法可靠观察或计算的字段必须省略，不能伪造为 0。
- 字节数只记录序列化后的 UTF-8 长度，不记录被测内容。

## 5. 安全错误分类

错误日志只允许记录：

- `llm.error_name`；
- `llm.http_status`；
- `llm.retryable`；
- `llm.interrupted`。

可以从安全的嵌套错误结构中提取这些值，但禁止记录 error message、stack、response body、headers、URL、cause 对象或原始 error。`AbortError` 归类为 interrupted，但仍遵守同一白名单。

## 6. 内容隐私

任何 `llm performance *` 事件都不得包含：

- system prompt；
- 用户或助手消息；
- reasoning 或模型输出；
- 工具名称、description、schema、input 或 output；
- API key、authorization header、cookie；
- 请求或响应 body；
- Provider 异常 message 和 stack。

允许记录身份字段、计数、字节数、token 数、耗时、finish reason 和安全错误分类。新增字段必须先证明不会包含用户内容或凭据，并加入隐私回归验证。

## 7. 运行约束

- 性能观察不得改变流事件顺序、重试策略、取消语义或 Provider 请求参数。
- 正常结束、错误和资源提前关闭都必须得到互斥且幂等的终态。
- 日志写入失败不得将被保护内容作为调试 fallback 输出。
- 不同 Provider runtime 可以采用不同接入方式，但必须输出相同的诊断语义。

## 8. 验收标准

1. 给定已知时间序列，准备、响应建立、TTFT、生成、总耗时和吞吐计算准确。
2. 多次 attempt 正确累计重试，单次 attempt 失败不会提前终止仍可重试的逻辑请求。
3. 文本、reasoning、工具输入和工具调用都能成为首输出，但总共只记录一次。
4. 正常、错误和提前关闭分别只产生一个终态。
5. AbortError 被标记为 interrupted，且异常消息不进入日志。
6. 将唯一 secret 放入 system、messages、工具、请求体、输出和异常后，全部性能事件均搜索不到 secret。
7. 所有受支持 runtime 都满足相同事件和字段语义，且原始流行为不变。
