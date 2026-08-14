# Git 独立 Clone 与 Worktree 隔离规格

- 状态：逆向确认
- 迁移顺序：`04`
- 基线版本：OpenCode `1.17.9`
- 最后更新：2026-08-15

## 1. 问题

OpenCode 可让相同仓库的目录共享 project ID。独立 `git clone` 与 linked worktree 因而可能进入同一个项目记录，但二者不能都当作 sandbox：独立 clone 有自己的 `.git` store 和生命周期，若误入 sandboxes，UI 和清理逻辑会把它当作主 worktree 的附属目录。

## 2. 术语

- 主 worktree：项目记录中的稳定 `project.worktree`。
- linked worktree/sandbox：工作目录使用位于自身目录之外的 Git store，例如主仓库 `.git/worktrees/...`。
- 独立 clone：工作目录包含自己的 Git store，虽然与另一 clone 解析为相同 project ID，但生命周期独立。

## 3. 行为合同

解析目录得到已有项目时：

1. 相同仓库的独立 clone 可以继续共享 project ID。
2. 解析独立 clone 不能改变已有 `project.worktree`。
3. 独立 clone 不能新增到 `project.sandboxes`。
4. 若该目录此前被错误或手动加入 sandboxes，本次解析必须移除其规范化后的精确路径。
5. 只有满足以下全部条件的目录才自动加入 sandboxes：
   - 项目不是 global project；
   - 当前目录不是主 worktree；
   - VCS 类型是 Git；
   - Git store 不位于当前工作目录内部，即符合 linked worktree 的结构。
6. 路径比较必须先做统一 resolve，避免相对路径、分隔符或 `..` 造成重复和误判。
7. 重新解析同一目录必须幂等，sandboxes 中最多保留一个规范路径。

## 4. 非目标

- 不改变 project ID 的仓库识别算法。
- 不把独立 clone 强制拆成不同 project ID。
- 不自动删除独立 clone 的文件或数据库记录。
- 不改变显式 worktree 创建、删除和分支命名流程。
- 不把非 Git 目录自动当作 sandbox。

## 5. 验收场景

### 5.1 两个独立 clone

给定同一个 bare/origin 仓库的 clone A 与 clone B：

- 先解析 A，再显式把 B 加入 sandboxes；
- 随后解析 B；
- A 与 B 返回相同 project ID；
- project 的主 worktree 仍是 A；
- sandboxes 不包含 B。

### 5.2 linked worktree

给定主仓库 A 通过 `git worktree add` 创建目录 W：

- W 与 A 返回相同 project ID；
- W 的 Git store 位于 W 外部；
- W 被加入 sandboxes，重复解析不产生重复项。

### 5.3 规范化

以绝对路径、带 `..` 的等价路径或平台不同分隔形式解析同一目录，最终 sandboxes 不得出现语义相同的多条记录。

## 6. 1.17.9 实现锚点

- 分类逻辑：`packages/opencode/src/project/project.ts` 的 `fromDirectory` 更新路径
- 路径能力：`FSUtil.resolve`、`FSUtil.contains`
- 回归测试：`packages/opencode/test/project/project.test.ts` 中 `separate clones of the same repo should share project ID without becoming sandboxes`
