/**
 * @fileoverview Secret Management Client (Frontend)
 * @description Interface for backend secret operations.
 * Actual secrets are stored in AWS Secrets Manager via backend functions.
 * 
 * @module components/security/SecretManager
 * @version 1.0.0
 */

import { base44 } from '@/api/base44Client';
import { APIError, ErrorCodes } from '../shared/constants';

/**
 * Secret reference (not the actual secret).
 */
export class SecretReference {
  constructor(name, arn, metadata = {}) {
    this.name = name;
    this.arn = arn;
    this.metadata = metadata;
  }
}

/**
 * Fetches secret metadata (not values) for UI display.
 */
export async function listSecretReferences() {
  try {
    const { data } = await base44.functions.invoke('listSecrets');
    return data.map(s => new SecretReference(s.name, s.arn, s.metadata));
  } catch (_error) {
    throw new APIError(
      ErrorCodes.SERVER_ERROR,
      'Failed to list secrets',
      { retryable: true }
    );
  }
}

/**
 * Creates a new secret (admin only).
 */
export async function createSecret(name, description) {
  try {
    const { data } = await base44.functions.invoke('createSecret', {
      name,
      description
    });
    return new SecretReference(data.name, data.arn);
  } catch (error) {
    throw new APIError(
      ErrorCodes.SERVER_ERROR,
      error.message || 'Failed to create secret',
      { retryable: false }
    );
  }
}

/**
 * Initiates secret rotation (admin only).
 */
export async function rotateSecret(name) {
  try {
    await base44.functions.invoke('rotateSecret', { name });
    return { success: true };
  } catch (error) {
    throw new APIError(
      ErrorCodes.SERVER_ERROR,
      error.message || 'Failed to rotate secret',
      { retryable: true }
    );
  }
}

/**
 * Deletes a secret with recovery window (admin only).
 */
export async function deleteSecret(name, recoveryWindowInDays = 30) {
  try {
    await base44.functions.invoke('deleteSecret', {
      name,
      recoveryWindowInDays
    });
    return { success: true };
  } catch (error) {
    throw new APIError(
      ErrorCodes.SERVER_ERROR,
      error.message || 'Failed to delete secret',
      { retryable: false }
    );
  }
}

/**
 * Checks secret health (rotation status, last accessed).
 */
export async function getSecretHealth(name) {
  try {
    const { data } = await base44.functions.invoke('getSecretHealth', { name });
    return {
      name: data.name,
      rotationEnabled: data.rotation_enabled,
      lastRotated: data.last_rotated_date,
      lastAccessed: data.last_accessed_date,
      needsRotation: data.needs_rotation
    };
  } catch (_error) {
    throw new APIError(
      ErrorCodes.SERVER_ERROR,
      'Failed to fetch secret health',
      { retryable: true }
    );
  }
}