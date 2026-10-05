import assert from 'node:assert';
import {
  getProfileByUsername,
  getProfileById,
  getProfileStats,
} from '../src/lib/profile-storage';
import {
  getArticlesByUsername,
  getArticleBySlug,
} from '../src/lib/article-storage';
import { publishTenantArticle } from '../src/app/actions/tenant';

async function runTests() {
  console.log('--- Starting Storage & Authorization Unit Tests ---');

  // 1. Profile Storage Tests
  console.log('\n[1] Testing Profile Storage Functions...');
  const emptyUser = await getProfileByUsername('');
  assert.strictEqual(emptyUser, null, 'Empty username must return null');

  const invalidUser = await getProfileByUsername('non-existent-user-123456');
  assert.strictEqual(invalidUser, null, 'Non-existent profile must return null');

  const emptyId = await getProfileById('');
  assert.strictEqual(emptyId, null, 'Empty userId must return null');

  const stats = await getProfileStats('');
  assert.deepStrictEqual(stats, { followersCount: 0, followingCount: 0, articlesCount: 0 });
  console.log('✓ Profile storage safe fallbacks verified');

  // 2. Article Storage Tests
  console.log('\n[2] Testing Article Storage Functions & Clean States...');
  const emptyArticles = await getArticlesByUsername('');
  assert.deepStrictEqual(emptyArticles, [], 'Empty username must return empty list');

  const axaaArticles = await getArticlesByUsername('axaa');
  assert.strictEqual(axaaArticles.length, 0, 'axaa should have 0 articles in clean unseeded database');
  console.log(`✓ Clean profile verified: 0 dummy articles for @axaa`);

  const unknownSlug = await getArticleBySlug('axaa', 'mengenali-tanda-burnout');
  assert.strictEqual(unknownSlug, null, 'Non-existent / clean slug should return null');
  console.log('✓ Clean article query verified: non-existent returns null');

  const newCreatorArticles = await getArticlesByUsername('newcreator');
  assert.strictEqual(newCreatorArticles.length, 0, 'New creator starts with clean 0 articles');
  console.log('✓ Clean new creator state verified: 0 articles');

  // 3. Publishing Authorization Tests
  console.log('\n[3] Testing publishTenantArticle Authorization...');
  const unauthRes = await publishTenantArticle({
    username: 'axaa',
    title: 'Test Unauthenticated Post',
    excerpt: 'Test excerpt',
    content: 'Test content here...',
  });

  assert.strictEqual(unauthRes.success, false, 'Unauthenticated publish must fail');
  assert.ok(
    unauthRes.error?.includes('Sesi masuk tidak ditemukan') || unauthRes.error?.includes('masuk terlebih dahulu'),
    'Error message must indicate authentication is required'
  );
  console.log('✓ Unauthenticated publish rejection verified:', unauthRes.error);

  console.log('\n=============================================');
  console.log('All Task 3 Unit & Storage Tests Passed Successfully!');
  console.log('=============================================\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
