# 🎵 Music Web - 现代化音乐播放器

[English](#music-web---modern-music-player) | 中文

一个基于 Vue 3 + TypeScript 构建的现代化音乐播放器，支持多平台音乐搜索和播放，提供优雅的用户体验。

## ✨ 核心功能

### 🎧 音乐播放
- 完整的播放控制（播放/暂停/上一首/下一首）
- 进度条控制和音量调节
- 多种播放模式（顺序/单曲循环/列表循环/随机）
- 迷你播放器和全屏播放器界面
- 支持多种音质选择（128k/320k/FLAC/FLAC24bit）

### 🎵 多平台支持
- **网易云音乐** - 完整支持
- **酷我音乐** - 搜索和播放
- **QQ音乐** - 搜索和播放
- **聚合搜索** - 同时搜索所有平台

### 📱 页面功能
- **发现** - 浏览各平台音乐榜单和推荐
- **排行榜** - 分类音乐榜单浏览
- **搜索** - 多平台聚合或指定平台音乐搜索
- **音乐库** - 个人收藏、播放列表和播放历史
- **播放列表** - 创建和管理自定义播放列表
- **播放器** - 专注的音乐播放体验
- **设置** - API 配置、WebDAV 同步和偏好设置

### 🔄 数据管理
- **收藏管理** - 保存和管理喜爱的歌曲
- **播放历史** - 记录最近播放的歌曲
- **自定义播放列表** - 创建和组织音乐集合
- **WebDAV 同步** - 云备份和多设备同步
- **本地存储** - 保存用户偏好和设置

## 🛠️ 技术栈

### 前端框架
- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript** - 提供类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具

### UI 组件库
- **Naive UI** - 现代化的 Vue 3 组件库
- **@vueuse/core** - Vue 组合式 API 工具集
- **vfonts** - 字体支持

### 状态管理与路由
- **Pinia** - Vue 3 状态管理库
- **Vue Router** - 官方路由管理

### 数据交互
- **Axios** - HTTP 客户端，用于 API 通信
- **WebDAV** - 云存储同步协议

### 工具库
- **dayjs** - 轻量级日期时间处理库

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
├── api/           # API 接口定义
│   └── tunehub.ts # TuneHub API 客户端
├── assets/        # 静态资源
├── components/    # 公共组件
│   ├── PlayerBar.vue      # 底部播放器栏
│   ├── SettingsApi.vue    # API 设置组件
│   ├── SettingsSleep.vue  # 睡眠定时器设置
│   └── SettingsWebdav.vue # WebDAV 设置组件
├── lyrics/        # 歌词相关处理
├── router/        # 路由配置
├── storage/       # 本地存储管理
├── stores/        # 状态管理
│   ├── app.ts     # 应用状态
│   └── player.ts  # 播放器状态
├── views/         # 页面组件
│   ├── AppShell.vue     # 应用布局外壳
│   ├── DiscoverView.vue # 发现页面
│   ├── LibraryView.vue  # 音乐库页面
│   ├── PlayerView.vue   # 播放器页面
│   ├── PlaylistView.vue # 播放列表页面
│   ├── SearchView.vue   # 搜索页面
│   ├── SettingsView.vue # 设置页面
│   └── ToplistView.vue  # 排行榜页面
├── webdav/        # WebDAV 同步功能
├── App.vue        # 根组件
├── main.ts        # 应用入口
└── style.css      # 全局样式
```

## ⚙️ 配置说明

### API 配置
应用默认使用 TuneHub API 获取音乐数据，默认 API 地址为：
```
https://music-dl.sayqz.com
```

你可以在设置页面中修改 API 地址，以使用自定义的 TuneHub API 服务。

### WebDAV 同步
在设置页面中，你可以配置 WebDAV 服务器信息，实现收藏、播放列表和设置的云同步。

### 音质设置
支持多种音质选择，包括：
- 128k - 标准音质
- 320k - 高质量
- flac - 无损音质
- flac24bit - 24位无损音质

## 🎨 UI 设计

- **主题色**：#6366f1（靛蓝色）
- **现代化设计**：采用玻璃拟态（Glassmorphism）设计风格
- **响应式布局**：适配不同屏幕尺寸
- **流畅动画**：平滑的过渡效果和交互动画
- **深色模式**：支持深色主题切换

## 📝 开发指南

### 组件开发
- 使用 Vue 3 Composition API
- 严格的 TypeScript 类型约束
- 单文件组件（SFC）格式

### 状态管理
- 使用 Pinia 进行状态管理
- 模块化的 store 设计
- 支持 DevTools 调试

### 样式规范
- 使用 CSS 变量进行主题定制
- 组件级样式隔离
- 响应式设计原则

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

- [ ] 歌词实时同步显示
- [ ] 更多音乐平台支持
- [ ] 音频可视化效果
- [ ] 离线模式支持
- [ ] 主题自定义
- [ ] 社交分享功能
- [ ] 播客支持
- [ ] 电台模式

---

**享受你的音乐之旅！🎵**

---

<a name="music-web---modern-music-player"></a>

# 🎵 Music Web - Modern Music Player

[中文](#music-web---现代化音乐播放器) | English

A modern music player built with Vue 3 + TypeScript, supporting multi-platform music search and playback with an elegant user experience.

## ✨ Core Features

### 🎧 Music Playback
- Complete playback controls (play/pause/previous/next)
- Progress bar control and volume adjustment
- Multiple playback modes (sequential/single loop/list loop/shuffle)
- Mini player and full-screen player interfaces
- Support for multiple audio qualities (128k/320k/FLAC/FLAC24bit)

### 🎵 Multi-platform Support
- **NetEase Cloud Music** - Full support
- **Kuwo Music** - Search and playback
- **QQ Music** - Search and playback
- **Aggregate Search** - Search across all platforms simultaneously

### 📱 Page Features
- **Discover** - Browse music charts and recommendations from various platforms
- **Toplist** - Categorized music charts browsing
- **Search** - Multi-platform aggregate or specific platform music search
- **Library** - Personal favorites, playlists, and play history
- **Playlist** - Create and manage custom playlists
- **Player** - Focused music playback experience
- **Settings** - API configuration, WebDAV sync, and preferences

### 🔄 Data Management
- **Favorites Collection** - Save and manage favorite songs
- **Play History** - Record recently played songs
- **Custom Playlists** - Create and organize music collections
- **WebDAV Sync** - Cloud backup and multi-device synchronization
- **Local Storage** - Save user preferences and settings

## 🛠️ Tech Stack

### Frontend Framework
- **Vue 3.5** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript superset
- **Vite** - Next-generation frontend build tool

### UI Component Library
- **Naive UI** - Modern Vue 3 component library
- **@vueuse/core** - Vue Composition API utilities
- **vfonts** - Font support

### State Management & Routing
- **Pinia** - Vue 3 state management library
- **Vue Router** - Official routing management

### Data Interaction
- **Axios** - HTTP client for API communication
- **WebDAV** - Cloud storage synchronization protocol

### Utility Libraries
- **dayjs** - Lightweight date-time processing library

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

The app will start at `http://localhost:5173`

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
├── api/           # API interface definitions
│   └── tunehub.ts # TuneHub API client
├── assets/        # Static assets
├── components/    # Common components
│   ├── PlayerBar.vue      # Bottom player bar
│   ├── SettingsApi.vue    # API settings component
│   ├── SettingsSleep.vue  # Sleep timer settings
│   └── SettingsWebdav.vue # WebDAV settings component
├── lyrics/        # Lyrics processing
├── router/        # Router configuration
├── storage/       # Local storage management
├── stores/        # State management
│   ├── app.ts     # Application state
│   └── player.ts  # Player state
├── views/         # Page components
│   ├── AppShell.vue     # Application layout shell
│   ├── DiscoverView.vue # Discover page
│   ├── LibraryView.vue  # Library page
│   ├── PlayerView.vue   # Player page
│   ├── PlaylistView.vue # Playlist page
│   ├── SearchView.vue   # Search page
│   ├── SettingsView.vue # Settings page
│   └── ToplistView.vue  # Toplist page
├── webdav/        # WebDAV synchronization functionality
├── App.vue        # Root component
├── main.ts        # Application entry
└── style.css      # Global styles
```

## ⚙️ Configuration

### API Configuration
The app uses TuneHub API to fetch music data by default. The default API address is:
```
https://music-dl.sayqz.com
```

You can modify the API address in the settings page to use a custom TuneHub API service.

### WebDAV Sync
In the settings page, you can configure WebDAV server information to enable cloud synchronization of favorites, playlists, and settings.

### Audio Quality Settings
Supports multiple audio quality options:
- 128k - Standard quality
- 320k - High quality
- flac - Lossless quality
- flac24bit - 24-bit lossless quality

## 🎨 UI Design

- **Theme Color**: #6366f1 (Indigo)
- **Modern Design**: Adopts Glassmorphism design style
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: Fluid transition effects and interactive animations
- **Dark Mode**: Supports dark theme switching

## 📝 Development Guidelines

### Component Development
- Use Vue 3 Composition API
- Strict TypeScript type constraints
- Single File Component (SFC) format

### State Management
- Use Pinia for state management
- Modular store design
- DevTools debugging support

### Style Guidelines
- Use CSS variables for theme customization
- Component-level style isolation
- Responsive design principles

## 🚀 Deployment

### Build Optimization
```bash
npm run build
```

Build artifacts are located in the `dist/` directory and can be directly deployed to static hosting services.

### Recommended Deployment Platforms
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

- [ ] Real-time lyrics synchronization
- [ ] Support for more music platforms
- [ ] Audio visualization effects
- [ ] Offline mode support
- [ ] Theme customization
- [ ] Social sharing features
- [ ] Podcast support
- [ ] Radio mode

---

**Enjoy Your Music Journey! 🎵**