# ⚠️ Breaking Changes Documentation

**Project:** LexiLearn Refactor (hala-edit → master)  
**Created:** 2025-10-29

---

## 🎯 Purpose

This document tracks all breaking changes introduced during the migration from `hala-edit` (monolithic) to `master` (modular) structure.

---

## 📋 Breaking Changes

### ✅ Confirmed Breaking Changes

#### None Yet
The migration is designed to be **backward-compatible** where possible.

---

### 🟡 Potential Breaking Changes

#### 1. API Base Path Change
**Status:** Under Discussion

**Change:**
- Old: `/api/sessions/start`
- New: `/api/v1/sessions/start`

**Impact:**
- Frontend must update all API calls
- Mobile app (if any) must update

**Migration Path:**
- Support both paths temporarily
- Add deprecation warning to old path
- Remove old path in v2.0

**Timeline:** TBD

---

#### 2. WebSocket Connection URL
**Status:** Under Discussion

**Change:**
- Old: Direct connection to server
- New: Might need separate WebSocket server/port

**Impact:**
- Frontend WebSocket client initialization
- Connection string changes

**Migration Path:**
- Keep same connection method
- Only change if necessary for scaling

**Timeline:** TBD

---

#### 3. Error Response Format (WebSocket)
**Status:** Under Discussion

**Change:**
- Old (varied): `socket.emit("error", { message: "..." })`
- New (standardized):
```javascript
socket.emit("error", {
  success: false,
  code: "ERROR_CODE",
  message: "User-friendly message",
  details: "Technical details"
})
```

**Impact:**
- Frontend error handling needs update
- Better error messages for users

**Migration Path:**
- Support both formats initially
- Gradual frontend update

**Timeline:** TBD

---

#### 4. Session Summary Response Structure
**Status:** Under Discussion

**Change:**
Potential restructuring of summary response for better organization.

**Current:**
```json
{
  "sessionId": "...",
  "completedAt": "...",
  "scores": {...},
  "questions": [...]
}
```

**Proposed:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "...",
      "completedAt": "..."
    },
    "performance": {
      "scores": {...}
    },
    "questions": [...]
  }
}
```

**Impact:**
- Frontend parsing logic update needed

**Migration Path:**
- Keep current format for now
- Add new format in v2

**Timeline:** Defer to v2

---

### 🟢 Non-Breaking Changes

#### 1. Internal File Structure
**Change:** Reorganize backend code into modules  
**Impact:** None (internal only)  
**Status:** ✅ Safe

#### 2. Database Queries
**Change:** Move queries from server.js to models  
**Impact:** None (API stays same)  
**Status:** ✅ Safe

#### 3. Service Layer Addition
**Change:** Add service layer between controllers and models  
**Impact:** None (encapsulation improvement)  
**Status:** ✅ Safe

#### 4. Middleware Organization
**Change:** Split middleware into separate files  
**Impact:** None (functionality same)  
**Status:** ✅ Safe

---

## 🔄 Deprecation Timeline

### Phase 1: Compatibility (Weeks 1-4)
- Maintain full backward compatibility
- Support both old and new patterns

### Phase 2: Deprecation Warnings (Weeks 5-8)
- Add console warnings for deprecated endpoints
- Update documentation

### Phase 3: Migration Period (Weeks 9-12)
- Encourage frontend migration
- Provide migration guides

### Phase 4: Removal (Week 13+)
- Remove deprecated endpoints
- Release as v2.0

---

## 📚 Migration Guides

### For Frontend Developers

#### If API Paths Change:
```javascript
// Old
const response = await fetch('/api/sessions/start', {...});

// New
const response = await fetch('/api/v1/sessions/start', {...});

// Or use environment variable
const API_BASE = process.env.REACT_APP_API_BASE || '/api/v1';
const response = await fetch(`${API_BASE}/sessions/start`, {...});
```

#### If WebSocket Events Change:
```javascript
// Check event names remain same
socket.on('session_ready', handleSessionReady);
socket.on('ask_question', handleQuestion);
socket.emit('user_final_text', data);
```

---

### For Backend Developers

#### Code Migration Checklist:
- [ ] Update import paths after file reorganization
- [ ] Update route registration in app.js
- [ ] Ensure middleware order is correct
- [ ] Update tests for new structure
- [ ] Verify WebSocket handlers

---

## 🧪 Testing Strategy

### Compatibility Testing:
1. **Old Frontend + New Backend:** Must work
2. **New Frontend + New Backend:** Must work
3. **Mixed Versions:** Must work during migration period

### Test Cases:
- [ ] All REST endpoints respond correctly
- [ ] All WebSocket events work
- [ ] Error handling works for both formats
- [ ] Session flow completes successfully
- [ ] PDF export works
- [ ] Audio upload works

---

## 📊 Impact Assessment

### High Impact Changes (Require Frontend Update):
- None confirmed yet

### Medium Impact Changes (Recommended Frontend Update):
- API path versioning (if implemented)

### Low Impact Changes (Optional Frontend Update):
- Error response format improvements

### No Impact Changes:
- Internal code organization
- Database query refactoring
- Service layer addition

---

## 🚨 Rollback Plan

If critical issues arise:

1. **Immediate Rollback:**
   ```bash
   git checkout hala-edit
   npm run deploy
   ```

2. **Partial Rollback:**
   - Use feature flags to disable new modules
   - Fall back to old implementation

3. **Data Migration Rollback:**
   - Database migrations are reversible
   - Keep hala-edit schema available

---

## 📞 Communication Plan

### Stakeholders to Notify:
- [ ] Frontend team (about any API changes)
- [ ] Product team (about timeline)
- [ ] QA team (about testing needs)
- [ ] DevOps team (about deployment)
- [ ] End users (about maintenance window)

### Communication Channels:
- Slack #lexi-learn-dev
- Email: engineering@lexilearn.com
- GitHub issues for detailed discussions

---

## 📝 Change Log

| Date | Change | Type | Impact | Status |
|------|--------|------|--------|--------|
| 2025-10-29 | Initial document creation | N/A | None | ✅ Done |
| - | - | - | - | - |

---

## 🔗 Related Documents

- [PLAN.md](./PLAN.md) - Overall refactor plan
- [QUESTIONS.md](./QUESTIONS.md) - Open decisions
- API Documentation (to be created)

---

**Last Updated:** 2025-10-29  
**Review Schedule:** Weekly during migration  
**Status:** No breaking changes confirmed yet ✅

