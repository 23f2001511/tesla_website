#!/usr/bin/env node
/**
 * QA helper — mint a short-lived JWT for an existing user so authed routes can
 * be smoke-tested (scripts/qa-probe.js reads the token from /tmp/qa_token.txt).
 *
 * Usage:
 *   node scripts/qa-mint.js            # pick the first Admin in the DB
 *   QA_ROLE=President node scripts/qa-mint.js
 *
 * The token is signed with JWT_SECRET from .env.local and kept out of the repo
 * (written to /tmp). Never deploy this script as part of the app runtime.
 */
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const get = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(get('MONGODB_URI'), { serverSelectionTimeoutMS: 8000 });
  const role = process.env.QA_ROLE || 'Admin';
  const user =
    (await mongoose.connection.db.collection('users').findOne({ role })) ||
    (await mongoose.connection.db.collection('users').findOne({}));
  await mongoose.connection.close();

  if (!user) {
    console.log('NO_USERS');
    return;
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      designation: user.designation,
      team: user.team,
    },
    get('JWT_SECRET'),
    { expiresIn: '2h' }
  );

  fs.writeFileSync('/tmp/qa_token.txt', token);
  console.log(`TOKEN_MINTED_FOR ${user.role} ${user.email} (@/tmp/qa_token.txt, valid 2h)`);
})().catch((e) => console.log('FAIL', e.message));
