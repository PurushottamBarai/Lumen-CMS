const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const connectDB = require('../config/db');
const Article = require('../models/Article');
const User = require('../models/User');

const DATABASE_NAME = 'content_management_system';
const REQUIRED_CONFIRMATION = 'INSERT_TOPIC_TRENDS_TEST_ARTICLES';
const FIXTURE_AUTHOR_EMAIL = 'topic-trends-fixture-author@lumen.test';
const DAY_MS = 24 * 60 * 60 * 1000;
const topics = [
  {
    name: 'Artificial Intelligence in Education', category: 'Education',
    recent: 3, previous: 1,
    titles: ['Adaptive Tutors in the Classroom', 'Teacher Workflows and AI Literacy', 'A Pilot for Personalized Lessons', 'Preparing Students for AI-Assisted Study'],
  },
  {
    name: 'Cybersecurity and Data Privacy', category: 'Technology',
    recent: 2, previous: 1,
    titles: ['Protecting Small Teams from Phishing', 'Privacy Reviews for Connected Services', 'A Practical Incident Response Plan'],
  },
  {
    name: 'Climate Change and Sustainability', category: 'Environment',
    recent: 2, previous: 1,
    titles: ['Measuring Progress in City Climate Plans', 'Circular Design for Local Businesses', 'Tracking Community Emissions'],
  },
  {
    name: 'Digital Health and Wellness', category: 'Health',
    recent: 1, previous: 1,
    titles: ['Remote Care Tools and Patient Access', 'Building Healthy Habits with Wearables'],
  },
  {
    name: 'Space Exploration', category: 'Science',
    recent: 1, previous: 1,
    titles: ['Preparing Science Payloads for the Moon', 'New Research from Low Earth Orbit'],
  },
  {
    name: 'Financial Technology', category: 'Business',
    recent: 1, previous: 1,
    titles: ['How Instant Payments Change Small Business', 'Fintech Tools for Inclusive Banking'],
  },
  {
    name: 'Renewable Energy', category: 'Environment',
    recent: 0, previous: 1,
    titles: ['Community Batteries for Solar Power'],
  },
  {
    name: 'Emerging Software Development Tools', category: 'Technology',
    recent: 0, previous: 1,
    titles: ['New Tooling for Reliable Software Releases'],
  },
];

const makeArticleSpecs = (now) => {
  const specs = [];
  for (const topic of topics) {
    let index = 0;
    const windows = [
      ...Array.from({ length: topic.recent }, (_, item) => ({ daysAgo: 1 + item * 2, window: 'recent' })),
      ...Array.from({ length: topic.previous }, (_, item) => ({ daysAgo: 8 + item * 2, window: 'previous' })),
    ];
    for (const period of windows) {
      const articleTitle = topic.titles[index];
      specs.push({
        topicName: topic.name,
        window: period.window,
        document: {
          title: `${topic.name}: ${articleTitle}`,
          description: `${articleTitle}.`,
          content: `${articleTitle}. ${topic.name}.`,
          category: topic.category,
          tags: [topic.name],
          status: 'published',
          publishedAt: new Date(now.getTime() - period.daysAgo * DAY_MS),
          submittedAt: new Date(now.getTime() - period.daysAgo * DAY_MS),
          views: 90 + (index + 1) * 37,
          likes: 4 + (index + 1) * 3,
        },
      });
      index += 1;
    }
  }
  return specs;
};

const ensureFixtureAuthor = async () => {
  const existingAuthor = await User.findOne({ role: { $in: ['author', 'admin'] } })
    .select('_id role')
    .lean();
  if (existingAuthor) return { id: existingAuthor._id, created: false };

  const existingFixture = await User.findOne({ email: FIXTURE_AUTHOR_EMAIL })
    .select('_id role')
    .lean();
  if (existingFixture) {
    throw new Error('The fixture-author email already exists with a non-author role; no records were changed.');
  }

  // This related author is only needed when the CMS has no existing author.
  // Its random password is never logged or returned, so it cannot be used as
  // a public demo login. No existing user is modified.
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  try {
    const user = await User.create({
      name: 'Topic Trends Test Author',
      email: FIXTURE_AUTHOR_EMAIL,
      password: passwordHash,
      role: 'author',
      bio: 'Non-login fixture author for Topic & Trend Detection sample articles.',
    });
    return { id: user._id, created: true };
  } catch (error) {
    if (error.code === 11000) {
      const racedUser = await User.findOne({ email: FIXTURE_AUTHOR_EMAIL, role: 'author' })
        .select('_id')
        .lean();
      if (racedUser) return { id: racedUser._id, created: false };
    }
    throw error;
  }
};

const seedTopicTrends = async () => {
  if (process.env.SEED_TOPIC_TRENDS !== 'true') {
    throw new Error('Opt in by setting SEED_TOPIC_TRENDS=true.');
  }
  if (process.env.CONFIRM_TOPIC_TRENDS_SEED !== REQUIRED_CONFIRMATION) {
    throw new Error(`Confirmation required: set CONFIRM_TOPIC_TRENDS_SEED=${REQUIRED_CONFIRMATION}.`);
  }

  try {
    await connectDB();
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Main CMS database is not connected; no records were seeded.');
    }
    if (mongoose.connection.name !== DATABASE_NAME || Article.collection.name !== 'articles' || User.collection.name !== 'users') {
      throw new Error('Active database or collection did not match the expected CMS target; no records were seeded.');
    }

    const now = new Date();
    const specs = makeArticleSpecs(now);
    const dryRun = process.env.SEED_TOPIC_TRENDS_DRY_RUN === 'true';
    const existingAuthor = await User.findOne({ role: { $in: ['author', 'admin'] } })
      .select('_id role')
      .lean();
    const existingFixture = existingAuthor ? null : await User.findOne({ email: FIXTURE_AUTHOR_EMAIL })
      .select('_id role')
      .lean();
    if (existingFixture && existingFixture.role !== 'author') {
      throw new Error('The fixture-author email already exists with a non-author role; no records were changed.');
    }
    let missingArticles = 0;
    for (const spec of specs) {
      if (!(await Article.exists({ title: spec.document.title }))) missingArticles += 1;
    }

    if (dryRun) {
      console.log(JSON.stringify({
        dryRun: true,
        database: DATABASE_NAME,
        articleCollection: Article.collection.name,
        authorCollection: User.collection.name,
        existingAuthorAvailable: Boolean(existingAuthor || existingFixture),
        fixtureAuthorWouldBeCreated: !existingAuthor && !existingFixture,
        plannedTopicCount: topics.length,
        plannedArticleCount: specs.length,
        missingArticleCount: missingArticles,
      }));
      return;
    }

    let created = 0;
    let skipped = 0;
    const author = await ensureFixtureAuthor();

    for (const spec of specs) {
      const title = spec.document.title;
      const existing = await Article.findOne({ title }).select('_id').lean();
      if (existing) {
        console.log(`Skipped existing test article: ${title}`);
        skipped += 1;
        continue;
      }

      try {
        await Article.create({ ...spec.document, author: author.id });
        created += 1;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`Skipped existing test article: ${title}`);
          skipped += 1;
          continue;
        }
        throw error;
      }
    }

    console.log(JSON.stringify({
      database: DATABASE_NAME,
      articleCollection: Article.collection.name,
      authorCollection: User.collection.name,
      fixtureAuthorCreated: author.created,
      plannedTopicCount: topics.length,
      plannedArticleCount: specs.length,
      createdArticleCount: created,
      skippedArticleCount: skipped,
    }));
  } finally {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedTopicTrends().catch(() => {
    console.error('[Topic Trends seed] Failed. Check the opt-in values and configured CMS database. No credentials were logged.');
    process.exitCode = 1;
  });
}

module.exports = { seedTopicTrends, makeArticleSpecs, topics };
