/**
 * 新闻获取脚本
 * 从不同来源抓取新闻，按标签关键词过滤
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', 'config.yaml');
const OUTPUT_PATH = path.join(__dirname, '..', 'news_data.json');

function loadConfig() {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  return yaml.load(configContent);
}

async function fetchHackerNews(tagConfig) {
  const news = [];
  try {
    const response = await axios.get(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { timeout: 10000 }
    );
    const topIds = response.data.slice(0, 30);

    for (const storyId of topIds) {
      try {
        const storyRes = await axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`,
          { timeout: 10000 }
        );
        const story = storyRes.data;

        if (!story || !story.title) continue;

        const title = story.title;
        const keywords = tagConfig.keywords || [];

        for (const kw of keywords) {
          if (kw.toLowerCase().includes(kw.toLowerCase()) && title.toLowerCase().includes(kw.toLowerCase())) {
            news.push({
              title: title,
              url: story.url || `https://news.ycombinator.com/item?id=${storyId}`,
              source: 'Hacker News',
              time: new Date(story.time * 1000).toISOString().slice(0, 16).replace('T', ' '),
              score: story.score || 0
            });
            break;
          }
        }
      } catch (e) {
        // Skip individual story errors
      }
    }
  } catch (e) {
    console.error('HackerNews fetch error:', e.message);
  }
  return news;
}

async function fetchZhihu(tagConfig) {
  const news = [];
  try {
    const response = await axios.get(
      'https://api.zhihu.com/topstory/hot-lists/total?limit=20',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-API-Version': '3.0.40'
        },
        timeout: 10000
      }
    );

    const items = response.data?.data || [];
    const keywords = tagConfig.keywords || [];

    for (const item of items) {
      const target = item.target || {};
      const title = target.title || '';

      for (const kw of keywords) {
        if (title.includes(kw)) {
          news.push({
            title: title,
            url: target.url || 'https://www.zhihu.com',
            source: '知乎',
            time: new Date().toISOString().slice(0, 10),
            heat: target.follower_count || 0
          });
          break;
        }
      }
    }
  } catch (e) {
    console.error('Zhihu fetch error:', e.message);
  }
  return news;
}

async function fetchGithub(tagConfig) {
  const news = [];
  try {
    const query = (tagConfig.keywords || []).join(' ');
    const response = await axios.get(
      'https://api.github.com/search/repositories',
      {
        params: {
          q: `${query} created:>2024-01-01`,
          sort: 'stars',
          per_page: 10
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000
      }
    );

    const items = response.data?.items || [];
    for (const item of items) {
      news.push({
        title: `${item.name}: ${item.description || 'No description'}`,
        url: item.html_url,
        source: 'GitHub',
        time: item.created_at?.slice(0, 10) || '',
        stars: item.stargazers_count || 0
      });
    }
  } catch (e) {
    console.error('GitHub fetch error:', e.message);
  }
  return news;
}

async function fetchAllNews(config) {
  const allNews = {};
  const tags = config.tags || {};

  for (const [tagName, tagConfig] of Object.entries(tags)) {
    const tagNews = [];
    const sources = tagConfig.sources || [];

    const fetchPromises = [];
    if (sources.includes('hackernews')) fetchPromises.push(fetchHackerNews(tagConfig));
    if (sources.includes('zhihu')) fetchPromises.push(fetchZhihu(tagConfig));
    if (sources.includes('github')) fetchPromises.push(fetchGithub(tagConfig));

    const results = await Promise.allSettled(fetchPromises);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        tagNews.push(...result.value);
      }
    }

    // 去重
    const seen = new Set();
    const uniqueNews = tagNews.filter(n => {
      if (seen.has(n.title)) return false;
      seen.add(n.title);
      return true;
    });

    allNews[tagName] = uniqueNews;
  }

  return allNews;
}

async function main() {
  console.log('Loading config...');
  const config = loadConfig();

  console.log('Fetching news...');
  const news = await fetchAllNews(config);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(news, null, 2), 'utf8');

  console.log(`Fetched news for tags: ${Object.keys(news).join(', ')}`);
  for (const [tag, items] of Object.entries(news)) {
    console.log(`  ${tag}: ${items.length} items`);
  }
}

main().catch(console.error);
