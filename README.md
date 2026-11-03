# Sangam &mdash; Modern 2026 Social Media Platform

Sangam is a fast, fluid, production-grade social platform designed by combining the most successful and intuitive interaction patterns from **Instagram**, **Facebook**, **X**, **YouTube**, and **Pinterest** into one unified, modern 2026 product.

Built with **vanilla HTML5, CSS3, and ES Modules** on the frontend, and **Node.js, Express, and MongoDB** on the backend &mdash; zero frontend frameworks and zero third-party animation libraries.

This project fulfills **Task 2 (Social Media Platform)** of the CodeAlpha Full Stack Development Internship.

---

## 🌟 2026 Social Architecture & Proven Patterns

| Source Platform | Pattern Integrated into Sangam |
|:---|:---|
| **Instagram** | **Stories Row & Fullscreen Viewer**: 24h expiration, conic sunset gradient ring for unviewed stories, grey ring for viewed. Fullscreen viewer with 5-second animated progress bars, tap left/right, pause on hold, and "Your story" upload.<br>**Edge-to-Edge Media**: Photo posts with double-tap heart burst animation, lightbox modal, and inline comment input.<br>**Profile Photo Grid**: 3-column square photo grid with hover stats (reactions & comments). |
| **Facebook** | **"What's on your mind?" Card**: Prominent post creation card at the top of the feed with quick-action chips (Photo, Story, Topic) opening modal composer.<br>**Reaction Bar Popover**: Hover or long-press on Like reveals floating popping emoji bar (👍 Like, ❤️ Love, 😂 Haha, 😮 Wow, 😢 Sad) with multi-reaction summary badge. |
| **X** | **Feed Navigation**: "For you" and "Following" tabs with sliding indicator.<br>**Compact Post Layout**: Balanced typography with author metadata, timestamp, inline hashtags, repost, bookmark bounce, and share link.<br>**Trending Topics**: Right rail widget featuring trending hashtags with live conversation counts. |
| **YouTube** | **Centered Rounded Search**: Topbar search with live user and conversation suggestion dropdown (`⌘K` / `Ctrl+K`).<br>**Topic Filter Chips**: Horizontal scrollable chips row (`All`, `Tech`, `Cricket`, `Startups`, `Travel`, `Food`, `Music`, `Fitness`, etc.) for 1-click topic filtering. |
| **Pinterest** | **Explore Masonry Grid**: Multi-column staggered image grid on `/explore` with dark gradient hover overlay, quick-save button, and rich post discovery modal. |

---

## 🚀 Live Demo & Seed Credentials

- **Demo Account**: `demo@sangam.in` / `Demo@123` (Username: `@demo`)
- **Quick Fill**: Click the "Quick Demo Login" chip on the login page to immediately test with full creator privileges.
- **Guest Access**: Accessing `/` opens directly into the social feed. Guests can view stories, read posts, explore topics, and browse profiles; any interactive action (like, comment, post, follow) gently presents the "Join Sangam" modal.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js 4.x
- **Database**: MongoDB with Mongoose (User, Post with reactions, Story with 24h TTL, Comment, Notification)
- **Frontend**: Plain HTML5, Modern Vanilla CSS (CSS variables, Flexbox, Grid, CSS columns), Vanilla JavaScript (Native ES Modules)
- **Security & Middleware**: JWT authentication, bcryptjs, Helmet (CSP configured), CORS, Compression
- **Testing**: Automated smoke test suite (`npm run test:smoke`) testing 19/19 endpoints with 100% pass rate

---

## 📁 Project Structure

```
CodeAlpha_SocialMediaPlatform/
├── backend/
│   ├── config/             # Database connection (db.js)
│   ├── controllers/        # Post, user, story, auth, notification controllers
│   ├── middleware/         # Auth, error handling, rate limiting
│   ├── models/             # Mongoose models: User, Post, Story, Comment, Notification
│   ├── routes/             # Express API routes (/auth, /posts, /stories, /users, etc.)
│   ├── scripts/            # seed.js, download-seed-photos.js, smoke-test.js
│   └── app.js              # Express app setup & static file serving
├── frontend/
│   ├── assets/             # Brand logos, icons, and 30 curated seed images
│   ├── css/
│   │   ├── tokens.css      # Sunrise gradient, neutral surfaces, spacing, reaction colors
│   │   ├── base.css        # Clean resets, typography, view-transitions
│   │   ├── layout.css      # Sticky topbar, 3-column desktop layout, mobile dock
│   │   ├── components.css  # Stories, create-card, post-card, reactions, masonry, profile
│   │   └── animations.css  # 60fps spring animations, heart burst, popping reactions
│   ├── js/
│   │   ├── components/     # stories.js, createPostCard.js, reactions.js, postCard.js, etc.
│   │   ├── core/           # api.js, auth.js, avatar.js, shell.js, theme.js, modal.js
│   │   └── pages/          # feed.js, explore.js, profile.js, post.js, notifications.js, etc.
│   └── pages/              # index.html, explore.html, profile.html, post.html, auth pages
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running locally on `mongodb://127.0.0.1:27017/sangam_dev` or via cloud URI)

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/your-username/CodeAlpha_SocialMediaPlatform.git
cd CodeAlpha_SocialMediaPlatform

# Install backend dependencies
cd backend
npm install
```

### 3. Seed Realistic Data
```bash
# Seeds 14 users with authentic avatars and bios, 56 posts with 30 real photos, and 9 active stories
npm run seed
```

### 4. Run Automated Smoke Tests
```bash
# Runs full test suite verifying all 19 endpoints including stories and reactions
npm run test:smoke
```

### 5. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5000`** in your browser to experience the 2026 social app redesign.

---

## ⚡ Performance, Caching & Deploy Cache-Busting

- **Conditional ETag Revalidation (`no-cache`)**: All CSS and JavaScript files are served with `Cache-Control: no-cache` and strict ETags. Browsers conditionally revalidate on page refresh, guaranteeing that code changes and style updates propagate immediately without requiring client-side hard refreshes.
- **Dynamic Deploy Versioning (`?v=<build>`)**: The server injects a dynamic build version query string (`?v=<build>`) into all CSS and JS asset tags when serving HTML. Every new server start or deployment busts browser caches automatically across all pages.
- **Long-Lived Immutable Media Caching**: Curated seed photos (`/assets/images`) and uploaded user media (`/api/media/:id`) use `Cache-Control: public, max-age=31536000, immutable` for peak CDN and browser cache efficiency.
- **Minimal Clean Auth Experience**: Dedicated `/login` and `/register` flows featuring 1-click Quick Demo login, ambient animated sunrise blobs, password visibility toggles, inline field errors, and loading states without header clutter.

---

## 🎨 Theme & Responsiveness

- **Themes**: Seamless Light mode (`#FAFAFA` neutral surface) and Midnight OLED Dark mode (`#0B0B0F`) with flash-free initialization.
- **Breakpoints Tested**:
  - Desktop Ultra-wide (1920px) & Standard (1260px)
  - Laptop / Tablet Landscape (1024px): Right rail collapses smoothly into main stream
  - Tablet Portrait (768px): Left navigation rail adapts to compact icon bar
  - Mobile (390px): Clean single-column layout with fixed bottom navigation dock and floating compose trigger

---

## 📄 License
This project is open-source under the MIT License. Developed for the CodeAlpha Internship Program.
