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
            font-family: 'Times New Roman', Georgia, 'Noto Serif SC', serif;
            background: #f5f1eb;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #d4c5b0; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; font-weight: bold; letter-spacing: 4px; margin-bottom: 10px; }
        .header .date { font-size: 0.9em; color: #666; font-style: italic; }
        .header .edition { font-size: 0.8em; color: #999; margin-top: 5px; }
        .tag-section { margin-bottom: 30px; border: 1px solid #d4c5b0; padding: 20px; background: #faf8f5; }
        .tag-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .tag-icon { font-size: 1.2em; margin-right: 8px; }
        .tag-title { font-size: 1.3em; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
        .news-item { padding: 10px 0; border-bottom: 1px dotted #ccc; }
        .news-item:last-child { border-bottom: none; }
        .news-item a { color: #333; text-decoration: none; display: block; }
        .news-item a:hover { color: #8b4513; }
        .news-title { font-size: 1.05em; margin-bottom: 4px; }
        .news-meta { font-size: 0.8em; color: #888; font-style: italic; }
        .news-meta span { margin-right: 12px; }
        .empty-tag { color: #999; font-style: italic; text-align: center; padding: 20px; }
        .footer { text-align: center; border-top: 2px solid #333; padding-top: 20px; margin-top: 30px; font-size: 0.85em; color: #666; }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            .header h1 { font-size: 1.8em; letter-spacing: 2px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>每日新闻</h1>
            <div class="date">${today}</div>
            <div class="edition">第一版 | 珍藏版</div>
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
