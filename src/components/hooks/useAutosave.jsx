/**
 * @fileoverview Autosave Hook
 * @description Automatically saves data to localStorage or API at intervals.
 */

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for autosaving data.
 * 
 * @param {Object} options
 * @param {any} options.data - Data to save
 * @param {string} options.key - Storage key
 * @param {Function} options.onSave - Optional async save function
 * @param {number} options.delay - Debounce delay in ms (default: 2000)
 * @param {boolean} options.enabled - Whether autosave is enabled
 * 
 * @example
 * useAutosave({
 *   data: workflowState,
 *   key: 'workflow-draft-123',
 *   onSave: async (data) => await api.saveWorkflow(data),
 *   delay: 3000
 * });
 */
export function useAutosave({
  data,
  key,
  onSave,
  delay = 2000,
  enabled = true
}) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  const save = useCallback(async () => {
    if (!enabled || !data) return;

    const dataString = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (dataString === lastSavedRef.current) return;

    try {
      // Save to localStorage as backup
      if (key) {
        localStorage.setItem(key, dataString);
      }

      // Call custom save function if provided
      if (onSave) {
        await onSave(data);
      }

      lastSavedRef.current = dataString;
      console.log('[Autosave] Saved successfully');
    } catch (error) {
      console.error('[Autosave] Failed:', error);
      toast.error('Failed to autosave');
    }
  }, [data, key, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule save after delay
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Load saved data on mount
  const loadSaved = useCallback(() => {
    if (!key) return null;
    
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('[Autosave] Load failed:', error);
      return null;
    }
  }, [key]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    if (key) {
      localStorage.removeItem(key);
    }
    lastSavedRef.current = null;
  }, [key]);

  return {
    loadSaved,
    clearSaved,
    forceSave: save
  };
}