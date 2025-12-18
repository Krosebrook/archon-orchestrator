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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, GitCommit, History, 
  RotateCcw, Tag, GitCompare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import BranchManager from '../workflows/BranchManager';
import VersionComparison from '../workflows/VersionComparison';

export default function AdvancedVersioning({ workflow, onLoadVersion, onCreateBranch }) {
  const { organization, user } = useAuth();
  const [versions, setVersions] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comparing, setComparing] = useState({ a: null, b: null });
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (workflow?.id) {
      loadData();
    }
  }, [workflow?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [versionData, branchData] = await Promise.all([
        base44.entities.WorkflowVersion.filter(
          { workflow_id: workflow.id },
          '-version_number',
          50
        ),
        base44.entities.WorkflowBranch.filter(
          { workflow_id: workflow.id, is_default: true }
        )
      ]);
      setVersions(versionData);
      setCurrentBranch(branchData[0]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (version) => {
    if (!confirm(`Rollback to version ${version.version}? This will create a new version with the old specification.`)) {
      return;
    }

    try {
      if (!organization?.id) {
        toast.error('Organization not found');
        return;
      }

      // Create new version with old spec
      const newVersion = await base44.entities.WorkflowVersion.create({
        workflow_id: workflow.id,
        branch_id: currentBranch?.id,
        version: incrementVersion(versions[0]?.version || '1.0.0'),
        version_number: (versions[0]?.version_number || 0) + 1,
        spec: version.spec,
        change_summary: `Rolled back to version ${version.version}`,
        change_type: 'patch',
        parent_version_id: versions[0]?.id,
        created_by: user.email,
        org_id: organization.id
      });

      // Update workflow
      await base44.entities.Workflow.update(workflow.id, {
        spec: version.spec,
        version: newVersion.version
      });

      toast.success(`Rolled back to version ${version.version}`);
      loadData();
      onLoadVersion?.(newVersion);
    } catch (error) {
      console.error('Rollback failed:', error);
      toast.error('Failed to rollback version');
    }
  };

  const handleCompare = (versionA) => {
    if (!comparing.a) {
      setComparing({ a: versionA, b: null });
      toast.info('Select another version to compare');
    } else {
      setComparing({ a: comparing.a, b: versionA });
      setShowComparison(true);
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
    <div className="space-y-4">
      <BranchManager
        workflowId={workflow?.id}
        currentBranchId={currentBranch?.id}
        onBranchChange={(branch) => {
          setCurrentBranch(branch);
          loadData();
        }}
      />

      {showComparison && comparing.a && comparing.b && (
        <VersionComparison
          versionIdA={comparing.a.id}
          versionIdB={comparing.b.id}
          onClose={() => {
            setShowComparison(false);
            setComparing({ a: null, b: null });
          }}
        />
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </CardTitle>
            {comparing.a && !comparing.b && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparing({ a: null, b: null })}
                className="border-slate-700"
              >
                Cancel Comparison
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No versions yet. Save your workflow to create the first version.
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => {
                const isSelected = comparing.a?.id === version.id || comparing.b?.id === version.id;
                
                return (
                  <div
                    key={version.id}
                    className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-slate-800 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          v{version.version}
                        </Badge>
                        {version.change_type && (
                          <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600 capitalize">
                            {version.change_type}
                          </Badge>
                        )}
                        {version.is_release && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Tag className="w-3 h-3 mr-1" />
                            Release
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Current
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-white text-sm mb-2">{version.change_summary}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(version.created_date), 'MMM d, yyyy h:mm a')}
                        </span>
                        {version.created_by && (
                          <span>by {version.created_by}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {index !== 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollback(version)}
                            className="border-slate-700"
                            title="Rollback to this version"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLoadVersion?.(version)}
                            className="border-slate-700"
                          >
                            Load
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompare(version)}
                        className={`border-slate-700 ${isSelected ? 'bg-blue-500/30' : ''}`}
                        title="Compare with another version"
                      >
                        <GitCompare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}