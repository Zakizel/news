"""
生成 HTML 页面的脚本
"""
import json
import yaml
from datetime import datetime
from typing import Dict, List

TAG_ICONS = {
    'AI': '🤖',
    '金融': '💰',
    '前端': '💻',
    '开源': '📦',
    '后端': '⚙️',
    '移动端': '📱',
    '安全': '🔒',
    '数据科学': '📊',
}

def load_config():
    with open('config.yaml', 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def load_news():
    with open('news_data.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_html(news_data: Dict, config: Dict) -> str:
    today = datetime.now().strftime('%Y-%m-%d')

    html_parts = [
        f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻 - {today}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}

        .container {{
            max-width: 900px;
            margin: 0 auto;
        }}

        .header {{
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }}

        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }}

        .header p {{
            font-size: 1.2em;
            opacity: 0.9;
        }}

        .tag-section {{
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }}

        .tag-header {{
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #f0f0f0;
        }}

        .tag-icon {{
            font-size: 1.8em;
        }}

        .tag-title {{
            font-size: 1.4em;
            color: #333;
            font-weight: 600;
        }}

        .news-item {{
            padding: 12px 0;
            border-bottom: 1px solid #f5f5f5;
        }}

        .news-item:last-child {{
            border-bottom: none;
        }}

        .news-item a {{
            color: #333;
            text-decoration: none;
            display: block;
            transition: all 0.2s;
        }}

        .news-item a:hover {{
            color: #667eea;
            transform: translateX(5px);
        }}

        .news-title {{
            font-size: 1.1em;
            line-height: 1.5;
            margin-bottom: 6px;
        }}

        .news-meta {{
            font-size: 0.85em;
            color: #999;
        }}

        .news-meta span {{
            margin-right: 15px;
        }}

        .empty-tag {{
            color: #999;
            font-style: italic;
        }}

        .footer {{
            text-align: center;
            color: white;
            margin-top: 30px;
            opacity: 0.8;
        }}

        @media (max-width: 600px) {{
            body {{
                padding: 10px;
            }}

            .header h1 {{
                font-size: 1.8em;
            }}

            .tag-section {{
                padding: 16px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 每日新闻</h1>
            <p>{today}</p>
        </div>
'''
    ]

    for tag_name, tag_config in config.get('tags', {}).items():
        icon = TAG_ICONS.get(tag_name, '📌')
        tag_news = news_data.get(tag_name, [])

        html_parts.append(f'''
        <div class="tag-section">
            <div class="tag-header">
                <span class="tag-icon">{icon}</span>
                <span class="tag-title">{tag_name}</span>
            </div>
''')

        if tag_news:
            for item in tag_news[:10]:  # 每个标签最多显示10条
                meta_parts = [f"来源: {item.get('source', 'Unknown')}"]
                if 'time' in item:
                    meta_parts.append(item['time'])
                if 'score' in item:
                    meta_parts.append(f"⭐ {item['score']}")
                if 'stars' in item:
                    meta_parts.append(f"⭐ {item['stars']}")
                if 'heat' in item:
                    meta_parts.append(f"👁 {item['heat']}")

                meta = ' | '.join(meta_parts)
                url = item.get('url', '#')
                title = item.get('title', '无标题')

                html_parts.append(f'''
            <div class="news-item">
                <a href="{url}" target="_blank" rel="noopener">
                    <div class="news-title">{title}</div>
                    <div class="news-meta">{meta}</div>
                </a>
            </div>
''')
        else:
            html_parts.append('''
            <div class="empty-tag">今日暂无相关更新</div>
''')

        html_parts.append('        </div>')

    html_parts.append(f'''
        <div class="footer">
            <p>由 GitHub Actions 自动生成 | 更新时间: {datetime.now().strftime('%H:%M:%S')}</p>
        </div>
    </div>
</body>
</html>
''')

    return ''.join(html_parts)

def main():
    config = load_config()
    news_data = load_news()
    html = generate_html(news_data, config)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"Generated index.html with {sum(len(v) for v in news_data.values())} news items")

if __name__ == '__main__':
    main()
