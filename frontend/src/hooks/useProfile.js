import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser as useClerkUser } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

/**
 * Custom hook to manage user profile
 */
export const useProfile = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * Fetch user profile from backend
   */
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
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
        setProfile(result.profile);
      } else {
        throw new Error(result.error || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.message);
      
      // Fallback to Clerk user data if backend fails
      if (clerkUser) {
        setProfile({
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, clerkUser]);

  /**
   * Update user profile
   */
  const updateProfile = async (firstName, lastName) => {
    try {
      setSaving(true);
      setError(null);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update local state with new data
      setProfile(result.profile);
      
      // Update localStorage cache
      try {
        const cachedMe = localStorage.getItem('me');
        if (cachedMe) {
          const meData = JSON.parse(cachedMe);
          meData.first_name = firstName;
          meData.last_name = lastName;
          localStorage.setItem('me', JSON.stringify(meData));
        }
      } catch (e) {
        console.warn('Failed to update localStorage cache:', e);
      }

      return { success: true, profile: result.profile };
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    saving,
    updateProfile,
    refetch: fetchProfile,
  };
};

/**
 * Hook to get profile settings
 */
export const useProfileSettings = () => {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/profile/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.ok) {
        setSettings(result.settings);
      } else {
        throw new Error(result.error || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
  };
};

