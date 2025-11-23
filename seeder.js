/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AdminUser = require('./models/AdminUser');

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!DB_URI) { console.error('❌ MONGO_URI not set'); process.exit(1); }

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
if (!ADMIN_USERNAME) { console.error('❌ ADMIN_USERNAME not set'); process.exit(1); }

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

(async () => {
  try {
    await mongoose.connect(DB_URI, { autoIndex: true });
    console.log('✅ Connected');

    const existing = await AdminUser.findOne().sort({ createdAt: 1 }); // take the first/only admin
    if (existing) {
      if (existing.username === ADMIN_USERNAME) {
        console.log(`↩️  Admin already has username ${existing.username}`);
      } else {
        existing.username = ADMIN_USERNAME;
        await existing.save();
        console.log(`🔁 Updated admin username → ${ADMIN_USERNAME}`);
      }
    } else {
      // create a new admin (random password hash just to satisfy schema)
      const randomPass = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPass, BCRYPT_ROUNDS);
      const created = await AdminUser.create({
        username: ADMIN_USERNAME,
        passwordHash,
        otpCodeHash: null,
        otpExpiresAt: null,
        otpAttemptCounter: 0,
        otpSentAt: null,
      });
      console.log(`✅ Created admin ${created.username} (${created._id})`);
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
})();
