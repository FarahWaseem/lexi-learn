# LexiLearn Backend

Backend server for LexiLearn language learning platform.

## Setup

```bash
npm install
cp env.example .env
# Edit .env with your configuration
npm run migrate
npm run seed
npm run dev
```

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data
