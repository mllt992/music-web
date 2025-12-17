# 🎵 Music Web - Multi-Platform Music Aggregator

[中文](#chinese-version) | English

A modern music aggregation player web application built with Vue 3 + TypeScript, supporting multiple music platforms through TuneHub API.

---

## ✨ Features

### 🎧 Core Playback Features
- Multi-platform music playback controls (play/pause/previous/next)
- Progress bar control and volume adjustment
- Multiple playback modes (sequential/single loop/loop list/shuffle)
- Mini player and full-screen player interface
- Audio quality selection (128k/320k/FLAC/FLAC24bit)

### 🎵 Platform Integration
- **NetEase Cloud Music (网易云音乐)** - Full support
- **Kuwo Music (酷我音乐)** - Search and playback
- **QQ Music (QQ音乐)** - Search and playback
- **Aggregate Search** - Search across all platforms simultaneously
- **TuneHub API** - Unified music data source integration

### 📱 Page Features
- **Discover** - Browse music charts and rankings from various platforms
- **Toplist** - Categorized music charts (hot/style/language/special)
- **Search** - Aggregate or platform-specific music search
- **Library** - Personal favorites, playlists, and play history
- **Playlist** - Create and manage custom playlists
- **Player** - Focused music playback experience
- **Settings** - API configuration, WebDAV sync, and preferences

### 🔄 Data Management
- **Favorites Collection** - Save and manage favorite tracks
- **Play History** - Track recently played songs
- **Custom Playlists** - Create and organize music collections
- **Play Count Statistics** - Track listening habits
- **WebDAV Sync** - Cloud backup and synchronization
- **Local Data Import/Export** - Backup and restore user data

## 🛠️ Tech Stack

### Frontend Framework
- **Vue 3.5** - Progressive JavaScript framework
- **TypeScript** - JavaScript superset with static types
- **Vite** - Next-gen frontend build tool

### UI Component Library
- **Naive UI** - Vue 3 component library
- **@vueuse/core** - Vue composition utilities
- **vfonts** - Font support

### State Management & Routing
- **Pinia** - Vue state management library
- **Vue Router** - Official Vue.js router with hash mode

### External APIs & Services
- **TuneHub API** - Multi-platform music aggregation service
- **Axios** - HTTP client for API communication
- **WebDAV** - Cloud storage synchronization protocol

### Utilities
- **Day.js** - Lightweight date time library
- **LocalStorage & SessionStorage** - Client-side data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

App will start at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── api/           # API interfaces
├── assets/        # Static assets
├── components/    # Common components
│   ├── PlayerBar.vue      # Player bar component
│   ├── SettingsApi.vue    # API settings component
│   ├── SettingsSleep.vue  # Sleep timer settings
│   └── SettingsWebdav.vue # WebDAV settings component
├── lyrics/        # Lyrics related
├── router/        # Router configuration
├── storage/       # Storage related
├── stores/        # State management
├── style.css      # Global styles
├── views/         # Page components
│   ├── AppShell.vue     # App shell
│   ├── DiscoverView.vue # Discover page
│   ├── LibraryView.vue  # Library page
│   ├── PlayerView.vue   # Player page
│   ├── PlaylistView.vue # Playlist page
│   ├── SearchView.vue   # Search page
│   ├── SettingsView.vue # Settings page
│   └── ToplistView.vue  # Toplist page
├── App.vue        # Root component
└── main.ts        # App entry point
```

## ⚙️ Configuration

### TuneHub API Configuration
The app connects to TuneHub API for music data. Default endpoint:
```
https://music-dl.sayqz.com
```

You can configure custom API endpoints in Settings:
- Base URL for TuneHub API
- Platform preferences
- Audio quality settings

### Vite Configuration
Uses Vite with WebDAV proxy support. See `vite.config.ts` for proxy settings.

### Router Configuration
Hash routing mode with the following routes:
- `/` - Redirect to discover page
- `/discover` - Music charts and rankings
- `/toplist` - Platform toplist browsing
- `/search` - Music search interface
- `/library` - Personal music library
- `/playlist/:id` - Custom playlist viewing
- `/settings` - Application settings
- `/player` - Dedicated player view

## 🎨 UI Design

- **Theme Color**: #6366f1 (Indigo)
- **Border Radius**: 12px base, 16px for cards
- **Responsive Layout**: Mobile and desktop support
- **Modern Components**: Beautiful components based on Naive UI

## 🔌 Feature Extensions

### TuneHub API Integration
- **Multi-platform Search**: Search across Netease, Kuwo, and QQ Music
- **Music Metadata**: Access song info, album art, and lyrics
- **Audio Streaming**: Get playback URLs in various qualities
- **Chart Rankings**: Access platform-specific music charts
- **Playlist Data**: Import and browse public playlists

### WebDAV Synchronization
- **Cloud Backup**: Sync favorites, playlists, and settings
- **Conflict Resolution**: Handle data conflicts between devices
- **Multi-file Sync**: Synchronize multiple data files efficiently
- **Remote Storage**: Use any WebDAV-compatible cloud storage

### Data Persistence
- **Local Storage**: Save user preferences and settings
- **Session Storage**: Maintain player state across sessions
- **Import/Export**: Manual backup and restore functionality

## 📝 Development Guidelines

### Component Development
- Use Composition API
- TypeScript type constraints
- Single File Component (SFC) format

### State Management
- Use Pinia for state management
- Modular store design
- DevTools debugging support

### Style Guidelines
- Use CSS variables for theming
- Responsive design principles
- Component-level style isolation

## 🚀 Deployment

### Build Optimization
```bash
npm run build
```

Build artifacts are located in the `dist/` directory and can be deployed directly to static hosting services.

### Recommended Platforms
- Vercel
- Netlify
- GitHub Pages
- Alibaba Cloud OSS
- Tencent Cloud COS

## 🤝 Contributing

Issues and Pull Requests are welcome to improve the project.

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Plans

- [ ] **Lyrics Display** - Real-time lyrics synchronization
- [ ] **More Platforms** - Add support for additional music services
- [ ] **Audio Visualization** - Music waveform and spectrum analysis
- [ ] **Offline Mode** - Cache music for offline playback
- [ ] **Theme Customization** - Multiple color schemes and dark mode
- [ ] **Social Features** - Share playlists and music recommendations
- [ ] **Podcast Support** - Extend to podcast streaming
- [ ] **Radio Mode** - Algorithm-based radio stations
- [ ] **Mobile App** - Native mobile application

---

**Enjoy Your Music! 🎵**

---

<a name="chinese-version"></a>

# 🎵 Music Web - 多平台音乐聚合播放器

[English](#music-web---multi-platform-music-aggregator) | 中文

一个基于 Vue 3 + TypeScript 构建的多平台音乐聚合播放器，通过 TuneHub API 支持多个音乐平台。

## ✨ 功能特性

### 🎧 核心播放功能
- 多平台音乐播放控制（播放/暂停/上一首/下一首）
- 进度条控制和音量调节
- 多种播放模式（顺序/单曲循环/列表循环/随机）
- 迷你播放器和全屏播放器界面
- 音质选择（128k/320k/FLAC/FLAC24bit）

### 🎵 平台集成
- **网易云音乐** - 完整支持
- **酷我音乐** - 搜索和播放
- **QQ音乐** - 搜索和播放
- **聚合搜索** - 同时搜索所有平台
- **TuneHub API** - 统一音乐数据源集成

### 📱 页面功能
- **发现** - 浏览各平台音乐榜单和排行
- **排行榜** - 分类音乐榜单（热门/风格/语种/特色）
- **搜索** - 聚合或指定平台音乐搜索
- **音乐库** - 个人收藏、播放列表和播放历史
- **播放列表** - 创建和管理自定义播放列表
- **播放器** - 专注的音乐播放体验
- **设置** - API配置、WebDAV同步和偏好设置

### 🔄 数据管理
- **收藏管理** - 保存和管理收藏的歌曲
- **播放历史** - 记录最近播放的歌曲
- **自定义播放列表** - 创建和组织音乐集合
- **播放统计** - 追踪收听习惯和播放次数
- **WebDAV 同步** - 云备份和多设备同步
- **本地数据导入/导出** - 备份和恢复用户数据

## 🛠️ 技术栈

### 前端框架
- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集，提供静态类型
- **Vite** - 下一代前端构建工具

### UI 组件库
- **Naive UI** - Vue 3 组件库
- **@vueuse/core** - Vue 组合式工具集
- **vfonts** - 字体支持

### 状态管理 & 路由
- **Pinia** - Vue 状态管理库
- **Vue Router** - 使用 hash 模式的官方路由

### 外部 API 和服务
- **TuneHub API** - 多平台音乐聚合服务
- **Axios** - API 通信的 HTTP 客户端
- **WebDAV** - 云存储同步协议

### 工具库
- **Day.js** - 轻量级日期时间库
- **LocalStorage & SessionStorage** - 客户端数据持久化

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 📁 项目结构

```
src/
├── api/           # API 接口
├── assets/        # 静态资源
├── components/    # 公共组件
│   ├── PlayerBar.vue      # 播放器栏组件
│   ├── SettingsApi.vue    # API 设置组件
│   ├── SettingsSleep.vue  # 睡眠定时器设置
│   └── SettingsWebdav.vue # WebDAV 设置组件
├── lyrics/        # 歌词相关
├── router/        # 路由配置
├── storage/       # 存储相关
├── stores/        # 状态管理
├── style.css      # 全局样式
├── views/         # 页面组件
│   ├── AppShell.vue     # 应用外壳
│   ├── DiscoverView.vue # 发现页面
│   ├── LibraryView.vue  # 音乐库页面
│   ├── PlayerView.vue   # 播放器页面
│   ├── PlaylistView.vue # 播放列表页面
│   ├── SearchView.vue   # 搜索页面
│   ├── SettingsView.vue # 设置页面
│   └── ToplistView.vue  # 排行榜页面
├── App.vue        # 根组件
└── main.ts        # 应用入口
```

## ⚙️ 配置说明

### TuneHub API 配置
应用连接到 TuneHub API 获取音乐数据。默认端点：
```
https://music-dl.sayqz.com
```

可在设置中配置：
- TuneHub API 的基础 URL
- 平台偏好设置
- 音质选择

### Vite 配置
使用 Vite 配置了 WebDAV 代理支持，详见 `vite.config.ts`。

### 路由配置
使用 hash 路由模式，支持以下路由：
- `/` - 重定向到发现页面
- `/discover` - 音乐榜单和排行
- `/toplist` - 平台排行榜浏览
- `/search` - 音乐搜索界面
- `/library` - 个人音乐库
- `/playlist/:id` - 自定义播放列表查看
- `/settings` - 应用设置
- `/player` - 专用播放器视图

## 🎨 UI 设计

- **主题色**：#6366f1（靛蓝色）
- **圆角设计**：12px 基础圆角，16px 卡片圆角
- **响应式布局**：支持移动端和桌面端
- **现代化组件**：基于 Naive UI 的精美组件

## 🔌 功能扩展

### TuneHub API 集成
- **多平台搜索**：跨网易云音乐、酷我、QQ音乐搜索
- **音乐元数据**：获取歌曲信息、专辑封面和歌词
- **音频流媒体**：获取各种音质的播放链接
- **排行榜数据**：访问平台特定的音乐榜单
- **播放列表数据**：导入和浏览公开播放列表

### WebDAV 同步
- **云备份**：同步收藏、播放列表和设置
- **冲突解决**：处理设备间的数据冲突
- **多文件同步**：高效同步多个数据文件
- **远程存储**：使用任何兼容 WebDAV 的云存储

### 数据持久化
- **本地存储**：保存用户偏好和设置
- **会话存储**：跨会话保持播放器状态
- **导入/导出**：手动备份和恢复功能

## 📝 开发指南

### 组件开发
- 使用 Composition API
- TypeScript 类型约束
- 单文件组件（SFC）格式

### 状态管理
- 使用 Pinia 进行状态管理
- 模块化的 store 设计
- 支持 DevTools 调试

### 样式规范
- 使用 CSS 变量进行主题定制
- 响应式设计原则
- 组件级样式隔离

## 🚀 部署

### 构建优化
```bash
npm run build
```

构建产物位于 `dist/` 目录，可直接部署到静态托管服务。

### 推荐部署平台
- Vercel
- Netlify
- GitHub Pages
- 阿里云 OSS
- 腾讯云 COS

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📄 许可证

本项目采用 MIT 许可证。

## 🎯 未来计划

- [ ] **歌词显示** - 实时歌词同步功能
- [ ] **更多平台** - 添加对其他音乐服务的支持
- [ ] **音频可视化** - 音乐波形和频谱分析
- [ ] **离线模式** - 缓存音乐以供离线播放
- [ ] **主题定制** - 多种配色方案和深色模式
- [ ] **社交功能** - 分享播放列表和音乐推荐
- [ ] **播客支持** - 扩展到播客流媒体
- [ ] **电台模式** - 基于算法的电台播放
- [ ] **移动应用** - 原生移动应用程序

---

**享受你的音乐！🎵**