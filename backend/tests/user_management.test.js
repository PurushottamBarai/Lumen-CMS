const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

const jwtSecret = process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';

jest.setTimeout(20000);

describe('User Management Module — Comprehensive Test Suite (24+ Test Cases)', () => {
  const timestamp = Date.now();
  const validUser = {
    name: 'Test Tester',
    email: `test_user_${timestamp}@lumen.com`,
    password: 'ValidPassword123!',
    confirmPassword: 'ValidPassword123!',
    role: 'reader',
    bio: 'Avid reader and learner',
  };

  let registeredToken = '';
  let registeredUserId = '';
  let adminToken = '';

  beforeAll(() => {
    // Admin token for role tests
    adminToken = jwt.sign(
      { id: '66c9f1a00000000000000001', role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  // ======================================================
  // A. REGISTRATION TESTS
  // ======================================================
  describe('A. User Registration', () => {
    // 1. Valid registration
    it('1. Valid registration — should register successfully and return 201 with token and user object', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.user.role).toBe('reader');
      expect(res.body.user.password).toBeUndefined();

      registeredToken = res.body.token;
      registeredUserId = res.body.user.id || res.body.user._id;
    });

    // 2. Duplicate email
    it('2. Duplicate email registration — should be rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    // 3. Invalid email format
    it('3. Invalid email format — should be rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-a-valid-email',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid email/i);
    });

    // 4. Missing required fields
    it('4. Missing required fields — should be rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `missing_fields_${Date.now()}@lumen.com`,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/required/i);
    });

    // 5. Invalid / weak password (< 6 chars)
    it('5. Invalid password (< 6 chars) — should be rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Password',
          email: `short_pass_${Date.now()}@lumen.com`,
          password: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/6 characters/i);
    });

    // 6. Password confirmation mismatch
    it('6. Password confirmation mismatch — should be rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mismatch User',
          email: `mismatch_${Date.now()}@lumen.com`,
          password: 'Password123!',
          confirmPassword: 'DifferentPassword456!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/match/i);
    });
  });

  // ======================================================
  // B. LOGIN TESTS
  // ======================================================
  describe('B. User Login', () => {
    // 7. Correct credentials
    it('7. Correct credentials — should authenticate successfully and return 200 with JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.user.password).toBeUndefined();
    });

    // 8. Wrong password
    it('8. Wrong password — must be rejected with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'CompletelyWrongPassword999',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    // 8b. Security test: arbitrary user cannot login with "password123"
    it('8b. Non-demo user cannot login with demo password fallback — must be rejected with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'password123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // 9. Non-existing account
    it('9. Non-existing account — should be rejected with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_account_404@lumen.com',
          password: 'AnyPassword123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    // 10. Missing credentials
    it('10. Missing credentials — should be rejected with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/provide both/i);
    });
  });

  // ======================================================
  // C. AUTHENTICATION & JWT TESTS
  // ======================================================
  describe('C. Authentication & Middleware', () => {
    // 11. Access protected API without token
    it('11. Access protected API without token — should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // 12. Access protected API with valid token
    it('12. Access protected API with valid token — should return 200 OK', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${registeredToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
    });

    // 13. Access with invalid token
    it('13. Access with invalid token — should return 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid_tampered_token_xyz');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // 14. Access with expired token
    it('14. Access with expired token — should return 401 with session expired message', async () => {
      const expiredToken = jwt.sign(
        { id: registeredUserId, role: 'reader' },
        jwtSecret,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired/i);
    });
  });

  // ======================================================
  // D. USER PROFILE TESTS
  // ======================================================
  describe('D. User Profile Management', () => {
    // 15. View own profile
    it('15. View own profile — should return current user profile data', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${registeredToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe(validUser.name);
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
    });

    // 16. Update own profile
    it('16. Update own profile — should update name and bio successfully', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${registeredToken}`)
        .send({
          name: 'Updated Name',
          bio: 'Updated bio information',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Updated Name');
      expect(res.body.user.bio).toBe('Updated bio information');
    });

    // 17. Invalid profile data (empty name)
    it('17. Invalid profile data (empty name) — should be rejected with 400', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${registeredToken}`)
        .send({
          name: '   ',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/empty/i);
    });

    // 18. Attempt unauthorized modification of another user
    it('18. Attempt unauthorized modification of another user via profile endpoint — cannot modify another ID', async () => {
      // Sending another user's id in the payload should NOT affect another user
      const otherUserId = '66c9f1a00000000000000001';
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${registeredToken}`)
        .send({
          id: otherUserId,
          name: 'Attacker Name',
        });

      expect(res.statusCode).toBe(200);
      // The updated user must still be the authenticated user, NOT the other user
      expect(res.body.user.id).toBe(registeredUserId);
    });

    // 19. Ensure password and password hash are not returned
    it('19. Ensure password and password hash are never returned in responses', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${registeredToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.hashedPassword).toBeUndefined();
    });
  });

  // ======================================================
  // E. ACCOUNT MANAGEMENT & LOGOUT TESTS
  // ======================================================
  describe('E. Account Management & Logout', () => {
    // 20. Logout
    it('20. Logout — should return 200 sign out confirmation', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    // 21. Verify protected functionality after logout
    it('21. Verify protected functionality without token after client logout — returns 401', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // Password change tests
    it('21b. Change password — successfully update password with valid current credentials', async () => {
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${registeredToken}`)
        .send({
          currentPassword: validUser.password,
          newPassword: 'BrandNewPassword456!',
          confirmPassword: 'BrandNewPassword456!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/successfully/i);

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'BrandNewPassword456!',
        });
      expect(loginRes.statusCode).toBe(200);
    });

    it('21c. Change password with incorrect current password — rejected with 401', async () => {
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${registeredToken}`)
        .send({
          currentPassword: 'IncorrectOldPassword',
          newPassword: 'AnotherPassword789!',
          confirmPassword: 'AnotherPassword789!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ======================================================
  // F. ROLE-BASED ACCESS CONTROL TESTS
  // ======================================================
  describe('F. Role-Based Access Control', () => {
    // 22. Normal user cannot access admin-only functionality
    it('22. Normal user cannot access admin-only functionality — returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${registeredToken}`)
        .send({
          name: 'Should Fail',
          email: 'fail@lumen.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access denied/i);
    });

    // 23. User cannot change their own role
    it('23. User cannot change their own role via profile update — role remains unchanged', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${registeredToken}`)
        .send({
          role: 'admin',
        });

      expect(res.statusCode).toBe(200);
      // Role MUST remain reader
      expect(res.body.user.role).toBe('reader');
    });

    // 24. Admin functionality continues working
    it('24. Admin functionality continues working — admin can access admin routes', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });
});
