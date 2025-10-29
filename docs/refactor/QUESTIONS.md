# 🤔 Open Questions & Decisions Needed

**Project:** LexiLearn Refactor (hala-edit → master)  
**Created:** 2025-10-29

---

## 🔴 Critical Decisions Needed

### 1. WebSocket Authentication
**Question:** How should we handle WebSocket authentication in the new structure?

**Options:**
- **A:** Use Socket.IO middleware with Clerk token verification (current in hala-edit)
- **B:** Use session-based authentication
- **C:** Hybrid approach (token for REST, session for WS)

**Current in hala-edit:**
```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const payload = await verifyToken(token);
  socket.data.uuidUserId = userId;
  next();
});
```

**Recommendation:** Keep Option A (Clerk token) for consistency

**Decision:** [PENDING]

---

### 2. Session State Management
**Question:** Where should we store active session state?

**Options:**
- **A:** In-memory (current approach, simple but not scalable)
- **B:** Redis (scalable, production-ready)
- **C:** Database only (simpler, higher latency)

**Trade-offs:**
| Option | Pros | Cons |
|--------|------|------|
| A (Memory) | Fast, simple | Lost on restart, single-server only |
| B (Redis) | Fast, scalable, persistent | Added complexity, new dependency |
| C (DB) | Simple, persistent | Slower, more DB load |

**Recommendation:** Start with A, prepare for B migration

**Decision:** [PENDING]

---

### 3. API Versioning
**Question:** Should we version the new APIs?

**Current in master:** `/api/v1/vocab`, `/api/v1/lessons`  
**Current in hala-edit:** `/api/sessions`, `/api/topics`

**Options:**
- **A:** Add `/api/v1/` prefix to all new endpoints
- **B:** Keep non-versioned for now
- **C:** Use `/api/v2/` for completely new structure

**Recommendation:** Option A for consistency with existing master structure

**Decision:** [PENDING]

---

### 4. Real-time vs REST for Session Flow
**Question:** Should session flow be WebSocket-only or hybrid?

**Current:** hala-edit uses WebSocket for real-time lesson flow  
**Alternative:** Could use REST + polling or Server-Sent Events

**Considerations:**
- WebSocket pros: Real-time, bi-directional
- WebSocket cons: More complex, connection management
- REST pros: Simpler, stateless
- REST cons: Not real-time, polling overhead

**Recommendation:** Keep WebSocket for lesson flow (better UX)

**Decision:** [PENDING]

---

### 5. Audio Storage Strategy
**Question:** Where should we store uploaded audio files?

**Current in hala-edit:** Local filesystem (`uploads/` directory)  
**Current in master:** Likely local (audio service exists)

**Options:**
- **A:** Local filesystem (current)
- **B:** AWS S3 / Cloud storage
- **C:** Database (Base64 encoded) - NOT recommended

**Recommendation:** 
- Development: Option A
- Production: Option B (S3)

**Decision:** [PENDING]

---

## 🟡 Medium Priority Questions

### 6. PDF Generation Location
**Question:** Should PDF generation be synchronous or async?

**Current:** Synchronous generation in endpoint handler

**Options:**
- **A:** Keep synchronous (simple, may block for large PDFs)
- **B:** Move to background job queue (scalable, complex)

**Recommendation:** Keep A for now, move to B if performance issues

**Decision:** [PENDING]

---

### 7. Correction Service Timeout
**Question:** What should be the timeout for AI correction service?

**Current:** No explicit timeout (relies on Gemini/LT timeouts)

**Recommendation:** Add 10-second timeout with graceful fallback

**Decision:** [PENDING]

---

### 8. Topics Seed Data
**Question:** How should we manage the 60-day topic curriculum?

**Current in hala-edit:** `topics.json` file loaded at startup

**Options:**
- **A:** Keep JSON file (simple, easy to edit)
- **B:** Database seeding script (more structured)
- **C:** Admin UI for topic management (most flexible)

**Recommendation:** Start with A, migrate to B

**Decision:** [PENDING]

---

### 9. Error Response Format
**Question:** Should we standardize error responses across WebSocket and REST?

**Current REST (master):**
```json
{
  "success": false,
  "message": "Error message",
  "error": "details"
}
```

**Current WebSocket (hala-edit):**
```javascript
socket.emit("error", { message: "..." });
```

**Recommendation:** Unify format for consistency

**Decision:** [PENDING]

---

### 10. Logging Strategy
**Question:** What logging library/strategy should we use?

**Current in master:** `logger.js` (Winston-based)  
**Current in hala-edit:** `console.log()`

**Recommendation:** Use master's Winston logger consistently

**Decision:** [PENDING]

---

## 🟢 Low Priority / Nice to Have

### 11. Rate Limiting for WebSocket
**Question:** Should we implement rate limiting for WebSocket events?

**Recommendation:** Add later if abuse detected

**Decision:** [DEFERRED]

---

### 12. Database Connection Pooling
**Question:** Should we optimize the database pool size?

**Current:** Using default pg Pool settings

**Recommendation:** Monitor and tune based on load

**Decision:** [DEFERRED]

---

### 13. Monitoring & Analytics
**Question:** Should we add monitoring for WebSocket connections?

**Recommendation:** Add basic metrics (connection count, event counts)

**Decision:** [DEFERRED]

---

## 🔧 Technical Assumptions

### Assumptions We're Making:
1. ✅ Frontend expects same WebSocket event names
2. ✅ Database schema from hala-edit is correct
3. ✅ Clerk authentication is preferred
4. ✅ Master's file structure is the target
5. ✅ We can keep backend backward-compatible

### Assumptions to Verify:
- [ ] Frontend WebSocket implementation compatibility
- [ ] Database migration path from old to new schema
- [ ] Performance requirements (concurrent users, etc.)
- [ ] Deployment environment (single server vs cluster)
- [ ] Audio file size limits

---

## 🎯 Decision Matrix

| Decision | Impact | Urgency | Dependencies |
|----------|--------|---------|--------------|
| WebSocket Auth | High | High | Frontend, Clerk |
| Session State | High | Medium | Scalability |
| API Versioning | Medium | High | Frontend |
| Real-time vs REST | High | High | UX, Frontend |
| Audio Storage | Medium | Low | Deployment |
| PDF Generation | Low | Low | Performance |
| Logging Strategy | Medium | Medium | Debugging |

---

## 📝 Notes for Team Discussion

1. **WebSocket vs REST:** Need product decision on UX trade-offs
2. **Scalability:** Need infrastructure team input on Redis/scaling
3. **Frontend Impact:** Need frontend team to review event names/formats
4. **Timeline:** Some decisions can be deferred without blocking progress

---

## 🔄 Decision Log

### Decisions Made:
| Date | Decision | Rationale | By |
|------|----------|-----------|-----|
| - | - | - | - |

### Decisions Pending:
- All questions above marked [PENDING]

---

**Last Updated:** 2025-10-29  
**Next Review:** After team discussion

