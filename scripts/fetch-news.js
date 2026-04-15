/**
 * 新闻获取脚本
 * 支持 RSS 订阅源、东方财富 API、Hacker News API
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', 'config.yaml');
const OUTPUT_PATH = path.join(__dirname, '..', 'news_data.json');

// 加载配置
function loadConfig() {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  return yaml.load(configContent);
}

// 简单 RSS 解析（用正则）
function parseRSS(xmlString, sourceName) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
  const linkRegex = /<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i;
  const dateRegex = /<pubDate[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i;

  let match;
  while ((match = itemRegex.exec(xmlString)) !== null && items.length < 30) {
    const itemXml = match[1];
    const titleMatch = titleRegex.exec(itemXml);
    const linkMatch = linkRegex.exec(itemXml);
    const dateMatch = dateRegex.exec(itemXml);

    if (titleMatch) {
      const title = titleMatch[1].trim().replace(/<[^>]+>/g, '');
      const link = linkMatch ? linkMatch[1].trim() : '';
      const pubDate = dateMatch ? dateMatch[1].trim() : '';

      let time = '';
      if (pubDate) {
        const date = new Date(pubDate);
        if (!isNaN(date)) {
          time = date.toISOString().slice(0, 16).replace('T', ' ');
        }
      }

      items.push({ title, link, source: sourceName, time });
    }
  }
  return items;
}

// 从 RSS 源获取新闻
async function fetchFromRSS(sourceConfig, keywords) {
  const news = [];
  try {
    const response = await axios.get(sourceConfig.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const items = parseRSS(response.data, sourceConfig.name || 'RSS');

    for (const item of items) {
      const text = `${item.title}`.toLowerCase();
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          news.push({
            title: item.title,
            url: item.link || '#',
            source: item.source,
            time: item.time,
            score: 0
          });
          break;
        }
      }
    }
  } catch (e) {
    console.error(`RSS fetch error (${sourceConfig.name}):`, e.message);
  }
  return news;
}

// 从东方财富获取数据
async function fetchFromEastMoney(tagConfig) {
  const news = [];
  const keywords = tagConfig.keywords || [];

  try {
    // 获取 A股 涨幅榜
    const response = await axios.get(
      'https://push2.eastmoney.com/api/qt/clist/get',
      {
        params: {
          pn: 1,
          pz: 50,
          po: 1,
          np: 1,
          fltt: 2,
          invt: 2,
          fid: 'f3',
          fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
          fields: 'f2,f3,f12,f14',
          _: Date.now()
        },
        timeout: 10000,
        headers: {
          'Referer': 'https://quote.eastmoney.com/',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const data = response.data;
    if (data && data.data && data.data.diff) {
      const stocks = data.data.diff;

      for (const stock of stocks.slice(0, 50)) {
        const stockName = stock.f14 || '';
        const stockCode = stock.f12 || '';
        const changePercent = stock.f3 || 0;
        const price = stock.f2 || 0;

        // 检查是否匹配关键词
        for (const kw of keywords) {
          const kwLower = kw.toLowerCase();
          if (stockName.toLowerCase().includes(kwLower) ||
              stockCode.includes(kw) ||
              kwLower.includes('比特币') && (stockName.includes('BTC') || stockName.includes('比特'))) {

            const changeEmoji = changePercent >= 0 ? '🔴' : '🟢';
            const changeSign = changePercent >= 0 ? '+' : '';

            news.push({
              title: `${stockName} (${stockCode}) ${changeEmoji} ${changeSign}${changePercent}% 现价:${price}`,
              url: `https://quote.eastmoney.com/sh${stockCode}.html`,
              source: '东方财富',
              time: new Date().toISOString().slice(0, 10),
              score: changePercent
            });
            break;
          }
        }
      }
    }
  } catch (e) {
    console.error('EastMoney fetch error:', e.message);
  }

  return news;
}

// 从 Hacker News 获取新闻
async function fetchHackerNews(tagConfig) {
  const news = [];
  const keywords = tagConfig.keywords || [];

  try {
    const response = await axios.get(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { timeout: 10000 }
    );
    const topIds = response.data.slice(0, 30);

    for (const storyId of topIds.slice(0, 15)) {
      try {
        const storyRes = await axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`,
          { timeout: 10000 }
        );
        const story = storyRes.data;

        if (!story || !story.title) continue;

        const title = story.title;
        const text = title.toLowerCase();

        for (const kw of keywords) {
          if (text.includes(kw.toLowerCase())) {
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

// 聚合所有新闻
async function fetchAllNews(config) {
  const allNews = {};
  const tags = config.tags || {};

  for (const [tagName, tagConfig] of Object.entries(tags)) {
    const tagNews = [];
    const sources = tagConfig.sources || [];

    // 1. RSS 源
    const rssSources = config.rss_sources || [];
    if (sources.includes('rss')) {
      for (const rssSource of rssSources) {
        const items = await fetchFromRSS(rssSource, tagConfig.keywords || []);
        tagNews.push(...items);
      }
    }

    // 2. 东方财富
    if (sources.includes('eastmoney')) {
      const items = await fetchFromEastMoney(tagConfig);
      tagNews.push(...items);
    }

    // 3. Hacker News
    if (sources.includes('hackernews')) {
      const items = await fetchHackerNews(tagConfig);
      tagNews.push(...items);
    }

    // 去重（按标题）
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

// 主函数
async function main() {
  console.log('Loading config...');
  const config = loadConfig();
  console.log('Config loaded:', JSON.stringify(Object.keys(config.tags || {})));

  console.log('Fetching news...');
  const news = await fetchAllNews(config);

  console.log('Writing news data to:', OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(news, null, 2), 'utf8');

  console.log(`Fetched news for tags: ${Object.keys(news).join(', ')}`);
  for (const [tag, items] of Object.entries(news)) {
    console.log(`  ${tag}: ${items.length} items`);
  }
}

main().catch(console.error);
