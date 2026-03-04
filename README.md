# Music Player — GitHub Pages + Google Drive

极简在线音乐播放器，音频存储在 Google Drive，网站托管在 GitHub Pages。

## 快速开始

### 1. 获取 Google Drive API Key

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目（或选择已有项目）
3. 启用 **Google Drive API**：
   - 左侧菜单 → API 和服务 → 库 → 搜索 "Google Drive API" → 启用
4. 创建 API Key：
   - 左侧菜单 → API 和服务 → 凭据 → 创建凭据 → API 密钥
5. （推荐）限制 API Key：
   - 应用限制 → HTTP 引荐来源 → 添加你的 GitHub Pages 域名
   - API 限制 → 仅 Google Drive API

### 2. 上传音频到 Google Drive

1. 将音频文件上传到 Google Drive
2. 右键文件 → 共享 → 设为 **"知道链接的任何人"可查看**
3. 复制文件 ID（链接中 `/d/` 和 `/view` 之间的部分）
   - 例如：`https://drive.google.com/file/d/ABC123xyz/view` → ID 为 `ABC123xyz`

### 3. 配置 music.json

```json
{
  "googleDriveApiKey": "你的API_KEY",
  "tracks": [
    {
      "title": "歌曲名",
      "artist": "歌手",
      "driveId": "Google_Drive_文件ID",
      "cover": "封面图URL或Google_Drive_文件ID",
      "duration": "3:45"
    }
  ]
}
```

字段说明：
- `title` — 曲目名称
- `artist` — 艺术家
- `driveId` — Google Drive 文件 ID（音频文件）
- `cover` — 封面图片（可选）：URL 直链 或 Google Drive 文件 ID
- `duration` — 时长（展示用，可选）
- `src` — 如果不用 Google Drive，可直接填音频 URL

### 4. 部署到 GitHub Pages

```bash
cd music-site
git init
git add .
git commit -m "init: music player"
git branch -M main
git remote add origin https://github.com/你的用户名/music-site.git
git push -u origin main
```

然后在 GitHub 仓库 → Settings → Pages → Source 选择 `main` 分支 → Save。

几分钟后即可通过 `https://你的用户名.github.io/music-site/` 访问。

## 功能

- 网页直接播放音频（无需下载）
- 键盘快捷键：空格播放/暂停，左右方向键切换曲目
- 进度条拖拽、音量调节
- 自动播放下一首
- 响应式设计，支持手机
- 均衡器动画指示当前播放

## 添加新曲目

只需编辑 `music.json`，在 `tracks` 数组中添加新条目，push 到 GitHub 即可生效。
