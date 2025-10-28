# LexiLearn

AI-Powered Language Learning Platform

## Project Structure

This is a monorepo containing:

- `backend/` - Express.js server with PostgreSQL database
- `frontend/` - React + Vite PWA application

## Quick Start

### Backend

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run migrate
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Development

The backend runs on http://localhost:3001 and the frontend on http://localhost:5173.

See individual README files in `backend/` and `frontend/` for more details.

## Features

- 🎯 Interactive language lessons
- 🎤 Speech recognition for pronunciation practice
- 🤖 AI-powered grammar corrections (Google Gemini)
- 📊 Progress tracking and analytics
- 📝 Vocabulary notebook
- 📄 PDF lesson summaries
- 🔌 Offline support (PWA)
- 💬 Real-time communication (WebSocket)

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, Socket.io-client
**Backend:** Express.js, PostgreSQL, Socket.io, Clerk Auth
**AI:** Google Generative AI (Gemini)
