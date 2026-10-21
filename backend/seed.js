const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const User = require('./models/User');
const Article = require('./models/Article');
const Quiz = require('./models/Quiz');
const Notification = require('./models/Notification');
const Comment = require('./models/Comment');
const { seededArticles } = require('./models/articleStore');

const seedFullDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      console.log('[Seed Script] No MONGODB_URI provided in environment. Skipping database seed run.');
      process.exit(0);
    }

    console.log('[Seed Script] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI, { dbName: 'content_management_system' });
    console.log('[Seed Script] Connected to database: content_management_system');

    console.log('[Seed Script] Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Article.deleteMany({}),
      Quiz.deleteMany({}),
      Notification.deleteMany({}),
      Comment.deleteMany({}),
    ]);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Seed Users
    const users = await User.insertMany([
      {
        _id: new mongoose.Types.ObjectId('66c9f1a00000000000000001'),
        name: 'Amara Silva',
        email: 'admin@lumen.com',
        password: hashedPassword,
        role: 'admin',
        bio: 'Lead Editorial Director & Platform Administrator at Lumen.',
      },
      {
        _id: new mongoose.Types.ObjectId('66c9f1a00000000000000002'),
        name: 'Thomas Okeke',
        email: 'author@lumen.com',
        password: hashedPassword,
        role: 'author',
        bio: 'Historian of technology. Former editor at Nature. Coffee enthusiast.',
      },
      {
        _id: new mongoose.Types.ObjectId('66c9f1a00000000000000003'),
        name: 'Priya Mehta',
        email: 'priya.mehta@lumen.com',
        password: hashedPassword,
        role: 'author',
        bio: 'Molecular biologist & science communicator covering genetic engineering.',
      },
      {
        _id: new mongoose.Types.ObjectId('66c9f1a00000000000000004'),
        name: 'Lena Kaufmann',
        email: 'reader@lumen.com',
        password: hashedPassword,
        role: 'reader',
        bio: 'Avid reader and tech quiz enthusiast exploring modern science.',
      },
    ]);

    const admin = users.find((u) => u.role === 'admin');
    const thomas = users.find((u) => u.email === 'author@lumen.com');
    const priya = users.find((u) => u.email === 'priya.mehta@lumen.com');
    const reader = users.find((u) => u.role === 'reader');

    console.log(`[Seed Script] Created ${users.length} Users.`);

    // 2. Seed Articles matching articleStore
    const articleDocs = seededArticles.map((art) => ({
      _id: new mongoose.Types.ObjectId(art._id),
      title: art.title,
      description: art.description,
      content: art.content,
      category: art.category,
      tags: art.tags || [],
      status: art.status === 'pending_review' ? 'pending' : art.status,
      reviewFeedback: art.reviewFeedback || '',
      heroImage: art.heroImage,
      views: art.views || 0,
      likes: art.likes || 0,
      readingTime: art.readingTime || 5,
      author: art.author?.email === 'priya.mehta@lumen.com' ? priya._id : thomas._id,
      createdAt: art.createdAt,
      updatedAt: art.updatedAt,
    }));

    const insertedArticles = await Article.insertMany(articleDocs);
    console.log(`[Seed Script] Created ${insertedArticles.length} Articles.`);

    // 3. Seed Quizzes for published articles
    const crisprArticle = insertedArticles[0];
    const internetArticle = insertedArticles[1];

    const quizzes = await Quiz.insertMany([
      {
        _id: new mongoose.Types.ObjectId('66c9f3b00000000000000001'),
        title: 'Genetics & Biotechnology Knowledge Checkpoint',
        description: 'Test your understanding of CRISPR Cas9 and molecular gene editing.',
        articleId: crisprArticle._id,
        createdBy: priya._id,
        status: 'approved',
        questions: [
          {
            question: 'What does CRISPR stand for?',
            options: [
              'Clustered Regularly Interspaced Short Palindromic Repeats',
              'Coded Recombinant Integrated Short Protein Repeats',
              'Clustered RNA Integrated Sequence Protein Replication',
              'Cellular Recombination in Short Palindromic Regions',
            ],
            correctAnswer: 'Clustered Regularly Interspaced Short Palindromic Repeats',
            explanation: 'CRISPR stands for Clustered Regularly Interspaced Short Palindromic Repeats.',
          },
          {
            question: 'Which protein is most commonly paired with CRISPR as a gene-editing tool?',
            options: ['Cas9', 'Insulin', 'Hemoglobin', 'Collagen'],
            correctAnswer: 'Cas9',
            explanation: 'Cas9 is an endonuclease enzyme that acts as molecular scissors.',
          },
          {
            question: 'Who were awarded the 2020 Nobel Prize in Chemistry for developing CRISPR?',
            options: [
              'Jennifer Doudna and Emmanuelle Charpentier',
              'Marie Curie and Irène Joliot-Curie',
              'Dorothy Hodgkin and Rosalind Franklin',
              'Ada Yonath and Frances Arnold',
            ],
            correctAnswer: 'Jennifer Doudna and Emmanuelle Charpentier',
            explanation: 'Jennifer Doudna and Emmanuelle Charpentier won the Nobel Prize.',
          },
        ],
      },
      {
        _id: new mongoose.Types.ObjectId('66c9f3b00000000000000002'),
        title: 'History of ARPANET & Early Internet Checkpoint',
        description: 'Test your knowledge of the earliest electronic network transmissions.',
        articleId: internetArticle._id,
        createdBy: thomas._id,
        status: 'approved',
        questions: [
          {
            question: 'What were the first two letters transmitted over ARPANET before the system crashed?',
            options: ['LO', 'IN', 'HI', 'GO'],
            correctAnswer: 'LO',
            explanation: 'The system crashed after receiving the first two letters "LO".',
          },
          {
            question: 'Which university hosted the first host terminal in October 1969?',
            options: ['UCLA', 'MIT', 'Harvard', 'Stanford'],
            correctAnswer: 'UCLA',
            explanation: 'The transmission was sent from UCLA to Stanford Research Institute.',
          },
          {
            question: 'What precursor network laid the groundwork for today\'s global internet?',
            options: ['ARPANET', 'ENIAC', 'ETHERNET', 'BITNET'],
            correctAnswer: 'ARPANET',
            explanation: 'ARPANET established packet switching standards.',
          },
        ],
      },
    ]);

    console.log(`[Seed Script] Created ${quizzes.length} Quizzes.`);

    // 4. Seed Notifications
    const notifications = await Notification.insertMany([
      {
        recipient: thomas._id,
        user: thomas._id,
        title: 'Changes Requested',
        message: 'Admin Amara Silva requested changes on "The Forgotten History of the Mechanical Computer". Feedback: Please expand section on ENIAC programmers.',
        type: 'article_status',
        link: '/profile',
        isRead: false,
      },
      {
        recipient: priya._id,
        user: priya._id,
        title: 'Article Published',
        message: 'Your article "How CRISPR Is Rewriting the Story of Human Disease" has been approved and published live!',
        type: 'article_status',
        link: `/browse/${crisprArticle._id}`,
        isRead: true,
      },
      {
        recipient: priya._id,
        user: priya._id,
        title: '284 Article Likes',
        message: '284 readers have liked your CRISPR article this week.',
        type: 'system',
        link: `/browse/${crisprArticle._id}`,
        isRead: false,
      },
    ]);

    console.log(`[Seed Script] Created ${notifications.length} Notifications.`);

    // 5. Seed Comments for Articles & Discussions
    const parentComment1 = new mongoose.Types.ObjectId('66c9f2a00000000000000001');
    const parentComment4 = new mongoose.Types.ObjectId('66c9f2a00000000000000004');
    const parentComment6 = new mongoose.Types.ObjectId('66c9f2a00000000000000006');
    const parentComment8 = new mongoose.Types.ObjectId('66c9f2a00000000000000008');
    const parentComment10 = new mongoose.Types.ObjectId('66c9f2a00000000000000010');
    const parentComment12 = new mongoose.Types.ObjectId('66c9f2a00000000000000012');

    const seededComments = await Comment.insertMany([
      // CRISPR Article Comments (targetId: crispr-future-medicine & crisprArticle._id)
      {
        _id: parentComment1,
        content: 'Fascinating analysis of gene-editing therapies! The distinction between somatic and germline modifications was explained with exceptional clarity.',
        author: reader._id,
        targetId: 'crispr-future-medicine',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: priya._id, type: 'like' },
          { user: admin._id, type: 'insightful' },
        ],
      },
      {
        content: 'Thank you Lena! In our next investigative piece, we will explore the epigenetic delivery vectors currently in clinical phase II trials.',
        author: priya._id,
        targetId: 'crispr-future-medicine',
        targetType: 'article',
        parentId: parentComment1,
        reactions: [{ user: reader._id, type: 'heart' }],
      },
      {
        content: 'From an editorial standpoint, this is one of our highest-rated science deep dives this month. Great discussion in the comments!',
        author: admin._id,
        targetId: 'crispr-future-medicine',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: priya._id, type: 'like' },
          { user: reader._id, type: 'applause' },
        ],
      },
      {
        content: 'Fascinating analysis of gene-editing therapies! The distinction between somatic and germline modifications was explained with exceptional clarity.',
        author: reader._id,
        targetId: crisprArticle._id.toString(),
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: priya._id, type: 'like' },
          { user: admin._id, type: 'insightful' },
        ],
      },

      // Technology & AI (targetId: ai-reasoning-frontiers & internetArticle._id)
      {
        _id: parentComment4,
        content: 'The detail about typing "LO" before the UCLA SDS Sigma 7 crashed is legendary. Such a humble beginning for global packet networking.',
        author: priya._id,
        targetId: 'ai-reasoning-frontiers',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: thomas._id, type: 'like' },
          { user: reader._id, type: 'insightful' },
        ],
      },
      {
        content: 'Indeed! Charley Kline and Bill Duvall never suspected that two typed characters would spark the modern telecommunications era.',
        author: thomas._id,
        targetId: 'ai-reasoning-frontiers',
        targetType: 'article',
        parentId: parentComment4,
        reactions: [{ user: admin._id, type: 'like' }],
      },
      {
        content: 'The detail about typing "LO" before the UCLA SDS Sigma 7 crashed is legendary. Such a humble beginning for global packet networking.',
        author: priya._id,
        targetId: internetArticle._id.toString(),
        targetType: 'article',
        parentId: null,
        reactions: [{ user: thomas._id, type: 'like' }],
      },

      // Climate Resilience (targetId: climate-resilience-2030)
      {
        _id: parentComment6,
        content: 'Decentralized rainwater catchment and permeable pavement systems could reduce municipal runoff by up to 60% in high-density urban areas.',
        author: reader._id,
        targetId: 'climate-resilience-2030',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: thomas._id, type: 'like' },
          { user: admin._id, type: 'insightful' },
        ],
      },
      {
        content: 'Excellent observation. Urban sponge-city initiatives in East Asia have demonstrated remarkable resilience during recent monsoon seasons.',
        author: thomas._id,
        targetId: 'climate-resilience-2030',
        targetType: 'article',
        parentId: parentComment6,
        reactions: [{ user: reader._id, type: 'heart' }],
      },

      // Ancient Manuscripts (targetId: ancient-manuscripts-decoded)
      {
        _id: parentComment8,
        content: 'Using 3D X-ray tomography and computer vision to read carbonized papyri without physically unrolling them is truly science-fiction turned reality.',
        author: thomas._id,
        targetId: 'ancient-manuscripts-decoded',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: priya._id, type: 'like' },
          { user: reader._id, type: 'insightful' },
        ],
      },
      {
        content: 'The Vesuvius Challenge demonstrated the power of open-source science and machine learning competitions in humanitarian research.',
        author: reader._id,
        targetId: 'ancient-manuscripts-decoded',
        targetType: 'article',
        parentId: parentComment8,
        reactions: [{ user: admin._id, type: 'like' }],
      },

      // Longevity (targetId: longevity-cellular-repair)
      {
        _id: parentComment10,
        content: 'Targeting senescent cells with senolytic compounds appears to be one of the most promising therapeutic avenues for osteoarthritis.',
        author: priya._id,
        targetId: 'longevity-cellular-repair',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: reader._id, type: 'like' },
          { user: admin._id, type: 'insightful' },
        ],
      },
      {
        content: 'Are there any dietary or lifestyle protocols that currently mimic these pathway modulations?',
        author: reader._id,
        targetId: 'longevity-cellular-repair',
        targetType: 'article',
        parentId: parentComment10,
        reactions: [{ user: priya._id, type: 'heart' }],
      },

      // Editorial Governance (targetId: editorial-moderation-standards)
      {
        _id: parentComment12,
        content: 'Editorial transparency is the bedrock of trusted journalism. Clear reviewer rubrics and community reporting tools ensure high quality discourse.',
        author: admin._id,
        targetId: 'editorial-moderation-standards',
        targetType: 'discussion',
        parentId: null,
        reactions: [
          { user: priya._id, type: 'like' },
          { user: thomas._id, type: 'like' },
          { user: reader._id, type: 'applause' },
        ],
      },
      {
        content: 'As authors, having clear editorial feedback before publishing has drastically improved our investigative essays.',
        author: thomas._id,
        targetId: 'editorial-moderation-standards',
        targetType: 'discussion',
        parentId: parentComment12,
        reactions: [{ user: admin._id, type: 'heart' }],
      },
    ]);

    console.log(`[Seed Script] Created ${seededComments.length} Comments.`);

    console.log('\n======================================================');
    console.log('  🌿 Full MongoDB Atlas Database Seed Successful!');
    console.log('======================================================');
    console.log('  Database: content_management_system');
    console.log('  Seed Accounts (Password: password123):');
    console.log('    1. Admin:  Amara Silva   <admin@lumen.com>');
    console.log('    2. Author: Thomas Okeke  <author@lumen.com>');
    console.log('    3. Author: Priya Mehta   <priya.mehta@lumen.com>');
    console.log('    4. Reader: Lena Kaufmann <reader@lumen.com>');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedFullDatabase();
}

module.exports = seedFullDatabase;
