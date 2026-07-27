/**
 * server.js — Entry point for the Book Management System
 * Initializes Express app, middleware, routes, and static file serving
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const bookRoutes = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount book routes
app.use('/books', bookRoutes);

// Health Check Endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'running',
    message: 'Book Management API is online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Serve Frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n📚 Book Management System running on http://localhost:${PORT}\n`);
});

module.exports = app;
