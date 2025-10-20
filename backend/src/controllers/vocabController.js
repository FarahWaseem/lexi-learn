const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all vocab words for a user
// @route   GET /api/v1/vocab
// @access  Private
const getVocabWords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search, sortBy = 'word', sortOrder = 'asc' } = req.query;
    
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

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get vocab words error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vocabulary words'
    });
  }
};

// @desc    Search vocab words
// @route   GET /api/v1/vocab/search
// @access  Private
const searchVocabWords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchQuery = `
      SELECT id, lesson, word, translation, example, audio_url
      FROM user_vocab_words 
      WHERE user_id = $1 
      AND (word ILIKE $2 OR translation ILIKE $2 OR lesson ILIKE $2)
      ORDER BY 
        CASE 
          WHEN word ILIKE $3 THEN 1
          WHEN translation ILIKE $3 THEN 2
          ELSE 3
        END,
        word ASC
      LIMIT $4
    `;

    const searchTerm = `%${q}%`;
    const exactMatch = `${q}%`;
    
    const result = await query(searchQuery, [userId, searchTerm, exactMatch, parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows,
      query: q,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Search vocab words error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

// @desc    Get vocab statistics
// @route   GET /api/v1/vocab/stats
// @access  Private
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

// @desc    Get specific vocab word
// @route   GET /api/v1/vocab/:id
// @access  Private
const getVocabWordById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'SELECT * FROM user_vocab_words WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vocabulary word not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get vocab word by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vocabulary word'
    });
  }
};

// @desc    Create new vocab word
// @route   POST /api/v1/vocab
// @access  Private
const createVocabWord = async (req, res) => {
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
      message: 'Vocabulary word created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create vocab word error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vocabulary word'
    });
  }
};

// @desc    Update vocab word
// @route   PUT /api/v1/vocab/:id
// @access  Private
const updateVocabWord = async (req, res) => {
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
        message: 'Vocabulary word not found'
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
      message: 'Vocabulary word updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update vocab word error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vocabulary word'
    });
  }
};

// @desc    Delete vocab word
// @route   DELETE /api/v1/vocab/:id
// @access  Private
const deleteVocabWord = async (req, res) => {
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
        message: 'Vocabulary word not found'
      });
    }

    res.json({
      success: true,
      message: `Vocabulary word "${result.rows[0].word}" deleted successfully`
    });
  } catch (error) {
    console.error('Delete vocab word error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vocabulary word'
    });
  }
};

module.exports = {
  getVocabWords,
  createVocabWord,
  updateVocabWord,
  deleteVocabWord,
  getVocabWordById,
  searchVocabWords,
  getVocabStats
};
