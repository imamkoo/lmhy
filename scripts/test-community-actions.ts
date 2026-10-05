import assert from 'node:assert';
import {
  getCommentsByArticle,
  createComment,
  deleteComment,
  getFollowStatus,
} from '../src/lib/comment-storage';
import {
  toggleFollowAction,
  postCommentAction,
  deleteCommentAction,
} from '../src/app/actions/community';

async function runCommunityTests() {
  console.log('--- Starting Task 5 Social Engagement & Community Unit Tests ---');

  // 1. Test getCommentsByArticle with empty and valid article IDs
  console.log('\n[1] Testing getCommentsByArticle...');
  const emptyComments = await getCommentsByArticle('');
  assert.deepStrictEqual(emptyComments, [], 'Empty article ID must return empty array');

  const initialComments = await getCommentsByArticle('art_1');
  assert.ok(Array.isArray(initialComments), 'getCommentsByArticle must return an array');
  console.log(`✓ Fetched ${initialComments.length} comments for art_1`);

  // 2. Test createComment and deleteComment in storage
  console.log('\n[2] Testing createComment & deleteComment storage operations...');
  const testArticleId = 'test-article-unit-123';
  const testAuthorId = 'test-author-uuid-456';
  const testContent = 'Ini adalah refleksi mendalam dari pembaca mengenai ketenangan batin.';

  const newComment = await createComment({
    articleId: testArticleId,
    authorId: testAuthorId,
    content: testContent,
  });

  assert.ok(newComment.id, 'Created comment must have an ID');
  assert.strictEqual(newComment.article_id, testArticleId);
  assert.strictEqual(newComment.content, testContent);
  assert.strictEqual(newComment.author_id, testAuthorId);
  console.log(`✓ Comment created with ID: ${newComment.id}`);

  // Fetch comments to verify presence
  const commentsAfterCreate = await getCommentsByArticle(testArticleId);
  assert.ok(
    commentsAfterCreate.some((c) => c.id === newComment.id),
    'Created comment must be returned in getCommentsByArticle'
  );
  console.log('✓ Comment successfully retrieved from storage');

  // Test deleteComment
  const deleted = await deleteComment(newComment.id, testAuthorId);
  assert.strictEqual(deleted, true, 'Comment should be successfully deleted');

  const commentsAfterDelete = await getCommentsByArticle(testArticleId);
  assert.ok(
    !commentsAfterDelete.some((c) => c.id === newComment.id),
    'Deleted comment must not appear in comments list'
  );
  console.log('✓ Comment successfully deleted and verified');

  // 3. Test getFollowStatus
  console.log('\n[3] Testing getFollowStatus...');
  const sameUserStatus = await getFollowStatus('user-1', 'user-1');
  assert.strictEqual(sameUserStatus, false, 'Self-follow status should be false');

  const emptyStatus = await getFollowStatus('', 'user-2');
  assert.strictEqual(emptyStatus, false, 'Empty follower status should be false');
  console.log('✓ getFollowStatus edge cases handled correctly');

  // 4. Test toggleFollowAction without authentication
  console.log('\n[4] Testing toggleFollowAction server action without auth...');
  const unauthFollow = await toggleFollowAction('target-user-789');
  assert.strictEqual(unauthFollow.isFollowing, false);
  assert.ok(
    unauthFollow.error?.includes('masuk terlebih dahulu'),
    'Unauthenticated follow must return helpful login prompt message'
  );

  const emptyTargetFollow = await toggleFollowAction('');
  assert.strictEqual(emptyTargetFollow.isFollowing, false);
  assert.ok(emptyTargetFollow.error, 'Empty target must return error');
  console.log('✓ toggleFollowAction auth protection verified');

  // 5. Test postCommentAction and deleteCommentAction without authentication
  console.log('\n[5] Testing postCommentAction & deleteCommentAction server actions without auth...');
  const unauthPost = await postCommentAction('art_1', 'Komentar tanpa login');
  assert.strictEqual(unauthPost.success, false);
  assert.ok(
    unauthPost.error?.includes('masuk terlebih dahulu'),
    'Unauthenticated comment post must return login prompt'
  );

  const emptyContentPost = await postCommentAction('art_1', '   ');
  assert.strictEqual(emptyContentPost.success, false);
  assert.ok(
    emptyContentPost.error?.includes('kosong'),
    'Empty comment content must return error'
  );

  const unauthDelete = await deleteCommentAction('cm_123');
  assert.strictEqual(unauthDelete.success, false);
  assert.ok(
    unauthDelete.error?.includes('masuk terlebih dahulu') || unauthDelete.error?.includes('Sesi masuk'),
    'Unauthenticated comment delete must return auth error'
  );
  console.log('✓ Server actions authentication and validation verified');

  console.log('\n=============================================');
  console.log('All Task 5 Community & Social Engagement Tests Passed!');
  console.log('=============================================\n');
}

runCommunityTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
