/**
 * @fileoverview Global Keyboard Shortcuts System
 * @module shared/KeyboardShortcuts
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

/**
 * Global keyboard shortcuts manager.
 * 
 * Shortcuts:
 * - Cmd/Ctrl + K: Command palette
 * - Cmd/Ctrl + S: Save
 * - Cmd/Ctrl + /: Show shortcuts help
 * - Cmd/Ctrl + D: Dashboard
 * - Cmd/Ctrl + W: Workflows
 * - Cmd/Ctrl + A: Agents
 * - Cmd/Ctrl + R: Runs
 * - Esc: Close modals/dialogs
 */
export function KeyboardShortcuts({ onSave, onCommandPalette }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K - Command Palette
      if (modifier && e.key === 'k') {
        e.preventDefault();
        onCommandPalette?.();
        return;
      }

      // Cmd/Ctrl + S - Save
      if (modifier && e.key === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Cmd/Ctrl + / - Show shortcuts help
      if (modifier && e.key === '/') {
        e.preventDefault();
        showShortcutsHelp();
        return;
      }

      // Cmd/Ctrl + D - Dashboard
      if (modifier && e.key === 'd') {
        e.preventDefault();
        navigate(createPageUrl('Dashboard'));
        return;
      }

      // Cmd/Ctrl + W - Workflows
      if (modifier && e.key === 'w') {
        e.preventDefault();
        navigate(createPageUrl('Workflows'));
        return;
      }

      // Cmd/Ctrl + Shift + A - Agents
      if (modifier && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        navigate(createPageUrl('Agents'));
        return;
      }

      // Cmd/Ctrl + Shift + R - Runs
      if (modifier && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        navigate(createPageUrl('Runs'));
        return;
      }

      // Esc - Close modals (handled by individual components)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onSave, onCommandPalette]);

  return null;
}

function showShortcutsHelp() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  toast.info(
    <div className="space-y-2">
      <div className="font-semibold">Keyboard Shortcuts</div>
      <div className="space-y-1 text-sm">
        <div><kbd>{mod} K</kbd> Command Palette</div>
        <div><kbd>{mod} S</kbd> Save</div>
        <div><kbd>{mod} D</kbd> Dashboard</div>
        <div><kbd>{mod} W</kbd> Workflows</div>
        <div><kbd>{mod} Shift A</kbd> Agents</div>
        <div><kbd>{mod} Shift R</kbd> Runs</div>
        <div><kbd>Esc</kbd> Close Dialog</div>
      </div>
    </div>,
    { duration: 5000 }
  );
}

export function useKeyboardShortcut(key, callback, deps = []) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ...deps]);
}