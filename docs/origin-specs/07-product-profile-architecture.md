# BluedCode 产品 Profile 与跨版本演进架构

- 需求 ID：`ORIGIN-07`
- 类型：跨版本需求
- 状态：已实现，1.18.18 当前线性历史完成
- 产品：`BluedCode`

## 版本实现矩阵

| OpenCode 基线 | 实现分支 | 完成提交 | 版本落地 spec |
| ------------- | -------- | -------- | ------------- |
| `v1.18.18` | `dev-foreachcode-1.18.18` | `36899027b6694e5975dda6be9fa0b359b101355e` | `opencode/docs/superpowers/specs/2026-08-16-03-product-profile-architecture-design.md` |

当前行记录的是 2026-08-17 线性实现历史的完成落点。若后续执行历史重整并重新验收，应以重整后的最终提交替换该行。

`4b777025b908cd81a4b98c0457b2360059ea3b92` 是 2026-08-17 收敛修订前的 1.18.18 完整实现，保留为迁移基线；它尚未满足根服务收口、根仓无构建代码、通用 VersionAdapter registry 和最终 Portable 真实启动门禁，因此不再作为当前合同的完成矩阵记录。

## 1. 需求背景

BluedCode 是持续吸收 OpenCode 上游代码的独立产品，而不是一次性的换色打包。仅靠构建期派生源码实现品牌和企业策略，短期能减少合并冲突，但会把运行时业务语义隐藏在版本指纹、AST 钩子和产物扫描中，导致升级成本、故障定位和安全审计随版本持续增加。

产品需要一条可长期维护的混合路径：少量稳定、明确的产品差异进入源码；视觉资源、发行装配和最终审计继续留在构建层。上游升级时，通过正常 Git 合并处理少量产品边界冲突，而不是维护不断扩张的源码重写系统。

## 2. 单产品原则

- BluedCode 分支只构建 BluedCode，不要求同一源码树同时构建原始 OpenCode。
- 产品 Profile 是编译时静态、运行时不可变的产品事实，不接受环境变量、命令行、用户配置或远程响应覆盖。
- Profile 可以为测试提供显式测试夹具，但生产入口只能使用仓库内唯一批准的 Profile。
- 未来若更换品牌名，应定义新的完整 Profile，并视为新产品，而不是继续复用 BluedCode 身份。

## 3. 产品 Profile 合同

Profile 至少定义以下产品事实：

- 显示名称、目录名称和产品标识；
- Desktop app ID 和 Deep Link 协议；
- 配置、数据、缓存、日志、窗口状态和诊断目录身份；
- 支持的平台、架构和产品入口；
- Provider 管理、公开分享、遥测、更新和公共目录能力；
- 产品错误码及用户可见策略说明；
- 构建产物、版本、文件属性和 manifest 所需身份。
- 稳定的产品操作矩阵、配置变更策略、数据外发策略和 UI surface 策略。

BluedCode 的生产 Profile 必须至少表达：

```text
displayName = BluedCode
directoryName = bluedcode
appId = ai.bluedcode.desktop
protocol = bluedcode
desktop = true
cli = false
web = false
tui = false
updater = false
publicShare = false
telemetry = false
publicProviderCatalog = false
providerManagement = admin-static-only
```

`dev` 的显示名、app ID、协议和数据目录必须由同一 Profile 确定性派生，并与 `prod` 隔离。

Profile 必须是运行时授权、管理员集成读取、UI 注册、构建 manifest 和最终审计的共同事实源。不得在构建适配器中另行手写一份 EnterprisePolicy。建议使用稳定操作标识表达策略，例如本地偏好写入、外联集成写入、Provider 读取与管理、Auth 管理、MCP/插件管理、公开分享、公共目录、遥测、更新和公共代理。

## 4. 新品牌隔离合同

更换品牌名时，以下身份必须随新 Profile 一并改变：

- AppData、LocalAppData、配置、缓存、日志和窗口状态目录；
- Desktop app ID、进程身份和 Windows 文件属性；
- Deep Link 协议及其注册；
- 产品显示名、slug、图标、Wordmark 和发行文件名；
- manifest 中的产品身份和诊断边界。

新产品不得自动探测、读取、迁移、复制、修改或删除 BluedCode 数据。是否提供显式迁移工具属于独立需求，不能由品牌切换默认触发。

上游兼容文件名和协议字段可以保留。例如 BluedCode 的配置目录为 `.config/bluedcode`，其中继续识别 `config.json`、`opencode.json` 和 `opencode.jsonc`，以保持 OpenCode 配置格式兼容；这不等于复用 OpenCode 或其他品牌的数据目录。

## 5. 源码职责

下列行为必须由受版本控制的源码实现，并由源码级测试覆盖：

- 配置、数据、缓存和日志路径；
- app ID、Deep Link 与产品运行时身份；
- V1 默认布局及允许用户切换 V2；
- CLI、后台 CLI、WSL、Web、TUI 和 updater 的产品能力；
- Provider 信任、模型解析、Auth/API key 和配置写入边界；
- 分享服务和分享 API；
- 公共模型目录的离线策略；
- 遥测、公共链接、更新和 Web proxy 策略；
- 稳定错误码以及网络、写入、进程启动之前的 fail-closed 检查。

这些运行时行为不得以构建期 AST 替换作为主要实现，也不得只靠 UI 隐藏或最终 bundle 字符串扫描保证。

业务改动必须集中在天然根边界，禁止为同一能力在大量 handler、IPC、页面和按钮中重复散布产品判断：

- 所有用户配置写入经过一个配置变更策略，纯本地偏好显式允许，外联和敏感字段默认拒绝；
- Provider、model、MCP、插件和远程配置只通过管理员静态快照进入运行时注册表；
- Auth、分享、公共目录、遥测、更新和公共代理在各自服务根实现允许或禁用；
- 前端通过统一产品 UI 注册表注册页面和操作，具体控件不承担安全边界；
- HTTP、IPC 和直接服务调用复用相同的产品授权结果。

主题、语言、字体、快捷键、通知、V1/V2 布局和其他不会产生网络或信息外发的本地偏好必须继续支持图形化配置。新上游配置字段必须默认视为未分类，只有明确证明属于本地偏好后才能允许用户写入。

## 6. 构建职责

构建层继续负责：

- 图标、Wordmark、窗口图标、favicon 和派生资源；
- Windows x64 Portable、PE 元数据、版本和文件名；
- `dev` / `prod` 发行身份和 `release-manifest.json`；
- 缓存、隔离目录、Git 认证、ASAR/EXE/最终载荷审计；
- 静态多语言产品名的受控转换，直到上游提供更稳定的产品文案注入边界；
- 验证最终产物与源码 Profile 一致。

构建执行不得改写受跟踪源码、lockfile 或 `node_modules`。构建规则不得重新实现 Profile 已定义的运行时业务策略。

根仓不保存可执行构建代码。根仓只维护跨版本规格和品牌源资源；构建框架、版本适配器、测试与子仓可独立构建资源只存在于 `opencode` 子仓。根仓品牌资源同步到子仓时按摘要校验，但构建代码不做双仓快照。

同一文件中的同类静态品牌文案应按完整 AST 字符串或语义块转换并汇总记录，不应把一段文案中的多个关键词拆成多条独立规则。输出审计应区分必须为零的用户可达危险入口、允许保留的内部技术身份和一致性证据；不可达翻译或依赖残留不得依赖大规模脆弱的全局精确计数作为主要安全合同。

## 7. 企业安全边界

`ORIGIN-02` 的企业策略必须在最内层服务边界成立：

- Provider/Auth/config 写入在读取敏感请求体、持久化或网络之前拒绝；
- 分享、更新、公共目录和公共代理在发出网络请求前拒绝；
- UI 只负责展示管理员已配置的 Provider 和模型，并隐藏不适用入口；
- HTTP API、直接服务调用和旧客户端绕过 UI 时仍得到相同拒绝；
- 预期策略拒绝与意外错误使用不同诊断路径。
- Provider、model、MCP、插件和远程配置只能由管理员静态配置；项目配置、环境变量、GUI 和 API 不能增加或修改外联集成。
- 本地偏好继续允许图形化修改，但必须经过显式 allowlist；未知字段默认拒绝。

建议稳定错误码包括：

- `PRODUCT_CAPABILITY_DISABLED`
- `PROVIDER_MANAGED_BY_ADMIN`
- `CONFIG_WRITE_DISABLED`
- `PUBLIC_SHARE_DISABLED`
- `PUBLIC_UPDATE_DISABLED`

## 8. 上游合并与可维护性

- 产品源码改动应围绕稳定边界形成少量、聚焦的提交，避免散布无关品牌条件。
- 产品模块不得依赖某个 OpenCode 版本的源码路径；版本映射留在版本落地 spec。
- 上游升级优先使用普通 merge/rebase 解决源码冲突，并用产品合同测试确认语义，而不是自动扩大 AST 转换。
- 不得为了减少合并冲突把已经稳定的业务策略重新搬回构建钩子。
- 仅当能力能被多个版本复用时，才扩展通用构建框架；版本结构差异留在版本适配器。
- 公共执行流程通过 VersionAdapter registry 选择精确 adapter；`build`、server、Electron Vite、Builder 和审计不得直接 import 某一具体版本 adapter。
- 应提供只读 adapter-diff 和候选指纹生成工具，报告新旧 tag 的新增、删除、结构和摘要变化；工具不得自动接受差异。

## 9. 可诊断性与追溯

每次构建必须能回答：使用了哪个源码提交、哪个产品 Profile、哪些模块参与构建、哪些静态转换发生、各阶段输入输出摘要以及失败发生在哪一阶段。

最低要求：

- source、server、main、preload、renderer、assets、package、portable、runtime 各阶段有稳定事件和耗时；
- source map 或等价符号信息可用于定位产品代码和上游代码；
- server 与 Electron 转换都进入统一 ledger；
- 根仓品牌源资源与子仓资源有明确摘要；子仓构建框架、版本适配器和测试具有自身完整清单；
- 意外错误保留 cause、stack 和阶段上下文；
- manifest 记录 Profile 摘要、框架摘要、版本适配器摘要和最终审计结果。
- failure report 的阶段名必须与真实流水线一致，至少区分 assets、portable、portable-startup、server-health、preload、renderer、runtime 和 publish；诊断写入失败也必须留下安全的次级错误提示。

## 10. 测试与验收

每个目标版本至少完成：

1. 产品 Profile schema、不可变性、`dev` 派生和新品牌隔离测试。
2. 配置路径、Provider/Auth/config/share/update/models 业务边界单元测试。
3. UI、HTTP API、直接服务调用的一致性合同测试。
4. 构建保留转换、资源、server/Electron ledger 和 Profile 一致性测试。
5. Windows x64 Portable 构建、启动、模型配置读取、V1/V2 切换和禁用入口验收。
6. 构建前后 Git 内容不变、最终产物 exact、manifest 和诊断信息验收。
7. 对目标 OpenCode tag 的品牌兼容审计。

Portable 启动验收必须执行最终生成的 EXE，而不是只导入源码模块构造 fixture。验收使用隔离的用户目录和最小管理员配置，证明 Electron main、本地 server、preload、renderer 和管理员模型读取链路就绪，并在退出后确认没有残留进程。源码 fixture 可以作为快速测试保留，但不得替代发行产物启动门禁。

## 11. 非目标

- 不在运行时支持 OpenCode/BluedCode 一键切换。
- 不建设可由最终用户编辑的多品牌系统。
- 不通过 Profile 自动迁移旧品牌数据。
- 不把所有上游技术标识改名。
- 不取消版本适配器和最终产物审计。
- 不要求一次性修改所有多语言资源源码。
