# 👤 Profile & Settings API - Complete Summary

## ✅ What We Built

Created a **complete Profile & Settings API** for user account management!

---

## 📁 Files Created (3 files)

### 1. **Controller** (430 lines)
```
backend/src/controllers/profileController.js
```
Contains 7 main functions:
- `getProfile()` - Get user profile with stats
- `updateProfile()` - Update name
- `getSettings()` - Get user settings
- `updateSettings()` - Update preferences
- `getAchievements()` - Get badges & achievements
- `getActivity()` - Get activity history
- `deleteAccount()` - Soft delete account

### 2. **Routes** (55 lines)
```
backend/src/routes/profile.js
```
Defines 7 endpoints with authentication

### 3. **Documentation** (500+ lines)
```
backend/README-PROFILE.md
```
Complete API documentation with examples

### 4. **Test File**
```
backend/test-profile.http
```
Ready-to-use test cases

---

## 🚀 Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/profile` | Get user profile + stats |
| PUT | `/api/profile` | Update profile name |
| GET | `/api/profile/settings` | Get settings |
| PUT | `/api/profile/settings` | Update settings |
| GET | `/api/profile/achievements` | Get achievements |
| GET | `/api/profile/activity` | Get activity history |
| DELETE | `/api/profile/account` | Delete account |

---

## 📊 What Each Endpoint Does

### 1. GET `/api/profile`
Returns complete user profile with:
- ✅ Basic info (name, email)
- ✅ Streak data (current, longest)
- ✅ Account status
- ✅ **Statistics:**
  - Total completed lessons
  - Total unique words learned
  - Total practice time (minutes)
  - Average score

**Example Response:**
```json
{
  "profile": {
    "firstName": "Ahmed",
    "lastName": "Ali",
    "email": "ahmed@example.com",
    "streakCurrent": 5,
    "streakLongest": 12,
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

### 2. PUT `/api/profile`
Update user's first and last name

**Request:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Ali"
}
```

**Validation:**
- Both fields required
- 2-50 characters each
- Trimmed automatically

---

### 3. GET `/api/profile/settings`
Get user settings and preferences

**Returns:**
```json
{
  "settings": {
    "profile": { ... },
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

### 4. PUT `/api/profile/settings`
Update user preferences

**Request:**
```json
{
  "preferences": {
    "notifications": true,
    "darkMode": true
  }
}
```

---

### 5. GET `/api/profile/achievements`
Get earned achievements and badges

**Returns:**
```json
{
  "achievements": [
    {
      "id": "first_lesson",
      "title": "First Steps",
      "description": "Complete your first lesson",
      "icon": "🎯",
      "earned": true
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

**Available Achievements:**

**Lesson Milestones:**
- 🎯 First Steps (1 lesson)
- 📚 Dedicated Learner (10 lessons)
- ⭐ Halfway Hero (30 lessons)
- 🏆 Course Champion (60 lessons)

**Streak Achievements:**
- 🔥 On Fire (3 days)
- 💪 Week Warrior (7 days)
- 🌟 Month Master (30 days)

**Score Achievements:**
- 🎓 High Achiever (70+ avg)
- 💯 Perfect Student (90+ avg)

**Vocabulary:**
- 📖 Word Collector (50 words)
- 🧠 Vocabulary Master (200 words)

---

### 6. GET `/api/profile/activity`
Get user's activity history

**Query:** `?limit=20` (default)

**Returns:**
```json
{
  "activity": [
    {
      "id": "uuid",
      "type": "lesson",
      "title": "Daily Routines",
      "dayNumber": 5,
      "level": "A2",
      "status": "completed",
      "score": 85.5,
      "startedAt": "...",
      "completedAt": "..."
    }
  ]
}
```

---

### 7. DELETE `/api/profile/account`
Soft delete user account

**Request:**
```json
{
  "confirm": "DELETE"
}
```

⚠️ **Note:** Soft delete only - sets `is_active = false`

---

## 🎨 Frontend Integration

### Profile Page Example
```javascript
import { useAuth } from '@clerk/clerk-react';

export default function ProfilePage() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.ok) setProfile(data.profile);
    };
    fetchProfile();
  }, []);

  return (
    <div className="profile-page">
      <h1>{profile.name}</h1>
      <p>Email: {profile.email}</p>
      <p>Streak: {profile.streakCurrent} days 🔥</p>
      
      <div className="stats">
        <div>📚 {profile.stats.totalLessons} Lessons</div>
        <div>📖 {profile.stats.totalWords} Words</div>
        <div>⏱️ {profile.stats.totalMinutes} Minutes</div>
        <div>⭐ {profile.stats.avgScore}% Avg Score</div>
      </div>
    </div>
  );
}
```

---

### Settings Page Example
```javascript
export default function SettingsPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState(null);

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
    <div className="settings-page">
      <h1>Settings</h1>
      
      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings?.preferences.notifications}
            onChange={(e) => updateSettings({ 
              ...settings.preferences, 
              notifications: e.target.checked 
            })}
          />
          Enable Notifications
        </label>
      </div>

      <div className="setting-item">
        <label>
          <input 
            type="checkbox" 
            checked={settings?.preferences.darkMode}
            onChange={(e) => updateSettings({ 
              ...settings.preferences, 
              darkMode: e.target.checked 
            })}
          />
          Dark Mode
        </label>
      </div>
    </div>
  );
}
```

---

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
    <div className="achievements-page">
      <h1>Your Achievements</h1>
      
      <div className="achievements-grid">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`achievement ${achievement.earned ? 'earned' : 'locked'}`}
          >
            <div className="icon">{achievement.icon}</div>
            <h3>{achievement.title}</h3>
            <p>{achievement.description}</p>
            {achievement.earned && <span className="badge">✓ Earned</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### ProfileDropdown Integration
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
    navigate('/login');
    onLogoutClick?.();
  };

  return (
    <div className="profile-dropdown">
      <div className="dropdown-item active" onClick={handleSettings}>
        <div className="icon-wrapper green">
          <img src="/assets/icons/setting-2.svg" alt="Settings" />
        </div>
        <span>Settings</span>
      </div>

      <div className="dropdown-item red" onClick={handleLogout}>
        <div className="icon-wrapper red-bg">
          <img src="/assets/icons/Logout icon.svg" alt="Logout" />
        </div>
        <span>Logout</span>
      </div>
    </div>
  );
}
```

---

## 🎯 Use Cases

### 1. Profile Page
- Display user info
- Show learning stats
- Display achievements
- Edit profile name

### 2. Settings Page
- Update preferences
- Toggle notifications
- Toggle dark mode
- Sound settings

### 3. Achievements Page
- Display all achievements
- Show earned badges
- Display progress stats
- Motivate users

### 4. Activity Page
- Show learning history
- Display recent lessons
- Show scores
- Track progress over time

---

## 🔧 Custom Hook Example

```javascript
// hooks/useProfile.js
export const useProfile = () => {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.ok) setProfile(data.profile);
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

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
};
```

**Usage:**
```javascript
const { profile, loading, updateProfile } = useProfile();

if (loading) return <div>Loading...</div>;

return (
  <div>
    <h1>{profile.name}</h1>
    <button onClick={() => updateProfile('New', 'Name')}>
      Update Name
    </button>
  </div>
);
```

---

## 🧪 Testing

### 1. Start Backend:
```bash
cd backend
npm start
```

### 2. Test with REST Client:
Open `test-profile.http` in VS Code and add your Clerk token

### 3. Test Endpoints:
```bash
# Get profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/profile

# Update profile
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ahmed","lastName":"Ali"}' \
  http://localhost:3001/api/profile
```

---

## ✅ Features

### ✅ Complete Profile Management
- Get profile with statistics
- Update profile name
- View achievements
- Activity history

### ✅ Settings & Preferences
- Get settings
- Update preferences
- Notifications control
- Dark mode toggle

### ✅ Achievements System
- 12 different achievements
- Dynamic calculation
- Icon-based badges
- Progress tracking

### ✅ Security
- Clerk authentication required
- User ID auto-extracted from token
- Input validation
- Soft delete only

---

## 📈 Statistics Calculated

All stats calculated in real-time from database:

1. **Total Lessons**: Completed sessions count
2. **Total Words**: Unique vocabulary from completed lessons
3. **Total Minutes**: Sum of session durations
4. **Average Score**: Average of all correction scores
5. **Current Streak**: Consecutive days with activity
6. **Longest Streak**: Maximum consecutive days ever

---

## 🎊 Summary

### Endpoints: 7
- ✅ Get profile
- ✅ Update profile
- ✅ Get settings
- ✅ Update settings
- ✅ Get achievements
- ✅ Get activity
- ✅ Delete account

### Features:
- ✅ Full profile management
- ✅ Settings & preferences
- ✅ 12 achievements/badges
- ✅ Activity history
- ✅ Real-time stats
- ✅ Soft delete
- ✅ Input validation
- ✅ Error handling

### Documentation:
- ✅ Complete API docs
- ✅ Test file
- ✅ Frontend examples
- ✅ Custom hooks
- ✅ Integration guide

---

## 🚀 Next Steps

### For Frontend:
1. Create Profile page
2. Create Settings page
3. Create Achievements page
4. Create Activity page
5. Integrate ProfileDropdown
6. Add custom hooks

### For Backend (Future):
1. Add profile picture upload
2. Create `user_settings` table for persistent preferences
3. Add password change
4. Add email verification
5. Add two-factor authentication
6. Add data export (GDPR)

---

**The Profile & Settings API is complete and ready to use! 🎉**

Perfect for building comprehensive user profile, settings, and achievements pages!

