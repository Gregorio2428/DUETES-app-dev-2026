const db = require('../../db');

const getAllPosts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.title, p.content, p.author_id, p.created_at, p.updated_at, u.username AS author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.title, p.content, p.author_id, p.created_at, p.updated_at, u.username AS author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/me/posts (Returns only the logged-in user's posts)
const getMyPosts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.title, p.content, p.author_id, p.created_at, p.updated_at, u.username AS author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/posts (author or admin only via authorize middleware)
const createPost = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
      [title, content, req.user.id]
    );
    res.status(201).json({ message: 'Post created successfully', postId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/posts/:id (Post owner or admin)
const updatePost = async (req, res) => {
  const { title, content } = req.body;
  const postId = req.params.id;

  try {
    const [rows] = await db.query('SELECT author_id FROM posts WHERE id = ?', [postId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own posts' });
    }

    await db.query(
      'UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content) WHERE id = ?',
      [title, content, postId]
    );
    res.json({ message: 'Post updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/posts/:id (Admin only via authorize('admin') middleware)
const deletePost = async (req, res) => {
  const postId = req.params.id;

  try {
    const [rows] = await db.query('SELECT id FROM posts WHERE id = ?', [postId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await db.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllPosts, getPostById, getMyPosts, createPost, updatePost, deletePost };
