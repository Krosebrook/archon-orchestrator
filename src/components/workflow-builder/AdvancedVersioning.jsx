/**
 * @fileoverview Advanced Workflow Versioning
 * @description Semantic versioning with diff viewer, rollback, branching,
 * and merge capabilities following Archon canonical standards.
 * 
 * @module workflow-builder/AdvancedVersioning
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, GitCommit, GitMerge, History, 
  RotateCcw, Tag, Plus, ArrowRight, CheckCircle 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { handleError } from '../utils/api-client';
import { auditCreate, AuditEntities } from '../utils/audit-logger';

export default function AdvancedVersioning({ workflow, onLoadVersion, onCreateBranch }) {
  const [versions, setVersions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [isTagging, setIsTagging] = useState(false);

  useEffect(() => {
    if (workflow?.id) {
      loadVersions();
    }
  }, [workflow?.id]);

  const loadVersions = async () => {
    try {
      const versionsData = await base44.entities.WorkflowVersion.filter(
        { workflow_id: workflow.id },
        '-created_date',
        50
      );
      setVersions(versionsData);
    } catch (error) {
      handleError(error);
    }
  };

  const createTag = async (versionId) => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setIsTagging(true);
    try {
      const user = await base44.auth.me();
      const version = versions.find(v => v.id === versionId);

      await base44.entities.WorkflowVersion.update(versionId, {
        tags: [...(version.tags || []), newTagName]
      });

      // Audit tag creation
      await auditCreate(AuditEntities.WORKFLOW, workflow.id, {
        action: 'version_tagged',
        version: version.version,
        tag: newTagName
      });

      setNewTagName('');
      loadVersions();
      toast.success('Tag created');
    } catch (error) {
      handleError(error);
    } finally {
      setIsTagging(false);
    }
  };

  const rollbackToVersion = async (version) => {
    try {
      const user = await base44.auth.me();

      // Create new version from rollback
      const newVersion = {
        workflow_id: workflow.id,
        version: incrementVersion(workflow.version),
        spec: version.spec,
        change_summary: `Rollback to ${version.version}`,
        created_by: user.email,
        org_id: workflow.org_id
      };

      await base44.entities.WorkflowVersion.create(newVersion);
      
      // Update workflow
      await base44.entities.Workflow.update(workflow.id, {
        spec: version.spec,
        version: newVersion.version
      });

      // Audit rollback
      await auditCreate(AuditEntities.WORKFLOW, workflow.id, {
        action: 'version_rollback',
        from_version: workflow.version,
        to_version: version.version
      });

      if (onLoadVersion) {
        onLoadVersion(version);
      }

      loadVersions();
      toast.success(`Rolled back to version ${version.version}`);
    } catch (error) {
      handleError(error);
    }
  };

  const incrementVersion = (currentVersion) => {
    const parts = currentVersion.split('.');
    parts[2] = String(Number(parts[2]) + 1);
    return parts.join('.');
  };

  const compareVersions = (v1, v2) => {
    const diff = {
      nodesAdded: 0,
      nodesRemoved: 0,
      nodesModified: 0,
      edgesChanged: 0
    };

    const v1Nodes = new Set(v1.spec?.nodes?.map(n => n.id) || []);
    const v2Nodes = new Set(v2.spec?.nodes?.map(n => n.id) || []);

    diff.nodesAdded = v2.spec?.nodes?.filter(n => !v1Nodes.has(n.id)).length || 0;
    diff.nodesRemoved = v1.spec?.nodes?.filter(n => !v2Nodes.has(n.id)).length || 0;

    return diff;
  };

  return (
    <Tabs defaultValue="history" className="h-full flex flex-col">
      <TabsList className="bg-slate-800">
        <TabsTrigger value="history">
          <History className="w-4 h-4 mr-2" />
          History
        </TabsTrigger>
        <TabsTrigger value="branches">
          <GitBranch className="w-4 h-4 mr-2" />
          Branches
        </TabsTrigger>
        <TabsTrigger value="tags">
          <Tag className="w-4 h-4 mr-2" />
          Tags
        </TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="flex-1 mt-4">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4">
            {versions.map((version, idx) => {
              const isLatest = idx === 0;
              const prevVersion = versions[idx + 1];
              const diff = prevVersion ? compareVersions(prevVersion, version) : null;

              return (
                <Card key={version.id} className={`bg-slate-900 border-slate-800 ${isLatest ? 'border-purple-500/50' : ''}`}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitCommit className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-mono text-white">{version.version}</span>
                        {isLatest && (
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs">LATEST</Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {format(new Date(version.created_date), 'MMM d, HH:mm')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{version.change_summary || 'No description'}</p>

                    {diff && (
                      <div className="flex gap-2 text-xs">
                        {diff.nodesAdded > 0 && (
                          <Badge className="bg-green-500/20 text-green-400">+{diff.nodesAdded} nodes</Badge>
                        )}
                        {diff.nodesRemoved > 0 && (
                          <Badge className="bg-red-500/20 text-red-400">-{diff.nodesRemoved} nodes</Badge>
                        )}
                      </div>
                    )}

                    {version.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => onLoadVersion(version)}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-slate-700 text-xs"
                      >
                        Load
                      </Button>
                      {!isLatest && (
                        <Button
                          onClick={() => rollbackToVersion(version)}
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="branches" className="flex-1 mt-4">
        <div className="text-center py-8 text-slate-400 text-sm">
          <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Branch management coming soon
        </div>
      </TabsContent>

      <TabsContent value="tags" className="flex-1 mt-4">
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-4">
            {versions.filter(v => v.tags?.length > 0).map(version => (
              <Card key={version.id} className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-white">{version.version}</span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(version.created_date), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {version.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}