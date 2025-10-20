# LexiLearn Backend API

A clean, scalable backend API for the LexiLearn language learning application built with Node.js, Express, and PostgreSQL.

## 🏗️ Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── app.js                 # Application entry point
├── config/                # Configuration files
│   └── database.js        # Database connection
├── controllers/           # Business logic controllers
│   ├── userController.js
│   ├── vocabController.js
│   └── lessonController.js
├── middleware/           # Custom middleware
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── validationMiddleware.js
├── routes/               # API routes
│   ├── userRoutes.js
│   ├── vocabRoutes.js
│   └── lessonRoutes.js
├── utils/                # Utility functions
│   ├── logger.js
│   ├── responseHelper.js
│   └── validationHelper.js
└── database/             # Database related files
    ├── init.sql
    └── migrations/
```

## 🚀 Features

- **Clean Architecture** with separation of concerns
- **RESTful API** design
- **JWT Authentication** with secure token handling
- **PostgreSQL** database with proper indexing
- **Input Validation** using Joi
- **Error Handling** with custom middleware
- **Logging** system for debugging
- **Rate Limiting** for API protection
- **CORS** configuration
- **Docker** support for easy deployment

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Joi** - Validation
- **Docker** - Containerization
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Docker (optional)

## 🔧 Installation

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lexi-learn/backend
   ```

2. **Copy environment variables**
   ```bash
   cp env.example .env
   ```

3. **Update environment variables** in `.env` file

4. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb lexi_learn
   
   # Run initial schema
   psql -d lexi_learn -f database/init.sql
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/v1/users/register` | Register new user | No |
| POST | `/api/v1/users/login` | Login user | No |
| GET | `/api/v1/users/me` | Get current user | Yes |
| GET | `/api/v1/users/stats` | Get user statistics | Yes |

### Vocabulary Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/v1/vocab` | Get user's vocabulary | Yes |
| POST | `/api/v1/vocab` | Add new word | Yes |
| GET | `/api/v1/vocab/:id` | Get specific word | Yes |
| PUT | `/api/v1/vocab/:id` | Update word | Yes |
| DELETE | `/api/v1/vocab/:id` | Delete word | Yes |
| GET | `/api/v1/vocab/search` | Search words | Yes |
| GET | `/api/v1/vocab/stats` | Get vocabulary stats | Yes |

### Lesson Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/v1/lessons` | Get all lessons | Yes |
| POST | `/api/v1/lessons` | Create lesson | Yes |
| GET | `/api/v1/lessons/:id` | Get specific lesson | Yes |
| PUT | `/api/v1/lessons/:id` | Update lesson | Yes |
| DELETE | `/api/v1/lessons/:id` | Delete lesson | Yes |
| GET | `/api/v1/lessons/:id/words` | Get lesson words | Yes |

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and profiles
- **daily_topics** - Learning lessons/topics
- **topic_words** - Words associated with lessons
- **user_vocab_words** - User's personal vocabulary
- **sessions** - Learning sessions
- **attempts** - User attempts at questions
- **utterances** - Voice/text interactions
- **corrections** - AI feedback and scoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://lexi_user:lexi_password@localhost:5432/lexi_learn
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lexi_learn
DB_USER=lexi_user
DB_PASSWORD=lexi_password

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Deployment

### Using Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database
3. Set secure JWT secrets
4. Configure proper CORS origins
5. Use a reverse proxy (nginx) for SSL termination

## 📈 Performance

- Database queries are optimized with proper indexing
- Rate limiting prevents API abuse
- Connection pooling for database efficiency
- Compression middleware for response optimization

## 🔒 Security

- Helmet.js for security headers
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- Password hashing with bcrypt
- JWT token expiration
- CORS configuration

## 📞 Support

For issues and questions, please contact the development team.

## 📄 License

This project is licensed under the MIT License.
