# 📰 每日新闻推送

根据你的兴趣标签，自动抓取并生成新闻页面。

## 🔗 访问你的新闻页面

**https://zakizel.github.io/news**

> 每天凌晨 3 点自动更新

## 📁 项目结构

```
news-daily/
├── config.yaml              # 兴趣标签配置（修改这里自定义内容）
├── package.json             # Node.js 依赖配置
├── index.html               # 生成的新闻页面
├── scripts/
│   ├── fetch-news.js       # 抓取新闻
│   └── generate-html.js    # 生成 HTML
└── .github/
    └── workflows/
        └── daily-news.yml  # 每日定时任务
```

## ✏️ 自定义配置

编辑 `config.yaml` 来自定义你的兴趣标签：

```yaml
tags:
  AI:
    keywords:
      - 大模型
      - LLM
      - GPT
      - AI创业
    sources:
      - hackernews
      - zhihu

  金融:
    keywords:
      - 快手股票
      - 比特币
    sources:
      - zhihu
```

### 支持的来源

| 来源 | 说明 |
|------|------|
| `hackernews` | Hacker News 科技新闻 |
| `zhihu` | 知乎热榜 |
| `github` | GitHub 开源项目 |

### 支持的标签

| 标签 | 图标 |
|------|------|
| AI | 🤖 |
| 金融 | 💰 |
| 前端 | 💻 |
| 开源 | 📦 |
| 后端 | ⚙️ |
| 移动端 | 📱 |
| 安全 | 🔒 |
| 数据科学 | 📊 |

## 🚀 部署到自己仓库

1. **Fork 这个仓库** 或新建一个空仓库

2. **开启 GitHub Pages**
   - 进入仓库 `Settings` → `Pages`
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `gh-pages` / `main`

3. **推送代码**（如果是新建仓库）

4. **等待首次运行**
   - 去 `Actions` 标签页查看运行状态
   - 完成后访问 `https://你的用户名.github.io/news`

## ⏰ 运行时间

- 自动运行：每天 **北京时间 3:00**
- 手动触发：在 `Actions` 页面点击 `Daily News` → `Run workflow`

## 🔧 本地测试

```bash
cd news-daily
npm install
npm run build
# 然后直接打开 index.html 查看效果
```

## ❓ 常见问题

**Q: 页面没更新？**
- 检查 `Actions` 标签页是否有错误日志
- 确认 GitHub Pages 已开启

**Q: 想增加更多标签？**
- 在 `config.yaml` 的 `tags` 下添加新标签
- 关键词会自动匹配新闻标题

**Q: 想改运行时间？**
- 编辑 `.github/workflows/daily-news.yml` 中的 cron 表达式
- `0 19 * * *` 表示每天 19:00 UTC = 北京时间次日 3:00
