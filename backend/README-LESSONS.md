# 🎓 Lessons API - LexiLearn Backend

API للدروس متوافق مع واجهة `Lessons.jsx` في الـ frontend.

## 🚀 Quick Start

### 1. تشغيل Backend
```bash
cd backend
start.bat
```

### 2. إضافة البيانات التجريبية
```bash
npm run seed:lessons
```

## 📚 API Endpoints

### Lessons UI API (مطابق للواجهة)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/lessons/ui` | Get all lessons for UI | Clerk |
| GET | `/api/v1/lessons/ui/:id` | Get lesson details | Clerk |
| POST | `/api/v1/lessons/ui/:id/start` | Start lesson session | Clerk |
| POST | `/api/v1/lessons/ui/:id/complete` | Complete lesson | Clerk |
| GET | `/api/v1/lessons/ui/stats` | Get lesson statistics | Clerk |

## 📊 Response Examples

### Get Lessons for UI
```bash
GET /api/v1/lessons/ui?page=1&limit=10&search=shopping&lesson=Shopping
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": 1,
        "title": "Shopping",
        "description": "Learn basic shopping vocabulary and phrases...",
        "status": "new",
        "level": "A1",
        "estimatedMinutes": 15,
        "audioUrl": null,
        "dayNumber": 1,
        "completedQuestions": 0,
        "avgScore": 0,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalLessons": 10,
    "uniqueLessons": ["Shopping", "Food & Cooking", "Travel"],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 10,
      "itemsPerPage": 10
    }
  }
}
```

### Get Lesson Details
```bash
GET /api/v1/lessons/ui/1
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "dayNumber": 1,
    "title": "Shopping",
    "description": "Learn basic shopping vocabulary...",
    "level": "A1",
    "estimatedMinutes": 15,
    "audioUrl": null,
    "words": [
      {
        "id": 1,
        "term": "market",
        "meaning": "سوق",
        "example": "I go to the market every Saturday."
      }
    ],
    "questions": [
      {
        "id": 1,
        "question_idx": 1,
        "prompt_en": "What would you say when you want to buy something?",
        "answer_type": "voice"
      }
    ],
    "progress": {
      "status": "new",
      "completedQuestions": 0,
      "avgScore": 0,
      "startedAt": null,
      "completedAt": null
    }
  }
}
```

### Start Lesson Session
```bash
POST /api/v1/lessons/ui/1/start
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "success": true,
  "message": "Lesson session started",
  "data": {
    "sessionId": "uuid",
    "status": "active"
  }
}
```

### Complete Lesson
```bash
POST /api/v1/lessons/ui/1/complete
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "success": true,
  "message": "Lesson completed successfully"
}
```

### Get Lesson Statistics
```bash
GET /api/v1/lessons/ui/stats
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalLessonsStarted": 5,
    "completedLessons": 2,
    "activeLessons": 1,
    "avgScore": 85.5,
    "activeDays": 3
  }
}
```

## 🎯 Frontend Integration

### React Component Usage
```javascript
// في Lessons.jsx
const API_BASE = 'http://localhost:3001/api/v1';

// جلب الدروس
const fetchLessons = async () => {
  const response = await fetch(`${API_BASE}/lessons/ui`, {
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// بدء درس
const startLesson = async (lessonId) => {
  const response = await fetch(`${API_BASE}/lessons/ui/${lessonId}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

## 📊 Sample Data

البيانات التجريبية تشمل:
- **10 دروس** مختلفة (Shopping, Food, Travel, etc.)
- **80 كلمة** مفردات
- **60 سؤال** تدريبي
- **مستويات مختلفة** (A1, A2, B1)

## 🔧 Database Schema

### Tables Used:
- **daily_topics** - الدروس الأساسية
- **topic_words** - كلمات كل درس
- **topic_questions** - أسئلة كل درس
- **sessions** - جلسات المستخدمين
- **attempts** - محاولات الإجابة
- **corrections** - تقييم الذكاء الصناعي

## 🚀 Status Mapping

| Database Status | UI Status | Description |
|----------------|-----------|-------------|
| `new` | `new` | درس جديد لم يبدأ |
| `active` | `in_progress` | درس قيد التقدم |
| `completed` | `completed` | درس مكتمل |

## 🎉 Ready for Frontend!

الـ API جاهز للعمل مع:
- ✅ Lessons.jsx component
- ✅ Search & filtering
- ✅ Pagination
- ✅ Lesson progress tracking
- ✅ Clerk authentication
- ✅ Sample data included

---

**Lessons API جاهز للعمل! 🎓✨**
