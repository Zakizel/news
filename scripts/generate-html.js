/**
 * 生成 HTML 页面的脚本
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', 'config.yaml');
const NEWS_DATA_PATH = path.join(__dirname, '..', 'news_data.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'index.html');

const TAG_ICONS = {
  'AI': '🤖',
  '金融': '💰',
  '前端': '💻',
  '开源': '📦',
  '后端': '⚙️',
  '移动端': '📱',
  '安全': '🔒',
  '数据科学': '📊',
};

function loadConfig() {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  return yaml.load(configContent);
}

function loadNews() {
  const newsContent = fs.readFileSync(NEWS_DATA_PATH, 'utf8');
  return JSON.parse(newsContent);
}

function generateHtml(newsData, config) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString().slice(11, 19);

  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻 - ${today}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .header { text-align: center; color: white; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .tag-section {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .tag-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #f0f0f0;
        }
        .tag-icon { font-size: 1.8em; }
        .tag-title { font-size: 1.4em; color: #333; font-weight: 600; }
        .news-item { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .news-item:last-child { border-bottom: none; }
        .news-item a {
            color: #333;
            text-decoration: none;
            display: block;
            transition: all 0.2s;
        }
        .news-item a:hover { color: #667eea; transform: translateX(5px); }
        .news-title { font-size: 1.1em; line-height: 1.5; margin-bottom: 6px; }
        .news-meta { font-size: 0.85em; color: #999; }
        .news-meta span { margin-right: 15px; }
        .empty-tag { color: #999; font-style: italic; }
        .footer { text-align: center; color: white; margin-top: 30px; opacity: 0.8; }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .header h1 { font-size: 1.8em; }
            .tag-section { padding: 16px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 每日新闻</h1>
            <p>${today}</p>
        </div>
`;

  const tags = config.tags || {};

  for (const [tagName, tagConfig] of Object.entries(tags)) {
    const icon = TAG_ICONS[tagName] || '📌';
    const tagNews = newsData[tagName] || [];

    html += `
        <div class="tag-section">
            <div class="tag-header">
                <span class="tag-icon">${icon}</span>
                <span class="tag-title">${tagName}</span>
            </div>
`;

    if (tagNews.length > 0) {
      for (const item of tagNews.slice(0, 10)) {
        const metaParts = [`来源: ${item.source || 'Unknown'}`];
        if (item.time) metaParts.push(item.time);
        if (item.score) metaParts.push(`⭐ ${item.score}`);
        if (item.stars) metaParts.push(`⭐ ${item.stars}`);
        if (item.heat) metaParts.push(`👁 ${item.heat}`);
        const meta = metaParts.join(' | ');
        const url = item.url || '#';
        const title = item.title || '无标题';

        html += `
            <div class="news-item">
                <a href="${url}" target="_blank" rel="noopener">
                    <div class="news-title">${title}</div>
                    <div class="news-meta">${meta}</div>
                </a>
            </div>
`;
      }
    } else {
      html += `            <div class="empty-tag">今日暂无相关更新</div>\n`;
    }

    html += `        </div>\n`;
  }

  html += `
        <div class="footer">
            <p>由 GitHub Actions 自动生成 | 更新时间: ${now}</p>
        </div>
    </div>
</body>
</html>
`;

  return html;
}

function main() {
  console.log('Loading config and news data...');
  const config = loadConfig();
  const newsData = loadNews();
  const html = generateHtml(newsData, config);

  console.log('Writing HTML to:', OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, html, 'utf8');

  const totalItems = Object.values(newsData).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`Generated index.html with ${totalItems} news items`);
}

main();
