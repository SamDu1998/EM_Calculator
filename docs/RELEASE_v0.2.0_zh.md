# Release v0.2.0 - Liquid Glass 设计更新

## 🎨 重大视觉改版

本次发布带来了受 **Apple Liquid Glass** 设计语言启发的完整重新设计，包含增强的活力感、动态背景和现代化的无边框窗口体验。

## ✨ 新功能

### 🪟 无边框窗口设计
- **自定义标题栏** - 优雅的毛玻璃效果标题栏和窗口控制按钮
- **拖拽移动** - 拖动标题栏即可移动窗口
- **双击最大化** - 快速窗口管理
- **流畅动画** - 精致的窗口状态过渡效果

### 🎨 Apple Liquid Glass 设计
- **动态背景** - 流动的渐变色块，20-25秒动画循环
- **实时玻璃效果** - `backdrop-filter: blur(24px) saturate(200%) brightness(1.1)`
- **增强色彩** - 鲜艳的紫色、青色和琥珀色，饱和度提升
- **自适应透明度** - 65-75% 不透明度，遵循 Apple 设计指南
- **深度与层次** - 清晰的空间层级和正确的 z-index 分层

### 📝 字体改进
- **微软雅黑字体** - 更好的中日韩字符渲染
- **统一字体系统** - 全局一致的无衬线字体

### 📐 响应式布局
- **流体缩放** - 使用 CSS `clamp()` 函数实现自适应尺寸
- **窗口尺寸支持** - 优化支持 720x540 到 1600x900
- **智能网格** - 表单和结果网格随窗口宽度自适应
- **无滚动条** - 内容在所有支持的尺寸下都保持在视口内

## 🐛 Bug 修复

- 修复标签切换时的闪烁问题（移除 opacity 动画）
- 改进玻璃卡片的 hover 效果
- 增强组件间的视觉一致性

## 🛠️ 技术细节

### 依赖项
- Electron 33.3.1
- React 18.3.1
- Vite 6.0.7
- electron-vite 5.0.0

### 构建产物
- Windows: 便携版 `.exe` + `.zip`
- Linux: `.tar.gz`

---

## 📥 安装

### Windows
1. 下载 `EM-Calculator-0.2.0-portable-x64.exe`
2. 直接运行 - 无需安装

### Linux
1. 下载 `EM-Calculator-0.2.0-x64.tar.gz`
2. 解压并运行：`./EM-Calculator`

---

## 🌟 截图

（等待用户提供截图后添加）

---

## 🔗 链接

- [仓库](https://github.com/SamDu1998/EM_Calculator)
- [报告问题](https://github.com/SamDu1998/EM_Calculator/issues)
- [文档](https://github.com/SamDu1998/EM_Calculator#readme)

---

## 📄 完整更新日志

**提交**: `84caedf`

### UI 改进
- 切换为微软雅黑字体，改善中文渲染
- 使用 clamp() 实现响应式流体布局
- 添加增强色彩的动态动画背景
- 应用 Apple Liquid Glass 设计系统（模糊 24px，65-75% 不透明度）
- 增强 backdrop-filter（饱和度 200%，亮度 1.1）

### 无边框窗口
- 移除系统标题栏（frame: false）
- 添加带拖拽区域的自定义 TitleBar 组件
- 实现窗口控制（最小化、最大化/还原、关闭）
- 添加窗口管理的 IPC handlers
- 为标题栏应用 Liquid Glass 效果

### 视觉增强
- 提高色块的饱和度和亮度以获得鲜艳色彩
- 更快的动画循环（20-25秒），使用 3 关键帧路径
- 为色块动画添加旋转效果，增加动态感
- 平滑的标签切换动画（移除 opacity 闪烁）
- 玻璃卡片的 hover 效果，带有轻微上浮

### 技术实现
- 扩展 EmApi 接口，添加 windowMinimize/Maximize/Close 方法
- 通过 IPC 事件跟踪最大化状态
- 支持双击标题栏最大化/还原

---

**完整对比**: https://github.com/SamDu1998/EM_Calculator/compare/0040273...84caedf
