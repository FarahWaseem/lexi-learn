const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all lessons
// @route   GET /api/v1/lessons
// @access  Private
const getLessons = async (req, res) => {
  try {
    const { page = 1, limit = 10, level, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    // Add level filter if provided
    if (level) {
      paramCount++;
      whereClause += `WHERE level = $${paramCount}`;
      queryParams.push(level);
    }

    // Add search filter if provided
    if (search) {
      paramCount++;
      const searchCondition = `title_en ILIKE $${paramCount}`;
      whereClause += whereClause ? ` AND ${searchCondition}` : `WHERE ${searchCondition}`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM daily_topics ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT id, day_number, title_en, level, content, audio_url, estimated_minutes
      FROM daily_topics 
      ${whereClause}
      ORDER BY day_number ASC
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
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons'
    });
  }
};

// @desc    Get specific lesson
// @route   GET /api/v1/lessons/:id
// @access  Private
const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM daily_topics WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get lesson by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson'
    });
  }
};

// @desc    Get words for a lesson
// @route   GET /api/v1/lessons/:id/words
// @access  Private
const getLessonWords = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM topic_words WHERE topic_id = $1 ORDER BY term ASC',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get lesson words error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson words'
    });
  }
};

// @desc    Create new lesson
// @route   POST /api/v1/lessons
// @access  Private
const createLesson = async (req, res) => {
  try {
    const { dayNumber, titleEn, level, content, audioUrl, estimatedMinutes } = req.body;

    // Check if day number already exists
    const existingDay = await query(
      'SELECT id FROM daily_topics WHERE day_number = $1',
      [dayNumber]
    );

    if (existingDay.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Day number already exists'
      });
    }

    const result = await query(
      `INSERT INTO daily_topics (day_number, title_en, level, content, audio_url, estimated_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [dayNumber, titleEn, level, content, audioUrl, estimatedMinutes]
    );

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lesson'
    });
  }
};

// @desc    Update lesson
// @route   PUT /api/v1/lessons/:id
// @access  Private
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayNumber, titleEn, level, content, audioUrl, estimatedMinutes } = req.body;

    // Check if lesson exists
    const existingLesson = await query(
      'SELECT id FROM daily_topics WHERE id = $1',
      [id]
    );

    if (existingLesson.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if new day number already exists (if day number is being changed)
    if (dayNumber) {
      const duplicateDay = await query(
        'SELECT id FROM daily_topics WHERE day_number = $1 AND id != $2',
        [dayNumber, id]
      );

      if (duplicateDay.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Day number already exists'
        });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (dayNumber !== undefined) {
      paramCount++;
      updateFields.push(`day_number = $${paramCount}`);
      updateValues.push(dayNumber);
    }
    if (titleEn !== undefined) {
      paramCount++;
      updateFields.push(`title_en = $${paramCount}`);
      updateValues.push(titleEn);
    }
    if (level !== undefined) {
      paramCount++;
      updateFields.push(`level = $${paramCount}`);
      updateValues.push(level);
    }
    if (content !== undefined) {
      paramCount++;
      updateFields.push(`content = $${paramCount}`);
      updateValues.push(content);
    }
    if (audioUrl !== undefined) {
      paramCount++;
      updateFields.push(`audio_url = $${paramCount}`);
      updateValues.push(audioUrl);
    }
    if (estimatedMinutes !== undefined) {
      paramCount++;
      updateFields.push(`estimated_minutes = $${paramCount}`);
      updateValues.push(estimatedMinutes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(id);

    const updateQuery = `
      UPDATE daily_topics 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson'
    });
  }
};

// @desc    Delete lesson
// @route   DELETE /api/v1/lessons/:id
// @access  Private
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM daily_topics WHERE id = $1 RETURNING title_en',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      message: `Lesson "${result.rows[0].title_en}" deleted successfully`
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson'
    });
  }
};

// @desc    Add word to lesson
// @route   POST /api/v1/lessons/:id/words
// @access  Private
const addWordToLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { term, meaning, example, audioUrl } = req.body;

    // Check if lesson exists
    const lessonExists = await query(
      'SELECT id FROM daily_topics WHERE id = $1',
      [id]
    );

    if (lessonExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const result = await query(
      `INSERT INTO topic_words (topic_id, term, meaning, example, audio_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, term, meaning, example, audioUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Word added to lesson successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add word to lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add word to lesson'
    });
  }
};

// @desc    Remove word from lesson
// @route   DELETE /api/v1/lessons/:id/words/:wordId
// @access  Private
const removeWordFromLesson = async (req, res) => {
  try {
    const { id, wordId } = req.params;

    const result = await query(
      'DELETE FROM topic_words WHERE id = $1 AND topic_id = $2 RETURNING term',
      [wordId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Word not found in this lesson'
      });
    }

    res.json({
      success: true,
      message: `Word "${result.rows[0].term}" removed from lesson successfully`
    });
  } catch (error) {
    console.error('Remove word from lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove word from lesson'
    });
  }
};

module.exports = {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonWords,
  addWordToLesson,
  removeWordFromLesson
};
