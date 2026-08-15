# BluedCode 产品品牌需求

- 需求 ID：`ORIGIN-01`
- 类型：跨版本需求
- 状态：已确认
- 产品：`BluedCode`

## 版本实现矩阵

| OpenCode 基线 | 实现分支 | 完成提交 | 版本落地 spec |
| --- | --- | --- | --- |
| `v1.17.9` | `dev-foreachcode-1.17.9` | `3654f46519ad689faf9179d7c15b2fbc5326ed1e` | [`OpenCode 1.17.9 产品品牌落地设计`](https://github.com/Foreach-Coder/opencode/blob/d20dd4fa61c405736559eb4e217bfb0aea01e33a/docs/superpowers/specs/2026-08-15-01-product-branding-design.md) |

## 1. 需求背景

BluedCode 是基于 OpenCode 构建的独立产品。每次升级 OpenCode 时，都必须重新建立完整且一致的产品身份，避免只替换可见字符串而遗漏安装身份、数据目录、协议、发行物或视觉资源。

品牌信息必须有唯一、显式、可校验的构建输入。缺少品牌输入时不得生成可发布的 BluedCode 产物，也不得依赖散落在源码中的默认品牌值。

## 2. 产品身份合同

| 身份 | 稳定值 |
| --- | --- |
| 产品显示名 | `BluedCode` |
| 产品 slug | `bluedcode` |
| CLI 命令 | `bluedcode` |
| Deep Link scheme | `bluedcode://` |
| 全局数据子目录 | `bluedcode` |
| 数据库文件 | `bluedcode.db` |
| 日志文件 | `bluedcode.log` |
| Desktop app ID | `ai.bluedcode.desktop` |

`dev`、`beta` 和 `prod` channel 可以拥有独立的显示后缀、Desktop app ID 和产物身份，但不能改变 CLI、协议和全局产品 slug。不同 channel 必须能够并存，不能覆盖彼此的数据或安装结果。

## 3. 构建输入

一次构建必须显式提供并统一校验以下信息：

- 产品名称、slug、channel 和 Desktop app ID；
- 是否启用企业产品策略；
- 可选的产品发行号；
- App Icon、Wordmark 和 TUI 字标资源。

同一次构建的所有消费者必须使用同一份解析结果，不得各自声明品牌默认值或重复实现派生规则。未知字段、错误类型、无效身份、空值和不完整资源必须在编译或打包前失败。

本地开发、测试和正式发行都必须显式选择 BluedCode；不得因缺少参数而静默退回上游品牌或其他产品配置。

## 4. 展示与分发行为

- Desktop、Web、CLI、TUI、OAuth 页面和仍被部署的 Enterprise 页面必须使用 BluedCode 的可见品牌。
- 安装命令、帮助、错误提示、应用菜单、通知、窗口标题、协议注册、PWA/Desktop 元数据和发行物名称必须一致。
- 用户可执行的产品 CLI 只能是 `bluedcode`，不得额外创建其他产品的兼容别名。
- 产品发行物必须具有独立的包身份、应用身份和可追踪版本，不能覆盖其他发行。
- 浏览器持久化、Desktop store、主题、语言、workspace 和草稿等产品级 key 必须与其他产品隔离。

## 5. 数据隔离

- XDG data、config、cache、state 和临时目录必须使用 BluedCode 身份。
- 数据库、日志、Desktop user-data、updater 状态、debug 包和 WSL sidecar 路径不得与其他产品共用。
- 首次启动不得探测、迁移、复制或删除其他产品的全局数据。
- channel 需要独立运行时，必须使用不会互相覆盖的应用和数据身份。

## 6. 发行版本

产品版本由上游三段语义版本和 BluedCode 发行号组成：

```text
<base-version>-<release>
```

- 显式发行号格式为真实日期加 `01..99` 序号：`YYMMDD-NN`。
- 未显式提供时，可由构建日期和 Git 短提交号生成可追踪发行号。
- 同一次构建的 CLI、Desktop、错误诊断和平台产物必须报告同一组合版本。
- 平台专用的版本元数据必须在签名或发布前完成，并保留平台要求的其他资源。

## 7. 隔离和可重复构建

- 构建只能在独立暂存区物化品牌化 manifest、模板、资源和产物。
- 构建前已有的源码改动必须原样保留；构建自身不得新增、删除或修改源码树内容。
- 清理操作只能作用于本次构建的精确暂存目录，不能递归清理仓库根目录或其他发行目录。
- 需要外部目录快照的构建步骤必须使用可信本地输入；缺失时失败，不得静默访问公共服务。
- 发布构建不得继承 Sentry、认证 token 或其他与 BluedCode 发行无关的发布凭据。

## 8. 视觉资源合同

根仓 `xcode/build/bluedcode/` 保存 BluedCode 的规范视觉资源。各 OpenCode 版本可以采用不同的注入技术，但必须满足以下合同。

### 8.1 SVG

- Wordmark 和 App Icon 必须具有有效、正尺寸的 `viewBox`。
- 禁止脚本、事件处理器、`foreignObject`、嵌入对象、多媒体、动画、DOCTYPE、ENTITY、`@import` 和外部 URL。
- 引用通常只能指向同一 SVG 内部的 `#id`。
- App Icon 必须是正方形，并具有 `BluedCode application icon` 标题。

### 8.2 App Icon PNG

- App Icon SVG 最多引用一个同目录的 PNG 简单文件名。
- PNG 必须存在、签名有效且宽高相等。
- 构建产物必须把 PNG 内嵌为 data URI，不保留外部文件引用。

### 8.3 TUI 点阵

- 点阵必须声明 `width`、`height` 和 `cells`。
- 宽度范围为 `1..80`，高度范围为 `1..16`。
- 行列数量必须匹配，单元只能表示开或关，规范化后为 `0/1`。

### 8.4 稳定摘要

视觉摘要必须由规范化资源内容决定，不得包含源文件绝对路径。相同资源在不同目录中构建应得到相同摘要。

## 9. 必须保留的上游协议

以下兼容身份不得随产品品牌重命名：

- `.opencode`、`opencode.json`、`opencode.jsonc`；
- `OPENCODE_*`、`x-opencode-*`；
- `opencode` provider ID；
- `@opencode-ai/*`、已发布 API 类型、SDK 方法和内部协议字段；
- OpenCode Zen、OpenCode Go、官方文档和官方服务 URL。

## 10. 非目标

- 不重命名上游源码目录、workspace 包或内部类型。
- 不兼容、迁移或维护 BluedCode 之外的品牌 preset。
- 不在本规格中定义 Provider、分享、遥测和更新策略；这些由 `ORIGIN-02` 负责。

## 11. 验收标准

1. 缺少品牌输入、身份无效或资源不完整时，在编译和打包前失败。
2. 所有用户可见界面、安装入口和产物统一显示 BluedCode，且不出现其他产品品牌。
3. CLI、协议、目录、数据库、日志、Desktop app ID 和持久化 key 符合产品身份合同。
4. 多 channel 与其他产品能够并存，不覆盖安装、数据或发行物。
5. 构建完成后源码树与构建前一致，原有工作区改动不丢失。
6. 同一构建的所有产物报告相同组合版本。
7. 视觉资源通过安全校验，PNG 被内嵌，摘要不受绝对路径影响。
8. 上游兼容协议和官方服务身份保持不变。
