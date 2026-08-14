# 会话文件树偏好同步规格

- 状态：逆向确认
- 迁移顺序：`03`
- 基线版本：OpenCode `1.17.9`
- 最后更新：2026-08-15

## 1. 问题

会话侧边栏的文件树可见状态由 layout state 控制，而“显示文件树”是异步恢复的持久化设置。旧行为只在初始布局中读取一次，设置就绪后或运行期间切换偏好时，已挂载的侧边栏可能不随之打开/关闭。

## 2. 行为合同

系统观察两个值：

- `ready`：设置存储是否已完成恢复；
- `enabled`：`settings.general.showFileTree()` 当前值。

状态转换必须遵守：

| 当前输入 | 上一个已就绪值 | 动作 |
| --- | --- | --- |
| `ready=false` | 任意 | 无动作 |
| 第一次 `ready=true, enabled=true` | 无 | `open` |
| 第一次 `ready=true, enabled=false` | 无 | 无动作，保留旧初始布局 |
| `ready=true, false -> true` | `false` | `open` |
| `ready=true, true -> false` | `true` | `close` |
| 值未变化 | 相同 | 无动作 |

设置恢复前的临时默认值不能关闭用户当前布局。设置首次恢复为启用时必须主动打开，以弥补组件挂载早于持久化恢复的情况。

## 3. UI 集成

- 同步逻辑位于 session side panel 生命周期内，随设置 signal 变化运行。
- `open` 调用现有 `layout.fileTree.open()`，`close` 调用现有 `layout.fileTree.close()`。
- 不直接写入设置，不形成 layout → setting → layout 的反馈循环。
- 不改变窄屏断点、review panel、文件 tab、拖拽尺寸或 `shouldShowFileTree` 的既有规则。

## 4. 边界条件

- `ready` 从 false 变 true 时，上一次 `enabled` 只能视为“未知”，不能把恢复前默认值当作用户历史偏好。
- 组件重挂载且设置已经就绪、偏好为 true 时，应重新打开文件树。
- 组件重挂载且偏好为 false 时，不主动覆盖上游当前的 legacy initial layout。
- 多次相同通知必须幂等，不重复调用 open/close。

## 5. 验收标准

1. 设置未就绪时，无论 `enabled` 值为何都不调用 layout。
2. 设置首次就绪且启用时打开文件树；首次就绪且禁用时不调用 close。
3. 就绪后的 true/false 切换分别精确触发一次 open/close。
4. 重复相同值不产生动作。
5. 文件树显示条件、review panel 与文件 tab 的原有测试保持通过。

## 6. 1.17.9 实现锚点

- 纯状态转换：`packages/app/src/pages/session/helpers.ts` 中的 `fileTreePreferenceAction`
- UI effect：`packages/app/src/pages/session/session-side-panel.tsx`
- 合同测试：`packages/app/src/pages/session/helpers.test.ts`
