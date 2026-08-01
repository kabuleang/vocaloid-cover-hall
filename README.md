# 声之回响 · 虚拟歌手翻唱作品管理平台

一个纯静态的翻唱作品管理网站：上传封面与 MP3/WAV，站内直接试听与编辑，作品数据持久保存在 GitHub 仓库中公开分享。无需后端服务器。

## 功能

- 📤 **站内上传**：上传封面图片 + 音频（MP3/WAV，单文件 ≤ 25MB），通过 GitHub API 写入仓库
- ▶️ **站内试听**：点击卡片查看详情，用内置播放器直接播放，无任何外部链接
- ✎ **自由编辑**：随时修改作品信息、替换封面/音频、删除作品，保存后立即同步
- 🎛 **编辑器维度**：Synthesizer V、ACE Studio、VOCALOID、UTAU、X Studio 预设，也可自由输入自定义编辑器
- 🔍 **检索**：按编辑器/曲风筛选、搜索（作品名/原曲/原唱/编辑器/曲风）、按最新添加或标题排序
- ❤️ **本机收藏**：收藏记录保存在浏览器 localStorage
- 📱 **响应式布局**：桌面 / 平板 / 手机自适应

## 作品如何保存

- 元数据统一存放在仓库 `works/works.json`（JSON 数组）
- 封面与音频存放在 `works/{作品ID}/cover-{时间戳}.扩展名`、`audio-{时间戳}.扩展名`
- 文件名带时间戳，替换文件时不会受 CDN 缓存影响；被替换的旧文件会自动尝试删除
- 访客无需任何配置即可浏览与播放；上传 / 编辑 / 删除需要访问令牌

## 配置访问令牌（仅站长需要）

1. 打开网站，点击右上角 **⚙ 设置**
2. 填写仓库 `owner`（kabuleang）与 `repo`（vocaloid-cover-hall）
3. 创建并粘贴 fine-grained PAT：
   - GitHub → **Settings → Developer settings → Fine-grained personal access tokens → Generate new token**
   - Repository access 选择 **Only select repositories**（仅勾选本仓库）
   - Permissions 中勾选 **Contents: Read and write**
4. 点击“测试连接”，确认成功后可点击“保存设置”

令牌仅保存在当前浏览器的 localStorage 中，**不会写入仓库代码**。清除浏览器数据后需重新填写。

## 本地运行

纯静态页面，无需构建：

```bash
python -m http.server 8000
```

访问 `http://localhost:8000`。注意：页面通过 GitHub API 读写数据，需在可联网环境使用。

## 目录结构

```text
index.html        页面结构（上传表单、详情弹窗、设置面板）
css/style.css     样式
js/data.js        编辑器预设
js/main.js        GitHub API 管线、渲染、交互
works/works.json  作品元数据（初始为空）
```

## 限制与说明

- 上传受 GitHub API 限制：单文件 ≤ 25MB；建议使用 MP3（WAV 体积较大）
- 匿名访问 GitHub API 有频率限制（60 次/小时/IP），读取失败时页面会自动降级到 raw 文件
- 请上传你拥有相应授权或自行制作的翻唱作品；作品与音频在 GitHub 仓库中公开可见

## 部署

项目为纯静态站点，已通过 GitHub Pages 托管：<https://kabuleang.github.io/vocaloid-cover-hall/>
