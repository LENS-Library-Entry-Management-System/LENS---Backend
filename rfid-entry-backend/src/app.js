const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/entries', require('./routes/entryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rfid', require('./routes/rfidRoutes'));

// Error handling
app.use(errorHandler);

module.exports = app;