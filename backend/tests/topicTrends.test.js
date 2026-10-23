const { buildTopicTrends, extractKeywords } = require('../services/topicTrendService');

describe('topic trend detection', () => {
  const now = new Date('2026-10-20T12:00:00.000Z');
  const article = (id, title, publishedAt, extra = {}) => ({ _id: id, title, description: '', content: '', category: 'Technology', tags: [], status: 'published', publishedAt, ...extra });

  test('normalizes and merges duplicated multiword topics and counts published articles only', () => {
    const topics = buildTopicTrends([
      article('1', 'Artificial Intelligence for Education', '2026-10-18T12:00:00Z', { tags: ['ARTIFICIAL-INTELLIGENCE'] }),
      article('2', 'Artificial Intelligence in Healthcare', '2026-10-17T12:00:00Z', { tags: ['Artificial Intelligence'] }),
      { ...article('3', 'Artificial Intelligence unpublished', '2026-10-18T12:00:00Z'), status: 'draft' },
    ], now);
    const topic = topics.find((item) => item.name.toLowerCase() === 'artificial intelligence');
    expect(topic.articleCount).toBe(2);
    expect(topic.recentArticles).toBe(2);
    expect(topic.previousArticles).toBe(0);
    expect(topic.trend).toBe('Rising');
    expect(topic.growthPercent).toBeNull();
  });

  test('uses content, returns available engagement only, and caps related articles at five', () => {
    const articles = Array.from({ length: 6 }, (_, index) => article(String(index), `Story ${index}`, '2026-10-18T12:00:00Z', {
      title: `Story ${index}`, content: 'Climate resilience climate policy', views: index + 1, likes: 2,
    }));
    const topic = buildTopicTrends(articles, now).find((item) => item.name.toLowerCase() === 'climate');
    expect(topic.articleCount).toBe(6);
    expect(topic.articles).toHaveLength(5);
    expect(topic.engagement).toEqual({ views: 21, likes: 12 });
    expect(topic.popular).toBe(true);
  });

  test('classifies comparable windows as rising, steady, cooling, and insufficient', () => {
    const topics = buildTopicTrends([
      article('r1', 'Rising orchid', '2026-10-18T12:00:00Z'), article('r2', 'Rising orchid', '2026-10-17T12:00:00Z'), article('r3', 'Rising orchid', '2026-10-10T12:00:00Z'),
      article('s1', 'Steady maple', '2026-10-18T12:00:00Z'), article('s2', 'Steady maple', '2026-10-10T12:00:00Z'),
      article('c1', 'Cooling cedar', '2026-10-10T12:00:00Z'), article('c2', 'Cooling cedar', '2026-10-09T12:00:00Z'),
      article('u1', 'Undated topic', null),
    ], now);
    const trendFor = (name) => topics.find((topic) => topic.name.toLowerCase() === name).trend;
    expect(trendFor('rising')).toBe('Rising');
    expect(trendFor('steady')).toBe('Steady');
    expect(trendFor('cooling')).toBe('Cooling');
    expect(trendFor('undated')).toBe('Insufficient data');
  });

  test('does not call a topic steady when it has no activity in either comparison window', () => {
    const topics = buildTopicTrends([
      article('old', 'Legacy archive article', '2026-10-01T12:00:00Z', { tags: ['Legacy Archive'] }),
      article('current', 'Current orchid report', '2026-10-20T12:00:00Z'),
    ], now);
    const legacy = topics.find((topic) => topic.name === 'Legacy Archive');
    expect(legacy.recentArticles).toBe(0);
    expect(legacy.previousArticles).toBe(0);
    expect(legacy.trend).toBe('Insufficient data');
  });

  test('ignores punctuation and stop words and handles empty datasets', () => {
    expect(extractKeywords({ title: 'The!!! climate, CLIMATE trends', content: '' }).filter((item) => item.key === 'climate')).toHaveLength(1);
    expect(buildTopicTrends([], now)).toEqual([]);
    expect(buildTopicTrends([{ title: 'Draft stories', status: 'draft' }], now)).toEqual([]);
  });

  test('preserves meaningful curated tags containing stop words', () => {
    const keywords = extractKeywords({
      title: 'Classroom learning update',
      content: '',
      tags: ['Artificial Intelligence in Education', '  ARTIFICIAL-intelligence IN education  '],
    });
    expect(keywords.filter((item) => item.key === 'artificial intelligence in education')).toHaveLength(1);
    const topics = buildTopicTrends([
      article('tagged', 'Artificial Intelligence in Education 01', '2026-10-19T12:00:00Z', {
        tags: ['Artificial Intelligence in Education'],
      }),
    ], now);
    expect(topics.some((topic) => topic.name.toLowerCase() === 'artificial intelligence in education')).toBe(true);
  });
});
