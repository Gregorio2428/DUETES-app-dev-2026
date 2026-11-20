const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const register = async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const selectedRole = ['reader', 'author', 'admin'].includes(role) ? role : 'reader';

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const [roleRows] = await db.query('SELECT id FROM roles WHERE role = ?', [selectedRole]);
    if (roleRows.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const roleId = roleRows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, roleId]
    );

    return res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
      role: selectedRole
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.email, u.password_hash, u.is_active, r.role AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, [email]);

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid credentials or account inactive' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Short-lived access token (15m)
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    // Long-lived refresh token (7 days)
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    return res.json({
      message: 'Login successful',
      accessToken,
      refreshToken: rawRefreshToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role_name }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const tokenHash = hashToken(refreshToken);

    const [rows] = await db.query(`
      SELECT rt.*, u.id AS user_id, u.username, u.is_active, r.role AS role_name
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE rt.token_hash = ?
        AND rt.revoked_at IS NULL
        AND rt.expires_at > NOW()
        AND u.is_active = 1
    `, [tokenHash]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid, revoked, or expired refresh token' });
    }

    const user = rows[0];
    const newAccessToken = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const tokenHash = hashToken(refreshToken);
    await db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
      [tokenHash]
    );
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const me = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.email, u.is_active, r.role AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [decoded.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { register, login, refresh, logout, me };
