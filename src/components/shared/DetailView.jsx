/**
 * @fileoverview Reusable Detail View Component
 * @module shared/DetailView
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Standardized detail view layout.
 * 
 * @example
 * <DetailView
 *   title={workflow.name}
 *   subtitle="Workflow"
 *   status={workflow.status}
 *   onBack={() => navigate(-1)}
 *   onEdit={() => setEditMode(true)}
 *   onDelete={handleDelete}
 *   sections={[
 *     { title: 'Overview', content: <OverviewContent /> },
 *     { title: 'Configuration', content: <ConfigContent /> }
 *   ]}
 * />
 */
export function DetailView({
  title,
  subtitle,
  status,
  badges = [],
  loading = false,
  onBack,
  onEdit,
  onDelete,
  onShare,
  sections = [],
  actions,
  metadata = [],
  children
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {status && (
                <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                  {status}
                </Badge>
              )}
              {badges.map((badge, i) => (
                <Badge key={i} variant="outline">{badge}</Badge>
              ))}
            </div>
            {subtitle && (
              <p className="text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full sm:w-auto">
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Metadata */}
      {metadata.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metadata.map((item, i) => (
                <div key={i}>
                  <div className="text-sm text-slate-400 mb-1">{item.label}</div>
                  <div className="text-white font-medium">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {sections.map((section, i) => (
        <Card key={i} className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            {section.description && (
              <p className="text-sm text-slate-400">{section.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {section.content}
          </CardContent>
        </Card>
      ))}

      {/* Custom children */}
      {children}
    </div>
  );
}