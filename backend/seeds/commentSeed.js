const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const User = require('../models/User');
const Comment = require('../models/Comment');

const seedComments = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('[CommentSeed] MONGO_URI environment variable is missing.');
      process.exit(1);
    }

    console.log('[CommentSeed] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI, { dbName: 'lumen_cms' });
    console.log('[CommentSeed] Connected to database: lumen_cms');

    // Fetch user IDs
    const admin = await User.findOne({ email: 'admin@lumen.com' });
    const authorThomas = await User.findOne({ email: 'author@lumen.com' });
    const authorPriya = await User.findOne({ email: 'priya.mehta@lumen.com' });
    const reader = await User.findOne({ email: 'reader@lumen.com' });

    const adminId = admin?._id || new mongoose.Types.ObjectId('66c9f1a00000000000000001');
    const authorThomasId = authorThomas?._id || new mongoose.Types.ObjectId('66c9f1a00000000000000002');
    const authorPriyaId = authorPriya?._id || new mongoose.Types.ObjectId('66c9f1a00000000000000003');
    const readerId = reader?._id || new mongoose.Types.ObjectId('66c9f1a00000000000000004');

    console.log('[CommentSeed] Clearing existing demo comments...');
    await Comment.deleteMany({});

    // 1. CRISPR Article Comments
    const crisprRoot1 = await Comment.create({
      content: 'Fascinating breakdown of CRISPR-Cas9 mechanics! The distinction between somatic and germline gene edits was explained with exceptional clarity.',
      author: readerId,
      targetId: 'crispr-future-medicine',
      targetType: 'article',
      parentId: null,
      reactions: [
        { user: authorPriyaId, type: 'like', createdAt: new Date(Date.now() - 36 * 3600 * 1000) },
        { user: adminId, type: 'insightful', createdAt: new Date(Date.now() - 35 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 40 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 40 * 3600 * 1000),
    });

    await Comment.create({
      content: 'Thank you John! In our next piece, we will explore the epigenetic delivery vectors currently in clinical phase II trials.',
      author: authorPriyaId,
      targetId: 'crispr-future-medicine',
      targetType: 'article',
      parentId: crisprRoot1._id,
      reactions: [
        { user: readerId, type: 'heart', createdAt: new Date(Date.now() - 30 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 32 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 32 * 3600 * 1000),
    });

    await Comment.create({
      content: 'From an editorial standpoint, this is one of our highest-rated science deep dives this month. Great discussion in the comments!',
      author: adminId,
      targetId: 'crispr-future-medicine',
      targetType: 'article',
      parentId: null,
      reactions: [
        { user: authorPriyaId, type: 'like', createdAt: new Date(Date.now() - 15 * 3600 * 1000) },
        { user: readerId, type: 'applause', createdAt: new Date(Date.now() - 14 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 18 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 18 * 3600 * 1000),
    });

    // 2. Internet History Article Comments
    const netRoot1 = await Comment.create({
      content: 'The detail about typing "LO" before the UCLA SDS Sigma 7 crashed is legendary. Such a humble beginning for global packet networking.',
      author: authorPriyaId,
      targetId: 'ai-reasoning-frontiers',
      targetType: 'article',
      parentId: null,
      reactions: [
        { user: authorThomasId, type: 'like', createdAt: new Date(Date.now() - 25 * 3600 * 1000) },
        { user: readerId, type: 'insightful', createdAt: new Date(Date.now() - 24 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 28 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 28 * 3600 * 1000),
    });

    await Comment.create({
      content: 'Indeed! Charley Kline and Bill Duvall never suspected that two typed characters would spark the modern telecommunications era.',
      author: authorThomasId,
      targetId: 'ai-reasoning-frontiers',
      targetType: 'article',
      parentId: netRoot1._id,
      reactions: [
        { user: adminId, type: 'like', createdAt: new Date(Date.now() - 20 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 22 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 22 * 3600 * 1000),
    });

    // 3. Climate Resilience Article Comments
    const climateRoot1 = await Comment.create({
      content: 'Decentralized rainwater catchment and permeable pavement systems could reduce municipal runoff by up to 60% in high-density urban areas.',
      author: readerId,
      targetId: 'climate-resilience-2030',
      targetType: 'article',
      parentId: null,
      reactions: [
        { user: authorThomasId, type: 'like', createdAt: new Date(Date.now() - 12 * 3600 * 1000) },
        { user: adminId, type: 'insightful', createdAt: new Date(Date.now() - 10 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 14 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 14 * 3600 * 1000),
    });

    await Comment.create({
      content: 'Excellent observation. Urban sponge-city initiatives in East Asia have demonstrated remarkable resilience during recent monsoon seasons.',
      author: authorThomasId,
      targetId: 'climate-resilience-2030',
      targetType: 'article',
      parentId: climateRoot1._id,
      reactions: [
        { user: readerId, type: 'heart', createdAt: new Date(Date.now() - 8 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 9 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 9 * 3600 * 1000),
    });

    // 4. Ancient Manuscripts Decoded (History)
    const historyRoot1 = await Comment.create({
      content: 'Using 3D X-ray tomography and computer vision to read carbonized papyri without physically unrolling them is truly science-fiction turned reality.',
      author: authorThomasId,
      targetId: 'ancient-manuscripts-decoded',
      targetType: 'article',
      parentId: null,
      reactions: [
        { user: authorPriyaId, type: 'like', createdAt: new Date(Date.now() - 16 * 3600 * 1000) },
        { user: readerId, type: 'insightful', createdAt: new Date(Date.now() - 15 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 20 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 20 * 3600 * 1000),
    });

    await Comment.create({
      content: 'The Vesuvius Challenge demonstrated the power of open-source science and machine learning competitions in humanitarian research.',
      author: readerId,
      targetId: 'ancient-manuscripts-decoded',
      targetType: 'article',
      parentId: historyRoot1._id,
      reactions: [
        { user: adminId, type: 'like', createdAt: new Date(Date.now() - 11 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 12 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 12 * 3600 * 1000),
    });

    // 5. Longevity Cellular Repair (Medicine)
    const longevityRoot = await Comment.create({
      content: 'Targeting senescent cells with senolytic compounds appears to be one of the most promising therapeutic avenues for osteoarthritis.',
      author: authorPriyaId,
      targetId: 'longevity-cellular-repair',
      targetType: 'article',
      parentId: null,
      reactions: [
        { user: readerId, type: 'like', createdAt: new Date(Date.now() - 6 * 3600 * 1000) },
        { user: adminId, type: 'insightful', createdAt: new Date(Date.now() - 5 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 8 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 8 * 3600 * 1000),
    });

    await Comment.create({
      content: 'Are there any dietary or lifestyle protocols that currently mimic these pathway modulations?',
      author: readerId,
      targetId: 'longevity-cellular-repair',
      targetType: 'article',
      parentId: longevityRoot._id,
      reactions: [
        { user: authorPriyaId, type: 'heart', createdAt: new Date(Date.now() - 3 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 4 * 3600 * 1000),
    });

    // 6. Editorial Moderation & Governance (Discussions)
    const editorialRoot = await Comment.create({
      content: 'Editorial transparency is the bedrock of trusted journalism. Clear reviewer rubrics and community reporting tools ensure high quality discourse.',
      author: adminId,
      targetId: 'editorial-moderation-standards',
      targetType: 'discussion',
      parentId: null,
      reactions: [
        { user: authorPriyaId, type: 'like', createdAt: new Date(Date.now() - 5 * 3600 * 1000) },
        { user: authorThomasId, type: 'like', createdAt: new Date(Date.now() - 4 * 3600 * 1000) },
        { user: readerId, type: 'applause', createdAt: new Date(Date.now() - 3 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 7 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 7 * 3600 * 1000),
    });

    await Comment.create({
      content: 'As authors, having clear editorial feedback before publishing has drastically improved our investigative essays.',
      author: authorThomasId,
      targetId: 'editorial-moderation-standards',
      targetType: 'discussion',
      parentId: editorialRoot._id,
      reactions: [
        { user: adminId, type: 'heart', createdAt: new Date(Date.now() - 2 * 3600 * 1000) },
      ],
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 3 * 3600 * 1000),
    });

    console.log('[CommentSeed] Successfully seeded 12 discussion comments and threaded replies across 6 topics!');
    await mongoose.connection.close();
    console.log('[CommentSeed] Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[CommentSeed Error]:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedComments();
}

module.exports = seedComments;
