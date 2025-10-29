# LexiLearn Restructuring Plan

## Overview
This script will safely migrate your LexiLearn project from a flat structure to a backend + frontend monorepo.

## Safety Measures

1. **Git Branch**: Creates `chore/restructure-lexilearn` branch (if in git repo)
2. **Full Backup**: Creates backup at `.backup-lexi/<timestamp>/` (excludes .git, node_modules)
3. **Safe Moves**: If destination exists, renames it with `.bak` extension
4. **Idempotent**: Can be run multiple times safely

## What Will Happen

### Frontend Migration
- `public/` → `frontend/public/`
- `src/` → `frontend/src/`
- `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js` → `frontend/`
- `dev-dist/`, `dist/` → `frontend/`
- Top-level app files → `frontend/src/`: `App.jsx`, `App.css`, `main.jsx`, etc.

### Backend Migration
- `server.js` → `backend/server.js`
- `src/services/correction.js` → `backend/src/services/correction.js`
- `src/lib/realtime.js` → `backend/src/utils/realtime.js`

### Backend Structure Creation
Creates complete backend structure with:
- `database/` - migrations, seed files, migrate.js, seed.js
- `src/config/` - config.js, database.js
- `src/controllers/` - placeholder controllers
- `src/middleware/` - placeholder middleware
- `src/models/` - placeholder models
- `src/routes/` - placeholder routes
- `src/services/` - audioService.js, correction.js
- `src/utils/` - various utility files
- `app.js` - Express app factory
- `docker-compose.yml` - PostgreSQL setup
- `README.md` - Backend documentation

### Package.json Split
- **Frontend**: Vite, React, UI dependencies only
- **Backend**: Express, PostgreSQL, Clerk, AI services

### .env Split
- **Frontend .env**: Only `VITE_*` variables
- **Backend .env**: All other variables
- **backend/env.example**: Template with all backend keys
- **Root .env.bak**: Backup of original

### VS Code Tasks
Creates `.vscode/tasks.json` with:
1. Restructure to Monorepo
2. Start Backend
3. Start Frontend

## Files That Will Be Created

### Backend
```
backend/
├── database/
│   ├── migrations/
│   │   ├── 001_create_user_vocab_words.sql
│   │   ├── init.sql
│   │   └── seed-lessons.sql
│   ├── migrate.js
│   └── seed.js
├── src/
│   ├── config/
│   │   ├── config.js
│   │   └── database.js
│   ├── controllers/ (placeholders)
│   ├── middleware/ (placeholders)
│   ├── models/ (placeholders)
│   ├── routes/ (placeholders)
│   ├── services/
│   │   ├── audioService.js
│   │   └── correction.js (moved)
│   └── utils/
│       ├── realtime.js (moved)
│       └── (other placeholders)
├── app.js
├── server.js (moved)
├── docker-compose.yml
├── env.example
├── package.json
└── README.md
```

### Frontend
```
frontend/
├── public/ (moved)
├── src/ (moved)
├── dev-dist/ (moved)
├── dist/ (moved)
├── index.html (moved)
├── package.json
├── postcss.config.js (moved)
├── tailwind.config.js (moved)
├── vite.config.js (moved)
└── .env
```

### Root
```
.backup-lexi/<timestamp>/ (full backup)
.env.bak (original .env backup)
.vscode/tasks.json
README.md (updated)
```

## Warnings to Expect

The script will check for:
- Suspicious imports (frontend importing backend code directly)
- File conflicts (will rename with .bak)

## After Running

You'll need to:

1. **Install dependencies**:
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```

2. **Configure environment**:
   - Review `backend/.env`
   - Review `frontend/.env`

3. **Start services**:
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```

## Rollback Plan

If something goes wrong:
1. All original files are in `.backup-lexi/<timestamp>/`
2. You can restore from backup
3. Git branch allows easy revert: `git checkout <previous-branch>`

## Ready to Run?

Execute with:
```bash
node tools/restructure-lexi.js
```

