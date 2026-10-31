process.env.NODE_ENV = 'test';

const http = require('http');
const connectDB = require('../config/db');
const app = require('../app');

let server;
let baseUrl;

const runStep = async (name, testFn) => {
  try {
    await testFn();
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name} -> ${err.message}`);
    throw err;
  }
};

async function smokeTest() {
  console.log('=== SANGAM SMOKE TEST SUITE ===');

  await connectDB();

  // Start on a random port (port 0)
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  let testUserToken = '';
  let testUserId = '';
  let testUsername = `smoke_${Date.now() % 100000}`;
  let testPostId = '';
  let testMediaId = '';
  let testCommentId = '';

  try {
    // 1. Register
    await runStep('POST /api/auth/register', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Smoke Tester',
          username: testUsername,
          email: `${testUsername}@sangam.in`,
          password: 'Password123!',
        }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.token) {
        throw new Error(`Expected 201 with token, got ${res.status}: ${JSON.stringify(data)}`);
      }
      testUserToken = data.token;
      testUserId = data.user._id;
    });

    // 2. Login
    await runStep('POST /api/auth/login', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: testUsername,
          password: 'Password123!',
        }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token) {
        throw new Error(`Expected 200 with token, got ${res.status}`);
      }
    });

    // 3. Current User /me
    await runStep('GET /api/auth/me', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || data.user.username !== testUsername) {
        throw new Error(`Expected current user data, got ${res.status}`);
      }
    });

    // 4. Upload media (valid 1x1 transparent PNG)
    await runStep('POST /api/media', async () => {
      const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const res = await fetch(`${baseUrl}/api/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ dataUrl: tinyPng }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.id || !data.url) {
        throw new Error(`Expected 201 with media id and url, got ${res.status}`);
      }
      testMediaId = data.id;
    });

    // 5. Create post with text + media + hashtags
    await runStep('POST /api/posts', async () => {
      const res = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          text: 'Running the automated smoke test on Sangam #testing #qa @demo',
          mediaId: testMediaId,
        }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.post || !data.post._id) {
        throw new Error(`Expected 201 with created post, got ${res.status}`);
      }
      testPostId = data.post._id;
      if (!data.post.hashtags.includes('testing')) {
        throw new Error('Hashtag #testing was not extracted');
      }
    });

    // 6. Like post & Reactions
    await runStep('POST /api/posts/:id/like', async () => {
      const res = await fetch(`${baseUrl}/api/posts/${testPostId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || data.liked !== true || data.likesCount !== 1) {
        throw new Error(`Expected like toggle response, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // 6b. Post Reaction
    await runStep('POST /api/posts/:id/like with reaction type (love)', async () => {
      const res = await fetch(`${baseUrl}/api/posts/${testPostId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ type: 'love' }),
      });
      const data = await res.json();
      if (res.status !== 200 || data.myReaction !== 'love') {
        throw new Error(`Expected reaction type 'love', got: ${JSON.stringify(data)}`);
      }
    });

    // 7. Bookmark post
    await runStep('POST /api/posts/:id/bookmark', async () => {
      const res = await fetch(`${baseUrl}/api/posts/${testPostId}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || data.bookmarked !== true) {
        throw new Error(`Expected bookmark toggle response, got ${res.status}`);
      }
    });

    // 8. Comment on post
    await runStep('POST /api/posts/:id/comments', async () => {
      const res = await fetch(`${baseUrl}/api/posts/${testPostId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ text: 'Smoke test automated comment' }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.comment) {
        throw new Error(`Expected 201 with comment, got ${res.status}`);
      }
      testCommentId = data.comment._id;
    });

    // 9. Follow user
    await runStep('POST /api/users/:id/follow', async () => {
      // Find a user to follow (e.g., demo)
      const demoRes = await fetch(`${baseUrl}/api/users/demo`);
      const demoData = await demoRes.json();
      const demoId = demoData.user._id;

      const followRes = await fetch(`${baseUrl}/api/users/${demoId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const followData = await followRes.json();
      if (followRes.status !== 200 || followData.following !== true) {
        throw new Error(`Expected following true, got ${followRes.status}`);
      }
    });

    // 10. Check notifications
    await runStep('GET /api/notifications & /unread-count', async () => {
      const res = await fetch(`${baseUrl}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || typeof data.count !== 'number') {
        throw new Error(`Expected unread count, got ${res.status}`);
      }
    });

    // 11. Trending hashtags
    await runStep('GET /api/trending', async () => {
      const res = await fetch(`${baseUrl}/api/trending`);
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data.trending)) {
        throw new Error(`Expected trending array, got ${res.status}`);
      }
    });

    // 12. Stories tests (Create, Get, View)
    let testStoryId = null;
    await runStep('POST /api/stories', async () => {
      const res = await fetch(`${baseUrl}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          text: 'Smoke testing 24h stories feature on Sangam! 🚀',
          backgroundColor: 'linear-gradient(135deg, #FF007A 0%, #FFA41B 100%)',
        }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.story || !data.story._id) {
        throw new Error(`Expected 201 with story, got ${res.status}: ${JSON.stringify(data)}`);
      }
      testStoryId = data.story._id;
    });

    await runStep('GET /api/stories', async () => {
      const res = await fetch(`${baseUrl}/api/stories`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data.groups)) {
        throw new Error(`Expected 200 with groups array, got ${res.status}`);
      }
    });

    await runStep('POST /api/stories/:id/view', async () => {
      const res = await fetch(`${baseUrl}/api/stories/${testStoryId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || data.viewed !== true) {
        throw new Error(`Expected viewed: true, got ${res.status}`);
      }
    });

    // 13. Unauthorized request validation
    await runStep('GET /api/posts/bookmarks without auth (Expect 401)', async () => {
      const res = await fetch(`${baseUrl}/api/posts/bookmarks`);
      if (res.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      }
    });

    // 14. Invalid input validation
    await runStep('POST /api/posts with empty body (Expect 400)', async () => {
      const res = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({ text: '' }),
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      }
    });

    // 15. Delete post
    await runStep('DELETE /api/posts/:id', async () => {
      const res = await fetch(`${baseUrl}/api/posts/${testPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = await res.json();
      if (res.status !== 200) {
        throw new Error(`Expected 200 for deletion, got ${res.status}`);
      }
    });

    // 16. Verify deleted post returns 404
    await runStep('GET /api/posts/:id on deleted post (Expect 404)', async () => {
      const res = await fetch(`${baseUrl}/api/posts/${testPostId}`);
      if (res.status !== 404) {
        throw new Error(`Expected 404 Not Found, got ${res.status}`);
      }
    });

    console.log('\nALL SMOKE TESTS PASSED SUCCESSFULLY! (19/19)');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\nSMOKE TESTS FAILED!');
    if (server) server.close();
    process.exit(1);
  }
}

smokeTest();
