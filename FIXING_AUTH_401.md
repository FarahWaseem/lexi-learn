# Fixed: 401 Unauthorized Error on Lesson Summary

## Problem
The frontend was getting a **401 Unauthorized** error when trying to fetch the lesson summary from `/api/sessions/3/lesson-summary`.

## Root Cause
1. **Backend**: Routes were configured to use Clerk authentication (`clerkMiddleware()`)
2. **Frontend**: Clerk wasn't integrated - no `ClerkProvider` in the app
3. The frontend was trying to get tokens from localStorage that didn't exist

## Solution Applied

### 1. ✅ Installed Clerk React Package
```bash
npm install @clerk/clerk-react
```

### 2. ✅ Updated `frontend/src/main.jsx`
Added `ClerkProvider` to wrap the entire app:

```jsx
import { ClerkProvider } from '@clerk/clerk-react'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
  <UserProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </UserProvider>
</ClerkProvider>
```

### 3. ✅ Updated `frontend/src/pages/LessonSammary/lessonSammary.jsx`
Changed from reading `localStorage` to using Clerk's `useAuth` hook:

**Before:**
```javascript
const token = localStorage.getItem('clerk_token') || '';
```

**After:**
```javascript
import { useAuth } from "@clerk/clerk-react";

const { getToken, isLoaded, isSignedIn } = useAuth();

// Then in the fetch function:
const token = await getToken();
```

## What You Need to Do

### 1. Set Up Clerk Account (if not already done)
1. Go to [clerk.com](https://clerk.com)
2. Sign up or sign in
3. Create a new application
4. Get your **Publishable Key** and **Secret Key**

### 2. Configure Frontend Environment
Create a file `frontend/.env` with:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:3001
```

### 3. Configure Backend Environment
Make sure `backend/.env` has:

```env
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 4. Add Sign In/Sign Up UI
You'll need to add Clerk's authentication UI components. Here are some options:

#### Option A: Use Clerk's Pre-built Components (Recommended)
Add sign-in buttons to your app:

```jsx
import { SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

// In your Header or Login page:
<SignInButton mode="modal">
  <button>Sign In</button>
</SignInButton>

// Show user profile when signed in:
<UserButton afterSignOutUrl="/" />
```

#### Option B: Create Sign-In Routes
Update `App.jsx` to include Clerk's auth pages:

```jsx
import { SignIn, SignUp } from "@clerk/clerk-react";

<Routes>
  <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
  <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />
  {/* ... other routes */}
</Routes>
```

### 5. Protect Routes (Optional)
You can protect routes to ensure users are authenticated:

```jsx
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

<SignedIn>
  <Route path="/lessonSammary" element={<LessonSammary />} />
</SignedIn>
<SignedOut>
  <RedirectToSignIn />
</SignedOut>
```

## Testing

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Sign In/Sign Up** using Clerk's UI

4. **Navigate to Lesson Summary** - the 401 error should be gone!

## Additional Notes

- The backend already has the `ensureUserExists` middleware that automatically creates a user record in your database when someone signs in via Clerk for the first time
- All authenticated routes will now work properly once you're signed in
- The PDF export button will also work with proper authentication

## Files Changed
- ✅ `frontend/src/main.jsx` - Added ClerkProvider
- ✅ `frontend/src/pages/LessonSammary/lessonSammary.jsx` - Uses Clerk auth
- ✅ `frontend/package.json` - Added @clerk/clerk-react dependency

## References
- Clerk React Docs: https://clerk.com/docs/quickstarts/react
- Clerk Components: https://clerk.com/docs/components/overview

