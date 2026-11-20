const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const postRoutes = require('./src/routes/postRoutes');
const authenticate = require('./src/middleware/authenticate');
const { getMyPosts } = require('./src/controllers/postController');

const app = express();
const PORT = process.env.PORT_BLOG || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/posts', postRoutes);
// Direct alias for GET /api/me/posts
app.get('/api/me/posts', authenticate, getMyPosts);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'blog-server', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[BLOG] Server listening on port ${PORT}`);
});
