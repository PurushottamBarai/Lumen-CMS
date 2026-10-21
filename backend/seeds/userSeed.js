const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const User = require('../models/User');

const seedUsers = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('[UserSeed] MONGO_URI environment variable is missing.');
      process.exit(1);
    }

    console.log('[UserSeed] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI, { dbName: 'lumen_cms' });
    console.log('[UserSeed] Connected to database: lumen_cms');

    console.log('[UserSeed] Clearing existing demo users...');
    await User.deleteMany({
      email: {
        $in: [
          'admin@lumen.com',
          'author@lumen.com',
          'reader@lumen.com',
          'priya.mehta@lumen.com',
          'thomas.okeke@lumen.com',
          'john.reader@lumen.com',
        ],
      },
    });

    const salt = await bcrypt.genSalt(10);

    const demoUsers = [
      {
        name: 'Eleanor Vance',
        email: 'admin@lumen.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'admin',
        bio: 'Lead Editorial Director & Platform Administrator at Lumen.',
        avatar: '',
      },
      {
        name: 'Thomas Okeke',
        email: 'author@lumen.com',
        password: await bcrypt.hash('author123', salt),
        role: 'author',
        bio: 'Historian of technology. Former editor at Nature. Coffee enthusiast.',
        avatar: '',
      },
      {
        name: 'Priya Mehta',
        email: 'priya.mehta@lumen.com',
        password: await bcrypt.hash('author123', salt),
        role: 'author',
        bio: 'Molecular biologist & science communicator covering genetic engineering.',
        avatar: '',
      },
      {
        name: 'John Reader',
        email: 'reader@lumen.com',
        password: await bcrypt.hash('reader123', salt),
        role: 'reader',
        bio: 'Avid reader and tech quiz enthusiast exploring modern science.',
        avatar: '',
      },
    ];

    const created = await User.insertMany(demoUsers);
    console.log(`[UserSeed] Successfully created ${created.length} demo users for Lumen:`);
    created.forEach((u) => {
      console.log(`  - [${u.role.toUpperCase()}] ${u.name} <${u.email}>`);
    });

    console.log('\nDemo accounts ready for testing:');
    console.log('  1. Admin:  admin@lumen.com  / admin123');
    console.log('  2. Author: author@lumen.com / author123');
    console.log('  3. Reader: reader@lumen.com / reader123');

    await mongoose.connection.close();
    console.log('[UserSeed] Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[UserSeed Error]:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
