# BluedCode Windows Desktop 品牌构建需求

- 需求 ID：`ORIGIN-01`
- 类型：跨版本需求
- 状态：已实现，1.18.18 当前线性历史完成
- 产品：`BluedCode`
- 依赖：`ORIGIN-07`

## 版本实现矩阵

| OpenCode 基线 | 实现分支 | 完成提交 | 版本落地 spec | 验收口径 |
| ------------- | -------- | -------- | ------------- | -------- |
| `v1.18.18` | `dev-foreachcode-1.18.18` | `36899027b6694e5975dda6be9fa0b359b101355e` | `opencode/docs/superpowers/specs/2026-08-15-01-product-branding-design.md`；`opencode/docs/superpowers/specs/2026-08-16-03-product-profile-architecture-design.md` | Product Profile 源码身份、子仓独立构建、dev/prod Windows x64 Portable、真实 EXE 启动验收 |

当前行记录的是 2026-08-17 线性实现历史的完成落点；若后续执行历史重整并重新验收，应以重整后的最终提交替换该行。

原 1.18.18 构建期派生实现提交 `8799a4188f1c9aace35ba342bdf409906b626791` 保留为历史参考，但它不满足 `ORIGIN-07` 确立的混合架构合同，因此不再登记为当前规格的完成实现。

混合架构提交 `4b777025b908cd81a4b98c0457b2360059ea3b92` 是 2026-08-17 收敛修订前的 1.18.18 实现基线；它尚未满足根仓无构建代码、通用 VersionAdapter registry、品牌改名单入口和最终 Portable 真实启动门禁，因此不登记为当前合同的完成实现。

## 1. 需求背景

BluedCode 是基于 OpenCode 构建的独立 Windows Desktop 产品。产品需要在持续吸收 OpenCode 新版本的同时保持稳定的应用身份、视觉品牌、数据边界和发行身份，并把每次升级需要处理的差异限制在可审计的版本适配层。

BluedCode 产品分支允许提交少量、明确、可测试的产品源码改动；运行时身份、数据路径和产品能力必须由静态产品 Profile 驱动。构建系统必须把已提交源码视为只读输入，只负责视觉资源、静态多语言产品文案、发行元数据、打包和最终审计，并在隔离目录生成产物。

## 2. 产品范围

本需求只覆盖：

- Windows Desktop；
- Windows `x64`；
- 单文件免安装 Portable EXE；
- Desktop 主进程、preload、renderer 和运行所必需的内嵌 server/runtime。

以下能力不属于 BluedCode 产品入口：

- 独立 CLI、CLI 安装入口和后台 CLI；
- WSL CLI 安装与管理入口；
- 独立 Web 产品入口；
- TUI 产品入口；
- SDK、Enterprise、macOS、Linux、Windows ARM64；
- NSIS、MSI、ZIP、Microsoft Store 等其他分发格式。

上游源码可以继续包含这些能力，但 BluedCode Desktop 构建不得把对应用户入口暴露或打包成独立产品。

## 3. 产品身份合同

| 身份             | `prod`                           | `dev`                                |
| ---------------- | -------------------------------- | ------------------------------------ |
| 产品显示名       | `BluedCode`                      | `BluedCode Dev`                      |
| 产品 slug        | `bluedcode`                      | `bluedcode`                          |
| Desktop app ID   | `ai.bluedcode.desktop`           | `ai.bluedcode.desktop.dev`           |
| Deep Link scheme | `bluedcode://`                   | `bluedcode-dev://`                   |
| 用户数据目录     | `%APPDATA%\ai.bluedcode.desktop` | `%APPDATA%\ai.bluedcode.desktop.dev` |

两个 channel 必须能够同时存在，不得覆盖彼此的应用身份、协议注册、用户数据、日志、设置、缓存或窗口状态。

Portable EXE 被移动到新路径后，应用必须在下次启动时刷新对应 Deep Link 的 Windows 注册路径。

## 4. 品牌边界

窗口标题、菜单、通知、登录引导、错误提示、Portable EXE、Windows 文件属性、图标、Wordmark、favicon 和 Desktop 多语言文本中的产品身份必须统一为 BluedCode。

以下上游兼容身份不得因产品品牌而重命名：

- `.opencode`、`opencode.json`、`opencode.jsonc`；
- `OPENCODE_*`、`x-opencode-*`；
- `opencode` provider ID；
- `@opencode-ai/*`、API 字段、SDK 方法和内部模块名；
- OpenCode Zen、OpenCode Go 等上游服务专有名称；
- Desktop 内嵌 server/runtime 之间使用的上游内部协议。

BluedCode 对外构建入口使用自己的配置和参数；构建框架负责在边界处把参数映射为上游内部所需的 `OPENCODE_*`。最终产物内部允许保留经过分类和批准的技术标识，但不得在代表 Desktop 产品身份的用户界面中显示 OpenCode。

## 5. 产品源码与构建边界

本需求遵守 `ORIGIN-07`。产品源码可以修改，但必须是版本控制内可审查、可测试的 BluedCode 产品行为；构建执行本身必须满足以下不变量：

- 不在构建过程中新增、修改或删除受跟踪源码；
- 不在构建前临时改写源码再恢复；
- 不修改 `node_modules`；
- 不对仓库、ASAR、JavaScript bundle 或 EXE 执行无约束的全局字符串替换；
- 只允许对静态品牌文案和打包装配使用已声明、可审计的编译期转换；
- 生成内容、缓存和产物只能写入精确的隔离目录；
- 构建前后必须证明 Git 跟踪内容一致。

app ID、Deep Link、数据目录、产品能力和其他运行时语义不得依赖构建期 AST 改写。它们必须在产品源码边界中实现并由测试直接覆盖。若构建仍需改变运行时业务语义，必须停止并重新评审职责归属。

## 6. 构建框架与版本适配

构建能力分为两层：

1. 通用构建框架负责配置解析、输入校验、语义转换、匹配计数、资源处理、缓存、产物扫描和审计报告。
2. 版本适配器负责目标 tag 的基线指纹、源码映射、替换规则、保留白名单和少量结构性转换钩子。

常见转换必须由声明式配置表达；只有删除入口或调整结构等无法由通用规则安全描述的变化，才能使用版本专用 AST 钩子。不得为了单个版本向通用框架堆叠路径判断和特殊分支。

每个 OpenCode tag 必须拥有经过验证的精确适配配置。不得未经审计直接声明对整个小版本范围兼容。

### 6.1 根仓与子仓

根仓 `xcode/build/bluedcode/` 只维护品牌源资源及其摘要，不保存任何可执行构建代码。根仓中的图标、Wordmark 和品牌视觉配置同步到子仓时必须逐文件校验；根仓不再作为通用构建框架的代码维护源。

子仓 `opencode/xcode/build/bluedcode/` 是通用构建框架、版本适配器、测试和可独立构建品牌资源的唯一代码实现位置。子仓脱离父级根仓后仍必须能够安装依赖、执行构建和完成验收，不得使用指向父级根仓的路径或符号链接。

历史版本分支冻结当时验证过的子仓构建框架和版本适配器，不要求自动跟随其他版本分支的后续变化。

### 6.2 小版本升级

从一个已完成的 BluedCode 版本升级到新的 OpenCode tag 时，应从上一 BluedCode 版本分支创建新分支，再合入新的上游 tag，并执行兼容审计。

兼容审计必须：

- 对比两个 tag 中品牌规则涉及的文件和构建入口；
- 在新版本上 dry-run 全部规则；
- 报告可直接复用、需要更新和新增未分类的品牌引用；
- 为新 tag 保存独立的精确适配配置；
- 重新完成 Windows Portable 构建与运行验收。

Git 合并成功不能作为品牌兼容的证明。

## 7. 防错与防漏

版本适配器中的每条规则必须记录：

- 稳定规则 ID；
- 精确目标文件与语义位置；
- 预期原始值和目标值；
- 预期匹配次数；
- 转换原因及是否属于用户可见产品身份。

构建必须默认失败：

- tag、关键语义指纹或输入资源不匹配时失败；
- 任一规则零命中或超出预期次数时失败；
- 出现未分类的产品身份引用时失败；
- 保留白名单之外的用户可见 OpenCode 残留时失败；
- 版本专用规则命中非声明文件时失败。

每次构建必须生成转换审计报告，列出规则、目标、语义块、命中节点数和转换结果。一个完整 AST 字符串或同一文件中的一组同类产品文案应作为一个语义转换合同；不得把同一段文案中的多个关键词拆成互相独立的脆弱规则，也不得对整棵源码执行无边界字符串替换。测试必须主动改变、删除和复制目标节点，证明规则失配时构建确实失败。

## 8. 视觉资源

规范资源包括 App Icon、App Icon PNG、Wordmark 和现有资源清单。根仓资源必须复制到子仓并逐文件校验。

- Windows `.ico` 和 renderer favicon 由规范 App Icon 在构建时生成；
- Desktop Logo、Wordmark、窗口图标和 Portable EXE 图标必须使用 BluedCode 资源；
- 派生资源只能进入隔离构建目录；
- `tui.json` 可以保留在规范资源快照中，但 Desktop 构建必须明确排除，不得进入缓存、renderer 或 Portable 产物。

SVG 和 PNG 必须通过尺寸、格式、外部引用和危险内容校验；相同资源在不同绝对路径中必须得到相同规范摘要。

## 9. 数据隔离

BluedCode 不得探测、读取、迁移、复制、修改或删除 OpenCode Desktop 的全局用户数据。首次启动必须视为全新 BluedCode 安装。

数据库、日志、Crashpad、窗口状态、设置、缓存、会话数据、debug 包和内嵌 server 状态必须落入当前 channel 的 BluedCode 用户数据边界。`dev` 和 `prod` 同样不得互相读取或迁移。

## 10. 版本与发行

正式版本格式为：

```text
<OpenCode版本>-<YYMMDD>-<NN>-<10位子仓commitid>
```

例如：

```text
1.2.3-260815-01-acde123456
```

- `commitid` 必须由干净的 `opencode` 子仓 HEAD 自动读取，不能手工传入；
- `prod` 的日期与当日序号必须显式提供；
- 同一天的 `NN` 从 `01` 开始，在所有 OpenCode 版本之间全局递增；
- `dev` 使用 `<OpenCode版本>-dev-<10位commitid>`，不占用正式发行序号；
- Windows 展示版本、文件名和诊断信息必须报告同一个产品版本；
- Windows PE 所需的数字版本由构建逻辑单独映射，不能替代产品展示版本。

正式发行序号以 `opencode` 子仓的 annotated Git tag 为权威账本，tag 格式为：

```text
bluedcode-v<OpenCode版本>-<YYMMDD>-<NN>
```

正式构建必须拒绝重复、回退或跳号。验收通过后才能创建 tag。发布说明、tag 注释和 release 文本必须使用中文。

每个产物必须伴随 `release-manifest.json`，记录完整版本、完整 commit ID、tag、channel、输入摘要、规则摘要和 Portable EXE 的 SHA-256。

## 11. 分发与安全

- 只生成 Windows x64 单文件免安装 Portable EXE；
- 用户数据仍保存在 AppData，不随 EXE 放置；
- 不生成安装器、压缩包或商店包；
- `dev` 和 `prod` 均禁用自动更新与自动发布；
- 不继承上游 OpenCode 的发布仓库、Sentry、签名脚本、证书或凭据；
- 当前产物不签名，发布时必须明确说明 Windows SmartScreen 可能显示未知发布者。

## 12. 构建性能与缓存

构建直接复用子仓已有的 `node_modules`，不得把依赖复制到派生源码树。首次或锁文件变化时使用冻结锁文件安装；后续构建复用依赖、Electron 下载和 Electron Builder 工具缓存。

转换、内嵌 server、main、preload、renderer、视觉资源和打包阶段必须采用分阶段内容寻址缓存。缓存键至少包含：

- OpenCode commit；
- lockfile 与运行时工具版本；
- Windows x64 平台；
- 通用框架、版本适配器和品牌资源摘要；
- channel。

相同输入的第二次构建必须报告缓存命中。缓存命中不能跳过输入校验、审计报告或最终产物验收；正式签名若未来启用，签名结果不得作为可跨发行复用的构建缓存。

## 13. 验收标准

1. 产品源码改动均为已提交、可审查的 BluedCode 改动，且构建前后受跟踪源码不发生变化。
2. 子仓脱离父级根仓后可以独立完成依赖安装、构建和验收。
3. 只生成命名正确的 Windows x64 Portable EXE 和 manifest。
4. EXE 文件属性、图标、窗口、菜单、通知、引导和多语言产品身份均为 BluedCode。
5. `dev` 与 `prod` 的 app ID、AppData、协议和运行状态互相隔离。
6. Portable EXE 移动后再次启动能够刷新 Deep Link 注册路径。
7. 不存在 CLI、后台 CLI、WSL CLI、独立 Web 或 TUI 用户入口。
8. 更新器、发布器、Sentry 和上游签名逻辑均未启用。
9. 全新用户目录启动成功，且不会读取或修改 OpenCode 数据。
10. 必须保留的上游协议和服务身份继续工作。
11. 规则失配、未知品牌引用、无效资源、重复发行号和非干净正式构建都会在打包前失败。
12. 重复构建能够复用缓存，且不会因缓存跳过品牌审计。

## 14. 非目标

- 不提供一个运行时可切换 OpenCode/BluedCode 的通用多品牌产品；
- 不保证最终二进制中完全不存在 `OpenCode/opencode` 技术字符串；
- 不迁移 OpenCode 或其他 channel 的用户数据；
- 不实现自动更新、发布上传、代码签名或安装器；
- 不为 CLI、Web、TUI、SDK、Enterprise、macOS、Linux 或 Windows ARM64 提供 BluedCode 品牌入口。
