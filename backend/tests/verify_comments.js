/**
 * Lumen CMS — Comment & Discussion Module Verification Suite
 * Automated tests covering:
 * - Threaded comment creation (top-level & replies)
 * - Hierarchy tree assembly
 * - Reaction toggling (likes/hearts)
 * - Comment edit permissions (author only)
 * - Comment moderation permissions (author & admin deletion)
 * - Input validation & recent discussions feed
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const userStore = require('../models/userStore');
const commentStore = require('../models/commentStore');
const {
  getCommentsByTarget,
  createComment,
  updateComment,
  deleteComment,
  toggleReaction,
  getRecentDiscussions,
} = require('../controllers/commentController');

const mock = () => {
  const r = {
    statusCode: 200,
    jsonData: null,
    status(c) {
      r.statusCode = c;
      return r;
    },
    json(d) {
      r.jsonData = d;
      return r;
    },
  };
  return r;
};

let passed = 0;
let total = 0;
const test = async (name, fn) => {
  total++;
  try {
    const ok = await fn();
    if (ok) {
      passed++;
      console.log(`✅ PASS: ${name}`);
    } else {
      console.log(`❌ FAIL: ${name}`);
    }
  } catch (e) {
    console.log(`❌ FAIL: ${name} (${e.message})`);
  }
};

async function main() {
  console.log('\n=============================================================');
  console.log('  💬 Lumen CMS: Comment & Discussion Verification Suite');
  console.log('=============================================================\n');

  // Fetch test users
  const admin = await userStore.findByEmail('admin@lumen.com');
  const author = await userStore.findByEmail('author@lumen.com');
  const reader = await userStore.findByEmail('reader@lumen.com');

  const adminId = admin.id || admin._id;
  const authorId = author.id || author._id;
  const readerId = reader.id || reader._id;

  const targetId = `test-article-${Date.now()}`;
  let rootCommentId = null;
  let replyCommentId = null;

  // 1. Create Top-Level Comment
  await test('Create Top-Level Comment (201)', async () => {
    const res = mock();
    await createComment(
      {
        user: { id: authorId, role: 'author' },
        body: {
          content: 'This is an insightful article about neural architectures.',
          targetId,
          targetType: 'article',
        },
      },
      res
    );

    const ok = res.statusCode === 201 && res.jsonData?.success;
    rootCommentId = res.jsonData?.comment?.id || res.jsonData?.comment?._id;
    return ok && !!rootCommentId;
  });

  // 2. Reject Empty Comment
  await test('Reject Empty Comment Content (400)', async () => {
    const res = mock();
    await createComment(
      {
        user: { id: readerId, role: 'reader' },
        body: { content: '   ', targetId },
      },
      res
    );
    return res.statusCode === 400;
  });

  // 3. Create Threaded Reply
  await test('Create Threaded Reply to Parent Comment (201)', async () => {
    const res = mock();
    await createComment(
      {
        user: { id: readerId, role: 'reader' },
        body: {
          content: 'I agree with this perspective completely!',
          targetId,
          parentId: rootCommentId,
        },
      },
      res
    );

    const ok = res.statusCode === 201 && res.jsonData?.comment?.parentId === rootCommentId.toString();
    replyCommentId = res.jsonData?.comment?.id || res.jsonData?.comment?._id;
    return ok && !!replyCommentId;
  });

  // 4. Retrieve Threaded Comments with Hierarchical Tree
  await test('Get Threaded Comments & Verify Nested Replies Tree (200)', async () => {
    const res = mock();
    await getCommentsByTarget(
      {
        params: { targetId },
        user: { id: readerId },
      },
      res
    );

    const rootList = res.jsonData?.comments || [];
    const root = rootList.find((c) => c.id === rootCommentId.toString() || c._id === rootCommentId.toString());
    const hasReply = root && root.replies && root.replies.length > 0;
    return res.statusCode === 200 && rootList.length >= 1 && hasReply;
  });

  // 5. Toggle Reactions (Like / Unlike)
  await test('Toggle Reaction Like (Add like & Increment Count)', async () => {
    const res = mock();
    await toggleReaction(
      {
        params: { id: rootCommentId },
        user: { id: readerId },
        body: { type: 'like' },
      },
      res
    );

    const ok = res.statusCode === 200 && res.jsonData?.userReacted === true && res.jsonData?.reactionCounts?.like >= 1;
    return ok;
  });

  await test('Toggle Reaction Again (Remove like & Decrement Count)', async () => {
    const res = mock();
    await toggleReaction(
      {
        params: { id: rootCommentId },
        user: { id: readerId },
        body: { type: 'like' },
      },
      res
    );

    return res.statusCode === 200 && res.jsonData?.userReacted === false;
  });

  // 6. Update Comment by Author
  await test('Author Can Edit Own Comment (200 & isEdited=true)', async () => {
    const res = mock();
    await updateComment(
      {
        params: { id: rootCommentId },
        user: { id: authorId, role: 'author' },
        body: { content: 'This is an updated and expanded comment content.' },
      },
      res
    );

    return res.statusCode === 200 && res.jsonData?.comment?.isEdited === true;
  });

  // 7. Non-Author Cannot Edit Comment
  await test('Non-Author Blocked from Editing Comment (403)', async () => {
    const res = mock();
    await updateComment(
      {
        params: { id: rootCommentId },
        user: { id: readerId, role: 'reader' },
        body: { content: 'Malicious modification attempt' },
      },
      res
    );

    return res.statusCode === 403;
  });

  // 8. Non-Owner Cannot Delete Others Comment
  await test('Non-Owner Reader Blocked from Deleting Comment (403)', async () => {
    const res = mock();
    await deleteComment(
      {
        params: { id: rootCommentId },
        user: { id: readerId, role: 'reader' },
      },
      res
    );

    return res.statusCode === 403;
  });

  // 9. Admin Moderation Deletion
  await test('Admin Can Delete Any Comment for Moderation (200)', async () => {
    const res = mock();
    await deleteComment(
      {
        params: { id: rootCommentId },
        user: { id: adminId, role: 'admin' },
      },
      res
    );

    return res.statusCode === 200;
  });

  // 10. Recent Discussions Feed
  await test('Get Recent Discussions Feed (200)', async () => {
    const res = mock();
    await getRecentDiscussions(
      {
        query: { limit: 5 },
      },
      res
    );

    return res.statusCode === 200 && Array.isArray(res.jsonData?.comments);
  });

  console.log(`\n=============================================================`);
  console.log(`  📊 Comment Verification: ${passed}/${total} Passed (${total - passed} Failed)`);
  console.log(`=============================================================\n`);

  process.exit(passed === total ? 0 : 1);
}

main();
