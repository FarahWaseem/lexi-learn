const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// @desc    Get user's vocabulary notebook (compatible with VocabsNotebook.jsx)
// @route   GET /api/v1/vocab/notebook
// @access  Private (Clerk)
const getVocabNotebook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search, lesson, sortBy = 'word', sortOrder = 'asc' } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = $1';
    let queryParams = [userId];
    let paramCount = 1;

    // Add search filter if provided
    if (search) {
      paramCount++;
      whereClause += ` AND (word ILIKE $${paramCount} OR translation ILIKE $${paramCount} OR lesson ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add lesson filter if provided
    if (lesson) {
      paramCount++;
      whereClause += ` AND lesson = $${paramCount}`;
      queryParams.push(lesson);
    }

    // Build ORDER BY clause
    const validSortColumns = ['word', 'lesson', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'word';
    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    const orderBy = `ORDER BY ${sortColumn} ${orderDirection}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM user_vocab_words 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT id, lesson, word, translation, example, audio_url, created_at, updated_at
      FROM user_vocab_words 
      ${whereClause}
      ${orderBy}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    queryParams.push(limit, offset);
    
    const result = await query(dataQuery, queryParams);

    // Get unique lessons for filtering
    const lessonsQuery = `
      SELECT DISTINCT lesson 
      FROM user_vocab_words 
      WHERE user_id = $1 
      ORDER BY lesson ASC
    `;
    const lessonsResult = await query(lessonsQuery, [userId]);
    const uniqueLessons = lessonsResult.rows.map(row => row.lesson);

    res.json({
      success: true,
      data: {
        words: result.rows,
        totalWords: total,
        uniqueLessons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get vocab notebook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vocabulary notebook'
    });
  }
};

// @desc    Add word to vocabulary notebook
// @route   POST /api/v1/vocab/notebook
// @access  Private (Clerk)
const addWordToNotebook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lesson, word, translation, example, audioUrl } = req.body;

    // Check if word already exists for this user
    const existingWord = await query(
      'SELECT id FROM user_vocab_words WHERE user_id = $1 AND word = $2',
      [userId, word]
    );

    if (existingWord.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Word already exists in your vocabulary'
      });
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO user_vocab_words (id, user_id, lesson, word, translation, example, audio_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [id, userId, lesson, word, translation, example, audioUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Word added to vocabulary successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add word to notebook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add word to vocabulary'
    });
  }
};

// @desc    Update word in vocabulary notebook
// @route   PUT /api/v1/vocab/notebook/:id
// @access  Private (Clerk)
const updateWordInNotebook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { lesson, word, translation, example, audioUrl } = req.body;

    // Check if word exists and belongs to user
    const existingWord = await query(
      'SELECT id FROM user_vocab_words WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingWord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Word not found in your vocabulary'
      });
    }

    // Check if new word already exists (if word is being changed)
    if (word) {
      const duplicateWord = await query(
        'SELECT id FROM user_vocab_words WHERE user_id = $1 AND word = $2 AND id != $3',
        [userId, word, id]
      );

      if (duplicateWord.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Word already exists in your vocabulary'
        });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (lesson !== undefined) {
      paramCount++;
      updateFields.push(`lesson = $${paramCount}`);
      updateValues.push(lesson);
    }
    if (word !== undefined) {
      paramCount++;
      updateFields.push(`word = $${paramCount}`);
      updateValues.push(word);
    }
    if (translation !== undefined) {
      paramCount++;
      updateFields.push(`translation = $${paramCount}`);
      updateValues.push(translation);
    }
    if (example !== undefined) {
      paramCount++;
      updateFields.push(`example = $${paramCount}`);
      updateValues.push(example);
    }
    if (audioUrl !== undefined) {
      paramCount++;
      updateFields.push(`audio_url = $${paramCount}`);
      updateValues.push(audioUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id, userId);

    const updateQuery = `
      UPDATE user_vocab_words 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Word updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update word in notebook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update word'
    });
  }
};

// @desc    Delete word from vocabulary notebook
// @route   DELETE /api/v1/vocab/notebook/:id
// @access  Private (Clerk)
const deleteWordFromNotebook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM user_vocab_words WHERE id = $1 AND user_id = $2 RETURNING word',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Word not found in your vocabulary'
      });
    }

    res.json({
      success: true,
      message: `Word "${result.rows[0].word}" deleted successfully`
    });
  } catch (error) {
    console.error('Delete word from notebook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete word'
    });
  }
};

// @desc    Get vocabulary statistics
// @route   GET /api/v1/vocab/notebook/stats
// @access  Private (Clerk)
const getVocabStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_words,
        COUNT(DISTINCT lesson) as unique_lessons,
        COUNT(CASE WHEN audio_url IS NOT NULL THEN 1 END) as words_with_audio,
        MAX(created_at) as last_added
      FROM user_vocab_words 
      WHERE user_id = $1
    `;

    const result = await query(statsQuery, [userId]);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalWords: parseInt(stats.total_words),
        uniqueLessons: parseInt(stats.unique_lessons),
        wordsWithAudio: parseInt(stats.words_with_audio),
        lastAdded: stats.last_added
      }
    });
  } catch (error) {
    console.error('Get vocab stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vocabulary statistics'
    });
  }
};

module.exports = {
  getVocabNotebook,
  addWordToNotebook,
  updateWordInNotebook,
  deleteWordFromNotebook,
  getVocabStats
};
