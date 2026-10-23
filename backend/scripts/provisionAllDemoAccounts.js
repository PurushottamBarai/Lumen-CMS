const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const REQUIRED_CONFIRMATION = 'CREATE_MISSING_LUMEN_DEMO_ACCOUNTS';
const demoAccounts = [
  { name: 'Amara Silva', email: 'admin@lumen.com', role: 'admin' },
  { name: 'Priya Mehta', email: 'priya.mehta@lumen.com', role: 'author' },
  { name: 'Thomas Okeke', email: 'author@lumen.com', role: 'author' },
  { name: 'Lena Kaufmann', email: 'reader@lumen.com', role: 'reader' },
];

const provisionAllDemoAccounts = async () => {
  if (process.env.ENABLE_DEMO_ACCOUNT_SETUP !== 'true') {
    throw new Error('Opt-in is required: set ENABLE_DEMO_ACCOUNT_SETUP=true.');
  }
  if (process.env.CONFIRM_DEMO_ACCOUNT_PROVISIONING !== REQUIRED_CONFIRMATION) {
    throw new Error(`Confirmation is required: set CONFIRM_DEMO_ACCOUNT_PROVISIONING=${REQUIRED_CONFIRMATION}.`);
  }

  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (typeof password !== 'string' || password.length < 6) {
    throw new Error('Set DEMO_ACCOUNT_PASSWORD to the password currently submitted by the frontend demo buttons.');
  }

  try {
    await connectDB();
    const { connection } = require('mongoose');
    if (connection.readyState !== 1) {
      throw new Error('The configured CMS database connection is not available; no accounts were changed.');
    }
    if (connection.name !== 'content_management_system' || User.collection.name !== 'users') {
      throw new Error('The active database or user collection did not match the expected CMS target; no accounts were changed.');
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const account of demoAccounts) {
      const email = account.email.toLowerCase();
      const existing = await User.findOne({ email }).select('_id').lean();
      if (existing) {
        console.log(`Skipped existing account: ${email} (left unchanged).`);
        skippedCount += 1;
        continue;
      }

      // Match authController.register: hash once with bcrypt cost 10, then
      // persist the already-hashed value. User has no password pre-save hook.
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      try {
        await User.create({
          name: account.name,
          email,
          password: hashedPassword,
          role: account.role,
        });
        console.log(`Created ${account.role} demo account: ${email}.`);
        createdCount += 1;
      } catch (error) {
        // The unique email index protects against a concurrent provisioner.
        // On a duplicate, leave the concurrently created account untouched.
        if (error.code === 11000) {
          console.log(`Skipped existing account: ${email} (left unchanged).`);
          skippedCount += 1;
          continue;
        }
        throw error;
      }
    }

    console.log(`Demo account setup complete. Created: ${createdCount}; skipped: ${skippedCount}.`);
  } finally {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

if (require.main === module) {
  provisionAllDemoAccounts().catch((error) => {
    // Deliberately omit error.message and database driver details to avoid
    // leaking connection or credential data in environment-specific errors.
    console.error('[Demo account setup] Failed. Check required opt-in settings and backend database configuration. No password or hash was logged.');
    process.exitCode = 1;
  });
}

module.exports = { provisionAllDemoAccounts };
