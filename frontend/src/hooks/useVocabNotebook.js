import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

/**
 * Custom hook to manage vocabulary notebook
 * @param {object} options - Hook options
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Items per page
 * @param {string} options.search - Search query
 * @param {string} options.lesson - Lesson filter
 * @param {string} options.sortBy - Sort column (word, lesson, created_at)
 * @param {string} options.sortOrder - Sort order (asc, desc)
 * @param {boolean} options.autoFetch - Whether to fetch data automatically
 */
export const useVocabNotebook = (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    lesson = '',
    sortBy = 'word',
    sortOrder = 'asc',
    autoFetch = true
  } = options;

  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVocabNotebook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (search) params.append('search', search);
      if (lesson) params.append('lesson', lesson);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/vocab/notebook?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch vocabulary notebook');
      }
    } catch (err) {
      console.error('Vocab notebook fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, limit, search, lesson, sortBy, sortOrder]);

  useEffect(() => {
    if (autoFetch) {
      fetchVocabNotebook();
    }
  }, [autoFetch, fetchVocabNotebook]);

  return {
    words: data?.words || [],
    totalWords: data?.totalWords || 0,
    uniqueLessons: data?.uniqueLessons || [],
    pagination: data?.pagination || null,
    loading,
    error,
    refetch: fetchVocabNotebook,
  };
};

/**
 * Hook to manage adding words to notebook
 */
export const useAddWord = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addWord = async (wordData) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/vocab/notebook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wordData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to add word');
      }

      return result.data;
    } catch (err) {
      console.error('Add word error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addWord,
    loading,
    error,
  };
};

/**
 * Hook to manage updating words in notebook
 */
export const useUpdateWord = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateWord = async (id, wordData) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/vocab/notebook/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wordData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update word');
      }

      return result.data;
    } catch (err) {
      console.error('Update word error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateWord,
    loading,
    error,
  };
};

/**
 * Hook to manage deleting words from notebook
 */
export const useDeleteWord = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteWord = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/vocab/notebook/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete word');
      }

      return result;
    } catch (err) {
      console.error('Delete word error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteWord,
    loading,
    error,
  };
};

/**
 * Hook to fetch vocabulary statistics
 */
export const useVocabStats = () => {
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/vocab/notebook/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Vocab stats fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

