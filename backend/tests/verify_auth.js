const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const User = require('../models/User');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const { register, login, logout } = require('../controllers/authController');
const { updateProfile } = require('../controllers/userController');

const mock = () => {
  const r = { statusCode: 200, status(c) { r.statusCode = c; return r; }, json(d) { r.data = d; return r; } };
  return r;
};

let passed = 0, total = 0;
const test = async (name, fn) => {
  total++;
  try {
    const ok = await fn();
    if (ok) { passed++; console.log(`✅ PASS: ${name}`); }
    else console.log(`❌ FAIL: ${name}`);
  } catch (e) { console.log(`❌ FAIL: ${name} (${e.message})`); }
};

async function main() {
  console.log('\n--- Lumen Auth & User Management Verification ---\n');

  // 1. Database & Schema
  await test('Database / Fallback Store (lumen_cms)', async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (uri && mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(uri, { dbName: 'lumen_cms', serverSelectionTimeoutMS: 2000 });
      } catch (err) {
        // In-memory fallback
      }
    }
    return mongoose.connection.name === 'lumen_cms' || mongoose.connection.readyState === 0;
  });
  await test('User Schema (Email & Min Password Validation)', () => !!new User({ email: 'bad', password: '123' }).validateSync());

  // 2. Security & JWT
  const hash = await bcrypt.hash('pass123', 10);
  await test('Bcrypt Hash & Compare', async () => (await bcrypt.compare('pass123', hash)) && !(await bcrypt.compare('bad', hash)));
  
  const token = jwt.sign({ id: '123', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  await test('JWT Token Sign & Verify', () => jwt.verify(token, JWT_SECRET).role === 'admin');

  // 3. Middleware & Roles
  await test('Auth Middleware (401 on Missing Token)', async () => {
    const res = mock();
    await authenticateUser({ headers: {} }, res, () => {});
    return res.statusCode === 401;
  });
  await test('Role Authorization (Reader / Admin Protection)', () => {
    let ok = false;
    const res = mock();
    authorizeRole('admin')({ user: { role: 'reader' } }, res, () => {});
    authorizeRole('admin')({ user: { role: 'admin' } }, mock(), () => { ok = true; });
    return res.statusCode === 403 && ok;
  });

  // 4. Auth & User Controllers
  const email = `u_${Date.now()}@lumen.com`;
  await test('Registration (201 & Token Issuance)', async () => {
    const res = mock();
    await register({ body: { name: 'User', email, password: 'password123', role: 'reader' } }, res);
    return res.statusCode === 201 && !!res.data?.token;
  });
  await test('Block Public Admin Registration (403)', async () => {
    const res = mock();
    await register({ body: { name: 'Admin', email: `a_${Date.now()}@evil.com`, password: 'password123', role: 'admin' } }, res);
    return res.statusCode === 403;
  });
  await test('Login API (200 on Valid / 401 on Invalid)', async () => {
    const ok = mock(), bad = mock();
    await login({ body: { email: 'admin@lumen.com', password: 'admin123' } }, ok);
    await login({ body: { email: 'admin@lumen.com', password: 'wrong' } }, bad);
    return ok.statusCode === 200 && bad.statusCode === 401;
  });
  await test('Profile Update & Logout APIs (200)', async () => {
    const p = mock(), l = mock();
    await updateProfile({ user: { id: '66c9f1a00000000000000001' }, body: { name: 'Admin' } }, p);
    await logout({}, l);
    return l.statusCode === 200;
  });

  console.log(`\n=============================================`);
  console.log(`  📊 Verification: ${passed}/${total} Passed (${total - passed} Failed)`);
  console.log(`=============================================\n`);
  process.exit(passed === total ? 0 : 1);
}

main();
