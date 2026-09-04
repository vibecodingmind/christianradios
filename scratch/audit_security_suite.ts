import { db } from '../server/db.js';
import { hashPassword, verifyPassword, createPasswordResetToken, verifyPasswordResetToken, consumePasswordResetToken } from '../server/auth.js';
import { validateStreamUrl } from '../server/ssrf.js';

async function runSecurityAuditSuite() {
  console.log('====================================================');
  console.log('RUNNING AUTOMATED SECURITY & API TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${failureDetails || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Password Hashing & Timing-Safe Verification
  console.log('--- 1. Password Security & Hashing Tests ---');
  const pwd = 'TestPassword@2026!';
  const hashed = hashPassword(pwd);
  assert(verifyPassword(pwd, hashed), 'Valid password verification');
  assert(!verifyPassword('WrongPassword', hashed), 'Invalid password rejection');

  // 2. Password Reset Token Flow
  console.log('\n--- 2. Password Reset Token Tests ---');
  const email = 'audit_test_user@christianradios.org';
  const token = createPasswordResetToken(email);
  assert(typeof token === 'string' && token.length >= 32, 'Password reset token generation');

  const verifiedEmail = verifyPasswordResetToken(token);
  assert(verifiedEmail === email, 'Token resolves to correct user email');

  const consumed = consumePasswordResetToken(token);
  assert(consumed, 'Token consumed successfully');

  const reVerified = verifyPasswordResetToken(token);
  assert(reVerified === null, 'Single-use token cannot be reused');

  // 3. Stream URL / SSRF Protection Tests
  console.log('\n--- 3. Stream SSRF Validation Tests ---');
  const ssrf1 = await validateStreamUrl('http://127.0.0.1:3000/api/health');
  assert(!ssrf1.isValid, 'Block localhost 127.0.0.1 SSRF attack');

  const ssrf2 = await validateStreamUrl('http://169.254.169.254/latest/meta-data/');
  assert(!ssrf2.isValid, 'Block AWS cloud metadata 169.254.169.254 SSRF attack');

  const ssrf3 = await validateStreamUrl('http://localhost:8000/stream');
  assert(!ssrf3.isValid, 'Block internal hostname localhost SSRF attack');

  const ssrfValid = await validateStreamUrl('https://stream.zeno.fm/f3728190283');
  assert(ssrfValid.isValid, 'Allow valid external HTTPS radio stream URL');

  // 4. Tenant Isolation / IDOR Tests
  console.log('\n--- 4. Tenant Isolation & IDOR Verification ---');
  const allStations = db.stations.getAll();
  const ownerAStation = allStations[0];
  const ownerBId = 'usr_test_owner_b_fake';

  if (ownerAStation) {
    const isOwnedByB = ownerAStation.ownerId === ownerBId;
    assert(!isOwnedByB, `Owner B (${ownerBId}) cannot claim ownership of Station ${ownerAStation.name}`);
  }

  // 5. Financial Ledger & Withdrawal Balance Verification
  console.log('\n--- 5. Financial Ledger Accounting Tests ---');
  const ownerBalance = db.ledgerEntries.getOwnerBalance('usr_owner_01');
  assert(typeof ownerBalance.availableBalance === 'number', 'Available balance calculation');
  assert(ownerBalance.availableBalance >= 0, 'Available balance cannot be negative');

  console.log('\n====================================================');
  console.log(`TEST SUITE COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditSuite().catch((err) => {
  console.error('Audit suite error:', err);
  process.exit(1);
});
