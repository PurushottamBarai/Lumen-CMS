const mongoose = require('mongoose');
const Article = require('../models/Article');
const { getTopicTrends } = require('../controllers/articleController');

describe('topic trend API projection', () => {
  test('selects status so the published-only trend service receives it', async () => {
    const previousReadyState = mongoose.connection.readyState;
    const previousTopicUri = process.env.TOPIC_MONGODB_URI;
    const previousGeminiKey = process.env.GEMINI_API_KEY;
    delete process.env.TOPIC_MONGODB_URI;
    delete process.env.GEMINI_API_KEY;
    mongoose.connection.readyState = 1;

    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{
        _id: 'topic-test-article',
        title: 'Artificial Intelligence in Education',
        description: 'A short test article.',
        content: 'Artificial Intelligence in Education.',
        category: 'Education',
        tags: ['Artificial Intelligence in Education'],
        status: 'published',
        publishedAt: new Date(),
      }]),
    };
    const find = jest.spyOn(Article, 'find').mockReturnValue(query);
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    try {
      await getTopicTrends({}, response);
      expect(find).toHaveBeenCalledWith({ status: 'published' });
      expect(query.select).toHaveBeenCalledWith(expect.stringContaining('status'));
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json.mock.calls[0][0].sourceArticleCount).toBe(1);
      expect(response.json.mock.calls[0][0].topics).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Artificial Intelligence In Education' }),
      ]));
    } finally {
      find.mockRestore();
      mongoose.connection.readyState = previousReadyState;
      if (previousTopicUri === undefined) delete process.env.TOPIC_MONGODB_URI;
      else process.env.TOPIC_MONGODB_URI = previousTopicUri;
      if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousGeminiKey;
    }
  });
});
