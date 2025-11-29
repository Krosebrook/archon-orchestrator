import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  GitBranch,
  Clock,
  User,
  RotateCcw,
  ChevronRight,
  FileJson,
  Diff
} from 'lucide-react';
import { format } from 'date-fns';

export default function VersionHistory({ workflowId, onLoadVersion }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (workflowId) {
      loadVersions();
    }
  }, [workflowId]);

  const loadVersions = async () => {
    if (!workflowId) return;
    
    setIsLoading(true);
    try {
      const versionData = await base44.entities.WorkflowVersion.filter(
        { workflow_id: workflowId },
        '-created_date',
        50
      );
      setVersions(versionData);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!workflowId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <History className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-medium text-slate-400 mb-2">No Version History</h3>
        <p className="text-slate-500">Save your workflow to start tracking versions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading version history...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            Version History
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {versions.length} versions saved
          </p>
        </div>
      </div>

      {versions.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No versions yet. Save your workflow to create the first version.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Version List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">All Versions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-slate-700">
                  {versions.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`
                        w-full p-4 text-left transition-colors
                        ${selectedVersion?.id === version.id 
                          ? 'bg-blue-500/10 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-700/50 border-l-2 border-transparent'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <GitBranch className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">v{version.version}</span>
                              {index === 0 && (
                                <Badge className="bg-green-500/20 text-green-400 text-xs">Latest</Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {version.change_summary || 'No description'}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 ml-13 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(version.created_date), 'MMM d, yyyy HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {version.created_by || 'Unknown'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Version Details */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {selectedVersion ? `Version ${selectedVersion.version}` : 'Select a Version'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVersion ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">Created</div>
                      <div className="text-sm text-white">
                        {format(new Date(selectedVersion.created_date), 'PPp')}
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">Author</div>
                      <div className="text-sm text-white">
                        {selectedVersion.created_by || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Change Summary</div>
                    <div className="text-sm text-white">
                      {selectedVersion.change_summary || 'No description provided'}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-2">Specification</div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-white">
                        <span className="text-slate-400">Nodes:</span> {selectedVersion.spec?.nodes?.length || 0}
                      </div>
                      <div className="text-white">
                        <span className="text-slate-400">Edges:</span> {selectedVersion.spec?.edges?.length || 0}
                      </div>
                    </div>
                  </div>

                  {/* Spec Preview */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <FileJson className="w-3 h-3" />
                      JSON Specification
                    </div>
                    <ScrollArea className="h-48">
                      <pre className="bg-slate-950 rounded-lg p-3 text-xs text-slate-300 font-mono">
                        {JSON.stringify(selectedVersion.spec, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => onLoadVersion(selectedVersion)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore This Version
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a version from the list to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}