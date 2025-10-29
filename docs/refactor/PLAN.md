# 🔧 LexiLearn Refactor & Migration Plan

**Goal:** Port all features from `hala-edit` branch (monolithic `server.js`) into the modular structure on `master` branch.

**Status:** Planning Phase  
**Created:** 2025-10-29  
**Branch:** Will create `refactor/port-hala-edit-to-master`

---

## 📊 Branch Analysis

### Master Branch (Target Structure)
- **Backend Structure:** Modular, well-organized
  - `backend/src/app.js` - Main application entry (80 lines)
  - `backend/src/config/` - Database & configuration
  - `backend/src/controllers/` - Request handlers (6 controllers)
  - `backend/src/models/` - Data models
  - `backend/src/routes/` - Route definitions (3 route files)
  - `backend/src/services/` - Business logic
  - `backend/src/middleware/` - Auth, validation, errors (4 middlewares)
  - `backend/src/utils/` - Helper functions (5 utilities)

- **Total:** ~25 organized files
- **Features Implemented:**
  - ✅ Vocabulary management (CRUD)
  - ✅ Lessons management
  - ✅ Audio processing
  - ✅ Clerk authentication
  - ✅ Database migrations

### Hala-Edit Branch (Source Features)
- **Structure:** Monolithic
  - `server.js` - **1,285 lines** containing everything
  - `backend/src/services/correction.js` - AI correction service
  - `backend/src/middleware/ensureUserExists.js` - User sync middleware

- **Total:** 3 files (1 massive, 2 helpers)
- **Features:**
  - ✅ Real-time WebSocket-based lesson sessions
  - ✅ Topic/Day management (60 days curriculum)
  - ✅ Questions system (6 questions per topic)
  - ✅ Attempts & Utterances tracking
  - ✅ AI-powered grammar correction (Gemini + LanguageTool)
  - ✅ PDF export for lesson summaries
  - ✅ Session management with timing
  - ✅ User progress tracking
  - ✅ Clerk authentication integration
  - ✅ Database schema for sessions/attempts/utterances/corrections
  - ✅ Topic vocabulary management
  - ✅ Fluency scoring

---

## 🎯 Feature Inventory from hala-edit

### 1. REST API Endpoints

| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/` | GET | Health check | Low |
| `/api/health` | GET | Service health | Low |
| `/api/topics` | GET | List all topics/days | High |
| `/api/db/info` | GET | Database info | Medium |
| `/api/me` | GET | Current user profile | High |
| `/api/day/:day` | GET | Get specific day/topic details | High |
| `/api/sessions/start` | POST | Start new lesson session | **Critical** |
| `/api/sessions` | POST | Alias for start session | **Critical** |
| `/api/utterances/audio` | POST | Upload audio response | **Critical** |
| `/api/utterances/text` | POST | Submit text response | **Critical** |
| `/api/sessions/:id/finish` | POST | Finish lesson session | **Critical** |
| `/api/sessions/:id/summary` | GET | Get session summary | High |
| `/api/my/topics` | GET | User's completed topics | High |
| `/api/sessions/last` | GET | Get last session | Medium |
| `/api/sessions/:id/export.pdf` | GET | Export session as PDF | Medium |
| `/api/sessions/:id/lesson-summary` | GET | Detailed lesson summary | High |
| `/api/correct` | POST | Manual correction endpoint | Medium |

**Total:** 17 REST endpoints

### 2. WebSocket Events

| Event | Direction | Description | Priority |
|-------|-----------|-------------|----------|
| `connection` | - | Initial WebSocket connection | **Critical** |
| `start_day` | Client → Server | Start new day/lesson | **Critical** |
| `session_ready` | Server → Client | Session initialized | **Critical** |
| `system_say` | Server → Client | System message | High |
| `topic_vocab` | Server → Client | Send topic vocabulary | High |
| `ask_question` | Server → Client | Ask next question | **Critical** |
| `time_up` | Client → Server | Timer expired | **Critical** |
| `user_final_text` | Client → Server | Submit final answer | **Critical** |
| `correction_ready` | Server → Client | Grammar correction results | **Critical** |
| `ready_for_next` | Client → Server | Ready for next question | High |
| `lesson_finished` | Server → Client | All questions completed | **Critical** |
| `summary_ready` | Server → Client | Session summary available | High |

**Total:** 12 WebSocket events

### 3. Database Schema (from hala-edit)

#### Tables Used:
1. **daily_topics** - 60 daily conversation topics
2. **topic_questions** - 6 questions per topic
3. **topic_words** - Vocabulary for each topic
4. **sessions** - User lesson sessions
5. **attempts** - User attempts at questions
6. **utterances** - User & AI messages (role: user/ai)
7. **corrections** - AI-generated feedback with scores
8. **lesson_summary** - Aggregated session results
9. **users** - User accounts (with Clerk integration)

#### Key Fields:
- **users:** `clerk_user_id`, email, first_name, last_name, streak, last_active
- **sessions:** user_id, topic_id, started_at, completed_at, status
- **attempts:** session_id, question_id, started_at, completed_at
- **utterances:** attempt_id, role (user/ai), text, audio_url
- **corrections:** attempt_id, feedback, fluency_score, grammar_score, vocab_score

### 4. Services & Utilities

#### AI/Correction Service (`src/services/correction.js`)
- **Gemini AI Integration** - Primary grammar checker
- **LanguageTool Fallback** - Secondary grammar checker
- **Functions:**
  - `generateCorrection(text)` - Main correction function
  - Returns: `{ feedback, corrected, issues[], fluency, grammar, vocab }`

#### Helper Functions (in server.js)
- `buildDetailedFeedback()` - Format correction feedback
- `resolveUsername()` - Get user's display name from Clerk
- `requireUser()` - Auth middleware / user sync
- `getOrCreateDevUser()` - Dev mode helper
- `getOrCreateTopicWithQuestions()` - Topic initialization
- `ensureAttempt()` - Create/get attempt record
- `createUserUtterance()` - Save user message
- `createAiUtterance()` - Save AI message
- `loadSessionSummary()` - Aggregate session results
- `calcOverallScore()` - Calculate average scores

#### FFmpeg Integration
- Audio conversion (webm → wav)
- Used for uploaded audio processing

#### PDF Generation
- Uses `pdfkit` library
- Generates lesson summary PDFs
- Includes:
  - Session metadata
  - Questions & answers
  - Grammar corrections
  - Scores (fluency, grammar, vocab)

---

## 🗺️ Migration Mapping

### Phase 1: Core Session Management (**Critical**)

| hala-edit Code | Target in master | Notes |
|----------------|------------------|-------|
| Session creation logic | `backend/src/controllers/sessionController.js` (NEW) | Extract from `startHandler` |
| WebSocket session handlers | `backend/src/services/sessionService.js` (NEW) | Business logic |
| `/api/sessions/*` endpoints | `backend/src/routes/sessionRoutes.js` (NEW) | REST routes |
| WebSocket initialization | `backend/src/config/websocket.js` (NEW) | Socket.IO config |
| Session models/queries | `backend/src/models/sessionModel.js` (NEW) | Database layer |

### Phase 2: Topics & Questions (**Critical**)

| hala-edit Code | Target in master | Notes |
|----------------|------------------|-------|
| Topic creation/fetching | `backend/src/controllers/topicController.js` (NEW) | |
| Topic seed loading | `backend/src/services/topicService.js` (NEW) | Handle topics.json |
| `/api/topics`, `/api/day/:day` | `backend/src/routes/topicRoutes.js` (NEW) | |
| Topic models | `backend/src/models/topicModel.js` (NEW) | DB queries |

### Phase 3: Attempts & Utterances (**Critical**)

| hala-edit Code | Target in master | Notes |
|----------------|------------------|-------|
| Attempt creation/tracking | `backend/src/controllers/attemptController.js` (NEW) | |
| Utterance saving | `backend/src/services/utteranceService.js` (NEW) | |
| Audio processing | `backend/src/services/audioProcessingService.js` (NEW) | FFmpeg logic |
| Models | `backend/src/models/attemptModel.js`, `utteranceModel.js` (NEW) | |

### Phase 4: AI Correction System (**Critical**)

| hala-edit Code | Target in master | Notes |
|----------------|------------------|-------|
| `correction.js` | `backend/src/services/correctionService.js` (MOVE) | Already exists, just move |
| Correction controller | `backend/src/controllers/correctionController.js` (NEW) | Wrap service |
| Correction routes | `backend/src/routes/correctionRoutes.js` (NEW) | `/api/correct` |
| Correction model | `backend/src/models/correctionModel.js` (NEW) | DB queries |

### Phase 5: Summary & PDF Export (High)

| hala-edit Code | Target in master | Notes |
|----------------|------------------|-------|
| Summary aggregation | `backend/src/services/summaryService.js` (NEW) | Calculate scores |
| PDF generation | `backend/src/services/pdfService.js` (NEW) | pdfkit logic |
| Summary controller | `backend/src/controllers/summaryController.js` (NEW) | |
| Summary routes | `backend/src/routes/summaryRoutes.js` (NEW) | |

### Phase 6: User Management (High)

| hala-edit Code | Target in master | Notes |
|----------------|------------------|-------|
| `requireUser()` | `backend/src/middleware/clerkMiddleware.js` (MERGE) | Already exists |
| User profile endpoints | `backend/src/controllers/userController.js` (NEW) | `/api/me`, `/api/my/*` |
| User routes | `backend/src/routes/userRoutes.js` (NEW) | |
| User model | `backend/src/models/userModel.js` (NEW) | |

### Phase 7: Utilities & Helpers (Medium)

| hala-edit Code | Target in master | Notes |
|----------------|------------------|-------|
| `resolveUsername()` | `backend/src/utils/clerkHelpers.js` (NEW) | |
| `buildDetailedFeedback()` | `backend/src/utils/feedbackFormatter.js` (NEW) | |
| Score calculation | `backend/src/utils/scoreCalculator.js` (NEW) | |

---

## 📦 New Files to Create

### Controllers (9 new files)
1. `backend/src/controllers/sessionController.js`
2. `backend/src/controllers/topicController.js`
3. `backend/src/controllers/attemptController.js`
4. `backend/src/controllers/correctionController.js`
5. `backend/src/controllers/summaryController.js`
6. `backend/src/controllers/userController.js`
7. `backend/src/controllers/utteranceController.js`
8. `backend/src/controllers/websocketController.js` (if needed)
9. `backend/src/controllers/exportController.js` (PDF)

### Services (7 new files)
1. `backend/src/services/sessionService.js`
2. `backend/src/services/topicService.js`
3. `backend/src/services/utteranceService.js`
4. `backend/src/services/summaryService.js`
5. `backend/src/services/pdfService.js`
6. `backend/src/services/audioProcessingService.js`
7. `backend/src/services/correctionService.js` (MOVE existing)

### Models (7 new files)
1. `backend/src/models/sessionModel.js`
2. `backend/src/models/topicModel.js`
3. `backend/src/models/attemptModel.js`
4. `backend/src/models/utteranceModel.js`
5. `backend/src/models/correctionModel.js`
6. `backend/src/models/userModel.js` (expand existing)
7. `backend/src/models/summaryModel.js`

### Routes (6 new files)
1. `backend/src/routes/sessionRoutes.js`
2. `backend/src/routes/topicRoutes.js`
3. `backend/src/routes/attemptRoutes.js`
4. `backend/src/routes/correctionRoutes.js`
5. `backend/src/routes/summaryRoutes.js`
6. `backend/src/routes/userRoutes.js`

### Config/Setup (2 new files)
1. `backend/src/config/websocket.js` - Socket.IO setup
2. `backend/src/config/multer.js` - File upload config (if not exists)

### Utilities (4 new files)
1. `backend/src/utils/clerkHelpers.js`
2. `backend/src/utils/feedbackFormatter.js`
3. `backend/src/utils/scoreCalculator.js`
4. `backend/src/utils/sessionHelpers.js`

**Total New Files:** ~35 files

---

## 🔄 Files to Modify

1. `backend/src/app.js` - Add new routes & WebSocket setup
2. `backend/server.js` - Main server file integration
3. `backend/package.json` - Ensure all dependencies
4. `backend/.env.example` - Add new environment variables
5. `backend/src/middleware/clerkMiddleware.js` - Merge `requireUser()` logic

---

## 🎨 Architectural Decisions

### 1. **WebSocket Handling**
- **Option A:** Keep WebSocket logic in controllers (recommended)
- **Option B:** Create separate WebSocket service layer
- **Decision:** Option A - Controllers handle WebSocket events, call services for business logic

### 2. **Session State Management**
- **Option A:** In-memory session state (current in hala-edit)
- **Option B:** Redis-based session state
- **Decision:** Start with Option A, document Redis migration path

### 3. **Audio Processing**
- **Keep existing:** `audioService.js` and `audioController.js`
- **Integrate:** Audio upload for utterances into existing flow

### 4. **Error Handling**
- Use existing `errorMiddleware.js`
- Add WebSocket error handlers

### 5. **Authentication**
- Use existing `clerkMiddleware.js`
- Add WebSocket authentication from hala-edit's approach

---

## 🚨 Breaking Changes & Risks

### Potential Breaking Changes
1. **API Endpoint Changes:**
   - Old: `/api/sessions/start`
   - New: `/api/v1/sessions/start` (if versioning)
   - **Action:** Support both or document change

2. **WebSocket Event Names:**
   - Keep exact same event names to avoid frontend changes

3. **Response Format:**
   - Ensure response structure matches frontend expectations

### Risk Mitigation
1. **Testing:** Keep hala-edit branch for comparison testing
2. **Feature Flags:** Use env vars to toggle new features
3. **Gradual Rollout:** Migrate one module at a time
4. **Parallel Running:** Run both versions temporarily

---

## 📅 Migration Timeline

### Week 1: Core Infrastructure
- [x] Analyze both branches ✅
- [ ] Create refactor branch
- [ ] Set up WebSocket config
- [ ] Create base models (session, topic, attempt)
- [ ] Create base services

### Week 2: Critical Features
- [ ] Port session management
- [ ] Port topic/question system
- [ ] Port WebSocket handlers
- [ ] Port correction service

### Week 3: Secondary Features
- [ ] Port summary system
- [ ] Port PDF export
- [ ] Port user endpoints
- [ ] Port audio processing

### Week 4: Testing & Integration
- [ ] Integration testing
- [ ] Frontend compatibility testing
- [ ] Performance testing
- [ ] Documentation

---

## 📋 Checklist

### Pre-Migration
- [x] Analyze master structure
- [x] Inventory hala-edit features
- [x] Create migration plan
- [ ] Review with team
- [ ] Set up development branch

### During Migration
- [ ] Create file structure
- [ ] Port models (data layer)
- [ ] Port services (business logic)
- [ ] Port controllers (handlers)
- [ ] Port routes (endpoints)
- [ ] Port WebSocket logic
- [ ] Update app.js
- [ ] Update dependencies

### Post-Migration
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation
- [ ] Update README
- [ ] Create migration guide for team
- [ ] Merge to master

---

## 📝 Notes

- The monolithic `server.js` (1,285 lines) needs careful extraction
- WebSocket logic is tightly coupled - needs careful separation
- Correction service already exists in hala-edit, can be moved directly
- Topics seed data (`topics.json`) needs to be included
- Database schema is already defined in hala-edit
- Clerk authentication is used in both branches - merge approaches

---

## 🔗 Related Documents

- [QUESTIONS.md](./QUESTIONS.md) - Open questions and decisions needed
- [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) - Documented breaking changes
- [API_MAPPING.md](./API_MAPPING.md) - Old vs new endpoint mapping (TBD)

---

**Last Updated:** 2025-10-29  
**Status:** Ready for review and implementation

