# 📚 LexiLearn Refactor Documentation

**Goal:** Migrate all features from monolithic `hala-edit` branch into the modular structure of `master` branch.

---

## 📋 Quick Overview

### The Challenge
- **Source:** `hala-edit` branch - 1 massive `server.js` file (1,285 lines)
- **Target:** `master` branch - Modular structure (~25 organized files)
- **Mission:** Port 17 REST endpoints + 12 WebSocket events without breaking functionality

### Current Status
- ✅ **Phase 1 Complete:** Planning & Documentation
- ⏳ **Phase 2 Next:** Implementation begins

---

## 📄 Documentation Files

### 1. [PLAN.md](./PLAN.md) - **START HERE**
**Purpose:** Master refactor plan with complete feature inventory

**Contents:**
- Branch analysis (master vs hala-edit)
- Complete feature inventory (17 REST + 12 WebSocket)
- Migration mapping table
- 35+ new files to create
- 4-week timeline
- Detailed checklist

**Who needs this:** Everyone - this is the source of truth

---

### 2. [API_MAPPING.md](./API_MAPPING.md)
**Purpose:** Detailed endpoint-to-module mapping

**Contents:**
- Old → New endpoint mapping
- Controller → Service → Model assignments
- WebSocket event handlers
- New file structure diagram
- Implementation priority
- Progress tracker (currently 0/33 files)

**Who needs this:** Developers during implementation

---

### 3. [QUESTIONS.md](./QUESTIONS.md)
**Purpose:** Open questions & decisions needed

**Contents:**
- 13 open questions (5 critical, 5 medium, 3 low priority)
- Decision matrix
- Technical assumptions to verify
- Team discussion topics

**Critical Decisions:**
1. WebSocket authentication strategy
2. Session state management (in-memory vs Redis)
3. API versioning approach
4. Real-time vs REST for session flow
5. Audio storage strategy

**Who needs this:** Tech leads, product managers, architects

---

### 4. [BREAKING_CHANGES.md](./BREAKING_CHANGES.md)
**Purpose:** Track any breaking changes during migration

**Contents:**
- Confirmed breaking changes (none yet! ✅)
- Potential breaking changes (4 under discussion)
- Migration guides for frontend
- Rollback plan
- Communication plan

**Current Status:** Designed for backward compatibility

**Who needs this:** Frontend team, QA, product managers

---

## 🎯 Key Numbers

| Metric | Count |
|--------|-------|
| **Source Files (hala-edit)** | 3 files |
| **Target Files (master)** | 25+ files |
| **New Files to Create** | 35 files |
| **REST Endpoints** | 17 |
| **WebSocket Events** | 12 |
| **Database Tables** | 9 |
| **Lines of Code to Refactor** | ~1,285 |
| **Estimated Timeline** | 4 weeks |

---

## 🗂️ Feature Categories

### ✅ Already in Master
- Vocabulary CRUD
- Lessons management
- Audio processing
- Clerk authentication
- Database migrations

### 📦 Coming from hala-edit
- **Real-time lesson sessions** (WebSocket)
- Topic/Day management (60-day curriculum)
- Question system (6 per topic)
- Attempts & Utterances tracking
- AI-powered grammar correction
- PDF lesson export
- Session summary & scoring
- User progress tracking

---

## 🚀 Getting Started

### For Project Managers:
1. Read [PLAN.md](./PLAN.md) - Sections: "Overview" & "Migration Timeline"
2. Review [QUESTIONS.md](./QUESTIONS.md) - Make critical decisions
3. Check [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) - Understand impact

### For Developers:
1. Read [PLAN.md](./PLAN.md) - Complete document
2. Use [API_MAPPING.md](./API_MAPPING.md) - During implementation
3. Update progress in [API_MAPPING.md](./API_MAPPING.md) - Track files created

### For Frontend Team:
1. Check [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) - Any API changes?
2. Review [API_MAPPING.md](./API_MAPPING.md) - New endpoint paths
3. Test compatibility - Old frontend + new backend

### For QA:
1. Read [PLAN.md](./PLAN.md) - Section: "Feature Inventory"
2. Check [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) - Test cases
3. Plan testing strategy - REST + WebSocket

---

## 📅 Implementation Phases

### ✅ Phase 1: Planning (COMPLETE)
- [x] Analyze branches
- [x] Create documentation
- [x] Set up working branch

### ⏳ Phase 2: Core Infrastructure (Next)
- [ ] Create base models
- [ ] Set up WebSocket config
- [ ] Create base services

### 📋 Phase 3: Session Management
- [ ] Session CRUD
- [ ] WebSocket handlers
- [ ] Real-time flow

### 📋 Phase 4: Topics & Correction
- [ ] Topic management
- [ ] AI correction service
- [ ] Question system

### 📋 Phase 5: Summary & Export
- [ ] Summary aggregation
- [ ] PDF generation
- [ ] User endpoints

### 📋 Phase 6: Testing & Integration
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation

---

## 🎨 Architecture Principles

### Design Decisions:
1. **MVC Pattern:** Controllers → Services → Models
2. **Separation of Concerns:** Each module has single responsibility
3. **Reusability:** Shared utilities extracted
4. **Testability:** Each layer independently testable
5. **Maintainability:** Clear file structure & naming
6. **Scalability:** Prepared for horizontal scaling

### File Organization:
```
backend/src/
├── app.js              ← Main application
├── config/             ← Configuration (DB, WebSocket, etc.)
├── controllers/        ← Request handlers
├── services/           ← Business logic
├── models/             ← Database queries
├── routes/             ← Route definitions
├── middleware/         ← Auth, validation, errors
└── utils/              ← Helper functions
```

---

## 🔧 Tools & Technologies

### From hala-edit:
- Express.js (REST API)
- Socket.IO (WebSockets)
- PostgreSQL (Database)
- Clerk (Authentication)
- Gemini AI (Grammar correction)
- LanguageTool (Fallback correction)
- FFmpeg (Audio processing)
- PDFKit (PDF generation)
- Multer (File uploads)

### From master:
- Modular structure
- Error handling middleware
- Validation middleware
- Logger (Winston)
- Response helpers

---

## 📊 Progress Tracking

### Overall Progress: 0% (Phase 1 Complete)

| Phase | Status | Progress |
|-------|--------|----------|
| Planning | ✅ Complete | 100% |
| Infrastructure | ⏳ Next | 0% |
| Session Mgmt | 📋 Planned | 0% |
| Topics/Correction | 📋 Planned | 0% |
| Summary/Export | 📋 Planned | 0% |
| Testing | 📋 Planned | 0% |

### Files Created: 0/35 (0%)

See [API_MAPPING.md](./API_MAPPING.md) for detailed progress.

---

## 🤝 Contributing

### Before You Start:
1. Read this README
2. Read [PLAN.md](./PLAN.md)
3. Check [QUESTIONS.md](./QUESTIONS.md) for open decisions
4. Review [API_MAPPING.md](./API_MAPPING.md) for your assigned module

### During Implementation:
1. Follow the file structure in [API_MAPPING.md](./API_MAPPING.md)
2. Update progress tracker when you create files
3. Write tests for each module
4. Document any issues or questions

### After Implementation:
1. Update [API_MAPPING.md](./API_MAPPING.md) progress
2. Add to [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) if needed
3. Submit PR with clear description
4. Link related issues/documents

---

## 🆘 Need Help?

### Common Questions:
**Q: Where should I put this code?**  
A: Check [API_MAPPING.md](./API_MAPPING.md) - it maps every function to a file

**Q: Is this a breaking change?**  
A: Review criteria in [BREAKING_CHANGES.md](./BREAKING_CHANGES.md)

**Q: What's the priority of feature X?**  
A: Check "Feature Inventory" table in [PLAN.md](./PLAN.md)

**Q: How do I structure my new file?**  
A: See existing files in `backend/src/` for patterns

### Contact:
- GitHub Issues: Tag with `refactor` label
- Slack: #lexi-learn-dev channel
- Email: engineering@lexilearn.com

---

## 📝 Updates & Changelog

| Date | Update | Author |
|------|--------|--------|
| 2025-10-29 | Created refactor documentation | AI Agent |
| 2025-10-29 | Set up working branch | AI Agent |
| - | - | - |

---

## 🎯 Success Criteria

### Must Have:
- ✅ All 17 REST endpoints working
- ✅ All 12 WebSocket events working
- ✅ Zero breaking changes (backward compatible)
- ✅ All tests passing
- ✅ Documentation complete

### Nice to Have:
- Improved performance
- Better error messages
- Enhanced logging
- Monitoring hooks

### Definition of Done:
1. All features ported
2. All tests passing
3. Frontend works without changes
4. Documentation updated
5. Code review approved
6. Successfully merged to master

---

**Last Updated:** 2025-10-29  
**Working Branch:** `refactor/port-hala-edit-to-master`  
**Status:** 📋 Planning Complete, Ready for Implementation

---

## 🔗 Quick Links

- [Complete Plan](./PLAN.md)
- [API Mapping](./API_MAPPING.md)
- [Open Questions](./QUESTIONS.md)
- [Breaking Changes](./BREAKING_CHANGES.md)
- [Main README](../../README.md)

