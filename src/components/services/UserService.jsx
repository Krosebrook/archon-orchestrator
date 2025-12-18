/**
 * @fileoverview User Service
 * @description Service layer for user profile and preferences management.
 */

import { base44 } from '@/api/base44Client';
import { APIError, ErrorCodes } from '../utils/api-client';

/**
 * User Service - handles user profile and preferences.
 */
export class UserService {
  /**
   * Get user profile.
   */
  async getProfile(userEmail) {
    try {
      const [profile] = await base44.entities.UserProfile.filter({ user_email: userEmail });
      return { ok: true, value: profile || null };
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(ErrorCodes.SERVER_ERROR, 'Failed to get profile')
      };
    }
  }

  /**
   * Update user profile.
   */
  async updateProfile(userEmail, orgId, data) {
    try {
      const [existing] = await base44.entities.UserProfile.filter({ user_email: userEmail });
      
      if (existing) {
        const updated = await base44.entities.UserProfile.update(existing.id, data);
        return { ok: true, value: updated };
      } else {
        const created = await base44.entities.UserProfile.create({
          user_email: userEmail,
          org_id: orgId,
          ...data
        });
        return { ok: true, value: created };
      }
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(ErrorCodes.SERVER_ERROR, 'Failed to update profile')
      };
    }
  }

  /**
   * Get user preferences.
   */
  async getPreferences(userEmail) {
    try {
      const [prefs] = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return { ok: true, value: prefs || this.getDefaultPreferences() };
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(ErrorCodes.SERVER_ERROR, 'Failed to get preferences')
      };
    }
  }

  /**
   * Update user preferences.
   */
  async updatePreferences(userEmail, orgId, data) {
    try {
      const [existing] = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      
      if (existing) {
        const updated = await base44.entities.UserPreferences.update(existing.id, data);
        return { ok: true, value: updated };
      } else {
        const created = await base44.entities.UserPreferences.create({
          user_email: userEmail,
          org_id: orgId,
          ...data
        });
        return { ok: true, value: created };
      }
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(ErrorCodes.SERVER_ERROR, 'Failed to update preferences')
      };
    }
  }

  /**
   * Generate API key.
   */
  async generateApiKey(userEmail, orgId) {
    try {
      const key = `archon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const result = await this.updateProfile(userEmail, orgId, { api_key: key });
      return result;
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(ErrorCodes.SERVER_ERROR, 'Failed to generate API key')
      };
    }
  }

  /**
   * Revoke API key.
   */
  async revokeApiKey(userEmail, orgId) {
    return this.updateProfile(userEmail, orgId, { api_key: null });
  }

  /**
   * Enable 2FA for user.
   */
  async enable2FA(userEmail, orgId) {
    return this.updateProfile(userEmail, orgId, { two_factor_enabled: true });
  }

  /**
   * Disable 2FA for user.
   */
  async disable2FA(userEmail, orgId) {
    return this.updateProfile(userEmail, orgId, { two_factor_enabled: false });
  }

  /**
   * Get default preferences.
   */
  getDefaultPreferences() {
    return {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      notification_preferences: {
        email_enabled: true,
        push_enabled: true,
        workflow_events: true,
        agent_events: true,
        approval_requests: true,
        security_alerts: true
      },
      accessibility: {
        reduced_motion: false,
        high_contrast: false,
        font_size: 'medium'
      }
    };
  }
}

// Singleton instance
export const userService = new UserService();