const { buildTopicTrends } = require('../services/topicTrendService');
const {
  enrichTopicTrends,
  REQUEST_TIMEOUT_MS,
  REQUEST_RETRY_OPTIONS,
  resetForTests,
  safeProviderError,
  setClientFactoryForTests,
} = require('../services/geminiTopicService');

describe('Gemini topic enrichment', () => {
  const now = new Date('2026-10-21T12:00:00.000Z');
  const articles = [
    { _id: 'ai-1', title: 'Artificial Intelligence reaches the classroom', description: 'AI tutors help students.', content: '', category: 'Education', tags: ['Artificial Intelligence', 'Education AI'], status: 'published', publishedAt: '2026-10-20T12:00:00.000Z', views: 12, likes: 2 },
    { _id: 'ai-2', title: 'AI education tools for teachers', description: 'AI learning tools.', content: '', category: 'Education', tags: ['Artificial Intelligence', 'Education AI'], status: 'published', publishedAt: '2026-10-18T12:00:00.000Z', views: 8, likes: 1 },
    { _id: 'draft', title: 'Artificial Intelligence draft', description: '', content: '', category: 'Education', tags: ['Artificial Intelligence', 'Education AI'], status: 'draft', publishedAt: '2026-10-20T12:00:00.000Z', views: 1000 },
  ];
  let originalKey;

  beforeEach(() => {
    resetForTests();
    originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetForTests();
    setClientFactoryForTests(async () => {
      const { GoogleGenAI } = await import('@google/genai');
      return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    });
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  function validResponseFactory() {
    return async () => ({ models: { generateContent: async ({ contents }) => {
      const candidateData = JSON.parse(contents.split('Candidate data:\n')[1]);
      const aiNames = candidateData.filter((topic) => ['artificial intelligence', 'education ai'].includes(topic.name.toLowerCase()));
      const groups = [{ canonicalTopic: 'Artificial Intelligence Education', sourceTopics: aiNames.map((topic) => topic.name), summary: 'Published articles discuss AI-supported education.', explanation: 'The supplied articles show two recent publications; no historical engagement comparison is available.' }];
      candidateData.filter((topic) => !aiNames.includes(topic)).forEach((topic) => groups.push({ canonicalTopic: topic.name, sourceTopics: [topic.name], summary: `Articles mention ${topic.name}.`, explanation: `The supplied article evidence includes ${topic.name}.` }));
      return { text: JSON.stringify({ groups }) };
    } } });
  }

  test('groups similar topics from supplied evidence and recomputes unique article metrics deterministically', async () => {
    setClientFactoryForTests(validResponseFactory());
    const baseline = buildTopicTrends(articles, now);
    const result = await enrichTopicTrends(articles, now);
    const combined = result.topics.find((topic) => topic.name === 'Artificial Intelligence Education');
    expect(result.aiEnhanced).toBe(true);
    expect(combined).toMatchObject({ aiEnhanced: true, articleCount: 2, recentArticles: 2, previousArticles: 0, trend: 'Rising', engagement: { views: 20, likes: 3 } });
    expect(combined.articles.map((article) => article._id)).toEqual(['ai-1', 'ai-2']);
    expect(combined.summary).toContain('AI-supported');
    expect(baseline.find((topic) => topic.name === 'Artificial Intelligence').articleCount).toBe(2);
    expect(combined.articleCount).not.toBe(4);
  });

  test('rejects malformed or incomplete output and returns rule-based results', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    setClientFactoryForTests(async () => ({ models: { generateContent: async () => ({ text: '{bad json' }) } }));
    const result = await enrichTopicTrends(articles, now);
    expect(result.aiEnhanced).toBe(false);
    expect(result.topics.every((topic) => topic.aiEnhanced === false && !topic.summary)).toBe(true);
    expect(result.topics.map(({ name, articleCount, trend }) => [name, articleCount, trend])).toEqual(buildTopicTrends(articles, now).map(({ name, articleCount, trend }) => [name, articleCount, trend]));
  });

  test('rejects incomplete source-topic mappings instead of dropping topics', async () => {
    setClientFactoryForTests(async () => ({ models: { generateContent: async () => ({ text: JSON.stringify({ groups: [{ canonicalTopic: 'Artificial Intelligence', sourceTopics: ['Artificial Intelligence'], summary: 'Summary.', explanation: 'Evidence.' }] }) }) } }));
    const result = await enrichTopicTrends(articles, now);
    expect(result.aiEnhanced).toBe(false);
    expect(result.topics.map(({ name, articleCount, trend }) => [name, articleCount, trend])).toEqual(buildTopicTrends(articles, now).map(({ name, articleCount, trend }) => [name, articleCount, trend]));
  });

  test('missing API key skips provider and returns rule-based results', async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = jest.fn();
    setClientFactoryForTests(provider);
    const result = await enrichTopicTrends(articles, now);
    expect(provider).not.toHaveBeenCalled();
    expect(result.aiEnhanced).toBe(false);
    expect(result.topics).toEqual(expect.arrayContaining([expect.objectContaining({ aiEnhanced: false })]));
  });

  test('provider diagnostics include safe HTTP details and redact credentials', () => {
    const error = new Error(JSON.stringify({ error: { code: 400, status: 'INVALID_ARGUMENT', message: `Rejected key=${process.env.GEMINI_API_KEY}` } }));
    error.status = 400;
    expect(safeProviderError(error)).toEqual({
      name: 'Error',
      message: 'Rejected key=[REDACTED]',
      httpStatus: 400,
      code: 'INVALID_ARGUMENT',
    });
    expect(JSON.stringify(safeProviderError(error))).not.toContain(process.env.GEMINI_API_KEY);
  });

  test('allows enough time for Gemini analysis and logs safe 504 diagnostics on timeout', async () => {
    expect(REQUEST_TIMEOUT_MS).toBe(30_000);
    expect(REQUEST_RETRY_OPTIONS).toMatchObject({ attempts: 2, httpStatusCodes: [408, 429, 500, 502, 503, 504] });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    setClientFactoryForTests(async () => ({ models: { generateContent: async () => {
      const error = new Error('Deadline expired before operation could complete.');
      error.name = 'ApiError';
      error.status = 504;
      error.code = 'DEADLINE_EXCEEDED';
      throw error;
    } } }));
    const result = await enrichTopicTrends(articles, now);
    expect(result.aiEnhanced).toBe(false);
    expect(warn).toHaveBeenCalledWith('[Topic Trends] Gemini enrichment unavailable; using deterministic analysis.', {
      name: 'ApiError',
      message: 'Deadline expired before operation could complete.',
      httpStatus: 504,
      code: 'DEADLINE_EXCEEDED',
    });
  });

  test.each(['rate limit', 'timeout', 'provider failure'])('provider %s safely falls back', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    setClientFactoryForTests(async () => ({ models: { generateContent: async () => { throw new Error('provider unavailable'); } } }));
    const result = await enrichTopicTrends(articles, now);
    expect(result.aiEnhanced).toBe(false);
    expect(result.topics.map(({ name, articleCount, trend }) => [name, articleCount, trend])).toEqual(buildTopicTrends(articles, now).map(({ name, articleCount, trend }) => [name, articleCount, trend]));
  });

  test('uses cached enrichment for repeated requests', async () => {
    const factory = jest.fn(validResponseFactory());
    setClientFactoryForTests(factory);
    await enrichTopicTrends(articles, now);
    await enrichTopicTrends(articles, now);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
