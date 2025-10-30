# 📚 Student Dashboard API Documentation

## Overview
Student Dashboard API provides personalized data for each student's dashboard, matching the frontend `Dashboard.jsx` component.

---

## 🔐 Authentication
All endpoints require Clerk authentication token:

```
Authorization: Bearer YOUR_CLERK_TOKEN
```

The API automatically extracts the user ID from the token.

---

## 📍 Endpoints

### 1. **GET** `/api/student/dashboard`
**Get all dashboard data in one request** (Recommended for initial load)

#### Response Structure
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "firstName": "Ahmed",
    "lastName": "Ali",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "streakDays": 5,
    "streakLongest": 12,
    "lastActive": "2025-10-30"
  },
  "stats": {
    "newWords": 50,
    "completedLessons": 4,
    "totalTime": 100,
    "goalProgress": 7
  },
  "lessons": [
    {
      "id": "session-uuid",
      "dayNumber": 3,
      "title": "Talking about family",
      "desc": "Learn family member names",
      "level": "A1",
      "completedAt": "2025-10-30T14:25:00Z",
      "avgScore": 82.5,
      "vocabs": []
    }
  ],
  "vocabs": [
    {
      "en": "father",
      "ar": "أب",
      "audio_url": null
    }
  ],
  "practiceHistory": [
    { "day": "Sat", "minutes": 10 },
    { "day": "Sun", "minutes": 20 },
    { "day": "Mon", "minutes": 15 }
  ],
  "nextLesson": {
    "id": 5,
    "dayNumber": 5,
    "title": "Daily Routines",
    "desc": "Learn about daily activities",
    "level": "A2"
  }
}
```

#### Frontend Usage
```javascript
// In Dashboard.jsx
useEffect(() => {
  const fetchDashboardData = async () => {
    const response = await fetch('http://localhost:3001/api/student/dashboard', {
      headers: {
        'Authorization': `Bearer ${clerkToken}`
      }
    });
    const data = await response.json();
    
    if (data.ok) {
      setUser(data.user);
      setStats(data.stats);
      setLessons(data.lessons);
      setVocabs(data.vocabs);
      setPracticeHistory(data.practiceHistory);
      setNextLesson(data.nextLesson);
    }
  };

  fetchDashboardData();
}, []);
```

---

### 2. **GET** `/api/student/stats`
**Get only header statistics** (Lighter request)

#### Response
```json
{
  "ok": true,
  "user": {
    "name": "Ahmed Ali",
    "streakDays": 5
  },
  "stats": {
    "newWords": 50,
    "completedLessons": 4,
    "totalTime": 100,
    "goalProgress": 7
  }
}
```

#### Maps to: `HeaderStats.jsx`
- `stats.newWords` → "New Words"
- `stats.completedLessons` → "Completed Lessons"
- `stats.totalTime` → "Total Practice Time"
- `stats.goalProgress` → CircularProgressbar value

---

### 3. **GET** `/api/student/recent-lessons`
**Get recent completed lessons**

#### Query Parameters
- `limit` (default: 3) - Number of lessons to return

#### Response
```json
{
  "ok": true,
  "lessons": [
    {
      "id": "session-uuid",
      "dayNumber": 3,
      "title": "Lesson 3",
      "desc": "Talking about family",
      "vocabs": [
        { "en": "father", "ar": "أب" },
        { "en": "mother", "ar": "أم" },
        { "en": "brother", "ar": "أخ" }
      ]
    }
  ]
}
```

#### Maps to: `RecentLessons.jsx`
```javascript
<RecentLessons lessons={data.lessons} />
```

---

### 4. **GET** `/api/student/practice-history`
**Get practice history for the chart**

#### Query Parameters
- `days` (default: 7) - Number of days to include

#### Response
```json
{
  "ok": true,
  "practiceHistory": [
    { "day": "Sat", "date": "2025-10-26", "minutes": 10 },
    { "day": "Sun", "date": "2025-10-27", "minutes": 20 },
    { "day": "Mon", "date": "2025-10-28", "minutes": 15 },
    { "day": "Tue", "date": "2025-10-29", "minutes": 25 },
    { "day": "Wed", "date": "2025-10-30", "minutes": 60 }
  ]
}
```

#### Maps to: `PracticeHistory.jsx`
```javascript
<PracticeHistory data={data.practiceHistory} />
```

---

### 5. **GET** `/api/student/next-lesson`
**Get the next lesson to study**

#### Response
```json
{
  "ok": true,
  "nextLesson": {
    "id": 5,
    "dayNumber": 5,
    "title": "Daily Routines",
    "desc": "Learn about daily activities",
    "level": "A2",
    "estimatedMinutes": 10
  }
}
```

Or if all lessons are completed:
```json
{
  "ok": true,
  "nextLesson": null,
  "message": "Congratulations! You have completed all lessons!"
}
```

#### Maps to: `NextLessonCard.jsx`

---

## 🎨 Frontend Integration Example

### Complete Dashboard Component
```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await getToken();
        const response = await fetch('http://localhost:3001/api/student/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (data.ok) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!dashboardData) return <div>Error loading dashboard</div>;

  return (
    <div className="dashboard">
      <HeaderStats 
        user={dashboardData.user} 
        stats={dashboardData.stats} 
      />
      
      <NextLessonCard 
        nextLesson={dashboardData.nextLesson} 
      />
      
      <RecentLessons 
        lessons={dashboardData.lessons} 
      />
      
      <LastVocabs 
        vocabs={dashboardData.vocabs} 
      />
      
      <PracticeHistory 
        data={dashboardData.practiceHistory} 
      />
      
      <StreakCard 
        streakDays={dashboardData.user.streakDays} 
      />
    </div>
  );
}
```

---

## 📊 Data Calculations

### New Words Count
Counts unique vocabulary words from sessions in the last 30 days.

### Completed Lessons
Total number of sessions with `status = 'completed'`.

### Total Practice Time
Sum of all session durations (completed_at - started_at) in minutes.

### Goal Progress
Percentage based on 60 total lessons: `(completedLessons / 60) * 100`

### Practice History
Groups sessions by day and sums the practice time. Returns last 7 days with day names (Sat, Sun, Mon, etc.).

### Recent Lessons
Returns last 3 completed sessions ordered by completion date.

### Last Vocabs
Returns up to 8 vocabulary words from the most recent completed sessions.

### Next Lesson
Returns the first daily_topics record that hasn't been completed yet, ordered by day_number.

---

## 🔄 Differences from Admin Dashboard

| Feature | Student Dashboard | Admin Dashboard |
|---------|-------------------|-----------------|
| **Purpose** | Personal progress | System overview |
| **Scope** | Single user (from token) | All users |
| **Routes** | `/api/student/*` | `/api/dashboard/*` |
| **Auth** | Automatic from token | Manual userId |
| **Data** | Personalized | Aggregated |

---

## 🧪 Testing

### Using REST Client (test file below)
```http
GET http://localhost:3001/api/student/dashboard
Authorization: Bearer YOUR_CLERK_TOKEN
```

### Using curl
```bash
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:3001/api/student/dashboard
```

### Using JavaScript/Fetch
```javascript
const token = await getToken();
const response = await fetch('http://localhost:3001/api/student/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

---

## ⚠️ Important Notes

1. **Authentication Required**: All endpoints require valid Clerk token
2. **Automatic User ID**: User ID is extracted from token, no need to pass it
3. **Empty States**: All endpoints handle cases where user has no data
4. **Performance**: The main `/dashboard` endpoint makes multiple queries - consider caching
5. **Day Names**: Practice history returns day names in English (Sat, Sun, Mon...)

---

## 🚀 Performance Tips

1. **Use `/dashboard` for initial load** - Gets all data in one request
2. **Use specific endpoints for updates** - e.g., only fetch stats when needed
3. **Add caching** - Consider adding Redis cache for frequently accessed data
4. **Lazy load vocabs** - Vocabs in recent lessons can be loaded separately if needed

---

## 📝 Migration from Mock Data

### Before (using mock data):
```javascript
import { dashboardMockData } from "../../data/dashboardMockData";

export default function Dashboard() {
  const { lessons, practiceHistory, user } = dashboardMockData;
  // ...
}
```

### After (using API):
```javascript
import { useAuth } from '@clerk/clerk-react';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/student/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result);
    };
    fetchData();
  }, []);

  if (!data) return <div>Loading...</div>;

  const { lessons, practiceHistory, user } = data;
  // ... rest of component stays the same
}
```

---

## ✅ Complete Mapping

| Frontend Component | Data Source | API Endpoint |
|-------------------|-------------|--------------|
| `HeaderStats` | `user`, `stats` | `/api/student/stats` |
| `NextLessonCard` | `nextLesson` | `/api/student/next-lesson` |
| `RecentLessons` | `lessons` | `/api/student/recent-lessons` |
| `LastVocabs` | `vocabs` | Main dashboard (vocabs) |
| `PracticeHistory` | `practiceHistory` | `/api/student/practice-history` |
| `StreakCard` | `user.streakDays` | `/api/student/stats` |

---

## 🎯 Summary

The Student Dashboard API is now **fully aligned** with your frontend `Dashboard.jsx`:

✅ Same data structure  
✅ Same field names  
✅ Ready to replace mock data  
✅ All components covered  
✅ Authentication handled  
✅ Optimized queries  

Just replace the mock data imports with API calls and you're good to go! 🚀

