# Git 独立 Clone 与 Worktree 隔离需求

- 需求 ID：`ORIGIN-04`
- 类型：跨版本需求
- 状态：已确认

## 版本实现矩阵

| OpenCode 基线 | 实现分支 | 完成提交 | 版本落地 spec |
| --- | --- | --- | --- |
| `v1.17.9` | `dev-foreachcode-1.17.9` | `66ec4bbefff123593e3bf538ffd8f7a7ffdd6d09` | [`OpenCode 1.17.9 独立 Clone 隔离落地设计`](https://github.com/Foreach-Coder/opencode/blob/d20dd4fa61c405736559eb4e217bfb0aea01e33a/docs/superpowers/specs/2026-08-15-04-independent-clone-isolation-design.md) |
| `v1.18.18` | `dev-foreachcode-1.18.18` | `5d3a695dbd3055e9cccf564bdba9ec387744a213` | [`OpenCode 1.18.18 独立 Clone 与 Worktree 隔离落地设计`](https://github.com/Foreach-Coder/opencode/blob/5d3a695dbd3055e9cccf564bdba9ec387744a213/docs/superpowers/specs/2026-08-17-05-independent-clone-isolation-design.md) |

## 1. 需求背景

同一 Git 仓库的多个独立 clone 可能被 OpenCode 识别为同一逻辑项目，但独立 clone 拥有自己的 Git store 和生命周期，不能被当成主工作目录创建的 linked worktree 或 sandbox。错误分类会让 UI、清理和生命周期管理误操作独立 clone。

## 2. 术语

- 主工作目录：逻辑项目当前稳定记录的主要工作目录。
- linked worktree/sandbox：工作目录依赖位于自身目录之外的 Git store，生命周期从属于主仓库。
- 独立 clone：工作目录内部拥有自己的 Git store，生命周期独立。

## 3. 行为合同

当系统把一个目录解析到已有逻辑项目时：

1. 现有的项目识别算法可以继续让多个独立 clone 共享逻辑项目身份；本需求不强制改变识别结果。
2. 解析独立 clone 不能改变已有主工作目录。
3. 独立 clone 不能出现在 sandbox/worktree 列表中。
4. 如果独立 clone 此前被错误或手动加入 sandbox 列表，再次解析时必须移除其规范化后的精确路径。
5. 只有非主目录、属于 Git、且 Git store 位于工作目录之外的 linked worktree 才能被自动加入 sandbox 列表。
6. 所有路径在比较和去重前必须规范化。
7. 重复解析必须幂等，同一路径最多出现一次。

## 4. 安全边界

- 分类不得触发独立 clone 的文件删除、Git 操作或数据库清理。
- sandbox 清理和删除流程不得作用于独立 clone。
- 非 Git 目录不能仅因与已有项目关联而自动成为 sandbox。

## 5. 非目标

- 不改变项目身份的仓库识别算法。
- 不要求独立 clone 获得不同的项目身份。
- 不改变显式创建、删除 linked worktree 和分支命名的流程。

## 6. 验收标准

1. 给定系统识别为同一逻辑项目的两个独立 clone，解析第二个 clone 后主工作目录保持不变，sandbox 列表不包含第二个 clone。
2. 即使第二个 clone 预先存在于 sandbox 列表，再次解析也会安全移除该精确路径。
3. 主仓库创建的 linked worktree 会进入 sandbox 列表，重复解析不产生重复项。
4. 绝对路径、含 `..` 的等价路径和平台分隔符差异不会形成重复或绕过分类。
5. 分类过程不修改或删除任何独立 clone 内容。
