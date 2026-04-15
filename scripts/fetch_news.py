"""
新闻获取脚本
从不同来源抓取新闻，按标签关键词过滤
"""
import requests
import yaml
import json
import re
from datetime import datetime
from typing import List, Dict

def load_config():
    with open('config.yaml', 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def fetch_hackernews(tag_config: Dict) -> List[Dict]:
    """从 Hacker News 获取新闻"""
    news = []
    try:
        # 获取 Top Stories
        top_ids = requests.get(
            'https://hacker-news.firebaseio.com/v0/topstories.json',
            timeout=10
        ).json()[:30]  # 只取前30条

        for story_id in top_ids:
            try:
                story = requests.get(
                    f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json',
                    timeout=10
                ).json()

                if not story or 'title' not in story:
                    continue

                title = story.get('title', '')
                keywords = tag_config.get('keywords', [])

                # 检查标题是否匹配关键词
                for kw in keywords:
                    if kw.lower() in title.lower():
                        news.append({
                            'title': title,
                            'url': story.get('url', f'https://news.ycombinator.com/item?id={story_id}'),
                            'source': 'Hacker News',
                            'time': datetime.fromtimestamp(story.get('time', 0)).strftime('%Y-%m-%d %H:%M'),
                            'score': story.get('score', 0)
                        })
                        break
            except Exception:
                continue
    except Exception as e:
        print(f"HackerNews fetch error: {e}")

    return news

def fetch_zhihu(tag_config: Dict) -> List[Dict]:
    """从知乎热榜获取新闻"""
    news = []
    try:
        resp = requests.get(
            'https://api.zhihu.com/topstory/hot-lists/total?limit=20',
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'X-API-Version': '3.0.40'
            },
            timeout=10
        )

        if resp.status_code == 200:
            data = resp.json()
            items = data.get('data', [])

            for item in items:
                target = item.get('target', {})
                title = target.get('title', '')
                keywords = tag_config.get('keywords', [])

                for kw in keywords:
                    if kw in title:
                        news.append({
                            'title': title,
                            'url': target.get('url', 'https://www.zhihu.com'),
                            'source': '知乎',
                            'time': datetime.now().strftime('%Y-%m-%d'),
                            'heat': target.get('follower_count', 0)
                        })
                        break
    except Exception as e:
        print(f"Zhihu fetch error: {e}")

    return news

def fetch_github_trending(tag_config: Dict) -> List[Dict]:
    """从 GitHub Trending 获取开源项目"""
    news = []
    try:
        resp = requests.get(
            'https://api.github.com/search/repositories',
            params={
                'q': ' '.join(tag_config.get('keywords', [])) + ' created:>2024-01-01',
                'sort': 'stars',
                'per_page': 10
            },
            headers={
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout=10
        )

        if resp.status_code == 200:
            data = resp.json()
            for item in data.get('items', []):
                news.append({
                    'title': f"{item['name']}: {item['description'] or 'No description'}",
                    'url': item['html_url'],
                    'source': 'GitHub',
                    'time': item.get('created_at', '')[:10],
                    'stars': item.get('stargazers_count', 0)
                })
    except Exception as e:
        print(f"GitHub fetch error: {e}")

    return news

def fetch_all_news(config: Dict) -> Dict[str, List[Dict]]:
    """根据配置获取所有新闻"""
    all_news = {}

    for tag_name, tag_config in config.get('tags', {}).items():
        tag_news = []
        sources = tag_config.get('sources', [])

        if 'hackernews' in sources:
            tag_news.extend(fetch_hackernews(tag_config))
        if 'zhihu' in sources:
            tag_news.extend(fetch_zhihu(tag_config))
        if 'github' in sources:
            tag_news.extend(fetch_github_trending(tag_config))

        # 去重（按标题）
        seen = set()
        unique_news = []
        for n in tag_news:
            if n['title'] not in seen:
                seen.add(n['title'])
                unique_news.append(n)

        all_news[tag_name] = unique_news

    return all_news

if __name__ == '__main__':
    config = load_config()
    news = fetch_all_news(config)

    with open('news_data.json', 'w', encoding='utf-8') as f:
        json.dump(news, f, ensure_ascii=False, indent=2)

    print(f"Fetched news for tags: {list(news.keys())}")
    for tag, items in news.items():
        print(f"  {tag}: {len(items)} items")
