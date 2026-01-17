/**
 * @fileoverview Contextual Help Component
 * @description Tooltip-based help system for UI elements
 * @version 1.0.0
 */

import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function ContextualHelp({ title, content, learnMoreLink }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-slate-900 border-slate-800 text-white w-80">
        {title && <h4 className="font-semibold text-sm mb-2">{title}</h4>}
        <p className="text-sm text-slate-300 mb-3">{content}</p>
        {learnMoreLink && (
          <a
            href={learnMoreLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Learn more →
          </a>
        )}
      </PopoverContent>
    </Popover>
  );
}