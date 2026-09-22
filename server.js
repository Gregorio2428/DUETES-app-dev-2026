// ---------------------------------------------------------------------------
// Latch: a tiny signup + login system.
//
//   POST /api/signup   { email, username, password }  ->  201 | 400 | 409
//   POST /api/login    { username, password }         ->  200 | 400 | 401
//
// Both endpoints read from the request BODY (never from params or the query
// string), and POST is the only HTTP method the API accepts.
// ---------------------------------------------------------------------------
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const users = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ------------------------------------------------------

// Parses JSON request bodies into req.body.
app.use(express.json());

// Serves the HTML/CSS/JS in /public. `/` opens the login page and `/signup`
// resolves to signup.html, so no extra routes are needed.
app.use(
  express.static(path.join(__dirname, 'public'), {
    index: 'login.html',
    extensions: ['html'],
  })
);

// ---------- Helpers ---------------------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns a trimmed string, or '' when the value is missing or not a string.
const clean = (value) => (typeof value === 'string' ? value.trim() : '');

// Passwords are never stored in plain text. scrypt is built into Node,
// so this needs no extra packages.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

// Only send back what the browser needs. The password hash stays on the server.
const toPublicUser = ({ id, email, username }) => ({ id, email, username });

// Next id = highest existing id + 1.
const nextId = () => users.reduce((max, u) => Math.max(max, u.id), 0) + 1;

// Builds the 400 payload for empty fields: { message, errors: { field: "..." } }
function emptyFieldsResponse(fields) {
  const labels = { email: 'Email', username: 'Username', password: 'Password' };
  const errors = {};
  for (const [name, value] of Object.entries(fields)) {
    if (!value) errors[name] = `${labels[name]} is required.`;
  }
  return Object.keys(errors).length
    ? { message: 'Fill in every field to continue.', errors }
    : null;
}

// ---------- POST /api/signup ------------------------------------------------

app.post('/api/signup', (req, res) => {
  const body = req.body || {};
  const email = clean(body.email).toLowerCase();
  const username = clean(body.username);
  const password = typeof body.password === 'string' ? body.password : '';

  // 400: any empty field
  const empty = emptyFieldsResponse({ email, username, password: password.trim() });
  if (empty) return res.status(400).json(empty);

  // 400: email that can't possibly be an email
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({
      message: 'Enter a valid email address.',
      errors: { email: 'Use the format name@example.com.' },
    });
  }

  // 409: the user already exists (email and username are both unique,
  // compared case-insensitively)
  const emailTaken = users.some((u) => u.email === email);
  const usernameTaken = users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (emailTaken || usernameTaken) {
    const errors = {};
    if (emailTaken) errors.email = 'This email is already registered.';
    if (usernameTaken) errors.username = 'This username is taken.';
    return res.status(409).json({
      message: emailTaken
        ? 'An account with this email already exists. Try logging in instead.'
        : 'This username is taken. Pick another one.',
      errors,
    });
  }

  // 201: created
  const user = { id: nextId(), email, username, password: hashPassword(password) };
  users.push(user);

  return res.status(201).json({
    message: 'Account created.',
    user: toPublicUser(user),
  });
});

// ---------- POST /api/login -------------------------------------------------

app.post('/api/login', (req, res) => {
  const body = req.body || {};
  const username = clean(body.username);
  const password = typeof body.password === 'string' ? body.password : '';

  // 400: any empty field
  const empty = emptyFieldsResponse({ username, password: password.trim() });
  if (empty) return res.status(400).json(empty);

  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  // 401: unknown user or wrong password. The message is identical for both, so
  // it doesn't reveal which usernames exist. Hashing anyway keeps timing similar.
  if (!user || !verifyPassword(password, user.password)) {
    if (!user) hashPassword(password);
    return res.status(401).json({ message: 'Username or password is incorrect.' });
  }

  // 200: the user exists and the password matches
  return res.status(200).json({
    message: 'Logged in.',
    user: toPublicUser(user),
  });
});

// ---------- Guard rails -----------------------------------------------------

// Anything else under /api: 405 for non-POST methods, 404 for unknown paths.
app.use('/api', (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST');
    return res.status(405).json({ message: 'This API only accepts POST requests.' });
  }
  return res.status(404).json({ message: 'Endpoint not found.' });
});

// Malformed JSON and unexpected errors return JSON instead of an HTML stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body must be valid JSON.' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Latch is running at http://localhost:${PORT}`);
});
