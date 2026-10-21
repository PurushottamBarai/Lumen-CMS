const API_URL = 'http://localhost:5000/api';

async function verifyFullArticleLifecycle() {
  console.log('=== FULL END-TO-END ARTICLE VISIBILITY & APPROVAL WORKFLOW TEST ===\n');

  try {
    // 1. Author Login
    let authorToken;
    let authorUser;

    const authorLogin1 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'author@lumen.com', password: 'author123' })
    }).then(r => r.json());

    if (authorLogin1.token) {
      authorToken = authorLogin1.token;
      authorUser = authorLogin1.user;
    } else {
      const authorLogin2 = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'priya.mehta@lumen.com', password: 'author123' })
      }).then(r => r.json());
      authorToken = authorLogin2.token;
      authorUser = authorLogin2.user;
    }

    console.log(`[Author Login] Logged in as ${authorUser?.email || 'author'}`);

    // 2. Author creates a new article in pending status
    const createArticleRes = await fetch(`${API_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorToken}`
      },
      body: JSON.stringify({
        title: 'Quantum Fusion Energy Milestone Test 2026',
        description: 'Scientists announce major milestone in sustainable fusion power generation.',
        content: 'Full editorial breakdown of the groundbreaking fusion power experiment...',
        category: 'Technology',
        tags: ['fusion', 'energy', 'tech'],
        status: 'pending'
      })
    }).then(r => r.json());

    if (!createArticleRes.success || !createArticleRes.article) {
      console.error('❌ FAIL: Could not create article:', createArticleRes);
      process.exit(1);
    }

    const testArticle = createArticleRes.article;
    console.log(`[Article Submitted] Created article "${testArticle.title}" (ID: ${testArticle._id}) Status: ${testArticle.status}`);

    // 3. Verify public feed does NOT include the pending article
    const publicRes = await fetch(`${API_URL}/articles`).then(r => r.json());
    const publicList = publicRes.articles || [];
    const isPresentInFeed = publicList.some(a => a._id.toString() === testArticle._id.toString());

    if (isPresentInFeed) {
      console.error('❌ FAIL: Pending article is visible in public feed!');
      process.exit(1);
    } else {
      console.log('✅ PASS: Pending article is hidden from public article feed.');
    }

    // 4. Verify public direct access to pending article returns 403 Forbidden
    const directRes = await fetch(`${API_URL}/articles/${testArticle._id}`);
    const directBody = await directRes.json();

    if (directRes.status === 403) {
      console.log('✅ PASS: Direct public access to pending article returned 403 Forbidden.');
      console.log(`        Message: "${directBody.message}"`);
    } else {
      console.error(`❌ FAIL: Expected 403 Forbidden but got HTTP ${directRes.status}`);
      process.exit(1);
    }

    // 5. Admin Login
    let adminToken;
    let adminUser;

    const adminLogin1 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@lumen.com', password: 'admin123' })
    }).then(r => r.json());

    if (adminLogin1.token) {
      adminToken = adminLogin1.token;
      adminUser = adminLogin1.user;
    } else {
      const adminLogin2 = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'amara@lumen.com', password: 'password123' })
      }).then(r => r.json());
      adminToken = adminLogin2.token;
      adminUser = adminLogin2.user;
    }

    console.log(`[Admin Login] Logged in as ${adminUser?.email || 'admin'}`);

    // 6. Admin approves the pending article
    const approveRes = await fetch(`${API_URL}/articles/${testArticle._id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'published',
        reviewFeedback: 'Approved and verified for publication.'
      })
    }).then(r => r.json());

    console.log(`[Admin Approval] Article "${approveRes.article.title}" status changed to: ${approveRes.article.status}`);

    // 7. Verify public feed now includes the published article
    const updatedPublicRes = await fetch(`${API_URL}/articles`).then(r => r.json());
    const updatedList = updatedPublicRes.articles || [];
    const isNowInFeed = updatedList.some(a => a._id.toString() === testArticle._id.toString());

    if (isNowInFeed) {
      console.log('✅ PASS: Approved article is now visible in the public feed!');
    } else {
      console.error('❌ FAIL: Approved article not found in public feed.');
      process.exit(1);
    }

    // 8. Verify public direct access now returns 200 OK
    const publicDirectRes = await fetch(`${API_URL}/articles/${testArticle._id}`);
    const publicDirectBody = await publicDirectRes.json();

    if (publicDirectRes.status === 200 && publicDirectBody.success) {
      console.log('✅ PASS: Public direct access to approved article returned 200 OK with full article content.');
    } else {
      console.error(`❌ FAIL: Direct access after publishing failed with status ${publicDirectRes.status}`);
      process.exit(1);
    }

    console.log('\n=== ALL END-TO-END VISIBILITY & APPROVAL VERIFICATIONS SUCCEEDED ===');
  } catch (err) {
    console.error('Error running lifecycle verification:', err);
    process.exit(1);
  }
}

verifyFullArticleLifecycle();
