# ForeachCode 工作区约定

## 仓库边界

- 当前根目录是 ForeachCode 工作区根仓，负责跨版本规格、品牌构建资源以及 `opencode` 子模块引用。
- `opencode/` 是独立 Git 子仓库。进入该目录工作时，还必须遵守 `opencode/AGENTS.md` 以及更深层目录中的 `AGENTS.md`。
- 根仓与 `opencode` 子仓必须分别提交。不要把根仓文件误写进子仓，也不要在根仓提交中夹带未经确认的子模块修改。

## 提交与发布语言

- 根仓和 `opencode` 子仓的所有 commit 摘要与正文必须使用中文。
- commit 可以继续使用 Conventional Commits 的英文 `type(scope):` 前缀，但冒号后的描述和正文必须使用中文，例如 `docs: 更新跨版本规格`。
- squash、revert、merge commit 以及自动生成的提交在允许编辑 message 时，也必须提供中文描述。
- 所有 release 的标题、发布说明、变更日志、升级提示和发布公告必须使用中文。
- 版本号、Git tag、代码标识、命令、文件路径、API 名称和必须保持原样的上游专有名词可以保留英文；其解释文字仍使用中文。

## Spec 分类

开始编写任何需求 spec 前，必须先判断它属于以下哪一类：

| 类型 | 判断标准 | 存放位置 | 写作重点 |
| --- | --- | --- | --- |
| 版本级需求 | 只服务于当前 OpenCode 版本，或由该版本特有结构、兼容问题和实现约束产生 | `opencode/docs/superpowers/specs/` | 在目标版本中如何实现 |
| 跨版本需求 | 产品能力需要在多个 OpenCode 版本中持续存在，并会在升级后重复实现 | `docs/origin-specs/`，然后再写 `opencode/docs/superpowers/specs/` | 先定义需求本身，再定义当前版本的实现 |

如果无法确认需求是否会跨版本延续，不要自行假设；先向用户确认分类。

## Spec 编写流程

### 版本级需求

版本级需求直接写入 `opencode/docs/superpowers/specs/`，不需要在 `docs/origin-specs/` 创建对应文档。

版本级 spec 应描述：

- 目标 OpenCode 版本和适用基线；
- 当前版本的源码结构与受影响模块；
- 技术设计、兼容处理和实施步骤；
- 针对该版本的测试与验证方法。

### 跨版本需求

跨版本需求必须按以下顺序处理：

1. 先在 `docs/origin-specs/` 编写或更新跨版本 spec。
2. 再在 `opencode/docs/superpowers/specs/` 编写当前 OpenCode 版本的落地 spec。
3. 版本 spec 必须引用对应的跨版本 spec，并说明本版本如何满足其需求和验收标准。

命名约定：

- 跨版本 spec 使用稳定编号和主题，例如 `docs/origin-specs/01-product-branding.md`。不要把目标 OpenCode 版本或一次实施日期写入稳定文件名。
- 版本 spec 使用 Superpowers 日期与设计文档格式，例如 `opencode/docs/superpowers/specs/YYYY-MM-DD-01-product-branding-design.md`。
- 跨版本 spec 使用稳定需求 ID（例如 `ORIGIN-01`）；版本 spec 必须同时记录该 ID 和根仓路径。
- 逆向来源的过程提交、旧源码路径和测试位置写入对应版本 spec，不写入 origin spec。

每份跨版本 spec 必须包含“版本实现矩阵”，每个已经完成的 OpenCode 版本占一行，并记录：

- OpenCode tag 或其他明确基线；
- 实现分支；
- 该分支首次完整满足整个 origin spec 的完整 commit ID；
- 对应版本落地 spec 的路径或链接。

只有版本验收完成后才能新增或更新矩阵行。矩阵中的完成提交不是分支当前 HEAD；若需求由多个提交逐步实现，矩阵记录最终形成完整合同的提交，其他过程提交写入版本 spec。

同一需求的两类 spec 不能只是复制同一份内容，它们必须采用不同的描述视角：

- 跨版本 spec 侧重“是什么”和“为什么”：产品目标、用户场景、用户可见行为、业务与安全边界、不变量、验收标准。除追溯来源所需的信息外，避免绑定特定版本、文件路径、函数名或补丁细节。
- 版本 spec 侧重“怎么做”：目标版本、实现现状、源码映射、技术方案、版本兼容、执行步骤、测试位置和验证结果。

若实现过程中发现需求合同本身有误，应先修正跨版本 spec，再同步调整版本 spec；不要用某一版本的偶然实现反向定义跨版本需求。

## BluedCode 构建资源

- 根仓维护的 BluedCode 构建资源放在 `xcode/build/bluedcode/`。
- `opencode/xcode/build/bluedcode/` 属于子仓中的版本实现资源。复制或同步两处资源时，应逐文件校验，且不要在未确认的情况下覆盖任一侧。
