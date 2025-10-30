# 📊 Dashboard API Documentation

## Overview
توفر Dashboard API إحصائيات شاملة لواجهة إدارة LexiLearn. جميع الـ endpoints محمية بـ Clerk Authentication.

---

## 🔐 Authentication
جميع الـ endpoints تتطلب Clerk authentication token في الـ headers:

```
Authorization: Bearer YOUR_CLERK_TOKEN
```

---

## 📍 Endpoints

### 1. **GET** `/api/dashboard/stats`
**إحصائيات عامة للنظام**

#### Response
```json
{
  "ok": true,
  "stats": {
    "users": {
      "total_users": 150,
      "active_users": 120,
      "active_last_7_days": 45,
      "active_last_30_days": 98,
      "new_users_7_days": 12,
      "new_users_30_days": 35
    },
    "sessions": {
      "total_sessions": 450,
      "completed_sessions": 380,
      "active_sessions": 15,
      "abandoned_sessions": 55,
      "sessions_last_7_days": 89,
      "sessions_last_30_days": 290,
      "completion_rate": 84.44
    },
    "performance": {
      "avg_overall_score": 75.5,
      "avg_fluency_score": 72.3,
      "avg_grammar_score": 76.8,
      "avg_vocab_score": 77.4,
      "max_score": 98,
      "min_score": 32
    },
    "attempts": {
      "total_attempts": 2700,
      "unique_sessions": 450,
      "unique_questions": 360,
      "avg_attempts_per_session": 6.0
    },
    "topics": {
      "total_topics": 60,
      "topics_started": 48,
      "topics_completed": 42
    },
    "dailyActivity": [
      {
        "date": "2025-10-30",
        "sessions_count": 15,
        "unique_users": 12
      }
    ]
  }
}
```

---

### 2. **GET** `/api/dashboard/users`
**قائمة المستخدمين مع إحصائياتهم**

#### Query Parameters
- `page` (default: 1) - رقم الصفحة
- `limit` (default: 20) - عدد النتائج
- `search` (optional) - البحث في الاسم أو البريد
- `sortBy` (default: created_at) - الترتيب حسب: created_at, last_active, streak_current, total_sessions, avg_score
- `sortOrder` (default: DESC) - ASC أو DESC

#### Example Request
```
GET /api/dashboard/users?page=1&limit=20&search=john&sortBy=avg_score&sortOrder=DESC
```

#### Response
```json
{
  "ok": true,
  "users": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "streak_current": 5,
      "streak_longest": 12,
      "last_active": "2025-10-30",
      "created_at": "2025-09-15T10:00:00Z",
      "is_active": true,
      "total_sessions": 25,
      "completed_sessions": 22,
      "avg_score": 78.5,
      "last_session_at": "2025-10-30T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 3. **GET** `/api/dashboard/users/:id`
**تفاصيل مستخدم محدد مع كامل إحصائياته**

#### Response
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "total_sessions": 25,
    "completed_sessions": 22,
    "active_sessions": 1,
    "abandoned_sessions": 2
  },
  "performance": {
    "avg_overall_score": 78.5,
    "avg_fluency_score": 76.2,
    "avg_grammar_score": 79.8,
    "avg_vocab_score": 79.5,
    "max_score": 95,
    "min_score": 55,
    "total_corrections": 132
  },
  "recentSessions": [
    {
      "id": "uuid",
      "started_at": "2025-10-30T14:00:00Z",
      "completed_at": "2025-10-30T14:25:00Z",
      "status": "completed",
      "topic_title": "Daily Routines",
      "day_number": 5,
      "level": "A2",
      "avg_score": 82.0
    }
  ],
  "progress": [
    {
      "date": "2025-10-30",
      "sessions_count": 2,
      "avg_score": 80.5
    }
  ],
  "completedTopics": [
    {
      "day_number": 1,
      "title_en": "Greetings",
      "level": "A1",
      "completed_at": "2025-09-20T15:00:00Z",
      "avg_score": 75.0
    }
  ]
}
```

---

### 4. **GET** `/api/dashboard/sessions`
**قائمة الجلسات مع تفاصيلها**

#### Query Parameters
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional) - active, completed, abandoned
- `userId` (optional) - فلترة حسب مستخدم محدد
- `sortBy` (default: started_at) - started_at, completed_at, avg_score, status
- `sortOrder` (default: DESC)

#### Example Request
```
GET /api/dashboard/sessions?status=completed&page=1&limit=20
```

#### Response
```json
{
  "ok": true,
  "sessions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "started_at": "2025-10-30T14:00:00Z",
      "completed_at": "2025-10-30T14:25:00Z",
      "status": "completed",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "topic_title": "Daily Routines",
      "day_number": 5,
      "level": "A2",
      "total_attempts": 6,
      "avg_score": 82.0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 450,
    "totalPages": 23
  }
}
```

---

### 5. **GET** `/api/dashboard/topics`
**إحصائيات الدروس**

#### Response
```json
{
  "ok": true,
  "topics": [
    {
      "id": 1,
      "day_number": 1,
      "title_en": "Greetings",
      "level": "A1",
      "estimated_minutes": 10,
      "total_sessions": 45,
      "completed_sessions": 40,
      "unique_users": 38,
      "avg_score": 75.5,
      "completion_rate": 88.89
    }
  ],
  "levelStats": [
    {
      "level": "A1",
      "total_topics": 15,
      "total_sessions": 180,
      "completed_sessions": 160,
      "avg_score": 74.2
    }
  ]
}
```

---

### 6. **GET** `/api/dashboard/analytics`
**تحليلات متقدمة**

#### Query Parameters
- `period` (default: 30) - عدد الأيام للتحليل

#### Response
```json
{
  "ok": true,
  "analytics": {
    "dailyActivity": [
      {
        "date": "2025-10-30",
        "sessions": 15,
        "unique_users": 12,
        "completed": 13,
        "avg_score": 78.5
      }
    ],
    "scoreDistribution": [
      {
        "score_range": "90-100",
        "count": 45,
        "percentage": 15.5
      }
    ],
    "topUsers": [
      {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "total_sessions": 25,
        "completed_sessions": 22,
        "avg_score": 85.5,
        "streak_current": 5
      }
    ],
    "completionByLevel": [
      {
        "level": "A1",
        "total_sessions": 180,
        "completed_sessions": 160,
        "completion_rate": 88.89
      }
    ],
    "weeklyGrowth": [
      {
        "week": "2025-10-21",
        "sessions": 89,
        "unique_users": 45
      }
    ]
  }
}
```

---

### 7. **GET** `/api/dashboard/recent-activity`
**النشاط الأخير في النظام**

#### Query Parameters
- `limit` (default: 20)

#### Response
```json
{
  "ok": true,
  "activity": [
    {
      "type": "session",
      "id": "uuid",
      "timestamp": "2025-10-30T14:30:00Z",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "topic_title": "Daily Routines",
      "day_number": 5,
      "status": "completed"
    }
  ]
}
```

---

## 🔧 Dashboard Service Functions

يمكن استخدام Dashboard Service للحصول على بيانات إضافية:

### `getComparisonStats(currentPeriod, previousPeriod)`
مقارنة الإحصائيات بين فترتين

### `getCommonErrors(limit)`
الأخطاء الشائعة في التصحيحات

### `getLeaderboard(metric, limit)`
لوحة المتصدرين (حسب score, sessions, أو streak)

### `getUserDistributionByLevel()`
توزيع المستخدمين حسب المستوى

### `getAverageCompletionTime()`
متوسط الوقت لإكمال كل درس

### `getRetentionRate()`
معدل الاحتفاظ بالمستخدمين

### `getTopicsNeedingImprovement(limit)`
الدروس التي تحتاج تحسين

### `exportUserData(userId)`
تصدير بيانات المستخدم (GDPR Compliance)

---

## 📊 استخدام الـ Service Functions

```javascript
const dashboardService = require('./services/dashboardService');

// مثال: جلب لوحة المتصدرين
const leaderboard = await dashboardService.getLeaderboard('score', 10);

// مثال: مقارنة الإحصائيات
const comparison = await dashboardService.getComparisonStats(7, 7);

// مثال: معدل الاحتفاظ
const retention = await dashboardService.getRetentionRate();
```

---

## 🚀 Next Steps

لإضافة وظائف إضافية للدشبورد، يمكنك:

1. **إضافة Admin Middleware**: للتحقق من صلاحيات الأدمن
2. **إضافة Caching**: لتحسين الأداء (Redis)
3. **إضافة Real-time Updates**: باستخدام WebSockets
4. **إضافة Export Features**: تصدير التقارير بصيغة PDF/Excel
5. **إضافة Notifications**: إشعارات للأحداث المهمة

---

## 📝 Notes

- جميع الـ endpoints محمية بـ Clerk Authentication
- يُنصح بإضافة Caching للـ stats endpoint لتحسين الأداء
- يمكن إضافة middleware للتحقق من صلاحيات الأدمن
- الـ pagination يبدأ من page=1

---

## 🐛 Error Handling

جميع الـ endpoints ترجع أخطاء بصيغة موحدة:

```json
{
  "ok": false,
  "error": "Error message here"
}
```

Status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

