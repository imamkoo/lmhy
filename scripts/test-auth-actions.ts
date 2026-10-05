import assert from 'node:assert';
import {
  USERNAME_REGEX,
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  RESERVED_USERNAMES,
  checkUsernameAvailabilityAction,
  completeOnboardingAction,
  signInWithGoogleAction,
  signInWithFacebookAction,
  signInWithEmailAction,
  signUpWithEmailAction,
  signOutAction,
} from '../src/app/actions/auth';

async function runTests() {
  console.log('🧪 Testing Auth Actions & Username Validation Rules...');

  // 1. Function exports test
  assert.strictEqual(typeof signInWithGoogleAction, 'function');
  assert.strictEqual(typeof signInWithFacebookAction, 'function');
  assert.strictEqual(typeof signInWithEmailAction, 'function');
  assert.strictEqual(typeof signUpWithEmailAction, 'function');
  assert.strictEqual(typeof signOutAction, 'function');
  assert.strictEqual(typeof checkUsernameAvailabilityAction, 'function');
  assert.strictEqual(typeof completeOnboardingAction, 'function');
  console.log('  ✅ All 7 required auth actions are exported functions');

  // 2. Constants test
  assert.strictEqual(MIN_USERNAME_LENGTH, 3);
  assert.strictEqual(MAX_USERNAME_LENGTH, 30);
  assert.ok(RESERVED_USERNAMES.has('admin'));
  assert.ok(RESERVED_USERNAMES.has('builder'));
  assert.ok(RESERVED_USERNAMES.has('www'));
  assert.ok(RESERVED_USERNAMES.has('onboarding'));
  console.log('  ✅ Validation constants and reserved usernames configured');

  // 3. Regex tests
  assert.ok(USERNAME_REGEX.test('axaa'));
  assert.ok(USERNAME_REGEX.test('jiwa-tenang'));
  assert.ok(USERNAME_REGEX.test('user123'));
  assert.ok(!USERNAME_REGEX.test('Axaa'), 'Must reject uppercase');
  assert.ok(!USERNAME_REGEX.test('user name'), 'Must reject spaces');
  assert.ok(!USERNAME_REGEX.test('user_name'), 'Must reject underscores');
  assert.ok(!USERNAME_REGEX.test('user@123'), 'Must reject symbols');
  console.log('  ✅ Subdomain-safe regex ^[a-z0-9-]+$ verified');

  // 4. Availability action tests
  // Empty
  const resEmpty = await checkUsernameAvailabilityAction('');
  assert.strictEqual(resEmpty.available, false);

  // Short
  const resShort = await checkUsernameAvailabilityAction('ab');
  assert.strictEqual(resShort.available, false);
  assert.ok(resShort.error?.includes('minimal 3'));

  // Leading/trailing dash
  const resDashLead = await checkUsernameAvailabilityAction('-abc');
  assert.strictEqual(resDashLead.available, false);
  const resDashTrail = await checkUsernameAvailabilityAction('abc-');
  assert.strictEqual(resDashTrail.available, false);

  // Double dash
  const resDoubleDash = await checkUsernameAvailabilityAction('ab--cd');
  assert.strictEqual(resDoubleDash.available, false);

  // Reserved
  const resReserved = await checkUsernameAvailabilityAction('admin');
  assert.strictEqual(resReserved.available, false);
  assert.ok(resReserved.error?.includes('cadangan sistem'));

  // Uppercase input is automatically lowercased and tested
  const resUpper = await checkUsernameAvailabilityAction('ValidUser');
  assert.strictEqual(resUpper.available, true); // 'validuser' is valid

  // 5. Complete Onboarding validation
  const resNoName = await completeOnboardingAction('myname', '');
  assert.strictEqual(resNoName.success, false);
  assert.ok(resNoName.error?.includes('Nama tampilan minimal 2 karakter'));

  const resInvalidUser = await completeOnboardingAction('bad_user', 'My Display Name');
  assert.strictEqual(resInvalidUser.success, false);

  console.log('  ✅ Username availability logic correctly enforces all constraints');
  console.log('🎉 All Auth Action & Onboarding tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
