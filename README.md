# ✂️ Snip — URL Shortener

A production-ready URL shortening service built with **Node.js**, **Express**, and **MongoDB**.

## Features

- 🔗 Shorten any URL with a random or custom alias
- 📊 Click tracking with history (referrer + user agent)
- ⏰ Optional link expiration (TTL via MongoDB)
- 🔒 Rate limiting on the shorten endpoint
- ⚡ Enable/disable links without deleting them
- 🎨 Clean, dark frontend included

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your MongoDB URI and base URL.

### 3. Run the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser.

---

## API Reference

### POST `/api/shorten`
Create a short URL.
```json
{
  "originalUrl": "https://example.com/very/long/path",
  "customAlias": "my-link",     // optional
  "expiresIn": 7                // optional, days
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shortCode": "abc1234",
    "shortUrl": "http://localhost:3000/abc1234",
    "originalUrl": "https://example.com/...",
    "clicks": 0,
    "expiresAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/:shortCode`
Redirects to the original URL (301).

### GET `/api/stats/:shortCode`
Get click stats for a short URL.

### GET `/api/urls`
List all URLs (paginated).
- Query params: `?page=1&limit=10`

### DELETE `/api/urls/:shortCode`
Delete a short URL.

### PATCH `/api/urls/:shortCode/toggle`
Enable or disable a short URL.

### GET `/health`
Server health check.

---

## Project Structure

```
url-shortener/
├── src/
│   ├── server.js              # Express app entry point
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   └── Url.js             # Mongoose schema
│   ├── controllers/
│   │   └── urlController.js   # Business logic
│   └── routes/
│       └── urlRoutes.js       # API route definitions
├── public/
│   └── index.html             # Frontend UI
├── .env.example
└── package.json
```

---

## MongoDB Schema

```
Url {
  originalUrl   String   // The full original URL
  shortCode     String   // Unique short identifier
  customAlias   String   // User-defined alias (optional)
  clicks        Number   // Total click count
  clickHistory  Array    // Last 100 clicks with timestamp + metadata
  expiresAt     Date     // TTL — auto-deleted by MongoDB index
  isActive      Boolean  // Enable/disable without deletion
  createdAt     Date     // Auto timestamp
}
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/urlshortener` |
| `PORT` | Server port | `3000` |
| `BASE_URL` | Base URL for short links | `http://localhost:3000` |
