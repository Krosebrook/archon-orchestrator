/**
 * @fileoverview Onboarding Hook
 * @description Manages onboarding tour state and user preferences
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { base44 } from '@/api/base44Client';

export function useOnboarding() {
  const { user, organization } = useAuth();
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboardingState();
  }, [user?.email]);

  const loadOnboardingState = async () => {
    if (!user?.email || !organization?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const preferences = await base44.entities.UserPreferences.filter({
        user_email: user.email,
      });

      if (preferences.length > 0) {
        const tourStatus = preferences[0].dashboard_layout?.tour_completed || false;
        setTourCompleted(tourStatus);
        setShowTour(!tourStatus);
      } else {
        setShowTour(true);
      }
    } catch (error) {
      console.error('[useOnboarding] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTour = useCallback(async () => {
    if (!user?.email || !organization?.id) return;

    try {
      const preferences = await base44.entities.UserPreferences.filter({
        user_email: user.email,
      });

      const dashboardLayout = preferences[0]?.dashboard_layout || {};
      dashboardLayout.tour_completed = true;

      if (preferences.length > 0) {
        await base44.entities.UserPreferences.update(preferences[0].id, {
          dashboard_layout: dashboardLayout,
        });
      } else {
        await base44.entities.UserPreferences.create({
          user_email: user.email,
          org_id: organization.id,
          dashboard_layout: dashboardLayout,
        });
      }

      setTourCompleted(true);
      setShowTour(false);
    } catch (error) {
      console.error('[useOnboarding] Save error:', error);
    }
  }, [user?.email, organization?.id]);

  const skipTour = useCallback(async () => {
    await completeTour();
  }, [completeTour]);

  const restartTour = useCallback(() => {
    setShowTour(true);
  }, []);

  return {
    showTour,
    tourCompleted,
    isLoading,
    completeTour,
    skipTour,
    restartTour,
  };
}