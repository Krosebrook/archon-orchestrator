/**
 * @fileoverview Loading Overlay Component
 * @module shared/LoadingOverlay
 */

import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Full-screen loading overlay with backdrop.
 * 
 * @example
 * <LoadingOverlay visible={isProcessing} message="Processing workflow..." />
 */
export function LoadingOverlay({ visible, message = 'Loading...', blur = true }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            blur ? 'backdrop-blur-sm' : ''
          } bg-black/60`}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-white font-medium">{message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}