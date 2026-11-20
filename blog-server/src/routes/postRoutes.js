const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getAllPosts,
  getPostById,
  getMyPosts,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');

// Public routes
router.get('/', getAllPosts);
router.get('/me/posts', authenticate, getMyPosts);
router.get('/:id', getPostById);

// Protected routes
router.post('/', authenticate, authorize('author', 'admin'), createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, authorize('admin'), deletePost);

module.exports = router;
