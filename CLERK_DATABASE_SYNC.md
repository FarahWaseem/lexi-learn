# Clerk & Database Synchronization Guide

## 📋 Overview

هذا الدليل يشرح كيف ربطنا **Clerk (Authentication)** مع **قاعدة البيانات (PostgreSQL)** في مشروع LexiLearn.

---

## 🎯 المشكلة

قبل الربط كان عندنا **نظامين منفصلين**:

1. **Clerk**: بيدير تسجيل الدخول والمستخدمين
2. **Database**: فيها جدول `users` لكن **فاضي**

### المشكلة الأساسية:
- User يسجل دخول عن طريق Clerk ✅
- بيكون عنده ID في Clerk ✅
- لكن **مافي record** في database تبعنا ❌
- فبالتالي ما نقدر نربط User بـ lessons, vocabs, progress ❌

---

## ✅ الحل: Auto-Sync Middleware

أنشأنا **middleware** اسمه `ensureUserExists` بيعمل:

1. كل ما user يدخل على أي endpoint محمي
2. بيفحص إذا موجود في جدول `users`
3. إذا **مش موجود** → بينشئه تلقائياً
4. إذا **موجود** → بيحدث `last_active`

---

## 🔧 الملفات المعدلة

### 1. Backend Middleware

#### ✅ `backend/src/middleware/ensureUserExists.js` (NEW)
```javascript
// Syncs Clerk users with our database
// Creates user record if doesn't exist
// Updates last_active if exists
```

**الوظيفة:**
- يفحص إذا User موجود في database
- إذا مش موجود، بينشئ record جديد
- بياخد البيانات من Clerk (id, firstName, lastName, email)
- بينشئ كمان record في جدول `progress`

#### ✅ `backend/src/routes/dashboardRoutes.js` (Modified)
```javascript
router.use(authenticateClerk);    // ✅ Authentication
router.use(ensureUserExists);     // ✅ Database Sync (NEW)
```

#### ✅ `backend/src/routes/vocabRoutes.js` (Modified)
```javascript
router.use(authenticateClerk);
router.use(ensureUserExists);     // Added
```

#### ✅ `backend/src/routes/lessonRoutes.js` (Modified)
```javascript
router.use(authenticateClerk);
router.use(ensureUserExists);     // Added
```

---

### 2. Frontend Integration

#### ✅ `frontend/src/main.jsx` (Modified)
```javascript
import { ClerkProvider } from '@clerk/clerk-react'

<ClerkProvider publishableKey={clerkPubKey}>
  <App />
</ClerkProvider>
```

#### ✅ `frontend/src/pages/Dashboard/Dashboard.jsx` (Modified)
```javascript
import { useAuth } from "@clerk/clerk-react";

const { isLoaded, isSignedIn } = useAuth();
const { ...dashboardData } = useDashboard(isSignedIn);
```

#### ✅ `frontend/src/services/DashboardService.js` (Modified)
```javascript
const getAuthToken = async () => {
  const token = await window.Clerk.session.getToken();
  return token;
};
```

---

## 📊 Database Schema

### جدول `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,              -- نفس الـ ID من Clerk
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,      -- 'clerk_managed' للـ Clerk users
  streak_current SMALLINT DEFAULT 0,
  streak_longest SMALLINT DEFAULT 0,
  last_active DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### جدول `progress`

```sql
CREATE TABLE progress (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  completed_lessons SMALLINT DEFAULT 0,
  avg_score NUMERIC(5,2) DEFAULT 0,
  total_active_days SMALLINT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 How It Works (Flow)

### 1️⃣ User Registration (New User)

```
User Signs Up via Clerk
       ↓
Clerk creates user account
       ↓
User gets Clerk ID (e.g., user_abc123)
       ↓
User redirected to Dashboard
       ↓
Dashboard calls /api/v1/dashboard
       ↓
authenticateClerk middleware validates token ✅
       ↓
ensureUserExists middleware checks database
       ↓
User NOT found in database ❌
       ↓
CREATE new user record with Clerk ID
CREATE progress record
       ↓
Continue to dashboardController ✅
       ↓
Return dashboard data
```

### 2️⃣ Returning User (Existing User)

```
User Signs In via Clerk
       ↓
Clerk validates credentials ✅
       ↓
User redirected to Dashboard
       ↓
Dashboard calls /api/v1/dashboard
       ↓
authenticateClerk middleware validates token ✅
       ↓
ensureUserExists middleware checks database
       ↓
User FOUND in database ✅
       ↓
UPDATE last_active = NOW()
       ↓
Continue to dashboardController ✅
       ↓
Return dashboard data (lessons, vocabs, etc.)
```

---

## 🚀 Setup Instructions

### Backend Setup

1. **تأكد من .env**

```env
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lexilearn
DB_USER=postgres
DB_PASSWORD=your_password

CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

2. **شغل Backend**

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

1. **تأكد من .env**

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

2. **ثبت Clerk**

```bash
cd frontend
npm install @clerk/clerk-react
```

3. **شغل Frontend**

```bash
npm run dev
```

---

## 🧪 Testing

### 1. Test New User Registration

1. انتقل إلى signup page
2. سجل user جديد
3. بعد التسجيل، انتقل للـ Dashboard
4. افحص database:

```sql
-- Should see new user
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;

-- Should see progress record
SELECT * FROM progress WHERE user_id = 'user_xxx';
```

### 2. Test Existing User Login

1. سجل دخول بـ user موجود
2. انتقل للـ Dashboard
3. افحص `last_active` في database:

```sql
SELECT id, email, last_active FROM users WHERE email = 'your_email@example.com';
```

Should show today's date.

### 3. Test API Endpoints

```bash
# Get dashboard data (should auto-create user if needed)
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:3001/api/v1/dashboard

# Add a vocab word (should work because user now exists)
curl -X POST \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"word":"hello","translation":"مرحبا","lesson":"Test"}' \
  http://localhost:3001/api/v1/vocab
```

---

## 🔐 Security Considerations

### 1. Password Management
- الـ users اللي جايين من Clerk، password مش محفوظ عندنا
- نحط `password_hash = 'clerk_managed'` كـ placeholder
- Clerk بيدير كل شي متعلق بالـ passwords

### 2. User ID Consistency
- نستخدم **نفس** الـ ID من Clerk كـ Primary Key
- هيك نضمن consistency بين النظامين

### 3. Email Uniqueness
- الـ email column عندنا `UNIQUE`
- Clerk كمان بيضمن email uniqueness
- Double protection ✅

---

## 📝 Important Notes

### ✅ Advantages
1. **Auto-Sync**: Users بيتنشئوا تلقائياً
2. **No Manual Work**: ما في حاجة لإنشاء users يدوياً
3. **Seamless**: User ما بيحس بأي شي
4. **Consistent**: ID واحد في Clerk والـ database

### ⚠️ Things to Remember
1. Clerk لازم يكون configured صح
2. Database لازم يكون running
3. Environment variables لازم تكون صحيحة
4. الـ middleware ترتيبه مهم:
   ```javascript
   router.use(authenticateClerk);  // أولاً
   router.use(ensureUserExists);   // ثانياً
   ```

---

## 🐛 Troubleshooting

### Problem: User not created in database

**Check:**
1. هل Backend logs بتظهر "Creating new user"?
2. هل Database connection شغالة?
3. هل Clerk token صحيح?

**Solution:**
```bash
# Check backend logs
npm run dev

# Check database
psql -U postgres -d lexilearn
SELECT * FROM users;
```

### Problem: "No authentication token available"

**Check:**
1. هل Clerk initialized في `main.jsx`?
2. هل User signed in?
3. هل Environment variables صحيحة?

**Solution:**
```javascript
// Check if Clerk is loaded
console.log(window.Clerk);
console.log(window.Clerk.session);
```

### Problem: Database constraint error

**Check:**
1. هل Email مكرر?
2. هل User ID format صحيح (UUID)?

**Solution:**
```sql
-- Check for duplicates
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
```

---

## 🎓 Summary

### Before Integration ❌
- Clerk manages authentication
- Database has empty `users` table
- No connection between them
- Can't track user progress

### After Integration ✅
- Clerk manages authentication
- Database automatically syncs users
- Single source of truth (Clerk ID)
- Can track lessons, vocabs, progress

### Key Files Created/Modified
- ✅ `backend/src/middleware/ensureUserExists.js` (NEW)
- ✅ `backend/src/routes/dashboardRoutes.js` (Modified)
- ✅ `backend/src/routes/vocabRoutes.js` (Modified)
- ✅ `backend/src/routes/lessonRoutes.js` (Modified)
- ✅ `frontend/src/main.jsx` (Modified)
- ✅ `frontend/src/pages/Dashboard/Dashboard.jsx` (Modified)
- ✅ `frontend/src/services/DashboardService.js` (Modified)

---

## 🚀 Next Steps

1. ✅ Test user registration
2. ✅ Test user login
3. ✅ Verify database sync
4. ✅ Test dashboard data loading
5. 🔄 Add Clerk Webhooks (optional - for advanced sync)
6. 🔄 Add user profile editing
7. 🔄 Add user settings

---

**الحمد لله، Integration جاهز! 🎉**

كلام زميلتك كان صح 100%، وهلأ الـ system بيشتغل بشكل متكامل!

