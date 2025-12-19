/**
 * @fileoverview Template Loading Skeleton
 * @description Loading state UI for template cards
 * @version 1.0.0
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton loader for template card
 */
export function TemplateCardSkeleton() {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="space-y-3">
          <div className="h-5 bg-slate-800 rounded animate-pulse w-3/4" />
          <div className="flex gap-2">
            <div className="h-5 bg-slate-800 rounded animate-pulse w-20" />
            <div className="h-5 bg-slate-800 rounded animate-pulse w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
        </div>
        <div className="flex gap-1">
          <div className="h-6 bg-slate-800 rounded animate-pulse w-16" />
          <div className="h-6 bg-slate-800 rounded animate-pulse w-16" />
          <div className="h-6 bg-slate-800 rounded animate-pulse w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-4 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-slate-800 rounded animate-pulse flex-1" />
          <div className="h-10 bg-slate-800 rounded animate-pulse flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid of loading skeletons
 */
export function TemplateGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <TemplateCardSkeleton key={idx} />
      ))}
    </div>
  );
}