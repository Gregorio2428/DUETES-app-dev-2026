const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const postRoutes = require('./src/routes/postRoutes');

const app = express();
const PORT = process.env.PORT_BLOG || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Blog server is running', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[BLOG] Server listening on port ${PORT}`);
});
