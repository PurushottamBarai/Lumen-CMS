const request = require('supertest');
const app = require('../server');
const {
  analyzeContent,
} = require('../services/contentQualityService');
const {
  generateContentSuggestions,
  parseSuggestions,
} = require('../services/aiContentSuggestionsService');

describe('Content quality analysis', () => {
  it('reports clarity and repeated terms in addition to readability and grammar', () => {
    const analysis = analyzeContent({
      title: 'A clear title',
      description: 'A short summary',
      content:
        'This is very vague stuff. This is very vague stuff. This is very vague stuff. This is very vague stuff. ' +
        'The report report confirms the result.',
      category: 'Science',
      tags: ['research'],
    });

    expect(analysis).toHaveProperty('readability.score');
    expect(analysis).toHaveProperty('grammar.issueCount');
    expect(analysis.clarity.issueCount).toBeGreaterThan(0);
    expect(analysis.repetition.repeatedTerms).toEqual(
      expect.arrayContaining([expect.objectContaining({ word: 'vague' })])
    );
  });
});

describe('AI content suggestion response validation', () => {
  const validResponse = {
    titleSuggestions: ['Title option one', 'Title option two', 'Title option three'],
    summary: 'A concise summary of the article.',
    keyTakeaways: ['First takeaway', 'Second takeaway'],
    tags: ['Research', 'Writing'],
    writingSuggestions: [
      {
        original: 'The original sentence.',
        replacement: 'The revised sentence.',
        reason: 'This is more direct.',
      },
    ],
  };

  it('validates and returns the required suggestion shape', () => {
    const suggestions = parseSuggestions(
      JSON.stringify(validResponse),
      'The original sentence. More article text.'
    );

    expect(suggestions.titleSuggestions).toHaveLength(3);
    expect(suggestions.summary).toBe(validResponse.summary);
    expect(suggestions.keyTakeaways).toHaveLength(2);
    expect(suggestions.tags).toEqual(validResponse.tags);
    expect(suggestions.writingSuggestions[0].original).toBe(
      'The original sentence.'
    );
  });

  describe('AI content suggestions API', () => {
    it('requires the existing authentication middleware', async () => {
      const response = await request(app)
        .post('/api/content-quality/suggestions')
        .send({ content: 'An article draft.' });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  it('rejects sentence edits that do not exactly match the article', () => {
    expect(() =>
      parseSuggestions(
        JSON.stringify(validResponse),
        'A different article sentence.'
      )
    ).toThrow(/does not match the article/);
  });

  it('requires three distinct alternative titles and at least two takeaways', () => {
    const duplicatedTitles = {
      ...validResponse,
      titleSuggestions: ['Same title', 'Same title', 'Third title'],
    };

    expect(() =>
      parseSuggestions(
        JSON.stringify(duplicatedTitles),
        'The original sentence. Article content.'
      )
    ).toThrow(/three distinct alternative titles/);

    const oneTakeaway = {
      ...validResponse,
      keyTakeaways: ['Only one takeaway'],
    };
    expect(() =>
      parseSuggestions(
        JSON.stringify(oneTakeaway),
        'The original sentence. Article content.'
      )
    ).toThrow(/key takeaways/);
  });

  it('fails explicitly when the Gemini key is not configured', async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      await expect(
        generateContentSuggestions({ content: 'An article.' })
      ).rejects.toMatchObject({
        statusCode: 503,
        message: expect.stringContaining('GEMINI_API_KEY'),
      });
    } finally {
      if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousKey;
    }
  });
});
