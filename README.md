# 🎓 LexiLearn - Language Learning Platform

A modern, full-stack language learning application built with React, Node.js, and PostgreSQL.

## 🏗️ Project Structure

```
lexi-learn/
├── backend/                 # Node.js/Express API
│   ├── src/                # Source code
│   ├── database/           # Database schemas and migrations
│   ├── docker-compose.yml  # Docker configuration
│   └── Dockerfile         # Backend container
├── frontend/               # React application
│   ├── src/               # React source code
│   └── public/            # Static assets
├── uploads/               # File uploads
└── venv/                 # Python environment (for Whisper AI)
```

## 🚀 Quick Start

### Option 1: One-Click Start (Recommended)

```bash
# Start the entire project
start-project.bat
```

### Option 2: Manual Start

#### 1. Start Backend
```bash
cd backend
start.bat
```

#### 2. Start Frontend (in new terminal)
```bash
start-frontend.bat
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Docker** - Containerization
- **JWT** - Authentication
- **Joi** - Validation

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client

### Database
- **PostgreSQL** - Primary database
- **Clean Schema** - Well-structured tables
- **Migrations** - Version control for database

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Docker Desktop** (for backend)
- **Git**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lexi-learn
   ```

2. **Start the project**
   ```bash
   # Windows
   start-project.bat
   
   # Or manually
   cd backend && start.bat
   # Then in new terminal
   start-frontend.bat
   ```

## 📊 Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Database**: PostgreSQL on localhost:5432

## 🎯 Features

### ✅ Implemented
- **User Authentication** (Register/Login)
- **Vocabulary Management** (Add/Edit/Delete words)
- **Lesson System** (Daily topics and questions)
- **Clean Architecture** (Backend)
- **Responsive Design** (Frontend)
- **Docker Support** (Easy deployment)

### 🔄 In Progress
- **Voice Recording** (Audio features)
- **AI Integration** (Whisper for speech-to-text)
- **Progress Tracking** (User statistics)

## 📚 API Documentation

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/me` - Get current user

### Vocabulary
- `GET /api/v1/vocab` - Get user's vocabulary
- `POST /api/v1/vocab` - Add new word
- `PUT /api/v1/vocab/:id` - Update word
- `DELETE /api/v1/vocab/:id` - Delete word
- `GET /api/v1/vocab/search` - Search words

### Lessons
- `GET /api/v1/lessons` - Get all lessons
- `POST /api/v1/lessons` - Create lesson
- `GET /api/v1/lessons/:id` - Get specific lesson

## 🗄️ Database Schema

The application uses a clean PostgreSQL schema with the following main tables:

- **users** - User accounts and profiles
- **daily_topics** - Learning lessons/topics
- **topic_words** - Words associated with lessons
- **user_vocab_words** - User's personal vocabulary
- **sessions** - Learning sessions
- **attempts** - User attempts at questions
- **utterances** - Voice/text interactions
- **corrections** - AI feedback and scoring

## 🔐 Authentication

All protected endpoints require a Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm test            # Run tests
npm run migrate     # Run database migrations
```

### Frontend Development
```bash
cd frontend
npm start           # Start React development server
npm test           # Run tests
npm run build      # Build for production
```

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://lexi_user:lexi_password@localhost:5432/lexi_learn
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3001
NODE_ENV=development
```

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use production PostgreSQL database
3. Set secure JWT secrets
4. Configure CORS origins
5. Use reverse proxy (nginx) for SSL

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Performance

- **Database indexing** for fast queries
- **Rate limiting** to prevent abuse
- **Connection pooling** for efficiency
- **Compression** for response optimization

## 🔒 Security

- **Helmet.js** for security headers
- **Input validation** and sanitization
- **SQL injection** prevention
- **Password hashing** with bcrypt
- **JWT token** expiration
- **CORS** configuration

## 🐛 Troubleshooting

### Common Issues

1. **Docker not running**
   - Start Docker Desktop
   - Wait for it to fully start

2. **Port conflicts**
   - Check if ports 3000, 3001, 5432 are free
   - Stop conflicting services

3. **Database connection issues**
   - Ensure PostgreSQL is running
   - Check connection string in .env

4. **Frontend not connecting to backend**
   - Verify backend is running on port 3001
   - Check CORS configuration

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

## 📄 License

This project is licensed under the MIT License.

## 🎉 Getting Started

1. **Clone the repository**
2. **Run `start-project.bat`**
3. **Open http://localhost:3000**
4. **Start learning!**

---

**Happy Learning! 🎓✨**