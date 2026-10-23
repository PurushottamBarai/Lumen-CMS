const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');
const { canUseMemoryFallback } = require('../middleware/requireDatabase');

// In-Memory fallback store for when MongoDB Atlas/local is not yet connected
let inMemoryUsers = [];

const initMemoryStore = async () => {
  if (inMemoryUsers.length === 0) {
    const salt = await bcrypt.genSalt(10);
    inMemoryUsers = [
      {
        id: '66c9f1a00000000000000001',
        _id: '66c9f1a00000000000000001',
        name: 'Amara Silva',
        email: 'admin@lumen.com',
        password: await bcrypt.hash('password123', salt),
        role: 'admin',
        bio: 'Lead Editorial Director & Platform Administrator at Lumen.',
        avatar: '',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '66c9f1a00000000000000002',
        _id: '66c9f1a00000000000000002',
        name: 'Thomas Okeke',
        email: 'author@lumen.com',
        password: await bcrypt.hash('password123', salt),
        role: 'author',
        bio: 'Historian of technology. Former editor at Nature. Coffee enthusiast.',
        avatar: '',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '66c9f1a00000000000000003',
        _id: '66c9f1a00000000000000003',
        name: 'Priya Mehta',
        email: 'priya.mehta@lumen.com',
        password: await bcrypt.hash('password123', salt),
        role: 'author',
        bio: 'Molecular biologist & science communicator covering genetic engineering.',
        avatar: '',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '66c9f1a00000000000000004',
        _id: '66c9f1a00000000000000004',
        name: 'Lena Kaufmann',
        email: 'reader@lumen.com',
        password: await bcrypt.hash('password123', salt),
        role: 'reader',
        bio: 'Avid reader and tech quiz enthusiast exploring modern science.',
        avatar: '',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];
  }
};

initMemoryStore();

const isDBConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

const createDatabaseUnavailableError = () => {
  const error = new Error('The CMS database is unavailable.');
  error.name = 'DatabaseUnavailableError';
  error.code = 'DATABASE_UNAVAILABLE';
  return error;
};

const logStoreFailure = (operation, error) => {
  console.warn(`[DB Fallback] ${operation}; using in-memory store.`, {
    name: error.name,
    code: error.code || 'UNKNOWN',
  });
};

const userStore = {
  isDBConnected,

  async findByEmailPersistent(email, includePassword = false) {
    if (!isDBConnected()) {
      if (canUseMemoryFallback()) return userStore.findByEmail(email, includePassword);
      throw createDatabaseUnavailableError();
    }
    const query = User.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) query.select('+password');
    return query.exec();
  },

  async findByIdPersistent(id) {
    if (!isDBConnected()) {
      if (canUseMemoryFallback()) return userStore.findById(id);
      throw createDatabaseUnavailableError();
    }
    return User.findById(id);
  },

  async createUserPersistent(user) {
    if (!isDBConnected()) {
      if (canUseMemoryFallback()) return userStore.createUser(user);
      throw createDatabaseUnavailableError();
    }
    return User.create(user);
  },

  async findByEmail(email, includePassword = false) {
    const normalized = email.toLowerCase().trim();
    if (isDBConnected()) {
      try {
        const query = User.findOne({ email: normalized });
        if (includePassword) query.select('+password');
        const user = await query.exec();
        if (user) return user;
      } catch (err) {
        logStoreFailure('Mongoose query failed', err);
      }
    }

    // In-memory fallback
    await initMemoryStore();
    const found = inMemoryUsers.find((u) => u.email.toLowerCase() === normalized);
    if (!found) return null;

    return {
      ...found,
      _id: found.id,
      async matchPassword(enteredPassword) {
        return bcrypt.compare(enteredPassword, found.password);
      },
    };
  },

  async findById(id) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id);
        if (user) return user;
      } catch (err) {
        logStoreFailure('Mongoose findById failed', err);
      }
    }

    await initMemoryStore();
    const found = inMemoryUsers.find((u) => u.id === id || u._id === id || u._id?.toString() === id?.toString());
    if (!found) return null;

    return {
      ...found,
      _id: found.id,
      async matchPassword(enteredPassword) {
        return bcrypt.compare(enteredPassword, found.password);
      },
      async save() {
        const idx = inMemoryUsers.findIndex((u) => u.id === found.id);
        if (idx !== -1) {
          inMemoryUsers[idx] = { ...this, updatedAt: new Date() };
        }
        return this;
      },
    };
  },

  async createUser({ name, email, password, role, bio }) {
    if (isDBConnected()) {
      try {
        const newUser = await User.create({ name, email, password, role, bio });
        return newUser;
      } catch (err) {
        logStoreFailure('Mongoose create failed', err);
      }
    }

    await initMemoryStore();
    const newId = new mongoose.Types.ObjectId().toString();
    const userDoc = {
      id: newId,
      _id: newId,
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'reader',
      bio: bio || '',
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.push(userDoc);

    return {
      ...userDoc,
      async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, userDoc.password);
      },
    };
  },

  async updateUser(id, updateData) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id);
        if (user) {
          if (updateData.name !== undefined) user.name = updateData.name;
          if (updateData.bio !== undefined) user.bio = updateData.bio;
          if (updateData.avatar !== undefined) user.avatar = updateData.avatar;
          if (updateData.role !== undefined) user.role = updateData.role;
          await user.save();
          return user;
        }
      } catch (err) {
        logStoreFailure('Mongoose update failed', err);
      }
    }

    await initMemoryStore();
    const idx = inMemoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (idx === -1) return null;

    inMemoryUsers[idx] = {
      ...inMemoryUsers[idx],
      ...updateData,
      updatedAt: new Date(),
    };
    return inMemoryUsers[idx];
  },

  async updatePassword(id, hashedPassword) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id).select('+password');
        if (user) {
          user.password = hashedPassword;
          await user.save();
          return true;
        }
      } catch (err) {
        logStoreFailure('Mongoose password update failed', err);
      }
    }

    await initMemoryStore();
    const idx = inMemoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (idx !== -1) {
      inMemoryUsers[idx] = {
        ...inMemoryUsers[idx],
        password: hashedPassword,
        updatedAt: new Date(),
      };
      return true;
    }
    return false;
  },

  async deleteUser(id) {
    if (isDBConnected()) {
      try {
        await User.findByIdAndDelete(id);
        return true;
      } catch (err) {
        logStoreFailure('Mongoose delete failed', err);
      }
    }

    await initMemoryStore();
    const idx = inMemoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (idx !== -1) {
      inMemoryUsers.splice(idx, 1);
      return true;
    }
    return false;
  },

  async getAllUsers() {
    if (isDBConnected()) {
      try {
        const users = await User.find().sort({ createdAt: -1 });
        return users;
      } catch (err) {
        logStoreFailure('Mongoose find failed', err);
      }
    }

    await initMemoryStore();
    return inMemoryUsers;
  },
};

module.exports = userStore;
