import assert from 'node:assert';
import {
  getProfileByUsername,
  getProfileById,
  getProfileStats,
} from '../src/lib/profile-storage';
import {
  getArticlesByUsername,
  getArticleBySlug,
  convertTenantArticleToArticle,
} from '../src/lib/article-storage';
import { publishTenantArticle } from '../src/app/actions/tenant';
import { DEFAULT_TENANT_ARTICLES } from '../src/lib/tenant-storage';

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
  console.log('\n[2] Testing Article Storage Functions & Fallbacks...');
  const emptyArticles = await getArticlesByUsername('');
  assert.deepStrictEqual(emptyArticles, [], 'Empty username must return empty list');

  const axaaArticles = await getArticlesByUsername('axaa');
  assert.ok(axaaArticles.length >= 2, 'axaa should have at least 2 default seeded articles');
  assert.strictEqual(axaaArticles[0].username, 'axaa');
  console.log(`✓ axaa articles found: ${axaaArticles.length} items`);

  const axaaArticle1 = await getArticleBySlug('axaa', 'mengenali-tanda-burnout');
  assert.ok(axaaArticle1, 'Article "mengenali-tanda-burnout" should be found');
  assert.strictEqual(axaaArticle1.title, 'Mengenali Tanda Burnout Sebelum Terlambat');
  assert.strictEqual(axaaArticle1.media_type, 'IMAGE');
  console.log('✓ Article by slug verified');

  const unknownSlug = await getArticleBySlug('axaa', 'random-nonexistent-slug');
  assert.strictEqual(unknownSlug, null, 'Non-existent slug should return null');

  const newCreatorArticles = await getArticlesByUsername('newcreator');
  assert.strictEqual(newCreatorArticles.length, 1);
  assert.strictEqual(newCreatorArticles[0].slug, 'selamat-datang-di-ruang-refleksi');
  console.log('✓ New creator welcome article fallback verified');

  const converted = convertTenantArticleToArticle(DEFAULT_TENANT_ARTICLES[0], 'test-author-id');
  assert.strictEqual(converted.author_id, 'test-author-id');
  assert.strictEqual(converted.slug, DEFAULT_TENANT_ARTICLES[0].slug);
  console.log('✓ TenantArticle to Article conversion verified');

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
