# 🎓 LexiLearn Backend - Clerk Integration

Backend API للـ LexiLearn مع تكامل Clerk للـ authentication.

## 🔧 التغييرات المطبقة

### ✅ تم إزالة:
- ❌ Custom Authentication (JWT, bcrypt)
- ❌ User registration/login endpoints
- ❌ Whisper AI integration
- ❌ File upload functionality
- ❌ Multer dependencies

### ✅ تم إضافة:
- ✅ Clerk authentication middleware
- ✅ VocabNotebook API endpoints
- ✅ Clean database schema
- ✅ Clerk user ID support

## 🚀 Quick Start

### 1. إعداد Clerk
```bash
# في ملف .env
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

### 2. تشغيل Backend
```bash
cd backend
start.bat
```

## 📚 API Endpoints

### VocabNotebook API (مطابق للـ frontend)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/vocab/notebook` | Get vocabulary notebook | Clerk |
| POST | `/api/v1/vocab/notebook` | Add word to notebook | Clerk |
| PUT | `/api/v1/vocab/notebook/:id` | Update word | Clerk |
| DELETE | `/api/v1/vocab/notebook/:id` | Delete word | Clerk |
| GET | `/api/v1/vocab/notebook/stats` | Get statistics | Clerk |

### Request/Response Examples

#### Get Vocabulary Notebook
```bash
GET /api/v1/vocab/notebook?page=1&limit=10&search=hello&lesson=Lesson 1
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "words": [
      {
        "id": "uuid",
        "lesson": "Lesson 1: Greetings",
        "word": "Hello",
        "translation": "مرحبا",
        "example": "Hello, how are you?",
        "audio_url": null,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "totalWords": 25,
    "uniqueLessons": ["Lesson 1", "Lesson 2"],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

#### Add Word to Notebook
```bash
POST /api/v1/vocab/notebook
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "lesson": "Lesson 1: Greetings",
  "word": "Hello",
  "translation": "مرحبا",
  "example": "Hello, how are you?",
  "audioUrl": "https://example.com/audio.mp3"
}
```

## 🔐 Clerk Integration

### Authentication Flow
1. Frontend يحصل على Clerk token
2. يرسل Token في Authorization header
3. Backend يتحقق من Token مع Clerk
4. يستخرج user ID من Clerk payload

### User Data Structure
```javascript
req.user = {
  id: "clerk_user_id",        // Clerk user ID
  email: "user@example.com",  // User email
  firstName: "John",          // First name
  lastName: "Doe"             // Last name
}
```

## 🗄️ Database Schema

### Updated Tables
- **users**: يستخدم Clerk user ID (VARCHAR)
- **user_vocab_words**: مرتبط بـ Clerk user ID
- **daily_topics**: دروس التعلم
- **topic_words**: كلمات كل درس

## 🧪 Testing

### Test with Postman/Insomnia
```bash
# 1. Get Clerk token from frontend
# 2. Add to Authorization header: Bearer <token>
# 3. Test endpoints
```

### Health Check
```bash
GET http://localhost:3001/health
```

## 📊 Frontend Integration

الـ API مصمم ليعمل مع `VocabsNotebook.jsx`:

```javascript
// Frontend API calls
const API_BASE = 'http://localhost:3001/api/v1';

// Get vocabulary notebook
const response = await fetch(`${API_BASE}/vocab/notebook`, {
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  }
});

// Add new word
const addWord = async (wordData) => {
  const response = await fetch(`${API_BASE}/vocab/notebook`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(wordData)
  });
  return response.json();
};
```

## 🎯 Ready for Frontend

الـ backend جاهز للعمل مع:
- ✅ Clerk authentication
- ✅ VocabsNotebook component
- ✅ Search & filtering
- ✅ Pagination
- ✅ CRUD operations

## 🚀 Next Steps

1. **Setup Clerk** في الـ frontend
2. **Connect API** مع VocabsNotebook
3. **Test integration** بين Frontend و Backend
4. **Deploy** للمنتج

---

**Backend جاهز للعمل مع Clerk! 🎉**
