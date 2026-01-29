# Pomoduc - Advanced Focus Timer

Pomoduc 是一个基于 Electron + React 构建的现代化桌面专注计时应用。它结合了极简主义设计与强大的数据持久化能力，支持沉浸式专注、分节统计、微型模式以及详细的历史数据分析。

## 🛠 技术栈 (Technology Stack)

*   **Runtime**: [Electron](https://www.electronjs.org/) (Main Process)
*   **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) (Renderer Process)
*   **Language**: JavaScript (ES6+)
*   **Database**: SQLite (via `better-sqlite3`) - 本地持久化存储
*   **Styling**: Vanilla CSS (Variables & Layouts) with Glassmorphism effects
*   **Charts**: Recharts (数据可视化)

## 🏗 应用架构 (Architecture)

本应用采用了经典的 **Electron 多进程架构**，确保了 UI 的流畅性与数据操作的稳定性。

### 1. 核心层级
*   **Renderer Process (渲染进程)**:
    *   负责所有 UI 展示 (React)。
    *   通过 `TimerContext` 维护计时器状态 (Timer, Mode, Tasks)。
    *   通过 `window.electron` 暴露的 API 与主进程通信。
*   **Preload Script (预加载脚本)**:
    *   作为渲染进程与主进程之间的安全桥梁。
    *   使用 `contextBridge` 暴露受限的 API (如 `db.getHistory`, `set-mini-mode`)。
*   **Main Process (主进程)**:
    *   负责窗口管理 (创建、调整大小、透明度控制)。
    *   **数据中心**: 直接操作 SQLite 数据库 (`pomoduc.db`)。
    *   处理系统级事件 (托盘、应用生命周期)。

### 2. 数据流向 (Data Flow)
`React Components` -> `TimerContext` -> `IPC (Renderer)` -> `IPC (Main)` -> `SQLite Database`

---

## 📂 文件系统结构 (File System)

```text
pomoduc/
├── electron/                  # Electron 主进程核心代码
│   ├── main.cjs               # 入口文件：窗口创建、数据库初始化、IPC 监听
│   └── preload.cjs            # 预加载脚本：定义 window.electron API
│
├── src/                       # React 前端源代码
│   ├── components/            # UI 组件
│   │   ├── MainView.jsx       # 主界面 (标准模式)
│   │   ├── MiniView.jsx       # 迷你悬浮窗 (极简/透明模式)
│   │   ├── StatsView.jsx      # 统计界面 (图表与历史记录)
│   │   ├── SettingsModal.jsx  # 设置弹窗
│   │   └── TitleBar.jsx       # 自定义窗口标题栏
│   │
│   ├── context/               # 状态管理核心
│   │   └── TimerContext.jsx   # 计时逻辑、自动保存判定、DB同步接口
│   │
│   ├── assets/                # 静态资源 (图片/图标)
│   ├── App.jsx                # 路由与布局容器
│   ├── main.jsx               # React 入口
│   └── index.css              # 全局样式 (CSS Variables)
│
├── dist/                      # Vite 构建产出 (前端静态文件)
├── pomoduc.db                 # SQLite 数据库文件 (运行时生成于 userData 目录)
└── package.json               # 项目依赖与脚本配置
```

## 🧩 核心功能与逻辑

### 1. 计时与持久化 (Timer & Persistence)
*   **逻辑位置**: `src/context/TimerContext.jsx`
*   **保存机制**: 采用 **分段累计 (Chunk-based)** 策略。
    *   **门槛**: 任意专注记录必须 >= 10分钟才会被保存。
    *   **触发点**: 倒计时正常结束、中途暂停 (Pause)、手动重置 (Reset)。
    *   **优势**: 防止用户因意外退出或手动重置而丢失已完成的专注时长。

### 2. 数据库设计 (Database Schema)
位于 `electron/main.cjs`，包含以下表结构：
*   `settings`: 存储全局配置 (时长、日界线)。
*   `tasks`: 任务分类 (名称、颜色)。
*   `history`: 每一笔详细的专注记录 (开始时间、结束时间、时长)。
*   `stats`: 每日聚合统计 (用于快速生成热力图和趋势)。

### 3. 多视窗模式 (View Modes)
*   **Main View**: 完整功能界面，包含统计图表和任务管理。
*   **Mini View**: 紧凑的悬浮窗，支持透明度调节 (`set-opacity`)，仅显示倒计时和核心控制，适合配合其他工作使用。

## 🚀 开发与构建 (Development)

**启动开发环境**:
```bash
npm run dev
# 同时启动 Vite Server 和 Electron 窗口
```

**打包应用**:
```bash
npm run build
# 1. 编译 React 代码到 dist/
# 2. 使用 electron-builder 打包成可执行文件 (exe/dmg)
```
