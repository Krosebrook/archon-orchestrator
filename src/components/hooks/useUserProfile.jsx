/**
 * @fileoverview User Profile Hook
 * @description React hook for managing user profile and preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/components/services/UserService';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook for managing user profile and preferences.
 */
export function useUserProfile() {
  const { user, organization } = useAuth();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.email) return;

    try {
      const [profileResult, prefsResult] = await Promise.all([
        userService.getProfile(user.email),
        userService.getPreferences(user.email)
      ]);

      if (profileResult.ok) setProfile(profileResult.value);
      if (prefsResult.ok) setPreferences(prefsResult.value);
    } catch (error) {
      console.error('[Profile] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (data) => {
    if (!user?.email || !organization?.id) return false;

    setSaving(true);
    try {
      const result = await userService.updateProfile(user.email, organization.id, data);

      if (result.ok) {
        setProfile(result.value);
        toast.success('Profile updated');
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (error) {
      console.error('[Profile] Update error:', error);
      toast.error('Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.email, organization?.id]);

  const updatePreferences = useCallback(async (data) => {
    if (!user?.email || !organization?.id) return false;

    setSaving(true);
    try {
      const result = await userService.updatePreferences(user.email, organization.id, data);

      if (result.ok) {
        setPreferences(result.value);
        toast.success('Preferences updated');
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (error) {
      console.error('[Preferences] Update error:', error);
      toast.error('Failed to update preferences');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.email, organization?.id]);

  const generateApiKey = useCallback(async () => {
    if (!user?.email || !organization?.id) return null;

    setSaving(true);
    try {
      const result = await userService.generateApiKey(user.email, organization.id);

      if (result.ok) {
        setProfile(result.value);
        toast.success('API key generated');
        return result.value.api_key;
      } else {
        toast.error(result.error.message);
        return null;
      }
    } catch (error) {
      console.error('[API Key] Generate error:', error);
      toast.error('Failed to generate API key');
      return null;
    } finally {
      setSaving(false);
    }
  }, [user?.email, organization?.id]);

  const revokeApiKey = useCallback(async () => {
    if (!user?.email || !organization?.id) return false;

    setSaving(true);
    try {
      const result = await userService.revokeApiKey(user.email, organization.id);

      if (result.ok) {
        setProfile(result.value);
        toast.success('API key revoked');
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (error) {
      console.error('[API Key] Revoke error:', error);
      toast.error('Failed to revoke API key');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.email, organization?.id]);

  const toggle2FA = useCallback(async (enable) => {
    if (!user?.email || !organization?.id) return false;

    setSaving(true);
    try {
      const result = enable 
        ? await userService.enable2FA(user.email, organization.id)
        : await userService.disable2FA(user.email, organization.id);

      if (result.ok) {
        setProfile(result.value);
        toast.success(enable ? '2FA enabled' : '2FA disabled');
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (error) {
      console.error('[2FA] Toggle error:', error);
      toast.error('Failed to update 2FA settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.email, organization?.id]);

  return {
    profile,
    preferences,
    loading,
    saving,
    updateProfile,
    updatePreferences,
    generateApiKey,
    revokeApiKey,
    toggle2FA,
    refresh: loadProfile
  };
}