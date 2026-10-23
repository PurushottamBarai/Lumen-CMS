const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const User = require('../models/User');
const demoAccounts = {
  'author@lumen.com': { name: 'Thomas Okeke', role: 'author' },
  'priya.mehta@lumen.com': { name: 'Priya Mehta', role: 'author' },
  'reader@lumen.com': { name: 'Lena Kaufmann', role: 'reader' },
};

const provisionDemoAccount = async () => {
  if (process.env.ENABLE_DEMO_ACCOUNT_SETUP !== 'true') {
    throw new Error('Set ENABLE_DEMO_ACCOUNT_SETUP=true to opt in to demo account provisioning.');
  }

  const email = (process.env.DEMO_ACCOUNT_EMAIL || '').toLowerCase().trim();
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  const demoAccount = demoAccounts[email];
  if (!demoAccount) {
    throw new Error('DEMO_ACCOUNT_EMAIL must select one of the preset reader or author accounts. Admin accounts are not provisioned by this script.');
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw new Error('Set DEMO_ACCOUNT_PASSWORD to the password used by the frontend demo button (at least 6 characters).');
  }

  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoURI) throw new Error('MONGODB_URI or MONGO_URI must be configured.');

  try {
    await mongoose.connect(mongoURI, {
      dbName: 'content_management_system',
      family: 4,
      serverSelectionTimeoutMS: 8000,
    });

    const existing = await User.findOne({ email }).select('_id').lean();
    if (existing) {
      console.log('Demo account already exists; no changes made.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      await User.create({
        name: demoAccount.name,
        email,
        password: hashedPassword,
        role: demoAccount.role,
      });
      console.log('Demo account created in content_management_system.users.');
    } catch (error) {
      if (error.code === 11000) {
        console.log('Demo account already exists; no changes made.');
        return;
      }
      throw error;
    }
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

if (require.main === module) {
  provisionDemoAccount().catch((error) => {
    console.error(`[Demo account setup] ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { provisionDemoAccount };
