# 无限画布连线「属性注入」流向粒子动画与无文字纯净化升级方案

本次更新聚焦于提升无限画布中跨节点上下文继承（角色一致性锚点 $\rightarrow$ 剧本 $\rightarrow$ 视觉分镜）的动态数据流动感，并彻底移除连线上的文字标签干扰，让画布空间更加纯粹、极简。

---

## User Review & Critical Decisions

> [!IMPORTANT]
> 本次升级严格遵循您的两项明确指令，无需额外打扰提问，确认后即可立即执行代码更新：

- **Confirmed Decision 1（属性注入流向动画）**：在无限画布的 SVG 三次贝塞尔连线上引入 **多级流动光点（Data-Injection Flowing Particles）** 与 **动态虚线流（Animated Dash Flow）**。通过 SVG 原生 `<animateMotion>` 沿精确贝塞尔路径从输出端口匀速流向目标输入端口，直观呈现「角色三视图锁脸锚点」「场景光影锚点」与「分场剧本」实时注入下游分镜节点的过程。
- **Confirmed Decision 2（连线零文字化）**：彻底移除所有贝塞尔连线中段的矩形文本框与文字标签（包括常驻标签与悬停文字框），交互反馈改为高对比度连线高亮、流向粒子加速与发光光晕（Glow Filter），保持极简现代创作者工作台的干净视觉。

---

## 1. Overview & Core Concept

- **What It Does**：将原本静态且带有文字框遮挡的节点连线，升级为具有语义色彩区分的**动态属性注入粒子流（Attribute Injection Stream）**。
- **Key Value**：
  1. **一目了然的继承方向**：无需阅读连线文字，仅凭沿曲线流动的脉冲小点即可看清哪些角色锁脸特征和场景色温正在注入哪一张 9:16 分镜卡。
  2. **零遮挡极简画布**：消除连线中段文字框对网格、分组容器及密集节点区域的遮挡。

---

## 2. User Experience & Visual Design

- **语义化流向粒子设计**：
  - **角色锁脸锚点注入 (`character_ref`)**：靛蓝主题（`#4F46E5` / `#818CF8`），连线上配备双脉冲流动粒子（主光点 + 尾随微光点），周期 `2.2s` 连续注入目标分镜端口。
  - **场景空间光影锚点 (`scene_ref`)**：琥珀金主题（`#D97706` / `#FBBF24`），代表色温与环境透视属性源源不断注入分镜。
  - **剧本拆解与分镜串联 (`script_breakdown` / `shot_sequence`)**：高对比炭黑/银灰流向粒子（`#0F172A` / `#38BDF8`），展现叙事节奏的先后传递。
- **悬停与选中交互反馈（无文字）**：
  - 当选中某个角色或分镜节点，或鼠标悬停于某条连线时，关联连线自动加粗、流向粒子亮度与尺寸提升，且点击连线可直接平滑断开连接（通过原生浏览器 `title` 提示替代画布内文字渲染）。

---

## 3. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  SVG Cubic Bezier Edge Layer (No Text)                  │
│                                                                         │
│  [Output Port] ───(Base Bezier Track: 1.5px subtle stroke)───► [Input]  │
│                ───(Animated Dash Stream: stroke-dashoffset)──►          │
│                ───(●Particle 1 + ●Particle 2 via <animateMotion>)─►     │
└─────────────────────────────────────────────────────────────────────────┘
```

- **SVG `<animateMotion>` + `<mpath>` 硬件加速渲染**：
  - 为每条连线生成唯一路径 ID（`edge-path-${edge.id}`）。
  - 使用两个相位错开（`begin="0s"` 与 `begin="-1.1s"`）的圆形粒子沿该三次贝塞尔曲线循环运动（`repeatCount="indefinite"`），确保即使在画布平移（Pan）与缩放（Zoom）时也拥有 60fps 丝滑帧率。
- **彻底清理文字节点**：
  - 移除连线渲染层中的 `<text>` 与背景 `<rect>` 标签，确保画布连线层 100% 无文字。
