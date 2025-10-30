import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

/**
 * Custom hook to fetch student dashboard data
 * @param {boolean} autoFetch - Whether to fetch data automatically on mount
 * @returns {object} Dashboard data and loading state
 */
export const useDashboard = (autoFetch = true) => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/student/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        setData(result);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
};

/**
 * Fetch only dashboard stats (lighter request)
 */
export const useDashboardStats = () => {
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/student/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.ok) {
        setStats(result);
      } else {
        throw new Error(result.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

/**
 * Fetch practice history
 */
export const usePracticeHistory = (days = 7) => {
  const { getToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        
        const response = await fetch(
          `${API_BASE_URL}/api/student/practice-history?days=${days}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (result.ok) {
          setHistory(result.practiceHistory || []);
        } else {
          throw new Error(result.error || 'Failed to fetch history');
        }
      } catch (err) {
        console.error('History fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return {
    history,
    loading,
    error,
  };
};

/**
 * Fetch next lesson
 */
export const useNextLesson = () => {
  const { getToken } = useAuth();
  const [nextLesson, setNextLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNextLesson = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/student/next-lesson`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.ok) {
        setNextLesson(result.nextLesson);
      } else {
        throw new Error(result.error || 'Failed to fetch next lesson');
      }
    } catch (err) {
      console.error('Next lesson fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    nextLesson,
    loading,
    error,
    refetch: fetchNextLesson,
  };
};

