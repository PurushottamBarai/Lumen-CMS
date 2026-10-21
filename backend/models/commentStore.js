const mongoose = require('mongoose');
const Comment = require('./Comment');
const userStore = require('./userStore');

// In-Memory fallback store for when MongoDB Atlas/local is offline
let inMemoryComments = [];

const initMemoryComments = async () => {
  if (inMemoryComments.length === 0) {
    const adminUser = await userStore.findByEmail('admin@lumen.com');
    const authorPriya = await userStore.findByEmail('priya.mehta@lumen.com');
    const authorThomas = await userStore.findByEmail('author@lumen.com');
    const readerUser = await userStore.findByEmail('reader@lumen.com');

    const adminId = adminUser?.id || adminUser?._id || '66c9f1a00000000000000001';
    const authorThomasId = authorThomas?.id || authorThomas?._id || '66c9f1a00000000000000002';
    const authorPriyaId = authorPriya?.id || authorPriya?._id || '66c9f1a00000000000000003';
    const readerId = readerUser?.id || readerUser?._id || '66c9f1a00000000000000004';

    inMemoryComments = [
      // 1. CRISPR (Science)
      {
        id: '66c9f2a00000000000000001',
        _id: '66c9f2a00000000000000001',
        content: 'Fascinating analysis of gene-editing therapies! The distinction between somatic and germline modifications was explained with exceptional clarity.',
        author: readerId,
        targetId: 'crispr-future-medicine',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: authorPriyaId, type: 'like', createdAt: new Date() },
          { user: adminId, type: 'insightful', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 36 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 36 * 3600 * 1000),
      },
      {
        id: '66c9f2a00000000000000002',
        _id: '66c9f2a00000000000000002',
        content: 'Thank you John! In our next investigative piece, we will explore the epigenetic delivery vectors currently in clinical phase II trials.',
        author: authorPriyaId,
        targetId: 'crispr-future-medicine',
        targetType: 'article',
        parentId: '66c9f2a00000000000000001',
        reactions: [
          { user: readerId, type: 'heart', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 30 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 30 * 3600 * 1000),
      },
      {
        id: '66c9f2a00000000000000003',
        _id: '66c9f2a00000000000000003',
        content: 'From an editorial standpoint, this is one of our highest-rated science deep dives this month. Great discussion in the comments!',
        author: adminId,
        targetId: 'crispr-future-medicine',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: authorPriyaId, type: 'like', createdAt: new Date() },
          { user: readerId, type: 'applause', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 18 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 18 * 3600 * 1000),
      },

      // 2. Internet Origins (Technology)
      {
        id: '66c9f2a00000000000000004',
        _id: '66c9f2a00000000000000004',
        content: 'The detail about typing "LO" before the UCLA SDS Sigma 7 crashed is legendary. Such a humble beginning for global packet networking.',
        author: authorPriyaId,
        targetId: 'ai-reasoning-frontiers',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: authorThomasId, type: 'like', createdAt: new Date() },
          { user: readerId, type: 'insightful', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 28 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 28 * 3600 * 1000),
      },
      {
        id: '66c9f2a00000000000000005',
        _id: '66c9f2a00000000000000005',
        content: 'Indeed! Charley Kline and Bill Duvall never suspected that two typed characters would spark the modern telecommunications era.',
        author: authorThomasId,
        targetId: 'ai-reasoning-frontiers',
        targetType: 'article',
        parentId: '66c9f2a00000000000000004',
        reactions: [
          { user: adminId, type: 'like', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 22 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 22 * 3600 * 1000),
      },

      // 3. Climate Resilience (Environment)
      {
        id: '66c9f2a00000000000000006',
        _id: '66c9f2a00000000000000006',
        content: 'Decentralized rainwater catchment and permeable pavement systems could reduce municipal runoff by up to 60% in high-density urban areas.',
        author: readerId,
        targetId: 'climate-resilience-2030',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: authorThomasId, type: 'like', createdAt: new Date() },
          { user: adminId, type: 'insightful', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 14 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 14 * 3600 * 1000),
      },
      {
        id: '66c9f2a00000000000000007',
        _id: '66c9f2a00000000000000007',
        content: 'Excellent observation. Urban sponge-city initiatives in East Asia have demonstrated remarkable resilience during recent monsoon seasons.',
        author: authorThomasId,
        targetId: 'climate-resilience-2030',
        targetType: 'article',
        parentId: '66c9f2a00000000000000006',
        reactions: [
          { user: readerId, type: 'heart', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 9 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 9 * 3600 * 1000),
      },

      // 4. Ancient Manuscripts (History)
      {
        id: '66c9f2a00000000000000008',
        _id: '66c9f2a00000000000000008',
        content: 'Using 3D X-ray tomography and computer vision to read carbonized papyri without physically unrolling them is truly science-fiction turned reality.',
        author: authorThomasId,
        targetId: 'ancient-manuscripts-decoded',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: authorPriyaId, type: 'like', createdAt: new Date() },
          { user: readerId, type: 'insightful', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 20 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 20 * 3600 * 1000),
      },
      {
        id: '66c9f2a00000000000000009',
        _id: '66c9f2a00000000000000009',
        content: 'The Vesuvius Challenge demonstrated the power of open-source science and machine learning competitions in humanitarian research.',
        author: readerId,
        targetId: 'ancient-manuscripts-decoded',
        targetType: 'article',
        parentId: '66c9f2a00000000000000008',
        reactions: [
          { user: adminId, type: 'like', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 12 * 3600 * 1000),
      },

      // 5. Longevity Cellular Repair (Medicine)
      {
        id: '66c9f2a00000000000000010',
        _id: '66c9f2a00000000000000010',
        content: 'Targeting senescent cells with senolytic compounds appears to be one of the most promising therapeutic avenues for osteoarthritis.',
        author: authorPriyaId,
        targetId: 'longevity-cellular-repair',
        targetType: 'article',
        parentId: null,
        reactions: [
          { user: readerId, type: 'like', createdAt: new Date() },
          { user: adminId, type: 'insightful', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 8 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 8 * 3600 * 1000),
      },
      {
        id: '66c9f2a00000000000000011',
        _id: '66c9f2a00000000000000011',
        content: 'Are there any dietary or lifestyle protocols that currently mimic these pathway modulations?',
        author: readerId,
        targetId: 'longevity-cellular-repair',
        targetType: 'article',
        parentId: '66c9f2a00000000000000010',
        reactions: [
          { user: authorPriyaId, type: 'heart', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 4 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 4 * 3600 * 1000),
      },

      // 6. Editorial Governance (Discussions)
      {
        id: '66c9f2a00000000000000012',
        _id: '66c9f2a00000000000000012',
        content: 'Editorial transparency is the bedrock of trusted journalism. Clear reviewer rubrics and community reporting tools ensure high quality discourse.',
        author: adminId,
        targetId: 'editorial-moderation-standards',
        targetType: 'discussion',
        parentId: null,
        reactions: [
          { user: authorPriyaId, type: 'like', createdAt: new Date() },
          { user: authorThomasId, type: 'like', createdAt: new Date() },
          { user: readerId, type: 'applause', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 7 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 7 * 3600 * 1000),
      },
      {
        id: '66c9f2a00000000000000013',
        _id: '66c9f2a00000000000000013',
        content: 'As authors, having clear editorial feedback before publishing has drastically improved our investigative essays.',
        author: authorThomasId,
        targetId: 'editorial-moderation-standards',
        targetType: 'discussion',
        parentId: '66c9f2a00000000000000012',
        reactions: [
          { user: adminId, type: 'heart', createdAt: new Date() },
        ],
        isEdited: false,
        createdAt: new Date(Date.now() - 3 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 3 * 3600 * 1000),
      },
    ];
  }
};

initMemoryComments();

const isDBConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// Helper to attach author data
const populateAuthor = async (authorIdOrDoc) => {
  if (!authorIdOrDoc) return null;
  if (typeof authorIdOrDoc === 'object' && authorIdOrDoc.name) return authorIdOrDoc;
  const user = await userStore.findById(authorIdOrDoc.toString());
  if (!user) return { id: authorIdOrDoc, name: 'Anonymous Contributor', role: 'reader', avatar: '' };
  return {
    id: user.id || user._id,
    _id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    bio: user.bio || '',
  };
};

const commentStore = {
  isDBConnected,

  async getAllComments() {
    if (isDBConnected()) {
      try {
        const comments = await Comment.find({})
          .populate('author', 'name email role avatar bio')
          .sort({ createdAt: -1 });
        return comments;
      } catch (err) {
        console.warn('[DB Fallback] Comment getAllComments failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    return Promise.all(
      inMemoryComments.map(async (c) => ({
        ...c,
        author: await populateAuthor(c.author),
      }))
    );
  },

  async findById(id) {
    if (isDBConnected()) {
      try {
        const comment = await Comment.findById(id).populate('author', 'name email role avatar bio');
        if (comment) return comment;
      } catch (err) {
        console.warn('[DB Fallback] Comment findById failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    const found = inMemoryComments.find((c) => c.id === id || c._id === id || c._id?.toString() === id?.toString());
    if (!found) return null;

    const populatedAuthor = await populateAuthor(found.author);
    return {
      ...found,
      author: populatedAuthor,
      async save() {
        const idx = inMemoryComments.findIndex((c) => c.id === found.id);
        if (idx !== -1) {
          inMemoryComments[idx] = {
            ...inMemoryComments[idx],
            content: this.content,
            reactions: this.reactions,
            isEdited: this.isEdited,
            updatedAt: new Date(),
          };
        }
        return this;
      },
    };
  },

  async createComment({ content, author, targetId, targetType = 'article', parentId = null }) {
    if (isDBConnected()) {
      try {
        const newDoc = await Comment.create({
          content,
          author,
          targetId,
          targetType,
          parentId: parentId || null,
        });
        await newDoc.populate('author', 'name email role avatar bio');
        return newDoc;
      } catch (err) {
        console.warn('[DB Fallback] Comment create failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    const newId = new mongoose.Types.ObjectId().toString();
    const populatedAuthor = await populateAuthor(author);

    const doc = {
      id: newId,
      _id: newId,
      content,
      author: populatedAuthor,
      targetId,
      targetType,
      parentId: parentId || null,
      reactions: [],
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryComments.push({
      ...doc,
      author: author.id || author._id || author,
    });

    return doc;
  },

  async getCommentsByTarget(targetId) {
    if (isDBConnected()) {
      try {
        const comments = await Comment.find({ targetId })
          .populate('author', 'name email role avatar bio')
          .sort({ createdAt: 1 })
          .lean();
        return comments;
      } catch (err) {
        console.warn('[DB Fallback] Comment find by target failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    const targetComments = inMemoryComments.filter((c) => c.targetId === targetId);
    
    // Populate authors
    const populated = await Promise.all(
      targetComments.map(async (c) => ({
        ...c,
        author: await populateAuthor(c.author),
      }))
    );

    return populated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async getRecentComments(limit = 10) {
    if (isDBConnected()) {
      try {
        const comments = await Comment.find()
          .populate('author', 'name email role avatar bio')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return comments;
      } catch (err) {
        console.warn('[DB Fallback] Comment find recent failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    const sorted = [...inMemoryComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    return await Promise.all(
      sorted.map(async (c) => ({
        ...c,
        author: await populateAuthor(c.author),
      }))
    );
  },

  async updateComment(id, newContent) {
    if (isDBConnected()) {
      try {
        const comment = await Comment.findById(id);
        if (comment) {
          comment.content = newContent;
          comment.isEdited = true;
          await comment.save();
          await comment.populate('author', 'name email role avatar bio');
          return comment;
        }
      } catch (err) {
        console.warn('[DB Fallback] Comment update failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    const idx = inMemoryComments.findIndex((c) => c.id === id || c._id === id);
    if (idx === -1) return null;

    inMemoryComments[idx].content = newContent;
    inMemoryComments[idx].isEdited = true;
    inMemoryComments[idx].updatedAt = new Date();

    return {
      ...inMemoryComments[idx],
      author: await populateAuthor(inMemoryComments[idx].author),
    };
  },

  async deleteComment(id) {
    if (isDBConnected()) {
      try {
        // Also delete any child replies
        await Comment.deleteMany({ $or: [{ _id: id }, { parentId: id }] });
        return true;
      } catch (err) {
        console.warn('[DB Fallback] Comment delete failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    const initialLen = inMemoryComments.length;
    inMemoryComments = inMemoryComments.filter(
      (c) => c.id !== id && c._id !== id && c.parentId !== id && c.parentId?.toString() !== id?.toString()
    );
    return inMemoryComments.length < initialLen;
  },

  async toggleReaction(commentId, userId, reactionType = 'like') {
    if (isDBConnected()) {
      try {
        const comment = await Comment.findById(commentId);
        if (!comment) return null;

        const existingIdx = comment.reactions.findIndex(
          (r) => r.user.toString() === userId.toString() && r.type === reactionType
        );

        let userReacted = false;
        if (existingIdx > -1) {
          // Remove reaction
          comment.reactions.splice(existingIdx, 1);
          userReacted = false;
        } else {
          // Add reaction
          comment.reactions.push({ user: userId, type: reactionType });
          userReacted = true;
        }

        await comment.save();
        await comment.populate('author', 'name email role avatar bio');
        return { comment, userReacted };
      } catch (err) {
        console.warn('[DB Fallback] Comment toggleReaction failed, using in-memory store:', err.message);
      }
    }

    await initMemoryComments();
    const idx = inMemoryComments.findIndex((c) => c.id === commentId || c._id === commentId);
    if (idx === -1) return null;

    const reactions = inMemoryComments[idx].reactions || [];
    const existingIdx = reactions.findIndex(
      (r) => (r.user === userId || r.user?.toString() === userId.toString()) && r.type === reactionType
    );

    let userReacted = false;
    if (existingIdx > -1) {
      reactions.splice(existingIdx, 1);
      userReacted = false;
    } else {
      reactions.push({ user: userId, type: reactionType, createdAt: new Date() });
      userReacted = true;
    }

    inMemoryComments[idx].reactions = reactions;
    return {
      comment: {
        ...inMemoryComments[idx],
        author: await populateAuthor(inMemoryComments[idx].author),
      },
      userReacted,
    };
  },
};

module.exports = commentStore;
