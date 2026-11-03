const path = require('path');
const fs = require('fs');
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
const storyRoutes = require('./routes/storyRoutes');

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

// Build/deploy version query string (injected at server start to bust asset cache on new deploys)
const BUILD_VERSION = process.env.BUILD_VERSION || Date.now().toString(36);

// Static asset serving cache strategies:
// 1. CSS & JS: "no-cache" (always revalidate with ETag so updates appear immediately without stale cache)
const revalidateStaticOptions = {
  maxAge: 0,
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache');
  },
};

app.use('/css', express.static(path.join(frontendDir, 'css'), revalidateStaticOptions));
app.use('/js', express.static(path.join(frontendDir, 'js'), revalidateStaticOptions));

// 2. Seed images under /assets/images: keep long immutable caching (1 year)
const immutableImageOptions = {
  maxAge: '1y',
  immutable: true,
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  },
};
app.use('/assets/images', express.static(path.join(frontendDir, 'assets', 'images'), immutableImageOptions));

// 3. General static assets under /assets: revalidate with no-cache (fallback for images retains immutable)
app.use(
  '/assets',
  express.static(path.join(frontendDir, 'assets'), {
    maxAge: 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.includes(path.sep + 'images' + path.sep)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.set('Cache-Control', 'no-cache');
      }
    },
  })
);

// Favicon shortcut
app.get('/favicon.svg', (req, res) => {
  res.set('Cache-Control', 'no-cache');
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
app.use('/api/stories', storyRoutes);

// Helper to send HTML pages with injected cache-busting version on CSS/JS includes and no-cache headers
const sendPage = (res, pageName, statusCode = 200) => {
  const filePath = path.join(pagesDir, pageName);
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      return res.status(500).send('Error loading page');
    }

    // Inject cache-busting query string ?v=<version> to every /css and /js include
    const versionedHtml = html.replace(
      /((?:href|src)=["'])(\/(?:css|js)\/[^"'?>]+)(\?[^"']*)?(["'])/g,
      (match, attr, assetPath, existingQuery, quote) => `${attr}${assetPath}?v=${BUILD_VERSION}${quote}`
    );

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(statusCode).send(versionedHtml);
  });
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
