const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');

// Public endpoints
router.get('/', getAllPosts);
router.get('/:id', getPostById);

// Protected endpoints (Token required)
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;
