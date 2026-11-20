const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT_AUTH || 4000;

app.use(cors());
app.use(express.json());

// Support both /api/auth/* and direct root /* routing
app.use('/api/auth', authRoutes);
app.use('/', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-server', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[AUTH] Server listening on port ${PORT}`);
});
