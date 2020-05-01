const crypto = require('crypto');
const mongoose = require('mongoose');

let AccountModel = {};

// crypto settings
const iterations = 10000;
const saltLength = 64;
const keyLength = 64;

const AccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[A-Za-z0-9_\-.]{1,25}$/,
  },
  password: {
    type: String,
    required: true,
  },
  salt: {
    type: Buffer,
    required: true,
  },
  premium: {
    type: Boolean,
    default: false,
  },
  decks: {
    type: Array,
  },
  bio: {
    type: String,
    default: '',
    match: /^.{1,280}$/,
  },
  friends: {
    type: Array,
  },
  rank: {
    type: Number,
    default: 1,
  },
  wins: {
    type: Number,
    default: 0,
    min: 0,
  },
  losses: {
    type: Number,
    default: 0,
    min: 0,
  },
  replays: {
    type: Array,
  },
  featuredReplays: {
    type: Array,
  },
  tournaments: {
    type: Array,
  },
  totalPlaytime: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

AccountSchema.statics.toAPI = (doc) => ({
  // _id is built into your mongo document and is guaranteed to be unique
  username: doc.username,
  _id: doc._id,
});

const validatePassword = (doc, password, callback) => {
  const pass = doc.password;

  return crypto.pbkdf2(password, doc.salt, iterations, keyLength, 'RSA-SHA512', (err, hash) => {
    if (hash.toString('hex') !== pass) {
      return callback(false);
    }
    return callback(true);
  });
};

// wraps the results of a username db query in a promise, so it can be awaited
AccountSchema.statics.FindByUsername = async function FindByUsername(name) {
  const search = {
    username: name,
  };

  try {
    return await this.findOne(search).exec();
  } catch (err) {
    console.log(err);
    return null;
  }
};

// Secures password storage with a cryptographic hash, returning the hash and its salt
AccountSchema.statics.GenerateHash = function GenerateHash(password) {
  const salt = crypto.randomBytes(saltLength);

  return new Promise((res, rej) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, 'RSA-SHA512',
      (err, hash) => (err ? rej(err) : res({ salt, hash: hash.toString('hex') })));
  });
};

// Returns the associated account if username and password are correct
AccountSchema.statics.Authenticate = async function Authenticate(username, password) {
  const account = await this.findByUsername(username);

  // no account to return if we can't find it
  if (!account) {
    return null;
  }

  return validatePassword(account, password, (result) => {
    if (result === true) {
      return account;
    }
    return null;
  });
};

AccountModel = mongoose.model('Account', AccountSchema);

module.exports.AccountModel = AccountModel;
