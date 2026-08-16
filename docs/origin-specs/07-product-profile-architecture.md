# BluedCode 产品 Profile 与跨版本演进架构

- 需求 ID：`ORIGIN-07`
- 类型：跨版本需求
- 状态：已确认，1.18.18 待实现
- 产品：`BluedCode`

## 版本实现矩阵

| OpenCode 基线 | 实现分支 | 完成提交 | 版本落地 spec |
| ------------- | -------- | -------- | ------------- |

只有目标版本完成源码迁移、构建收敛、Portable 运行验收和历史重整后，才能登记完成提交。

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

## 6. 构建职责

构建层继续负责：

- 图标、Wordmark、窗口图标、favicon 和派生资源；
- Windows x64 Portable、PE 元数据、版本和文件名；
- `dev` / `prod` 发行身份和 `release-manifest.json`；
- 缓存、隔离目录、Git 认证、ASAR/EXE/最终载荷审计；
- 静态多语言产品名的受控转换，直到上游提供更稳定的产品文案注入边界；
- 验证最终产物与源码 Profile 一致。

构建执行不得改写受跟踪源码、lockfile 或 `node_modules`。构建规则不得重新实现 Profile 已定义的运行时业务策略。

## 7. 企业安全边界

`ORIGIN-02` 的企业策略必须在最内层服务边界成立：

- Provider/Auth/config 写入在读取敏感请求体、持久化或网络之前拒绝；
- 分享、更新、公共目录和公共代理在发出网络请求前拒绝；
- UI 只负责展示管理员已配置的 Provider 和模型，并隐藏不适用入口；
- HTTP API、直接服务调用和旧客户端绕过 UI 时仍得到相同拒绝；
- 预期策略拒绝与意外错误使用不同诊断路径。

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

## 9. 可诊断性与追溯

每次构建必须能回答：使用了哪个源码提交、哪个产品 Profile、哪些模块参与构建、哪些静态转换发生、各阶段输入输出摘要以及失败发生在哪一阶段。

最低要求：

- source、server、main、preload、renderer、assets、package、portable、runtime 各阶段有稳定事件和耗时；
- source map 或等价符号信息可用于定位产品代码和上游代码；
- server 与 Electron 转换都进入统一 ledger；
- 根仓公共框架与子仓快照有完整文件清单和摘要，不只校验视觉资源；
- 意外错误保留 cause、stack 和阶段上下文；
- manifest 记录 Profile 摘要、框架摘要、版本适配器摘要和最终审计结果。

## 10. 测试与验收

每个目标版本至少完成：

1. 产品 Profile schema、不可变性、`dev` 派生和新品牌隔离测试。
2. 配置路径、Provider/Auth/config/share/update/models 业务边界单元测试。
3. UI、HTTP API、直接服务调用的一致性合同测试。
4. 构建保留转换、资源、server/Electron ledger 和 Profile 一致性测试。
5. Windows x64 Portable 构建、启动、模型配置读取、V1/V2 切换和禁用入口验收。
6. 构建前后 Git 内容不变、最终产物 exact、manifest 和诊断信息验收。
7. 对目标 OpenCode tag 的品牌兼容审计。

## 11. 非目标

- 不在运行时支持 OpenCode/BluedCode 一键切换。
- 不建设可由最终用户编辑的多品牌系统。
- 不通过 Profile 自动迁移旧品牌数据。
- 不把所有上游技术标识改名。
- 不取消版本适配器和最终产物审计。
- 不要求一次性修改所有多语言资源源码。
