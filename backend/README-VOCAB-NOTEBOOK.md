# 📖 Vocabulary Notebook API Documentation

## Overview
The Vocabulary Notebook feature allows users to save, manage, and organize words they learn during lessons. Each user has their own personal vocabulary collection.

## Database Schema

### Table: `user_vocab_words`
```sql
CREATE TABLE user_vocab_words (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  lesson VARCHAR(255),
  word VARCHAR(255) NOT NULL,
  translation VARCHAR(255),
  example TEXT,
  audio_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Indexes:**
- `idx_user_vocab_words_user` - Fast lookups by user
- `idx_user_vocab_words_lesson` - Fast filtering by lesson
- `idx_user_vocab_unique` - Prevents duplicate words per user

## API Endpoints

### Base URL
```
/api/v1/vocab/notebook
```

### Authentication
All endpoints require Clerk authentication. Include the Bearer token in the Authorization header:
```
Authorization: Bearer <clerk_token>
```

---

### 1. Get Vocabulary Notebook
**Endpoint:** `GET /api/v1/vocab/notebook`

**Description:** Retrieve user's vocabulary words with pagination, search, and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Current page number |
| limit | number | 10 | Items per page |
| search | string | - | Search in word/translation/lesson |
| lesson | string | - | Filter by specific lesson |
| sortBy | string | word | Sort column (word, lesson, created_at) |
| sortOrder | string | asc | Sort direction (asc, desc) |

**Example Request:**
```bash
GET /api/v1/vocab/notebook?page=1&limit=10&search=hello&sortBy=word&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "words": [
      {
        "id": "uuid",
        "lesson": "Lesson 1: Greetings",
        "word": "Hello",
        "translation": "مرحبا",
        "example": "Hello, how are you?",
        "audio_url": "https://...",
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z"
      }
    ],
    "totalWords": 45,
    "uniqueLessons": ["Lesson 1: Greetings", "Lesson 2: Travel"],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 2. Add Word to Notebook
**Endpoint:** `POST /api/v1/vocab/notebook`

**Description:** Add a new word to user's vocabulary notebook.

**Request Body:**
```json
{
  "lesson": "Lesson 1: Greetings",
  "word": "Hello",
  "translation": "مرحبا",
  "example": "Hello, how are you?",
  "audioUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Word added to vocabulary successfully",
  "data": {
    "id": "uuid",
    "lesson": "Lesson 1: Greetings",
    "word": "Hello",
    "translation": "مرحبا",
    "example": "Hello, how are you?",
    "audio_url": "https://...",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Cases:**
- `400` - Word already exists in vocabulary
- `401` - Unauthorized
- `500` - Server error

---

### 3. Update Word in Notebook
**Endpoint:** `PUT /api/v1/vocab/notebook/:id`

**Description:** Update an existing word in user's vocabulary.

**Request Body:** (all fields optional)
```json
{
  "lesson": "Lesson 1: Greetings",
  "word": "Hi",
  "translation": "مرحبا",
  "example": "Hi there!",
  "audioUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Word updated successfully",
  "data": {
    "id": "uuid",
    "lesson": "Lesson 1: Greetings",
    "word": "Hi",
    "translation": "مرحبا",
    "example": "Hi there!",
    "audio_url": "https://...",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T12:00:00Z"
  }
}
```

**Error Cases:**
- `404` - Word not found in vocabulary
- `400` - No fields to update or duplicate word
- `401` - Unauthorized
- `500` - Server error

---

### 4. Delete Word from Notebook
**Endpoint:** `DELETE /api/v1/vocab/notebook/:id`

**Description:** Remove a word from user's vocabulary.

**Response:**
```json
{
  "success": true,
  "message": "Word \"Hello\" deleted successfully"
}
```

**Error Cases:**
- `404` - Word not found in vocabulary
- `401` - Unauthorized
- `500` - Server error

---

### 5. Get Vocabulary Statistics
**Endpoint:** `GET /api/v1/vocab/notebook/stats`

**Description:** Get statistics about user's vocabulary.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWords": 45,
    "uniqueLessons": 12,
    "wordsWithAudio": 38,
    "lastAdded": "2025-01-15T10:30:00Z"
  }
}
```

---

## Frontend Integration

### Custom Hooks

The frontend provides custom hooks for easy API integration:

```javascript
import {
  useVocabNotebook,
  useAddWord,
  useUpdateWord,
  useDeleteWord,
  useVocabStats
} from '../../hooks/useVocabNotebook';
```

#### Example Usage:

```javascript
function VocabNotebook() {
  const {
    words,
    totalWords,
    uniqueLessons,
    pagination,
    loading,
    error,
    refetch
  } = useVocabNotebook({
    page: 1,
    limit: 10,
    search: '',
    lesson: '',
    sortBy: 'word',
    sortOrder: 'asc',
    autoFetch: true
  });

  const { deleteWord } = useDeleteWord();

  const handleDelete = async (wordId) => {
    await deleteWord(wordId);
    refetch();
  };

  return (
    <div>
      {words.map(word => (
        <WordCard key={word.id} word={word} onDelete={handleDelete} />
      ))}
    </div>
  );
}
```

---

## Setup Instructions

### 1. Database Setup

**Option A: Fresh Installation**
Run the complete init script:
```bash
psql -U postgres -d lexi_learn -f backend/database/init.sql
```

**Option B: Existing Database (Migration)**
Run only the vocab table migration:
```bash
psql -U postgres -d lexi_learn -f backend/database/migrations/001_create_user_vocab_words.sql
```

### 2. Backend Setup

The routes are already registered in `backend/src/app.js`:
```javascript
const vocabRouter = require('./routes/vocabRoutes');
app.use('/api/v1/vocab', vocabRouter);
```

### 3. Frontend Setup

The frontend component is located at:
```
frontend/src/pages/VocabsNotebook/VocabsNotebook.jsx
```

Make sure your `.env` file has the correct API URL:
```env
VITE_API_URL=http://localhost:3001
```

---

## Testing

### Test with cURL:

```bash
# Get vocabulary notebook
curl -X GET "http://localhost:3001/api/v1/vocab/notebook?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# Add word
curl -X POST "http://localhost:3001/api/v1/vocab/notebook" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson": "Test Lesson",
    "word": "Test",
    "translation": "اختبار"
  }'

# Delete word
curl -X DELETE "http://localhost:3001/api/v1/vocab/notebook/WORD_UUID" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

---

## Features

✅ **Implemented:**
- Full CRUD operations for vocabulary words
- Pagination and filtering
- Search functionality
- Sort by word, lesson, or date
- Duplicate word prevention
- User isolation (each user sees only their words)
- Statistics endpoint
- Frontend integration with custom hooks
- Loading and error states
- Clerk authentication

🎯 **Future Enhancements:**
- Export vocabulary to PDF/CSV
- Spaced repetition learning
- Word flashcards
- Audio pronunciation playback
- Bulk import/export
- Tags and categories
- Practice quizzes

---

## Architecture

```
Backend:
  ├── controllers/vocabNotebookController.js  (Business logic)
  ├── routes/vocabRoutes.js                   (Route definitions)
  └── database/
      ├── init.sql                            (Complete schema)
      └── migrations/001_create_user_vocab_words.sql

Frontend:
  ├── hooks/useVocabNotebook.js               (Custom hooks)
  ├── pages/VocabsNotebook/VocabsNotebook.jsx (Main component)
  └── components/reusable/VocabCard/          (Word card component)
```

---

## Notes

- All routes are protected with Clerk authentication
- Words are unique per user (same word can exist for different users)
- Soft delete is not implemented (words are permanently deleted)
- Audio URLs are stored but not automatically generated
- The lesson field is free-text (not enforced foreign key)

---

## Support

For issues or questions, refer to the main project documentation or contact the development team.

