# BluedCode 企业产品策略规格

- 状态：逆向确认
- 迁移顺序：`02`
- 基线版本：OpenCode `1.17.9`
- 启用条件：构建清单 `enterprise: true`
- 最后整理：2026-08-15

## 1. 目标

BluedCode 的企业构建必须默认拒绝由产品自身发起的公共服务连接，并把模型 Provider 的建立权收口到管理员维护的配置文件。限制必须在服务边界生效，隐藏 UI 只能作为辅助，不能成为唯一防线。

## 2. 非目标

- 不禁止管理员在 `opencode.json(c)` 中显式配置企业批准的 Provider。
- 不阻止用户已经明确配置的 Provider API、MCP server、LSP、工具请求或其他业务连接。
- 不定义企业内部更新、分享、遥测或凭据分发服务；在这些服务接入前保持关闭。
- 不删除上游实现，以便未来通过新的策略合同接入内部服务。
- 不把 `enterprise` 改造成运行时可切换设置；它是构建态不可变策略。

## 3. 策略输入

产品清单必须显式提供布尔字段 `enterprise`。BluedCode 的值为 `true`。缺失、字符串化布尔值或其他类型必须使品牌解析失败。

编译期品牌对象是所有进程的唯一策略来源。Web、Electron、CLI、ACP、server 和 core 服务不能各自通过环境变量推断企业模式。

## 4. Provider 管控

### 4.1 唯一允许的 Provider 来源

企业构建只加载 `opencode.json(c)` 合并结果中 `provider` 字段显式声明的 Provider。声明可包含模型、base URL、API key 或其他 Provider options，由管理员负责安全分发配置文件。

以下来源必须被忽略：

- Provider 对应的环境变量，例如 `ANTHROPIC_API_KEY`；
- 全局凭据文件和 `OPENCODE_AUTH_CONTENT`；
- well-known authentication token；
- OpenCode account/organization 自动注入；
- Provider 插件的 OAuth/API-key auth hook；
- 未在 `config.provider` 中出现的内建或自定义 Provider。

`enabled_providers` 和 `disabled_providers` 仍可在静态配置加载阶段进一步约束显式 Provider，但不能使未显式声明的 Provider 出现。

### 4.2 凭据写入与认证

- Auth service 的凭据写入必须返回明确失败，且不能修改已有凭据文件。
- Provider auth methods 在企业构建中返回空集合。
- OAuth authorize/callback 服务返回稳定的 `ProviderAuthConnectionsDisabled` 类型错误。
- ACP capabilities 中的 `authMethods` 必须为空。
- CLI 不注册 `providers login` 命令；即使通过旧入口直接调用 handler，也必须失败。
- `providers list` 可以显示当前可见结果，但不能枚举环境变量提示。
- logout/凭据删除能力可以保留，用于清理历史数据；保留不代表这些凭据可被 Provider 加载。

### 4.3 HTTP 配置边界

实例级和全局 config PATCH 在 payload 出现以下任一字段时返回 HTTP 400，且不得写文件或重启实例：

- `provider`
- `enabled_providers`
- `disabled_providers`

同一接口仍允许更新 `model`、`small_model` 等对管理员预配置 Provider 的选择项。Provider list API 在企业模式只返回实际加载的显式 Provider、其默认模型和 connected ID，不混入公共目录中的未配置 Provider。

### 4.4 UI

Desktop/Web 的以下入口必须不渲染：

- Provider settings tab 及内容；
- Connect Provider 命令；
- 模型选择器中的加号/连接按钮；
- custom provider 选择对话框；
- 无付费 Provider 时的“添加更多 Provider”引导；
- 首页 getting-started Provider 引导。

模型管理和模型选择仍然可用，只展示管理员配置后由 server 返回的模型。

## 5. 模型目录

- 企业运行时不得从公共 models API 下载或定时刷新模型目录。
- `refresh(true)` 也必须直接返回而不请求网络。
- CLI `models --refresh` 返回“由产品构建禁用”的错误。
- 已存在的可信本地 cache 或构建时 models snapshot 可以读取。
- 产品构建没有有效的离线 models snapshot 时必须在编译前失败，不能回退到公共网络。

## 6. 会话分享

BluedCode 企业构建完全禁用本地会话的发布式分享：

- share service 的 request/create 在服务边界失败；
- 即使 `enterprise.url` 指向内部地址也不发送 HTTP 请求；
- 不使用任何公共分享 fallback；
- Desktop、Web、CLI 和 TUI 不提供 share、unshare 和公开链接入口；
- 不允许自动分享。

从用户显式提供的外部分享 URL 导入公开数据属于入站操作，可以保留；导入流程不得附带本地会话、代码或凭据到该地址。

## 7. 遥测与诊断出网

- 企业构建不创建 OTLP log exporter 或 trace layer，即使进程继承了 `OTEL_EXPORTER_OTLP_ENDPOINT`、headers 和 resource attributes。
- 创建隔离 workspace/adapter 进程时不得转发上述 OTLP 环境变量。
- 产品构建必须清空 Sentry DSN 和发布凭据，不能继承打包机配置。
- 本地文件日志继续工作；[`2026-08-15-06-llm-performance-logging-design.md`](2026-08-15-06-llm-performance-logging-design.md) 的结构化性能信息只进入当前已配置的本地日志链路。

如果未来需要企业内部 OTLP 或 Sentry，必须另开规格，明确可信 endpoint、凭据来源、字段白名单和管理员开关后再恢复。

## 8. 更新及其他公共产品能力

- Desktop updater 功能开关固定关闭；启动、菜单和设置均不能触发检查、下载或安装。
- CLI/server 的 update source 返回当前版本作为 latest；upgrade 返回“内部更新源未配置”的失败。
- UI 不展示检查更新入口。
- 默认不注册公共 Console、上游 changelog、反馈和 GitHub Agent 入口。
- 未内嵌 Web UI 时不得代理到上游公共 Web 应用。
- 不删除 updater 和安装抽象，以便未来实现企业内部更新源。

## 9. Fail-closed 要求

策略缺失、服务地址缺失、旧入口被直接调用、UI 状态陈旧或客户端绕过隐藏控件时，都必须由最内层服务拒绝操作。拒绝 Provider 配置、分享、模型刷新或更新时不得先发网络请求，也不得写入部分状态。

## 10. 验收标准

1. 设置环境 Provider key 或注入凭据内容后，对应 Provider 不出现在企业构建的 Provider 列表中。
2. 仅在 `config.provider` 声明显式 Provider 时，该 Provider 以 `source: "config"` 加载并可用于模型选择。
3. Auth 写入、Provider OAuth、CLI login 和 Provider 配置 PATCH 全部失败且无持久化副作用。
4. Provider list、模型管理和 `model`/`small_model` 更新仍可用于管理员预配置模型。
5. models get/refresh 在无本地数据时返回空结果且不访问公共目录。
6. share request/create 即使配置内部 URL也失败，并能通过假 HTTP client 证明零请求。
7. 继承 OTLP 环境变量时 exporter 列表为空、trace layer 为空，workspace 子进程收不到变量。
8. Desktop 和 Web 中不存在第 4.4 节的连接入口。
9. 启动和用户操作不会调用 Desktop updater 后端；CLI upgrade 不执行外部安装命令。
10. `enterprise: false` 的合同测试证明非企业构建仍可使用上游 Provider 连接流程，避免把策略误写成不可逆全局删除。

## 11. 1.17.9 实现锚点

- 策略源：`packages/brand/src/config.ts`
- Provider/model：`packages/core/src/models-dev.ts`、`packages/opencode/src/provider/provider.ts`
- Auth/CLI/ACP：`packages/opencode/src/auth/index.ts`、`packages/opencode/src/provider/auth.ts`、`packages/opencode/src/cli/cmd/providers.ts`、`packages/opencode/src/acp/service.ts`
- HTTP 边界：`packages/opencode/src/server/routes/instance/httpapi/handlers/config.ts`、`global.ts`、`provider.ts`
- UI：`packages/app/src/components/dialog-*.tsx`、`packages/app/src/pages/layout.tsx`
- 分享：`packages/opencode/src/share/share-next.ts`
- 遥测：`packages/core/src/observability/otlp.ts`、`packages/opencode/src/control-plane/workspace.ts`
- 更新：`packages/desktop/src/features.ts`、`packages/desktop/src/main/updater.ts`、`packages/opencode/src/installation/index.ts`
- 主要合同测试：`packages/core/test/models.test.ts`、`packages/core/test/effect/observability.test.ts`、`packages/opencode/test/auth/auth.test.ts`、`provider/provider.test.ts`、`server/httpapi-*.test.ts`、`share/share-next.test.ts`
