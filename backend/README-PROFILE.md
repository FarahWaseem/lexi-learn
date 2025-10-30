# 👤 Profile & Settings API Documentation

## Overview
Profile API provides endpoints for managing user profiles, settings, achievements, and account operations.

---

## 🔐 Authentication
All endpoints require Clerk authentication token:

```
Authorization: Bearer YOUR_CLERK_TOKEN
```

---

## 📍 Endpoints

### 1. **GET** `/api/profile`
**Get current user's profile**

#### Response
```json
{
  "ok": true,
  "profile": {
    "id": "uuid",
    "firstName": "Ahmed",
    "lastName": "Ali",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "streakCurrent": 5,
    "streakLongest": 12,
    "lastActive": "2025-10-30",
    "createdAt": "2025-09-15T10:00:00Z",
    "isActive": true,
    "stats": {
      "totalLessons": 15,
      "totalWords": 150,
      "totalMinutes": 240,
      "avgScore": 78.5
    }
  }
}
```

---

### 2. **PUT** `/api/profile`
**Update user profile**

#### Request Body
```json
{
  "firstName": "Ahmed",
  "lastName": "Ali"
}
```

#### Validation Rules
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters

#### Response
```json
{
  "ok": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "uuid",
    "firstName": "Ahmed",
    "lastName": "Ali",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com"
  }
}
```

---

### 3. **GET** `/api/profile/settings`
**Get user settings and preferences**

#### Response
```json
{
  "ok": true,
  "settings": {
    "profile": {
      "firstName": "Ahmed",
      "lastName": "Ali",
      "email": "ahmed@example.com"
    },
    "preferences": {
      "notifications": true,
      "emailNotifications": true,
      "soundEffects": true,
      "darkMode": false
    },
    "account": {
      "isActive": true
    }
  }
}
```

---

### 4. **PUT** `/api/profile/settings`
**Update user settings/preferences**

#### Request Body
```json
{
  "preferences": {
    "notifications": true,
    "emailNotifications": false,
    "soundEffects": true,
    "darkMode": true
  }
}
```

#### Response
```json
{
  "ok": true,
  "message": "Settings updated successfully",
  "settings": {
    "preferences": {
      "notifications": true,
      "emailNotifications": false,
      "soundEffects": true,
      "darkMode": true
    }
  }
}
```

---

### 5. **GET** `/api/profile/achievements`
**Get user achievements and badges**

#### Response
```json
{
  "ok": true,
  "achievements": [
    {
      "id": "first_lesson",
      "title": "First Steps",
      "description": "Complete your first lesson",
      "icon": "🎯",
      "earned": true,
      "earnedAt": null
    },
    {
      "id": "streak_7",
      "title": "Week Warrior",
      "description": "7-day learning streak",
      "icon": "💪",
      "earned": true,
      "earnedAt": null
    },
    {
      "id": "score_90",
      "title": "Perfect Student",
      "description": "Maintain 90+ average score",
      "icon": "💯",
      "earned": true,
      "earnedAt": null
    }
  ],
  "stats": {
    "completedLessons": 15,
    "currentStreak": 7,
    "longestStreak": 12,
    "uniqueWords": 150,
    "avgScore": 92.5
  }
}
```

#### Available Achievements

**Lesson Milestones:**
- 🎯 **First Steps** - Complete first lesson
- 📚 **Dedicated Learner** - Complete 10 lessons
- ⭐ **Halfway Hero** - Complete 30 lessons
- 🏆 **Course Champion** - Complete all 60 lessons

**Streak Achievements:**
- 🔥 **On Fire** - 3-day streak
- 💪 **Week Warrior** - 7-day streak
- 🌟 **Month Master** - 30-day streak

**Score Achievements:**
- 🎓 **High Achiever** - 70+ average score
- 💯 **Perfect Student** - 90+ average score

**Vocabulary Achievements:**
- 📖 **Word Collector** - Learn 50 words
- 🧠 **Vocabulary Master** - Learn 200 words

---

### 6. **GET** `/api/profile/activity`
**Get user activity history**

#### Query Parameters
- `limit` (default: 20) - Number of activities to return

#### Response
```json
{
  "ok": true,
  "activity": [
    {
      "id": "session-uuid",
      "type": "lesson",
      "title": "Daily Routines",
      "dayNumber": 5,
      "level": "A2",
      "status": "completed",
      "score": 85.5,
      "startedAt": "2025-10-30T14:00:00Z",
      "completedAt": "2025-10-30T14:25:00Z"
    }
  ]
}
```

---

### 7. **DELETE** `/api/profile/account`
**Delete user account (soft delete)**

#### Request Body
```json
{
  "confirm": "DELETE"
}
```

#### Response
```json
{
  "ok": true,
  "message": "Account deactivated successfully"
}
```

⚠️ **Note:** This performs a soft delete (sets `is_active = false`). User data is retained but account is deactivated.

---

## 🎨 Frontend Integration

### Profile Page Example
```javascript
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.ok) setProfile(data.profile);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {profile.name}</p>
      <p>Email: {profile.email}</p>
      <p>Streak: {profile.streakCurrent} days 🔥</p>
      <p>Total Lessons: {profile.stats.totalLessons}</p>
      <p>Average Score: {profile.stats.avgScore}%</p>
    </div>
  );
}
```

### Update Profile Example
```javascript
const updateProfile = async (firstName, lastName) => {
  const token = await getToken();
  const response = await fetch('http://localhost:3001/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ firstName, lastName })
  });
  const data = await response.json();
  if (data.ok) {
    console.log('Profile updated!');
    setProfile(data.profile);
  }
};
```

### Settings Page Example
```javascript
export default function SettingsPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/profile/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.ok) setSettings(data.settings);
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newPreferences) => {
    const token = await getToken();
    await fetch('http://localhost:3001/api/profile/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences: newPreferences })
    });
  };

  return (
    <div>
      <h1>Settings</h1>
      {/* Settings form */}
    </div>
  );
}
```

### Achievements Page Example
```javascript
export default function AchievementsPage() {
  const { getToken } = useAuth();
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/profile/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.ok) setAchievements(data.achievements);
    };
    fetchAchievements();
  }, []);

  return (
    <div>
      <h1>Your Achievements</h1>
      {achievements.map(achievement => (
        <div key={achievement.id} className={achievement.earned ? 'earned' : 'locked'}>
          <span className="icon">{achievement.icon}</span>
          <h3>{achievement.title}</h3>
          <p>{achievement.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Use Cases

### Profile Dropdown Integration
```javascript
// ProfileDropdown.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

function ProfileDropdown({ onSettingsClick, onLogoutClick }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSettings = () => {
    navigate('/settings');
    onSettingsClick?.();
  };

  const handleLogout = async () => {
    await signOut();
    onLogoutClick?.();
  };

  return (
    <div className="profile-dropdown">
      <div className="dropdown-item" onClick={handleSettings}>
        <span>⚙️ Settings</span>
      </div>
      <div className="dropdown-item" onClick={handleLogout}>
        <span>🚪 Logout</span>
      </div>
    </div>
  );
}
```

---

## 📊 Data Calculations

### Profile Stats
- **Total Lessons**: Count of completed sessions
- **Total Words**: Unique vocabulary words from completed lessons
- **Total Minutes**: Sum of all session durations
- **Average Score**: Average of all correction scores

### Achievements
Calculated in real-time based on:
- Completed lessons count
- Current and longest streaks
- Average scores
- Unique words learned

---

## 🔧 Custom Hooks

### useProfile Hook
```javascript
// hooks/useProfile.js
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useProfile = () => {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.ok) {
        setProfile(data.profile);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (firstName, lastName) => {
    const token = await getToken();
    const response = await fetch('http://localhost:3001/api/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ firstName, lastName })
    });
    const data = await response.json();
    if (data.ok) {
      setProfile(data.profile);
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  };
};
```

---

## ⚠️ Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "ok": false,
  "error": "First name and last name are required"
}
```

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "ok": false,
  "error": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "Internal server error message"
}
```

---

## 📝 Notes

1. **Soft Delete**: Account deletion is soft delete only - data is retained
2. **Settings Storage**: Currently settings are acknowledged but not persisted (can be extended with a `user_settings` table)
3. **Achievements**: Calculated dynamically based on user statistics
4. **Authentication**: All endpoints require valid Clerk token
5. **User ID**: Extracted automatically from Clerk token

---

## 🚀 Future Enhancements

Potential additions:
- [ ] Upload profile picture
- [ ] Change password
- [ ] Email preferences
- [ ] Privacy settings
- [ ] Export user data (GDPR)
- [ ] Two-factor authentication
- [ ] Social media connections
- [ ] Learning goals and reminders
- [ ] Persistent settings storage

---

## ✅ Summary

The Profile API provides:
- ✅ 7 endpoints for complete profile management
- ✅ User profile with statistics
- ✅ Settings and preferences
- ✅ Achievements system
- ✅ Activity history
- ✅ Account management
- ✅ Clerk authentication
- ✅ Ready for frontend integration

Perfect for building comprehensive profile and settings pages! 🎉

