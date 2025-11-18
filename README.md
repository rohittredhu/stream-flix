# 🎬 StreamFlix - Professional Video Streaming Platform

A full-stack video streaming platform built with Node.js, React, PostgreSQL, Redis, and Bull Queue. Features include video upload, processing, real-time comments, likes, and WebSocket notifications.

![StreamFlix Banner](https://via.placeholder.com/1200x300/0f0f0f/ff0000?text=StreamFlix+-+Video+Streaming+Platform)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎥 Video Management
- ✅ Upload videos with thumbnails
- ✅ Background video processing (thumbnails, duration extraction, compression)
- ✅ Video streaming with adaptive quality
- ✅ Video search and filtering
- ✅ View count tracking

### 👥 User Features
- ✅ User authentication (Register/Login)
- ✅ JWT-based authorization
- ✅ User profiles
- ✅ Personal video library

### 💬 Social Features
- ✅ Real-time comments
- ✅ Like/Unlike videos
- ✅ Share functionality (Web Share API + Social media)
- ✅ Live notifications via WebSocket

### 🚀 Performance
- ✅ Redis caching (sub-millisecond response times)
- ✅ Background job processing with Bull Queue
- ✅ Lazy loading and image optimization
- ✅ Responsive design (mobile-first)

---

## 🛠 Tech Stack

### Frontend
- **HTML5/CSS3** - Modern, responsive UI
- **JavaScript (Vanilla)** - No framework dependencies
- **Socket.io Client** - Real-time updates
- **Font Awesome** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Primary database
- **Redis** - Caching & Queue backend
- **Bull** - Job queue processor
- **Socket.io** - WebSocket server
- **Multer** - File upload handling
- **FFmpeg** - Video processing
- **JWT** - Authentication
- **Bcrypt** - Password hashing

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   HTML/CSS  │──│      JS     │──│  WebSocket  │         │
│  │    (UI)     │  │   (Logic)   │  │   Client    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTP/WS
┌──────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  REST API: /auth /videos /comments /likes /upload     │  │
│  └────────────────────────────────────────────────────────┘  │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         ↓                  ↓                  ↓              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │   Prisma   │    │   Redis    │    │    Bull    │        │
│  │   (ORM)    │    │  (Cache)   │    │  (Queue)   │        │
│  └────────────┘    └────────────┘    └────────────┘        │
│         ↓                  ↓                  ↓              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │ PostgreSQL │    │ Fast Cache │    │   Worker   │        │
│  │ (Database) │    │  Storage   │    │ Processing │        │
│  └────────────┘    └────────────┘    └────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow: Video Upload Process

```
1. User uploads video → Express receives file
2. Save video metadata → PostgreSQL (via Prisma)
3. Add processing job → Bull Queue (via Redis)
4. Return response → User (immediate, non-blocking)
5. Worker processes job → Generate thumbnail, extract metadata
6. Update database → Video status: "processing" → "ready"
7. Clear cache → Redis invalidation
8. Publish event → Redis Pub/Sub
9. Notify clients → WebSocket broadcast
10. Update UI → Real-time video ready notification
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v16 or higher)
   ```bash
   node --version  # Should be v16+
   ```
   Download: https://nodejs.org/

2. **PostgreSQL** (v12 or higher)
   ```bash
   psql --version  # Should be v12+
   ```
   Download: https://www.postgresql.org/download/

3. **Redis** (v6 or higher)
   ```bash
   redis-server --version  # Should be v6+
   ```
   
   **Installation:**
   - **Windows:** Download from https://github.com/tporadowski/redis/releases
   - **macOS:** `brew install redis`
   - **Linux:** `sudo apt-get install redis-server`

4. **FFmpeg** (for video processing)
   ```bash
   ffmpeg -version
   ```
   
   **Installation:**
   - **Windows:** Download from https://ffmpeg.org/download.html
   - **macOS:** `brew install ffmpeg`
   - **Linux:** `sudo apt-get install ffmpeg`

5. **Git**
   ```bash
   git --version
   ```
   Download: https://git-scm.com/

### Optional (for Docker users)

- **Docker** & **Docker Compose**
  ```bash
  docker --version
  docker-compose --version
  ```
  Download: https://www.docker.com/

---

## 🚀 Installation

### Method 1: Manual Setup (Recommended for Development)

#### Step 1: Clone the Repository

```bash
# Clone the repo
git clone https://github.com/yourusername/video-streaming.git
cd video-streaming

# Or if you have it locally
cd "d:\ROAD TO SE\DEVELOPMENT\video streaming\video-streaming"
```

#### Step 2: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies (if using npm for client)
cd ../client
npm install  # Optional - vanilla JS doesn't require npm

# Go back to root
cd ..
```

#### Step 3: Setup PostgreSQL Database

```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE streamflix;

# Create user (optional but recommended)
CREATE USER streamflix_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE streamflix TO streamflix_user;

# Exit
\q
```

#### Step 4: Setup Environment Variables

Create `.env` file in the `server` directory:

```bash
cd server
touch .env  # Linux/Mac
# OR
type nul > .env  # Windows
```

Copy and paste this configuration (update values):

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://streamflix_user:your_secure_password@localhost:5432/streamflix?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg
THUMBNAIL_SIZE=1280x720
```

**Important:** Replace `your_secure_password` and `JWT_SECRET` with your own secure values!

#### Step 5: Generate Prisma Client & Run Migrations

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Optional: Seed database with sample data
npx prisma db seed
```

#### Step 6: Verify Redis is Running

```bash
# Start Redis server (if not running)
redis-server

# In another terminal, test connection
redis-cli ping
# Should return: PONG
```

#### Step 7: Create Upload Directories

```bash
cd server

# Create directories
mkdir -p uploads/videos
mkdir -p uploads/thumbnails
mkdir -p uploads/temp

# Linux/Mac: Set permissions
chmod 755 uploads
```

---

### Method 2: Docker Setup (Recommended for Production)

#### Step 1: Create Docker Configuration

Create `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: streamflix_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: streamflix_user
      POSTGRES_PASSWORD: streamflix_password
      POSTGRES_DB: streamflix
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - streamflix_network

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: streamflix_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - streamflix_network

  # Backend Server
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: streamflix_server
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://streamflix_user:streamflix_password@postgres:5432/streamflix
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: your_production_jwt_secret_min_32_characters_long
      CLIENT_URL: http://localhost:3000
    depends_on:
      - postgres
      - redis
    volumes:
      - ./server/uploads:/app/uploads
    networks:
      - streamflix_network

  # Video Processing Worker
  worker:
    build:
      context: ./server
      dockerfile: Dockerfile.worker
    container_name: streamflix_worker
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://streamflix_user:streamflix_password@postgres:5432/streamflix
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./server/uploads:/app/uploads
    networks:
      - streamflix_network

  # Nginx (Optional - for serving client)
  nginx:
    image: nginx:alpine
    container_name: streamflix_nginx
    restart: unless-stopped
    ports:
      - "3000:80"
    volumes:
      - ./client:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - streamflix_network

volumes:
  postgres_data:
  redis_data:

networks:
  streamflix_network:
    driver: bridge
```

#### Step 2: Create Dockerfiles

**Server Dockerfile** (`server/Dockerfile`):

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Create upload directories
RUN mkdir -p uploads/videos uploads/thumbnails uploads/temp

EXPOSE 5000

CMD ["node", "src/index.js"]
```

**Worker Dockerfile** (`server/Dockerfile.worker`):

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

CMD ["node", "src/workers/videoWorker.js"]
```

#### Step 3: Run with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## ⚙️ Configuration

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | development | Yes |
| `PORT` | Server port | 5000 | Yes |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_HOST` | Redis server host | localhost | Yes |
| `REDIS_PORT` | Redis server port | 6379 | Yes |
| `REDIS_PASSWORD` | Redis password | null | No |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | 7d | No |
| `MAX_FILE_SIZE` | Max upload size in bytes | 104857600 (100MB) | No |
| `UPLOAD_PATH` | Upload directory path | ./uploads | No |

### Client Configuration

Update `client/api.js` with your server URL:

```javascript
class API {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';  // Change for production
        this.token = localStorage.getItem('token');
    }
    // ...
}
```

---

## 🎮 Running the Application

### Development Mode

#### Terminal 1: Start Redis
```bash
redis-server
```

#### Terminal 2: Start PostgreSQL
```bash
# Usually runs as a service, but if not:
postgres -D /usr/local/var/postgres  # macOS
# OR
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start  # Windows
```

#### Terminal 3: Start Backend Server
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 4: Start Video Worker
```bash
cd server
npm run worker
# Worker starts processing jobs from queue
```

#### Terminal 5: Start Frontend
```bash
cd client

# Option 1: Using Live Server (VS Code Extension)
# Right-click index.html → Open with Live Server

# Option 2: Using Python
python -m http.server 3000

# Option 3: Using Node.js http-server
npx http-server -p 3000

# Frontend runs on http://localhost:3000
```

### Production Mode

```bash
# Set environment to production
export NODE_ENV=production

# Start with PM2 (process manager)
npm install -g pm2

# Start server
pm2 start server/src/index.js --name streamflix-server

# Start worker
pm2 start server/src/workers/videoWorker.js --name streamflix-worker

# View logs
pm2 logs

# Monitor
pm2 monit
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# PostgreSQL: localhost:5432
# Redis: localhost:6379

# View logs
docker-compose logs -f server
docker-compose logs -f worker

# Stop all services
docker-compose down
```

---

## 📁 Project Structure

```
video-streaming/
├── client/                          # Frontend
│   ├── index.html                  # Main page
│   ├── login.html                  # Login page
│   ├── register.html               # Register page
│   ├── style.css                   # Styles
│   ├── script.js                   # Main JavaScript
│   ├── auth.js                     # Authentication logic
│   ├── api.js                      # API client
│   └── socket.js                   # WebSocket client
│
├── server/                          # Backend
│   ├── src/
│   │   ├── index.js                # Server entry point
│   │   ├── config/
│   │   │   ├── database.js         # Prisma setup
│   │   │   ├── redis.js            # Redis connection
│   │   │   ├── queue.js            # Bull queue setup
│   │   │   ├── socket.js           # Socket.io setup
│   │   │   └── pubsub.js           # Pub/Sub setup
│   │   ├── controllers/
│   │   │   ├── authController.js   # Auth endpoints
│   │   │   ├── videoController.js  # Video CRUD
│   │   │   ├── commentController.js # Comments
│   │   │   └── likeController.js   # Likes
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification
│   │   │   ├── upload.js           # Multer config
│   │   │   └── errorHandler.js     # Error handling
│   │   ├── routes/
│   │   │   ├── auth.js             # Auth routes
│   │   │   ├── videos.js           # Video routes
│   │   │   ├── comments.js         # Comment routes
│   │   │   └── likes.js            # Like routes
│   │   ├── workers/
│   │   │   └── videoWorker.js      # Background processor
│   │   └── utils/
│   │       ├── videoProcessor.js   # FFmpeg utilities
│   │       └── helpers.js          # Helper functions
│   │
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # DB migrations
│   │
│   ├── uploads/                     # Upload directory
│   │   ├── videos/                 # Video files
│   │   ├── thumbnails/             # Thumbnail images
│   │   └── temp/                   # Temporary files
│   │
│   ├── .env                        # Environment variables
│   ├── .env.example                # Env template
│   ├── package.json                # Dependencies
│   └── Dockerfile                  # Docker config
│
├── docker-compose.yml               # Docker orchestration
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
└── LICENSE                          # License file
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": 1, "username": "john_doe", "email": "john@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "john_doe", "email": "john@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "john_doe", "email": "john@example.com" }
  }
}
```

### Video Endpoints

#### Get All Videos
```http
GET /api/videos?page=1&limit=20
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "videos": [...],
    "pagination": { "page": 1, "limit": 20, "total": 50 }
  }
}
```

#### Get Video by ID
```http
GET /api/videos/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "video": {
      "id": 1,
      "title": "Amazing Video",
      "description": "This is a great video",
      "url": "/uploads/videos/video.mp4",
      "thumbnail": "/uploads/thumbnails/thumb.jpg",
      "duration": 180,
      "views": 1000,
      "status": "ready",
      "uploader": {...},
      "comments": [...],
      "likes": [...],
      "_count": { "likes": 50, "comments": 10 }
    }
  }
}
```

#### Upload Video
```http
POST /api/videos/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- title: "My Video"
- description: "Video description"
- video: [binary file]
- thumbnail: [binary file] (optional)

Response: 201 Created
{
  "success": true,
  "message": "Video uploaded, processing in background",
  "data": {
    "video": { "id": 1, "title": "My Video", "status": "processing", ... }
  }
}
```

#### Increment View
```http
POST /api/videos/:id/view
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": { "views": 1001 }
}
```

### Comment Endpoints

#### Add Comment
```http
POST /api/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "videoId": 1,
  "content": "Great video!"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "comment": {
      "id": 1,
      "content": "Great video!",
      "user": { "id": 1, "username": "john_doe" },
      "createdAt": "2025-11-19T10:30:00.000Z"
    }
  }
}
```

### Like Endpoints

#### Toggle Like
```http
POST /api/likes/toggle
Authorization: Bearer {token}
Content-Type: application/json

{
  "videoId": 1
}

Response: 200 OK
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 51
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to PostgreSQL"

**Problem:** Server can't connect to database

**Solutions:**
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection string in .env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Test connection manually
psql -U streamflix_user -d streamflix -h localhost

# Restart PostgreSQL
# Windows
net stop postgresql-x64-14
net start postgresql-x64-14

# Linux
sudo systemctl restart postgresql

# macOS
brew services restart postgresql
```

#### 2. "Redis connection refused"

**Problem:** Server can't connect to Redis

**Solutions:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
# Windows
redis-server

# Linux
sudo systemctl start redis

# macOS
brew services start redis

# Check Redis port (default: 6379)
netstat -an | grep 6379
```

#### 3. "JWT Secret not defined"

**Problem:** Missing JWT_SECRET in .env

**Solution:**
```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET=your_generated_secret_here
```

#### 4. "FFmpeg not found"

**Problem:** FFmpeg not installed or not in PATH

**Solutions:**
```bash
# Verify installation
ffmpeg -version

# Install FFmpeg
# Windows: Download from https://ffmpeg.org/
# Add to PATH: System Properties → Environment Variables → Path

# macOS
brew install ffmpeg

# Linux
sudo apt-get update
sudo apt-get install ffmpeg

# Update .env if needed
FFMPEG_PATH=/usr/bin/ffmpeg
```

#### 5. "Permission denied on uploads folder"

**Problem:** Server can't write to uploads directory

**Solutions:**
```bash
# Linux/Mac
cd server
chmod -R 755 uploads
chown -R $USER:$USER uploads

# Windows: Right-click uploads folder
# Properties → Security → Edit → Add write permissions
```

#### 6. "Prisma Client not generated"

**Problem:** Missing Prisma Client

**Solution:**
```bash
cd server
npx prisma generate
npx prisma migrate dev
```

#### 7. "Port already in use"

**Problem:** Port 5000 or 3000 is occupied

**Solutions:**
```bash
# Find process using port
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### 8. "CORS errors in browser"

**Problem:** Cross-origin request blocked

**Solutions:**
```javascript
// server/src/index.js
app.use(cors({
  origin: 'http://localhost:3000',  // Update with your client URL
  credentials: true
}));
```

```javascript
// client/api.js
this.baseURL = 'http://localhost:5000/api';  // Update with server URL
```

#### 9. "Video upload fails"

**Problem:** File size too large or format not supported

**Solutions:**
```env
# Increase max file size in .env
MAX_FILE_SIZE=209715200  # 200MB

# Check supported formats
# .mp4, .mov, .avi, .mkv, .webm
```

```javascript
// server/src/middleware/upload.js
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

#### 10. "Worker not processing videos"

**Problem:** Bull queue worker not running

**Solutions:**
```bash
# Start worker manually
cd server
node src/workers/videoWorker.js

# Check worker logs
# Should see: "🎬 Video worker started"

# Check Redis connection
redis-cli
> KEYS *
> LLEN bull:video-processing:wait

# Clear stuck jobs (use with caution)
redis-cli
> DEL bull:video-processing:wait
> DEL bull:video-processing:active
```

---

## 📊 Performance Optimization

### Database Optimization

```sql
-- Add indexes for better query performance
CREATE INDEX idx_videos_user ON videos(user_id);
CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_comments_video ON comments(video_id);
CREATE INDEX idx_likes_video ON likes(video_id);
CREATE INDEX idx_likes_user ON likes(user_id);
```

### Redis Caching Strategy

```javascript
// Cache frequently accessed data
// Videos: 5 minutes TTL
await redis.setex(`video:${id}`, 300, JSON.stringify(video));

// User sessions: 1 hour TTL
await redis.setex(`session:${userId}`, 3600, JSON.stringify(user));

// Clear cache on updates
await redis.del(`video:${id}`);
```

### Bull Queue Configuration

```javascript
// Optimize worker concurrency
videoQueue.process('process-video', 3, async (job) => {
  // 3 concurrent jobs
});

// Add job priorities
await videoQueue.add('process-video', data, {
  priority: 1,  // 1 = highest
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 }
});
```

---

## 🧪 Testing

### Run Tests

```bash
cd server

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- videoController.test.js
```

### Manual Testing with cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get videos (with token)
curl -X GET http://localhost:5000/api/videos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Upload video
curl -X POST http://localhost:5000/api/videos/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Test Video" \
  -F "description=Test Description" \
  -F "video=@/path/to/video.mp4"
```

---

## 🔒 Security Best Practices

### Production Checklist

- [ ] Change default passwords
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Enable CORS only for trusted origins
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Implement logging and monitoring
- [ ] Regular database backups
- [ ] Use helmet.js for HTTP headers
- [ ] Implement CSRF protection
- [ ] Add request validation
- [ ] Set up firewall rules

### Example Security Middleware

```javascript
// server/src/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// HTTP security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Input validation
const { body, validationResult } = require('express-validator');

app.post('/api/videos/upload', [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process upload
});
```

---

## 📈 Monitoring & Logging

### Setup PM2 Monitoring

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server/src/index.js --name streamflix-server
pm2 start server/src/workers/videoWorker.js --name streamflix-worker

# Monitor
pm2 monit

# View logs
pm2 logs

# Save configuration
pm2 save
pm2 startup
```

### Setup Winston Logging

```javascript
// server/src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

---

## 🚀 Deployment

### Deploy to VPS (Ubuntu)

```bash
# 1. Connect to server
ssh root@your-server-ip

# 2. Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql redis-server ffmpeg nginx

# 3. Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE streamflix;
CREATE USER streamflix_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE streamflix TO streamflix_user;
\q

# 4. Clone repository
cd /var/www
git clone https://github.com/yourusername/video-streaming.git
cd video-streaming/server

# 5. Install dependencies
npm ci --only=production

# 6. Setup environment
cp .env.example .env
nano .env  # Edit configuration

# 7. Run migrations
npx prisma migrate deploy
npx prisma generate

# 8. Setup PM2
npm install -g pm2
pm2 start src/index.js --name streamflix-server
pm2 start src/workers/videoWorker.js --name streamflix-worker
pm2 save
pm2 startup

# 9. Configure Nginx
sudo nano /etc/nginx/sites-available/streamflix
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/video-streaming/client;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/streamflix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Use ESLint and Prettier
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Follow existing code style

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Bull](https://optimalbits.github.io/bull/) - Job queue
- [Socket.io](https://socket.io/) - WebSocket library
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [Redis](https://redis.io/) - Cache & queue backend
- [PostgreSQL](https://www.postgresql.org/) - Database

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search [existing issues](https://github.com/yourusername/video-streaming/issues)
3. Create a [new issue](https://github.com/yourusername/video-streaming/issues/new)
4. Join our [Discord community](https://discord.gg/yourinvite)

---

## 🗺 Roadmap

### Version 2.0 (Planned)

- [ ] Video recommendations algorithm
- [ ] Playlists and watch later
- [ ] Live streaming support
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] CDN integration
- [ ] Advanced search with filters
- [ ] User subscriptions
- [ ] Notifications system
- [ ] Admin panel
- [ ] Video transcoding (multiple qualities)
- [ ] Subtitle support
- [ ] Social login (Google, Facebook)
- [ ] Two-factor authentication

---

## 📊 Project Status

- ✅ Core features complete
- ✅ Authentication & Authorization
- ✅ Video upload & streaming
- ✅ Real-time features (WebSocket)
- ✅ Background processing
- ✅ Caching layer
- 🚧 Advanced analytics (in progress)
- 📋 Mobile app (planned)
- 📋 Live streaming (planned)

---

**Made with ❤️ by [Your Name]**

⭐ **Star this repo if you found it helpful!**

---

*Last Updated: November 19, 2025*
