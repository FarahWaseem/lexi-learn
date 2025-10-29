# 🗺️ API Endpoint Mapping

**Project:** LexiLearn Refactor (hala-edit → master)  
**Purpose:** Map old endpoints to new modular structure

---

## 📊 REST API Mapping

### Health & Info Endpoints

| Old (hala-edit) | New (master) | Controller | Service | Status |
|-----------------|--------------|------------|---------|--------|
| `GET /` | `GET /` or `/api/health` | - | - | ✅ Keep as-is |
| `GET /api/health` | `GET /api/v1/health` | `healthController` | - | 📝 Plan |
| `GET /api/db/info` | `GET /api/v1/db/info` | `healthController` | `dbService` | 📝 Plan |

---

### User Endpoints

| Old (hala-edit) | New (master) | Controller | Service | Model | Status |
|-----------------|--------------|------------|---------|-------|--------|
| `GET /api/me` | `GET /api/v1/user/me` | `userController.getMe()` | `userService` | `userModel` | 📝 Plan |
| `GET /api/my/topics` | `GET /api/v1/user/topics` | `userController.getTopics()` | `userService` | `userModel` | 📝 Plan |

---

### Topic/Day Endpoints

| Old (hala-edit) | New (master) | Controller | Service | Model | Status |
|-----------------|--------------|------------|---------|-------|--------|
| `GET /api/topics` | `GET /api/v1/topics` | `topicController.list()` | `topicService` | `topicModel` | 📝 Plan |
| `GET /api/day/:day` | `GET /api/v1/topics/:dayNumber` | `topicController.getByDay()` | `topicService` | `topicModel` | 📝 Plan |

---

### Session Endpoints

| Old (hala-edit) | New (master) | Controller | Service | Model | Status |
|-----------------|--------------|------------|---------|-------|--------|
| `POST /api/sessions/start` | `POST /api/v1/sessions` | `sessionController.create()` | `sessionService` | `sessionModel` | 📝 Plan |
| `POST /api/sessions` | `POST /api/v1/sessions` | (alias above) | - | - | 📝 Plan |
| `POST /api/sessions/:id/finish` | `PUT /api/v1/sessions/:id/finish` | `sessionController.finish()` | `sessionService` | `sessionModel` | 📝 Plan |
| `GET /api/sessions/:id/summary` | `GET /api/v1/sessions/:id/summary` | `sessionController.getSummary()` | `summaryService` | `sessionModel` | 📝 Plan |
| `GET /api/sessions/last` | `GET /api/v1/sessions/latest` | `sessionController.getLatest()` | `sessionService` | `sessionModel` | 📝 Plan |
| `GET /api/sessions/:id/lesson-summary` | `GET /api/v1/sessions/:id/summary/detailed` | `sessionController.getDetailedSummary()` | `summaryService` | `sessionModel` | 📝 Plan |

---

### Utterance Endpoints

| Old (hala-edit) | New (master) | Controller | Service | Model | Status |
|-----------------|--------------|------------|---------|-------|--------|
| `POST /api/utterances/audio` | `POST /api/v1/utterances/audio` | `utteranceController.createAudio()` | `utteranceService` + `audioService` | `utteranceModel` | 📝 Plan |
| `POST /api/utterances/text` | `POST /api/v1/utterances/text` | `utteranceController.createText()` | `utteranceService` | `utteranceModel` | 📝 Plan |

---

### Export Endpoints

| Old (hala-edit) | New (master) | Controller | Service | Model | Status |
|-----------------|--------------|------------|---------|-------|--------|
| `GET /api/sessions/:id/export.pdf` | `GET /api/v1/sessions/:id/export/pdf` | `exportController.exportPDF()` | `pdfService` | `sessionModel` | 📝 Plan |

---

### Correction Endpoints

| Old (hala-edit) | New (master) | Controller | Service | Model | Status |
|-----------------|--------------|------------|---------|-------|--------|
| `POST /api/correct` | `POST /api/v1/corrections` | `correctionController.correct()` | `correctionService` | `correctionModel` | 📝 Plan |

---

## 🔌 WebSocket Event Mapping

### Client → Server Events

| Event Name | Handler Location | Service | Model | Status |
|------------|------------------|---------|-------|--------|
| `start_day` | `websocketController.handleStartDay()` | `sessionService` + `topicService` | `sessionModel` + `topicModel` | 📝 Plan |
| `time_up` | `websocketController.handleTimeUp()` | - | - | 📝 Plan |
| `user_final_text` | `websocketController.handleUserAnswer()` | `utteranceService` + `correctionService` | `utteranceModel` + `correctionModel` | 📝 Plan |
| `ready_for_next` | `websocketController.handleReadyNext()` | `sessionService` | `attemptModel` | 📝 Plan |

### Server → Client Events

| Event Name | Triggered By | Data Sent | Status |
|------------|--------------|-----------|--------|
| `system_say` | Various handlers | `{ text: string }` | ✅ Keep |
| `session_ready` | `start_day` handler | `{ sessionId, dayNumber }` | ✅ Keep |
| `topic_vocab` | `start_day` handler | `{ dayNumber, vocab[] }` | ✅ Keep |
| `ask_question` | Question flow | `{ sessionId, questionIdx, prompt, seconds }` | ✅ Keep |
| `time_up` | Echo from client | `{ questionIdx }` | ✅ Keep |
| `correction_ready` | After user answer | `{ feedback, corrected, issues[], scores }` | ✅ Keep |
| `lesson_finished` | After last question | `{ sessionId }` | ✅ Keep |
| `summary_ready` | After lesson finish | `{ session, scores, questions[], feedback }` | ✅ Keep |

---

## 📦 Module Organization

### New File Structure

```
backend/src/
├── controllers/
│   ├── sessionController.js      ← Sessions REST handlers
│   ├── topicController.js        ← Topics REST handlers
│   ├── utteranceController.js    ← Utterances REST handlers
│   ├── correctionController.js   ← Corrections REST handlers
│   ├── exportController.js       ← PDF export handlers
│   ├── userController.js         ← User profile handlers
│   └── websocketController.js    ← WebSocket event handlers
│
├── services/
│   ├── sessionService.js         ← Session business logic
│   ├── topicService.js           ← Topic loading/creation
│   ├── utteranceService.js       ← Utterance management
│   ├── correctionService.js      ← AI correction (MOVE from hala-edit)
│   ├── summaryService.js         ← Summary aggregation
│   ├── pdfService.js             ← PDF generation
│   └── audioProcessingService.js ← Audio conversion (FFmpeg)
│
├── models/
│   ├── sessionModel.js           ← Session DB queries
│   ├── topicModel.js             ← Topic DB queries
│   ├── attemptModel.js           ← Attempt DB queries
│   ├── utteranceModel.js         ← Utterance DB queries
│   ├── correctionModel.js        ← Correction DB queries
│   ├── summaryModel.js           ← Summary DB queries
│   └── userModel.js              ← User DB queries
│
├── routes/
│   ├── sessionRoutes.js          ← /api/v1/sessions/*
│   ├── topicRoutes.js            ← /api/v1/topics/*
│   ├── utteranceRoutes.js        ← /api/v1/utterances/*
│   ├── correctionRoutes.js       ← /api/v1/corrections/*
│   ├── exportRoutes.js           ← /api/v1/export/*
│   └── userRoutes.js             ← /api/v1/user/*
│
├── config/
│   ├── websocket.js              ← Socket.IO setup (NEW)
│   └── topics.json               ← 60-day curriculum (MOVE from root)
│
└── utils/
    ├── clerkHelpers.js           ← resolveUsername(), etc.
    ├── feedbackFormatter.js      ← buildDetailedFeedback()
    ├── scoreCalculator.js        ← calcOverallScore()
    └── sessionHelpers.js         ← ensureAttempt(), etc.
```

---

## 🔄 Middleware Flow

### REST Endpoints:
```
Request
  ↓
clerkMiddleware (auth)
  ↓
ensureUserExists (sync DB)
  ↓
validationMiddleware (if needed)
  ↓
Controller
  ↓
Service (business logic)
  ↓
Model (DB queries)
  ↓
Response
```

### WebSocket Events:
```
Client Event
  ↓
WebSocket Middleware (auth)
  ↓
websocketController
  ↓
Service (business logic)
  ↓
Model (DB queries)
  ↓
Emit Response Event
```

---

## 📝 Implementation Priority

### Phase 1: Core Infrastructure (Week 1)
1. ✅ Create documentation
2. [ ] Create working branch
3. [ ] Set up new file structure
4. [ ] Create base models
5. [ ] Set up WebSocket config

### Phase 2: Session Management (Week 2)
6. [ ] `sessionModel.js`
7. [ ] `sessionService.js`
8. [ ] `sessionController.js`
9. [ ] `sessionRoutes.js`
10. [ ] WebSocket session handlers

### Phase 3: Topics & Questions (Week 2)
11. [ ] `topicModel.js`
12. [ ] `topicService.js`
13. [ ] `topicController.js`
14. [ ] `topicRoutes.js`
15. [ ] Move `topics.json`

### Phase 4: Utterances & Correction (Week 3)
16. [ ] `utteranceModel.js`
17. [ ] `utteranceService.js`
18. [ ] `utteranceController.js`
19. [ ] Move `correctionService.js`
20. [ ] `correctionController.js`

### Phase 5: Summary & Export (Week 3)
21. [ ] `summaryService.js`
22. [ ] `pdfService.js`
23. [ ] `exportController.js`
24. [ ] `exportRoutes.js`

### Phase 6: User & Utilities (Week 4)
25. [ ] `userModel.js`
26. [ ] `userService.js`
27. [ ] `userController.js`
28. [ ] All utility files

---

## 🧪 Testing Checklist

### For Each Endpoint:
- [ ] Unit tests for model functions
- [ ] Unit tests for service functions
- [ ] Integration tests for controllers
- [ ] E2E tests for complete flows

### For WebSocket:
- [ ] Connection authentication test
- [ ] Each event handler test
- [ ] Full lesson flow test
- [ ] Error handling test

---

## 📊 Progress Tracking

| Module | Files Created | Tests Written | Status |
|--------|---------------|---------------|--------|
| Models | 0/7 | 0/7 | ⏳ Not Started |
| Services | 0/7 | 0/7 | ⏳ Not Started |
| Controllers | 0/7 | 0/7 | ⏳ Not Started |
| Routes | 0/6 | 0/6 | ⏳ Not Started |
| Config | 0/2 | 0/2 | ⏳ Not Started |
| Utils | 0/4 | 0/4 | ⏳ Not Started |
| **Total** | **0/33** | **0/33** | **0%** |

---

**Last Updated:** 2025-10-29  
**Next Update:** After Phase 1 completion

