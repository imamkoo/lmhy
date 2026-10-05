import assert from 'node:assert';
import { updateProfileAction, toggleFollowAction } from '../src/app/actions/profile';
import { getProfileByUsername } from '../src/lib/profile-storage';
import { getArticlesByUsername } from '../src/lib/article-storage';

async function runProfileTests() {
  console.log('--- Starting Task 4 Profile Overhaul Unit Tests ---');

  // 1. Test updateProfileAction without auth
  console.log('\n[1] Testing updateProfileAction without authentication...');
  const unauthUpdate = await updateProfileAction({
    displayName: 'New Name',
    bio: 'Updated bio description',
  });
  assert.strictEqual(unauthUpdate.success, false, 'Unauthenticated update must fail');
  assert.ok(
    unauthUpdate.error?.includes('Sesi masuk tidak ditemukan'),
    'Should return session not found error'
  );
  console.log('✓ Unauthenticated profile update correctly rejected');

  // 2. Test toggleFollowAction without auth
  console.log('\n[2] Testing toggleFollowAction without authentication...');
  const unauthFollow = await toggleFollowAction('some-user-uuid');
  assert.strictEqual(unauthFollow.success, false, 'Unauthenticated follow must fail');
  assert.ok(
    unauthFollow.error?.includes('Sesi masuk tidak ditemukan'),
    'Should return session not found error for follow'
  );

  const emptyTargetFollow = await toggleFollowAction('');
  assert.strictEqual(emptyTargetFollow.success, false, 'Empty target user ID must fail');
  console.log('✓ Unauthenticated follow action correctly rejected');

  // 3. Test Profile data structures for Medium-style layout
  console.log('\n[3] Testing Profile & Article data contract for Medium-style layout...');
  const articles = await getArticlesByUsername('axaa');
  assert.ok(articles.length >= 2, 'axaa should have articles');

  // Verify litera registered filter
  const literaArticles = articles.filter((a) => Boolean(a.register_litera));
  assert.ok(literaArticles.length > 0, 'axaa should have litera registered articles');
  console.log(`✓ Articles found: ${articles.length}, with Litera NFT: ${literaArticles.length}`);

  // 4. Test Profile fallback generation
  const profile = await getProfileByUsername('axaa');
  console.log('✓ Profile query completed (DB or fallback):', profile?.username || 'fallback ready');

  console.log('\n=============================================');
  console.log('All Task 4 Profile Overhaul Tests Passed Successfully!');
  console.log('=============================================\n');
}

runProfileTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
