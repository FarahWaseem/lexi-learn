# LexiLearn PWA - Quick Start Guide

## 🚀 Getting Started

### Development Mode
```bash
cd frontend
npm install
npm run dev
```
Visit: http://localhost:5173

### Production Build
```bash
cd frontend
npm run build
npm run preview
```
Visit: http://localhost:4173

---

## 🧪 Test Offline Functionality (5 Minutes)

### Step 1: Visit Pages While Online
1. Start the app: `npm run dev`
2. Login with Clerk
3. Visit these pages:
   - Dashboard: `/dashboard`
   - Lessons: `/lessons`
   - Open a lesson
   - View a summary: `/summary/:id`

### Step 2: Go Offline
**Chrome DevTools Method:**
1. Press `F12` to open DevTools
2. Go to **Network** tab
3. Check **"Offline"** checkbox

**OR**

**System Method:**
- Disable WiFi/Network adapter

### Step 3: Test Offline Access
1. **Refresh the page** (F5)
   - ✅ Should load from cache
   - ✅ Should show orange offline banner
   - ✅ Should NOT show blocking screen

2. **Navigate between pages**
   - ✅ Dashboard should load
   - ✅ Lessons should load
   - ✅ Summaries should load
   - ✅ All navigation should work

3. **Check offline banner**
   - ✅ Should see: "⚠️ You're offline - Using cached data"
   - ✅ Banner should be at top (non-blocking)

### Step 4: Go Back Online
1. Uncheck "Offline" in DevTools (or enable network)
2. ✅ Orange banner should disappear
3. ✅ App should fetch fresh data
4. ✅ Everything should work normally

---

## 🔍 Verify Service Worker

### Chrome DevTools
1. Press `F12`
2. Go to **Application** tab
3. Click **Service Workers** (left sidebar)
4. ✅ Should see: "Status: activated and is running"

### Check Caches
1. In **Application** tab
2. Click **Cache Storage** (left sidebar)
3. ✅ Should see multiple caches:
   - `workbox-precache-v2-...`
   - `api-topics-cache`
   - `api-session-summary-cache`
   - `pdf-exports-cache`
   - `images-cache`
   - `fonts-cache`

### Check IndexedDB
1. In **Application** tab
2. Click **IndexedDB** → **keyval-store**
3. ✅ Should see stored data:
   - `topics`
   - `summary:*`
   - `last_route`
   - `offline_state`

---

## 📱 Install as PWA

### Desktop (Chrome/Edge)
1. Open app in browser
2. Look for **Install** icon in address bar (⊕)
3. Click to install
4. App opens in standalone window
5. ✅ Test offline in installed app

### Mobile (Android)
1. Open app in Chrome
2. Tap menu (⋮)
3. Tap "Add to Home screen"
4. App installs on home screen
5. ✅ Opens like native app

### Mobile (iOS)
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App installs on home screen
5. ✅ Opens in standalone mode

---

## 🐛 Troubleshooting

### Service Worker Not Registering
```bash
# Clear cache and rebuild
rm -rf frontend/dist
cd frontend
npm run build
```

### Offline Not Working
1. Check if you visited pages while online first
2. Check Service Worker status in DevTools
3. Check Cache Storage has data
4. Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Old Cache Stuck
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister())
})
location.reload()
```

### Clear All Caches
```javascript
// In browser console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key))
})
location.reload()
```

---

## 📊 What Gets Cached?

### Automatically Cached
- ✅ All JavaScript files
- ✅ All CSS files
- ✅ All images (PNG, JPG, SVG, etc.)
- ✅ All fonts (WOFF, WOFF2, TTF)
- ✅ HTML pages
- ✅ API responses (topics, summaries, PDFs)

### Requires Online First Visit
- ⚠️ Lessons (must visit while online)
- ⚠️ Summaries (must view while online)
- ⚠️ PDFs (must download while online)
- ⚠️ Vocabulary (must load while online)

### Never Cached
- ❌ Login/Signup (requires online)
- ❌ POST/PUT/DELETE requests
- ❌ Real-time updates
- ❌ WebSocket connections

---

## 🎯 Key Features

### ✅ Works Offline
- Dashboard
- Lessons list
- Individual lessons
- Summaries
- Vocabulary
- PDF downloads (if cached)

### ✅ Persistent State
- Refreshing offline maintains current page
- Route restored after offline refresh
- Scroll position maintained

### ✅ Smart Caching
- Fresh data when online
- Cached data when offline
- Background updates
- Automatic cleanup

### ✅ User Experience
- No blocking screens
- Non-intrusive offline banner
- Instant page loads
- Seamless online/offline transition

---

## 📝 Important Notes

### First Time Users
- Must visit pages while online first
- Service Worker needs to cache data
- After first visit, everything works offline

### Returning Users
- Instant loading from cache
- Background updates when online
- Seamless experience

### Data Freshness
- Topics: Updated every 24 hours
- Summaries: Updated every 7 days
- PDFs: Cached for 30 days
- Images: Cached for 30 days

---

## 🔧 Developer Commands

```bash
# Install dependencies
npm install

# Development server (with PWA)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Clean build
rm -rf dist && npm run build
```

---

## 📚 Documentation

- **Full Guide**: `PWA_OFFLINE_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **This Guide**: `QUICK_START.md`

---

## ✅ Success Checklist

Before deploying, verify:
- [ ] `npm run build` succeeds
- [ ] Service Worker registers
- [ ] Offline banner appears when offline
- [ ] Pages load offline after visiting online
- [ ] Navigation works offline
- [ ] No console errors
- [ ] PWA can be installed
- [ ] Caches are populated

---

## 🎉 You're Ready!

The app is now a fully functional PWA with offline support. Users can:
- 📱 Install it like a native app
- 🔌 Use it without internet
- ⚡ Experience instant loading
- 💾 Save mobile data
- 🌍 Learn anywhere, anytime

**Happy Learning! 🚀**

