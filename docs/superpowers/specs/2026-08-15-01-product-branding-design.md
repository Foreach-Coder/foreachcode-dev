# BluedCode 构建态产品品牌规格

- 状态：逆向确认
- 迁移顺序：`01`
- 基线版本：OpenCode `1.17.9`
- 目标产品：`BluedCode`
- 目标 slug：`bluedcode`
- 最后整理：2026-08-15

## 1. 背景

BluedCode 是基于 OpenCode 构建的独立产品。品牌不能依靠修改一批散落字符串完成，否则每次升级都容易遗漏安装身份、数据目录、协议、视觉资产或构建产物。本规格将原有固定改名和后续构建参数化合并为一个合同：源码不携带可运行的默认品牌，构建者必须显式选择 BluedCode 清单，并由同一份解析结果驱动所有消费者。

企业安全策略由 [`2026-08-15-02-enterprise-product-policy-design.md`](2026-08-15-02-enterprise-product-policy-design.md) 定义；本规格只负责把清单中的 `enterprise` 布尔值可靠注入各构建目标。

## 2. 目标

1. 通过一个显式 JSON 清单构建 BluedCode，不在源码中维护另一套产品默认值。
2. 在 Desktop、Web、CLI、TUI、OAuth 页面和发行物中统一展示 BluedCode。
3. 从一个已校验的机器身份派生 CLI、协议、目录、数据库、日志和 Desktop app ID。
4. 在隔离暂存目录中物化静态 manifest、模板和视觉资源，构建前后源码树逐字节保持不变。
5. 生成可并存、可追踪且不会覆盖其他发行的产物。
6. 保留上游兼容协议和官方服务的原始身份。

## 3. 非目标

- 不重命名源码目录、workspace 包、TypeScript 标识或 API 类型。
- 不修改项目级 `.opencode` 目录、`opencode.json(c)`、`OPENCODE_*` 环境变量或 `x-opencode-*` HTTP 头。
- 不重命名 `opencode` provider ID、OpenCode Zen、OpenCode Go 或 OpenCode 官方文档。
- 不迁移、读取、复制或删除旧产品的全局数据。
- 不提供旧 CLI 名称、旧协议或旧安装目录的兼容别名。
- 不在本规格中定义企业 Provider、分享、遥测和更新策略。
- 不记录或维护 BluedCode 之外的品牌 preset。

## 4. 唯一构建清单

标准构建入口必须接受一个清单路径：

```text
bun run product:build --brand-config xcode/build/bluedcode/brand.json
```

只准备暂存区而不编译时使用：

```text
bun run product:build --brand-config xcode/build/bluedcode/brand.json --prepare-only
```

本地开发也必须显式加载 BluedCode 清单：

```text
bun run script/product-dev.ts <bluedcode-config> -- <development-command>
```

开发入口不得在清单缺失时回退到源码默认品牌。需要不同 channel 时，应提供仍以 BluedCode 为名称和 slug、只改变 `channel` 的显式清单。

目标清单合同为：

```json
{
  "name": "BluedCode",
  "slug": "bluedcode",
  "channel": "prod",
  "desktopAppId": "ai.bluedcode.desktop",
  "enterprise": true,
  "appIconSvg": "app-icon.svg",
  "wordmarkSvg": "wordmark.svg",
  "tuiWordmarkGrid": "tui.json"
}
```

### 4.1 字段规则

| 字段 | 要求 |
| --- | --- |
| `name` | 必填；值为 `BluedCode`；不得有首尾空白、控制字符或 `<>&"'\\` 等标记分隔符 |
| `slug` | 目标值为 `bluedcode`；格式为 `^[a-z][a-z0-9-]{1,30}$` |
| `channel` | 必填；只能为 `dev`、`beta` 或 `prod` |
| `desktopAppId` | 目标基础值为 `ai.bluedcode.desktop`；必须是至少三段的反向域名格式 |
| `enterprise` | 必填布尔值；BluedCode 为 `true` |
| `release` | 可选；有值时必须为合法日期加 `01` 到 `99` 的序号：`YYMMDD-NN` |
| `appIconSvg` | 必填；相对路径以清单目录为基准 |
| `wordmarkSvg` | 必填；相对路径以清单目录为基准 |
| `tuiWordmarkGrid` | 必填；相对路径以清单目录为基准 |

清单必须拒绝未知字段、错误类型、空字符串和不完整的视觉资源集合。构建入口只接受 `--brand-config` 与 `--prepare-only`，未知、重复或缺值参数必须失败。

### 4.2 派生身份

解析后必须得到以下不可变身份：

| 消费者 | prod 值 | dev/beta 派生 |
| --- | --- | --- |
| 显示名 | `BluedCode` | `BluedCode Dev`、`BluedCode Beta` |
| CLI | `bluedcode` | 不随 channel 改变 |
| Deep Link scheme | `bluedcode://` | 不随 channel 改变 |
| 全局目录名 | `bluedcode` | 不随 channel 改变 |
| 数据库文件 | `bluedcode.db` | 非稳定 channel 可使用带安全化 channel 的独立文件名 |
| 日志文件 | `bluedcode.log` | 不随 channel 改变 |
| Desktop app ID | `ai.bluedcode.desktop` | `.dev`、`.beta` 后缀 |

所有运行时代码只能消费同一个已解析品牌对象，不能重新声明 `BluedCode`、`bluedcode` 或平行派生规则。浏览器、Electron main/preload/renderer、CLI、SDK 和构建脚本必须接收同一份编译期 JSON。

## 5. 发行版本

仓库基础版本必须是稳定三段语义版本，例如 `1.17.9`。最终产品版本为：

```text
<base-version>-<release>
```

规则如下：

- 显式 `release` 使用 `YYMMDD-NN`，日期必须真实存在，序号范围为 `01..99`。
- 未提供或提供空 `release` 时，使用构建机器本地日期和当前 Git `HEAD` 短提交号生成 `YYMMDD-<shortCommitId>`。
- 短提交号必须是 4 到 40 位小写十六进制字符。
- 同一个最终版本必须写入 CLI/package manifest、Desktop renderer 的版本、Sentry release fallback、Electron extra metadata 和平台产物元数据。
- Windows 可执行文件的 `ProductVersion` 必须在签名前写成组合版本；不能破坏已有语言资源。

## 6. 隔离构建

每次构建使用独立目录：

```text
dist/product-build/bluedcode/<channel>/<release>/
```

暂存区至少包含：

- 解析后的 `brand.json`，包括 `release`、组合 `version`、品牌对象和视觉摘要；
- 重写了 `<title>` 的 Desktop renderer HTML；
- 只暴露 `bluedcode` 命令的 package manifest；
- 安装脚本、launcher、Dockerfile 和 Nix 模板的品牌化副本；
- Web manifest、favicon/App Icon、wordmark 和 TUI 点阵；
- Desktop 构建资源及按 slug 命名的 server/CLI 产物。

构建必须满足：

1. 开始前记录已跟踪、未跟踪、暂存和工作区内容状态。
2. 只允许清理当前解析出的精确暂存目录，不得对仓库根目录或其他品牌/发行目录做递归操作。
3. 所有需要物化的静态值只写入暂存区。
4. 构建结束后重新计算源码状态；任何新增、删除或内容变化都使构建失败。
5. 构建开始前必须加载一个可信的本地 models snapshot；缺失或不是 JSON 对象时失败，不允许联网回退。
6. 产品构建清空 Sentry DSN、认证 token、组织和项目参数，避免继承发布环境。

## 7. 展示与分发范围

### 7.1 Desktop 与 Web

- 窗口标题、应用菜单、错误对话框、安装/更新提示和设置中的产品名使用 `BluedCode`。
- HTML title、PWA manifest、favicon、通知图标和横向字标使用注入的品牌资源。
- Desktop 的 product name、bundle ID、Linux desktop/metainfo identity、协议注册、artifact name 和 user-data 身份来自品牌对象。
- localStorage、Electron store、主题、语言和 workspace/draft 持久化 key 使用 `bluedcode` 前缀，不能与上游产品共享。
- Enterprise SSR 与分享页面若仍被部署，其页面标题和可见产品文案使用 BluedCode。

### 7.2 CLI 与 TUI

- 用户安装和执行的命令只有 `bluedcode`。
- CLI help、示例、错误信息、server 文案、User-Agent 和内部可见提示使用品牌对象。
- curl 安装位置为 `~/.bluedcode/bin/bluedcode`，不创建其他产品的兼容别名。
- TUI 字标来自清单中的点阵，不从运行时字体或旧的字符画回退。
- OAuth 成功、失败和回调页标题使用 `BluedCode`。

### 7.3 独立数据身份

- XDG data、config、cache、state 和临时目录的应用子目录为 `bluedcode`。
- 默认数据库为 `bluedcode.db`，日志为 `bluedcode.log`。
- Desktop 设置、updater 状态、debug 压缩包和 WSL sidecar 路径使用品牌身份。
- 首次启动始终创建全新产品状态，不探测其他产品的目录。

### 7.4 必须保留的上游标识

以下值不得从 `bluedcode` 派生：

- `packages/opencode` 和 `@opencode-ai/*`；
- `.opencode`、`opencode.json`、`opencode.jsonc`；
- `OPENCODE_*`、`x-opencode-*`；
- `opencode` provider ID；
- OpenCode Zen、OpenCode Go、OpenCode Documentation 及其官方 URL；
- 已发布的 API 类型、SDK 方法和内部协议字段名。

## 8. 视觉资源合同

### 8.1 Wordmark SVG

- 必须有有效 `<svg>` 根节点和四个有限数值组成的正宽高 `viewBox`。
- 可使用 `currentColor` 或自身配色；构建必须保留其颜色语义。
- 不得包含脚本、事件处理器、`foreignObject`、iframe/object/embed、多媒体、动画、DOCTYPE、ENTITY、`@import` 或 `xml:base`。
- `href`、`xlink:href` 和 `url()` 只能引用同一 SVG 内的 `#id`。

### 8.2 App Icon SVG 与 PNG 包装

- App Icon 的 `viewBox` 必须为正方形。
- 构建必须将 `<title>` 规范化为 `BluedCode application icon`；没有 title 时插入，已有 title 时只替换内容并保留属性。
- 允许 App Icon SVG 引用至多一个同目录 PNG，路径只能是简单文件名或 `./文件名.png`，不能包含父目录、子目录或 URL。
- 被引用文件必须存在、具有 PNG 签名且宽高相等。
- 构建必须把 PNG 转为 `data:image/png;base64,...` 内嵌到暂存 SVG；最终产物不得保留外部文件引用。
- 除上述受控 PNG data URI 外，仍按普通 SVG 的安全规则拒绝所有外部引用。

### 8.3 TUI 点阵

- JSON 必须包含 `width`、`height` 和 `cells`。
- `width` 范围为 `1..80`，`height` 范围为 `1..16`。
- 行数、每行单元数必须与声明尺寸一致。
- 单元只能为 `0/1` 或 `false/true`，解析后统一为 `0/1`。
- JSON 的键和值均不得包含控制字符。

### 8.4 稳定身份

三类视觉资源分别计算内容 SHA-256，再与版本标记合成稳定视觉摘要。摘要只能由规范化内容决定，不能包含源文件绝对路径，以保证换目录构建的缓存身份一致。

## 9. 验收标准

1. 未提供 `--brand-config`、清单字段无效或视觉资源不完整时，构建在调用编译器前失败。
2. `--prepare-only` 只生成 `dist/product-build/bluedcode/<channel>/<release>/`，不执行编译和打包命令。
3. 构建前已有的工作区改动保持原样；构建自身不增加任何源码变化。
4. 最终 CLI 命令、安装目录、协议、数据库、日志、Desktop app ID 和持久化 key 均符合第 4.2 节。
5. Desktop、Web、CLI、TUI、OAuth 和 Enterprise 页面通用品牌位置不显示其他产品名。
6. OpenCode 官方服务名和第 7.4 节兼容标识保持不变。
7. 同目录 PNG 图标被内嵌；跨目录、非 PNG、非正方形或多个外部引用全部被拒绝。
8. 同一构建的所有产物报告相同组合版本，Windows `ProductVersion` 在签名前正确写入。
9. 没有本地 models snapshot 时产品构建失败，且没有公共网络请求。

## 10. 旧生成器与静态检查

- `brand:generate` 不得把某次品牌展开结果写回 Git 跟踪源码；若继续保留命令，只能生成隔离产物或执行只读合同检查。
- `brand:check` 必须检查运行时代码不存在硬编码的 BluedCode 展示名、slug 或平行身份定义，并验证 installer、launcher、Docker 和 Nix 仍是受控产品模板。
- 静态检查应排除 BluedCode 明确清单、规格、计划和只验证残留扫描器本身的测试，不得排除普通运行时代码。
- 新增品牌消费者时，必须从编译期品牌对象或视觉对象取值，并加入相应 bundle/合同测试。

## 11. 1.17.9 实现锚点

- 品牌解析：`packages/brand/src/config.ts`、`packages/brand/src/index.ts`
- 视觉解析：`packages/brand/src/visual.ts`、`packages/brand/src/assets-config.ts`
- 产品构建：`script/product-build.ts`、`script/product-dev.ts`
- 静态合同检查：`script/brand.ts`
- 产品清单：`xcode/build/bluedcode/brand.json`
- App/Desktop 注入：`packages/app/vite.config.ts`、`packages/desktop/electron.vite.config.ts`、`packages/desktop/electron-builder.config.ts`
- CLI 构建：`packages/opencode/script/build.ts`、`packages/opencode/script/build-node.ts`
- 版本处理：`packages/desktop/product-version.ts`、`packages/desktop/scripts/windows-product-version.ts`
- 主要合同测试：`packages/brand/test/*.test.ts`、`packages/desktop/scripts/product-build.test.ts`、`packages/opencode/test/brand/*.test.ts`
