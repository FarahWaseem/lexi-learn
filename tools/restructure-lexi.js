#!/usr/bin/env node
/**
 * LexiLearn Monorepo Restructuring Script
 * Safely migrates from flat structure to backend + frontend monorepo
 * 
 * Usage: node tools/restructure-lexi.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, '.backup-lexi', new Date().toISOString().replace(/:/g, '-').split('.')[0]);
const BRANCH_NAME = 'chore/restructure-lexilearn';

const EXCLUDE_FROM_BACKUP = ['.git', 'node_modules', '.backup-lexi'];

// ============================================================================
// UTILITIES
// ============================================================================

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
};

const report = {
  moved: [],
  warnings: [],
  created: [],
  notes: [],
};

/**
 * Recursively copy directory
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Safe move: if destination exists, rename it with .bak
 */
function safeMove(src, dest) {
  if (!fs.existsSync(src)) {
    log.warn(`Source does not exist: ${src}`);
    return false;
  }
  
  // Create destination directory
  const destDir = path.dirname(dest);
  fs.mkdirSync(destDir, { recursive: true });
  
  // If destination exists, back it up
  if (fs.existsSync(dest)) {
    const bakPath = `${dest}.bak`;
    log.warn(`Destination exists, renaming to ${path.basename(bakPath)}`);
    if (fs.existsSync(bakPath)) {
      fs.rmSync(bakPath, { recursive: true, force: true });
    }
    fs.renameSync(dest, bakPath);
  }
  
  // Move the file/directory
  fs.renameSync(src, dest);
  report.moved.push({ from: path.relative(ROOT, src), to: path.relative(ROOT, dest) });
  return true;
}

/**
 * Create file with content
 */
function createFile(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  report.created.push(path.relative(ROOT, filePath));
}

/**
 * Create empty file (placeholder)
 */
function createPlaceholder(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '// Placeholder file\n', 'utf8');
    report.created.push(path.relative(ROOT, filePath));
  }
}

/**
 * Check if running in a git repository
 */
function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create git branch
 */
function createGitBranch() {
  if (!isGitRepo()) {
    log.warn('Not a git repository, skipping branch creation');
    return;
  }
  
  try {
    // Check if branch exists
    const branches = execSync('git branch --list', { cwd: ROOT, encoding: 'utf8' });
    if (branches.includes(BRANCH_NAME)) {
      log.info(`Branch ${BRANCH_NAME} already exists, skipping creation`);
      return;
    }
    
    execSync(`git checkout -b ${BRANCH_NAME}`, { cwd: ROOT, stdio: 'inherit' });
    log.success(`Created branch: ${BRANCH_NAME}`);
  } catch (error) {
    log.warn(`Could not create branch: ${error.message}`);
  }
}

/**
 * Create backup
 */
function createBackup() {
  log.section('Creating Backup');
  
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  
  for (const entry of entries) {
    if (EXCLUDE_FROM_BACKUP.includes(entry.name)) continue;
    
    const srcPath = path.join(ROOT, entry.name);
    const destPath = path.join(BACKUP_DIR, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  log.success(`Backup created at: ${path.relative(ROOT, BACKUP_DIR)}`);
  report.notes.push(`Backup location: ${path.relative(ROOT, BACKUP_DIR)}`);
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Move frontend files
 */
function migrateFrontend() {
  log.section('Migrating Frontend Files');
  
  const frontendRoot = path.join(ROOT, 'frontend');
  
  // Move public/
  safeMove(path.join(ROOT, 'public'), path.join(frontendRoot, 'public'));
  
  // Move src/
  safeMove(path.join(ROOT, 'src'), path.join(frontendRoot, 'src'));
  
  // Move config files
  const configFiles = ['index.html', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'];
  for (const file of configFiles) {
    safeMove(path.join(ROOT, file), path.join(frontendRoot, file));
  }
  
  // Move PWA/build artifacts
  const artifacts = ['dev-dist', 'dist'];
  for (const artifact of artifacts) {
    const srcPath = path.join(ROOT, artifact);
    if (fs.existsSync(srcPath)) {
      safeMove(srcPath, path.join(frontendRoot, artifact));
    }
  }
  
  // Move any sw.js or workbox files at root
  const rootFiles = fs.readdirSync(ROOT);
  for (const file of rootFiles) {
    if (file.startsWith('sw.') || file.startsWith('workbox-')) {
      safeMove(path.join(ROOT, file), path.join(frontendRoot, file));
    }
  }
  
  log.success('Frontend files migrated');
}

/**
 * Move backend files
 */
function migrateBackend() {
  log.section('Migrating Backend Files');
  
  const backendRoot = path.join(ROOT, 'backend');
  
  // Move server.js
  safeMove(path.join(ROOT, 'server.js'), path.join(backendRoot, 'server.js'));
  
  log.success('Backend files migrated');
}

/**
 * Move shared backend files from frontend/src to backend
 */
function moveBackendFilesFromSrc() {
  log.section('Moving Backend-specific Files from src/');
  
  const frontendSrc = path.join(ROOT, 'frontend', 'src');
  const backendRoot = path.join(ROOT, 'backend');
  
  // Move services/correction.js
  const correctionSrc = path.join(frontendSrc, 'services', 'correction.js');
  if (fs.existsSync(correctionSrc)) {
    safeMove(correctionSrc, path.join(backendRoot, 'src', 'services', 'correction.js'));
  }
  
  // Move lib/realtime.js
  const realtimeSrc = path.join(frontendSrc, 'lib', 'realtime.js');
  if (fs.existsSync(realtimeSrc)) {
    safeMove(realtimeSrc, path.join(backendRoot, 'src', 'utils', 'realtime.js'));
  }
  
  // Move offline/db.js (this is actually backend database config)
  const dbSrc = path.join(frontendSrc, 'lib');
  if (fs.existsSync(dbSrc)) {
    // Remove empty lib directory
    try {
      fs.rmdirSync(dbSrc);
    } catch (e) {
      // Directory not empty or doesn't exist
    }
  }
  
  log.success('Backend-specific files moved from src/');
}

/**
 * Create backend placeholders and structure
 */
function createBackendStructure() {
  log.section('Creating Backend Structure');

  const backendRoot = path.join(ROOT, 'backend');

  // Database directory structure
  const dbDir = path.join(backendRoot, 'database');
  const migrationsDir = path.join(dbDir, 'migrations');
  fs.mkdirSync(migrationsDir, { recursive: true });

  // Create placeholder SQL files if they don't exist
  const sqlFiles = [
    { path: path.join(migrationsDir, '001_create_user_vocab_words.sql'), content: '-- Migration: Create user vocab words table\n' },
    { path: path.join(migrationsDir, 'init.sql'), content: '-- Database initialization\n' },
    { path: path.join(migrationsDir, 'seed-lessons.sql'), content: '-- Seed lessons data\n' },
  ];

  for (const { path: filePath, content } of sqlFiles) {
    if (!fs.existsSync(filePath)) {
      createFile(filePath, content);
    }
  }

  // Create migrate.js and seed.js
  createFile(path.join(dbDir, 'migrate.js'), `// Database migration script
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log('Running migrations...');
  // Add migration logic here
  await pool.end();
}

migrate().catch(console.error);
`);

  createFile(path.join(dbDir, 'seed.js'), `// Database seeding script
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('Seeding database...');
  // Add seeding logic here
  await pool.end();
}

seed().catch(console.error);
`);

  // Create config files
  const configDir = path.join(backendRoot, 'src', 'config');
  fs.mkdirSync(configDir, { recursive: true });

  // Check if offline/db.js exists in frontend
  const offlineDbPath = path.join(ROOT, 'frontend', 'src', 'offline', 'db.js');
  const hasOfflineDb = fs.existsSync(offlineDbPath);

  if (!fs.existsSync(path.join(configDir, 'database.js'))) {
    createFile(path.join(configDir, 'database.js'), `// Database configuration
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = { pool };
`);
  }

  if (!fs.existsSync(path.join(configDir, 'config.js'))) {
    createFile(path.join(configDir, 'config.js'), `// Application configuration
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  skipWsAuth: process.env.SKIP_WS_AUTH === 'true',
};
`);
  }

  // Create placeholder directories and files
  const placeholders = [
    'src/controllers/audioController.js',
    'src/controllers/lessonController.js',
    'src/controllers/lessonsController.js',
    'src/controllers/lessonsUIController.js',
    'src/controllers/vocabController.js',
    'src/controllers/vocabNotebookController.js',
    'src/middleware/clerkMiddleware.js',
    'src/middleware/errorMiddleware.js',
    'src/middleware/validationMiddleware.js',
    'src/models/audioModel.js',
    'src/routes/audioRoutes.js',
    'src/routes/lessonRoutes.js',
    'src/routes/vocabRoutes.js',
    'src/services/audioService.js',
    'src/utils/ffmpeg.js',
    'src/utils/logger.js',
    'src/utils/multerConfig.js',
    'src/utils/responseHelper.js',
    'src/utils/validationHelper.js',
  ];

  for (const placeholder of placeholders) {
    const filePath = path.join(backendRoot, placeholder);
    if (!fs.existsSync(filePath)) {
      createPlaceholder(filePath);
    }
  }

  // Create app.js (Express app factory)
  if (!fs.existsSync(path.join(backendRoot, 'app.js'))) {
    createFile(path.join(backendRoot, 'app.js'), `// Express app factory
const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Add routes here

  return app;
}

module.exports = { createApp };
`);
  }

  // Create docker-compose.yml
  if (!fs.existsSync(path.join(backendRoot, 'docker-compose.yml'))) {
    createFile(path.join(backendRoot, 'docker-compose.yml'), `version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: lexil
      POSTGRES_PASSWORD: secret123
      POSTGRES_DB: lexilearn
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`);
  }

  // Create README files
  if (!fs.existsSync(path.join(backendRoot, 'README.md'))) {
    createFile(path.join(backendRoot, 'README.md'), `# LexiLearn Backend

Backend server for LexiLearn language learning platform.

## Setup

\`\`\`bash
npm install
cp env.example .env
# Edit .env with your configuration
npm run migrate
npm run seed
npm run dev
\`\`\`

## Scripts

- \`npm run dev\` - Start development server with nodemon
- \`npm start\` - Start production server
- \`npm run migrate\` - Run database migrations
- \`npm run seed\` - Seed database with initial data
`);
  }

  log.success('Backend structure created');
}

/**
 * Split package.json
 */
function splitPackageJson() {
  log.section('Splitting package.json');

  const rootPackagePath = path.join(BACKUP_DIR, 'package.json');
  if (!fs.existsSync(rootPackagePath)) {
    log.error('Root package.json not found in backup');
    return;
  }

  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

  // Frontend package.json
  const frontendPackage = {
    name: 'lexilearn-frontend',
    version: rootPackage.version || '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      test: rootPackage.scripts?.test || 'react-scripts test',
    },
    dependencies: {},
    devDependencies: {},
    eslintConfig: rootPackage.eslintConfig,
    browserslist: rootPackage.browserslist,
  };

  // Frontend dependencies (Vite, React, UI libraries)
  const frontendDeps = [
    '@clerk/clerk-react',
    '@testing-library/dom',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    'classnames',
    'html2canvas',
    'idb',
    'idb-keyval',
    'jspdf',
    'jspdf-autotable',
    'lucide-react',
    'react',
    'react-dom',
    'react-router-dom',
    'react-scripts',
    'socket.io-client',
    'web-vitals',
  ];

  const frontendDevDeps = [
    '@tailwindcss/forms',
    '@tailwindcss/typography',
    '@vitejs/plugin-react',
    'autoprefixer',
    'postcss',
    'tailwindcss',
    'vite',
    'vite-plugin-pwa',
  ];

  for (const dep of frontendDeps) {
    if (rootPackage.dependencies?.[dep]) {
      frontendPackage.dependencies[dep] = rootPackage.dependencies[dep];
    }
  }

  for (const dep of frontendDevDeps) {
    if (rootPackage.devDependencies?.[dep]) {
      frontendPackage.devDependencies[dep] = rootPackage.devDependencies[dep];
    }
  }

  createFile(
    path.join(ROOT, 'frontend', 'package.json'),
    JSON.stringify(frontendPackage, null, 2) + '\n'
  );

  // Backend package.json
  const backendPackage = {
    name: 'lexilearn-backend',
    version: rootPackage.version || '0.1.0',
    private: true,
    type: 'commonjs',
    scripts: {
      dev: 'nodemon server.js',
      start: 'node server.js',
      migrate: 'node database/migrate.js',
      seed: 'node database/seed.js',
    },
    dependencies: {
      express: rootPackage.dependencies?.express || '^5.1.0',
      cors: rootPackage.dependencies?.cors || '^2.8.5',
      'socket.io': rootPackage.dependencies?.['socket.io'] || '^4.8.1',
      pg: rootPackage.dependencies?.pg || '^8.16.3',
      dotenv: rootPackage.dependencies?.dotenv || '^17.2.3',
      '@clerk/express': rootPackage.dependencies?.['@clerk/express'] || '^1.7.42',
      '@clerk/backend': rootPackage.dependencies?.['@clerk/backend'] || '^2.19.0',
      '@clerk/clerk-sdk-node': rootPackage.dependencies?.['@clerk/clerk-sdk-node'] || '^4.13.23',
      '@google/generative-ai': rootPackage.dependencies?.['@google/generative-ai'] || '^0.24.1',
      '@dotenvx/dotenvx': rootPackage.dependencies?.['@dotenvx/dotenvx'] || '^1.51.0',
      pdfkit: rootPackage.dependencies?.pdfkit || '^0.17.2',
      multer: rootPackage.dependencies?.multer || '^2.0.2',
      'fluent-ffmpeg': rootPackage.dependencies?.['fluent-ffmpeg'] || '^2.1.3',
      'node-fetch': rootPackage.dependencies?.['node-fetch'] || '^2.7.0',
      jose: rootPackage.dependencies?.jose || '^6.1.0',
      svix: rootPackage.dependencies?.svix || '^1.76.1',
      'abort-controller': rootPackage.dependencies?.['abort-controller'] || '^3.0.0',
    },
    devDependencies: {
      nodemon: '^3.0.1',
    },
  };

  createFile(
    path.join(ROOT, 'backend', 'package.json'),
    JSON.stringify(backendPackage, null, 2) + '\n'
  );

  log.success('package.json files created for frontend and backend');
}

/**
 * Split .env file
 */
function splitEnvFile() {
  log.section('Splitting .env File');

  const rootEnvPath = path.join(BACKUP_DIR, '.env');
  if (!fs.existsSync(rootEnvPath)) {
    log.warn('.env file not found in backup');
    return;
  }

  const envContent = fs.readFileSync(rootEnvPath, 'utf8');
  const lines = envContent.split('\n');

  const frontendEnv = [];
  const backendEnv = [];
  const envKeys = new Set();

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // Extract key
    const match = trimmed.match(/^([^=]+)=/);
    if (match) {
      const key = match[1].trim();
      envKeys.add(key);

      if (key.startsWith('VITE_')) {
        frontendEnv.push(trimmed);
      } else {
        backendEnv.push(trimmed);
      }
    }
  }

  // Write frontend .env
  if (frontendEnv.length > 0) {
    createFile(
      path.join(ROOT, 'frontend', '.env'),
      frontendEnv.join('\n') + '\n'
    );
    report.notes.push(`Frontend .env created with ${frontendEnv.length} variables`);
  }

  // Write backend .env
  if (backendEnv.length > 0) {
    createFile(
      path.join(ROOT, 'backend', '.env'),
      backendEnv.join('\n') + '\n'
    );
    report.notes.push(`Backend .env created with ${backendEnv.length} variables`);
  }

  // Create backend env.example
  const envExample = Array.from(envKeys)
    .filter(key => !key.startsWith('VITE_'))
    .map(key => `${key}=`)
    .join('\n');

  createFile(
    path.join(ROOT, 'backend', 'env.example'),
    `# Backend Environment Variables\n\n${envExample}\n`
  );

  // Backup original .env
  const bakPath = path.join(ROOT, '.env.bak');
  if (fs.existsSync(path.join(ROOT, '.env'))) {
    fs.copyFileSync(path.join(ROOT, '.env'), bakPath);
    report.notes.push('Original .env backed up to .env.bak');
  }

  log.success('.env files split and created');
}

/**
 * Check for suspicious imports (frontend importing backend code)
 */
function checkSuspiciousImports() {
  log.section('Checking for Suspicious Imports');

  const frontendSrc = path.join(ROOT, 'frontend', 'src');
  if (!fs.existsSync(frontendSrc)) {
    return;
  }

  const suspiciousPatterns = [
    /from\s+['"]\.\.\/\.\.\/services\/correction/,
    /from\s+['"]\.\.\/\.\.\/lib\/realtime/,
    /require\s*\(\s*['"]\.\.\/\.\.\/services\/correction/,
    /require\s*\(\s*['"]\.\.\/\.\.\/lib\/realtime/,
  ];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            report.warnings.push(
              `Suspicious import in ${path.relative(ROOT, fullPath)}: may need manual update`
            );
          }
        }
      }
    }
  }

  scanDirectory(frontendSrc);

  if (report.warnings.length === 0) {
    log.success('No suspicious imports found');
  } else {
    log.warn(`Found ${report.warnings.length} suspicious import(s)`);
  }
}

/**
 * Create VS Code tasks
 */
function createVSCodeTasks() {
  log.section('Creating VS Code Tasks');

  const vscodeDir = path.join(ROOT, '.vscode');
  fs.mkdirSync(vscodeDir, { recursive: true });

  const tasks = {
    version: '2.0.0',
    tasks: [
      {
        label: 'Restructure to Monorepo',
        type: 'shell',
        command: 'node',
        args: ['tools/restructure-lexi.js'],
        problemMatcher: [],
        presentation: {
          reveal: 'always',
          panel: 'new',
        },
      },
      {
        label: 'Start Backend',
        type: 'shell',
        command: 'npm',
        args: ['run', 'dev'],
        options: {
          cwd: '${workspaceFolder}/backend',
        },
        problemMatcher: [],
        presentation: {
          reveal: 'always',
          panel: 'dedicated',
        },
      },
      {
        label: 'Start Frontend',
        type: 'shell',
        command: 'npm',
        args: ['run', 'dev'],
        options: {
          cwd: '${workspaceFolder}/frontend',
        },
        problemMatcher: [],
        presentation: {
          reveal: 'always',
          panel: 'dedicated',
        },
      },
    ],
  };

  createFile(
    path.join(vscodeDir, 'tasks.json'),
    JSON.stringify(tasks, null, 2) + '\n'
  );

  log.success('VS Code tasks created');
}

/**
 * Create root README
 */
function createRootReadme() {
  const readmePath = path.join(ROOT, 'README.md');

  // Only create if it doesn't exist or is the default CRA readme
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    if (!content.includes('Create React App')) {
      return; // Keep existing custom README
    }
  }

  createFile(readmePath, `# LexiLearn

AI-Powered Language Learning Platform

## Project Structure

This is a monorepo containing:

- \`backend/\` - Express.js server with PostgreSQL database
- \`frontend/\` - React + Vite PWA application

## Quick Start

### Backend

\`\`\`bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run migrate
npm run seed
npm run dev
\`\`\`

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Development

The backend runs on http://localhost:3000 and the frontend on http://localhost:5173.

See individual README files in \`backend/\` and \`frontend/\` for more details.

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
`);
}

/**
 * Print final report
 */
function printReport() {
  log.section('MIGRATION REPORT');

  console.log('\n📦 Files Moved:');
  if (report.moved.length === 0) {
    console.log('  (none)');
  } else {
    for (const { from, to } of report.moved) {
      console.log(`  ${from} → ${to}`);
    }
  }

  console.log('\n✨ Files Created:');
  if (report.created.length === 0) {
    console.log('  (none)');
  } else {
    for (const file of report.created) {
      console.log(`  ${file}`);
    }
  }

  console.log('\n⚠️  Warnings:');
  if (report.warnings.length === 0) {
    console.log('  (none)');
  } else {
    for (const warning of report.warnings) {
      console.log(`  ${warning}`);
    }
  }

  console.log('\n📝 Notes:');
  if (report.notes.length === 0) {
    console.log('  (none)');
  } else {
    for (const note of report.notes) {
      console.log(`  ${note}`);
    }
  }

  console.log('\n🚀 Next Steps:');
  console.log('  1. Review the changes');
  console.log('  2. Install backend dependencies:');
  console.log('     cd backend && npm install');
  console.log('  3. Install frontend dependencies:');
  console.log('     cd frontend && npm install');
  console.log('  4. Start backend:');
  console.log('     cd backend && npm run dev');
  console.log('  5. Start frontend (in another terminal):');
  console.log('     cd frontend && npm run dev');

  log.section('MIGRATION COMPLETE');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         LexiLearn Monorepo Restructuring Script              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Create git branch
    createGitBranch();

    // Step 2: Create backup
    createBackup();

    // Step 3: Migrate frontend files
    migrateFrontend();

    // Step 4: Migrate backend files
    migrateBackend();

    // Step 5: Move backend-specific files from src
    moveBackendFilesFromSrc();

    // Step 6: Create backend structure
    createBackendStructure();

    // Step 7: Split package.json
    splitPackageJson();

    // Step 8: Split .env
    splitEnvFile();

    // Step 9: Check for suspicious imports
    checkSuspiciousImports();

    // Step 10: Create VS Code tasks
    createVSCodeTasks();

    // Step 11: Create root README
    createRootReadme();

    // Step 12: Print report
    printReport();

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };

