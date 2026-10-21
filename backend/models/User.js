const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['reader', 'author', 'admin'],
        message: '{VALUE} is not a valid user role. Allowed roles are: reader, author, admin',
      },
      default: 'reader',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    // Phase 3: User Trust & Reputation metrics (Sadanand Module)
    trustScore: {
      type: Number,
      default: 50,
      min: [0, 'Trust score cannot be below 0'],
      max: [100, 'Trust score cannot exceed 100'],
      index: true,
    },
    trustLevel: {
      type: String,
      enum: ['restricted', 'neutral', 'trusted', 'exemplary'],
      default: 'neutral',
      index: true,
    },
    positiveContributionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    violationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReputationUpdate: {
      type: Date,
      default: Date.now,
    },

    isRestricted: {
      type: Boolean,
      default: false,
    },

    restrictionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Verify credentials only against the stored bcrypt hash. Demo accounts must
// be provisioned like other users; known email addresses do not bypass hashing.
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (err) {
    return false;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
