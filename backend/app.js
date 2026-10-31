const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const trendingRoutes = require('./routes/trendingRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

const app = express();

// Path to frontend directory
const frontendDir = path.join(__dirname, '..', 'frontend');
const pagesDir = path.join(frontendDir, 'pages');

// Security headers with Helmet and customized CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Compression
app.use(compression());

// CORS
app.use(cors());

// Dev logging
if (!env.isProduction && env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global body parser with 100kb limit (media route has dedicated larger parser)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Static asset serving with long-term cache
const staticOptions = {
  maxAge: env.isProduction ? '1y' : 0,
  immutable: env.isProduction,
};

app.use('/css', express.static(path.join(frontendDir, 'css'), staticOptions));
app.use('/js', express.static(path.join(frontendDir, 'js'), staticOptions));
app.use('/assets', express.static(path.join(frontendDir, 'assets'), staticOptions));

// Favicon shortcut
app.get('/favicon.svg', (req, res) => {
  res.sendFile(path.join(frontendDir, 'assets', 'favicon.svg'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/media', mediaRoutes);

// Helper to send HTML pages with no-cache headers
const sendPage = (res, pageName, statusCode = 200) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.status(statusCode).sendFile(path.join(pagesDir, pageName));
};

// Clean URLs
app.get('/', (req, res) => sendPage(res, 'index.html'));
app.get('/explore', (req, res) => sendPage(res, 'explore.html'));
app.get('/notifications', (req, res) => sendPage(res, 'notifications.html'));
app.get('/bookmarks', (req, res) => sendPage(res, 'bookmarks.html'));
app.get('/login', (req, res) => sendPage(res, 'login.html'));
app.get('/register', (req, res) => sendPage(res, 'register.html'));
app.get('/u/:username', (req, res) => sendPage(res, 'profile.html'));
app.get('/post/:id', (req, res) => sendPage(res, 'post.html'));

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// 404 handler for all other routes
app.use((req, res) => {
  sendPage(res, '404.html', 404);
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
